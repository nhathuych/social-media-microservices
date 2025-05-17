require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const { Redis } = require('ioredis')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const logger = require('./utils/logger')
const proxy = require('express-http-proxy')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

const redisClient = new Redis(process.env.REDIS_URL)
const rateLimitOptions = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP [${req.ip}]`)
    res.status(429).json({ success: false, message: 'Too many requests.' })
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args)
  })
})

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    // Rewrite the incoming request path from the gateway (e.g., /v1/auth/login)
    // to match the internal route of the microservice (e.g., /api/v1/auth/login)
    return req.originalUrl.replace(/^\/v1/, '/api/v1')
  },
  proxyErrorHandler: (error, res, next) => {
    logger.error(`Proxy error: ${error.message}`)
    res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(errorHandler)
app.use(rateLimitOptions)
app.use((req, res, next) => {
  console.log()
  logger.info(`[${req.method}] "${req.url}"`)
  logger.info('Body:', req.body)
  next()
})

// Setting up a proxy for the Identity Service
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
  ...proxyOptions,

  // Modify the options of the outgoing proxy request before it is sent
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Content-Type'] = 'application/json'   // Ensure the Content-Type header is set to application/json
    return proxyReqOpts
  },

  // Modify or handle the response received from the proxied service
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response received from Identity Service: ${proxyRes.statusCode}`)
    return proxyResData
  },
}))

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`)
  logger.info(`Indentity Service url: ${process.env.IDENTITY_SERVICE_URL}`)
  logger.info(`Redis url: ${process.env.REDIS_URL}`)
})
