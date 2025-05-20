require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const helmet = require('helmet')
const cors = require('cors')
const errorHandler = require('./middleware/errorHandler')
const routes = require('./routes/search-post.routes')
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq')
const { handlePostCreated, handlePostDeleted } = require('./rabbitmq-event-handlers/search-event-handlers')

const app = express()
const PORT = process.env.PORT || 3005

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to mongodb.'))
  .catch((e) => logger.error('MongoDB connection error:', e))

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

app.use('/api/v1/search', routes)

// Unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at', promise, 'reason:', reason)
})

async function startServer() {
  try {
    await connectToRabbitMQ()
    // consume all events / subscribe to all events
    consumeEvent('post.created', handlePostCreated)
    consumeEvent('post.deleted', handlePostDeleted)

    app.listen(PORT, () => {
      logger.info(`Media service is running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ', error)
    process.exit(1)
  }
}

startServer()
