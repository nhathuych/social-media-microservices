require('dotenv').config()
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')
const routes = require('./routes/post.routes')
const { Redis } = require('ioredis')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')

const app = express()
const PORT = process.env.PORT || 3003

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to mongodb.'))
  .catch((e) => logger.error('MongoDB connection error:', e))

const redisClient = new Redis(process.env.REDIS_URL)
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
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

app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(errorHandler)
app.use((req, res, next) => {
  console.log()
  logger.info(`[${req.method}] "${req.url}"`)
  logger.info('Body:', req.body)
  next()
})

app.use('/api/v1/posts/create', sensitiveEndpointsLimiter)
app.use(
  '/api/v1/posts',
  (req, res, next) => {
    req.redisClient = redisClient
    next()
  },
  routes
)

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', promise, 'reason:', reason)
})

app.listen(PORT, () => {
  logger.info(`Identity service is running on port ${PORT}`)
})
