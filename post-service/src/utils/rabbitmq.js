const amqp = require('amqplib')
const logger = require('./logger')

let connection = null
let channel = null

const EXCHANGE_NAME = 'post_events'

const connectToRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL)  // Establish connection to RabbitMQ server
    channel = await connection.createChannel()  // Create a channel for sending/receiving messages

    // Declare an exchange of type 'topic'
    // 'topic' allows messages to be routed to one or many queues based on pattern matching in the routing key.
    // Example:
    // - If a message is published with routing key 'post.created',
    // - And a queue is bound with pattern 'post.*',
    // - Then that queue will receive the message.
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false })
    logger.info('Connected to RabbitMQ')

    return channel
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error)
  }
}

const publishEvent = async (routingKey, message) => {
  if (!channel) await connectToRabbitMQ()

  // Convert the message object to a JSON string, then to a binary buffer,
  // as RabbitMQ expects the message content to be a Buffer (binary data).
  channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)))
  logger.info(`Event published: ${routingKey}`)
}

/**
 * Subscribes to messages from a RabbitMQ exchange using a specific routing key.
 * When a message is received, it is parsed and passed to the provided callback function.
 *
 * @param {string} routingKey - The routing key to bind the queue to.
 * @param {Function} callback - The function to handle received messages.
 */
const consumeEvent = async (routingKey, callback) => {
  if (!channel) await connectToRabbitMQ()

  // Create a temporary, exclusive queue (auto-deleted when connection closes)
  const q = await channel.assertQueue('', { exclusive: true })

  // Bind the queue to the exchange using the specified routing key
  await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey)

  // Listen for incoming messages on the queue and handle them as they arrive
  channel.consume(q.queue, (message) => {
    if (message) {
      const content = JSON.parse(message.content.toString())  // Parse the message content from buffer to JSON
      callback(content)     // Call the provided callback with the parsed content
      channel.ack(message)  // Acknowledge that the message has been processed
    }
  })
  logger.info(`Subcribed to event: ${routingKey}`)
}

module.exports = {
  connectToRabbitMQ,
  publishEvent,
  consumeEvent,
}
