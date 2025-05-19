const logger = require('../../../post-service/src/utils/logger')
const Media = require('../models/media')
const { deleteUploadedMedia } = require('../utils/cloudinary')

const handlePostDeleted = async (event) => {
  try {
    console.log('event:', event)
    const { postId, userId, mediaIds } = event

    const medias = await Media.find({ _id: { $in: mediaIds } })
    for (const media of medias) {
      await Media.deleteOne(media._id)
      deleteUploadedMedia(media.publicId)

      logger.info(`Deleted media ${media._id} associated with this deleted post ${postId}`)
    }

    logger.info(`Processed deletion of media for post _id: ${postId}`)
  } catch (error) {
    logger.error('Error deleting media:', error)
  }
}

module.exports = {
  handlePostDeleted,
}
