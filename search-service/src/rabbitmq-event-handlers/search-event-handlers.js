const logger = require('../utils/logger')
const SearchPost = require('../models/search-post')

const handlePostCreated = async (event) => {
  logger.info(event)

  try {
    const searchPost = new SearchPost({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    })
    await searchPost.save()

    logger.info(`A SearchPost was created [${searchPost._id.toString()}] for Post [${searchPost.postId}]`)
  } catch (error) {
    logger.error('Error handling post creation event:', error)
  }
}

const handlePostDeleted = async (event) => {
  logger.info(event)

  try {
    await SearchPost.deleteOne({
      postId: event.postId,
      userId: event.userId,
    })

    logger.info(`A SearchPost was deleted for Post [${event.postId}]`)
  } catch (error) {
    logger.error('Error handling post deletion event:', error)
  }
}

module.exports = {
  handlePostCreated,
  handlePostDeleted,
}
