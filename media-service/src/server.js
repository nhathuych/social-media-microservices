require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const errorHandler = require('./middleware/errorHandler')
const routes = require('./routes/media.routes')
const logger = require('./utils/logger')
const { Redis } = require('ioredis')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq')
const { handlePostDeleted } = require('./rabbitmq-event-handlers/media.event.handlers')

const app = express()
const PORT = process.env.PORT || 3004

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
app.use('/api/v1/medias/upload', sensitiveEndpointsLimiter)
app.use('/api/v1/medias', routes)

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', promise, 'reason:', reason)
})

async function startServer() {
  try {
    await connectToRabbitMQ()
    // consume the Post Deleted event / subscribe to the Post Deleted event
    await consumeEvent('post.deleted', handlePostDeleted)

    app.listen(PORT, () => {
      logger.info(`Media service is running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', error)
    process.exit(1)
  }
}

startServer()
