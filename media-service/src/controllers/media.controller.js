const { uploadMedia, deleteUploadedMedia } = require('../utils/cloudinary')
const Media = require('../models/media')
const logger = require('../utils/logger')

const createMedia = async (req, res) => {
  logger.info('Starting media upload')
  let uploadResult

  try {
    if (!req.file) {
      logger.error('File is missing. Please upload a file and try again!')
      return res.status(400).json({ success: false, message: 'File is missing. Please upload a file and try again!' })
    }

    const { originalname, mimetype, buffer } = req.file
    const userId = req.user.userId

    logger.info(`File details: name="${originalname}", type="${mimetype}"`)
    logger.info('Uploading to cloudinary starting...')

    uploadResult = await uploadMedia(req.file)
    logger.info(`Cloudinary upload successfully. Public Id: ${uploadResult.public_id}`)

    const media = new Media({
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      originalname,
      mimetype,
      userId,
    })
    await media.save()

    res.status(201).json({
      success: true,
      mediaId: media._id,
      url: media.url,
      message: 'Media uploaded successfully.',
    })
  } catch (error) {
    deleteUploadedMedia(uploadResult?.public_id)
    logger.error('Error uploading media', error)
    res.status(500).json({ success: false, message: 'Error uploading media.' })
  }
}

const getMedias = async (req, res) => {
  try {
    const result = await Media.find({ userId : req.user.userId })
    if (result.length !== 0) return res.json(result)
    res.status(404).json({ success: false, message: "Cann't find any media for this user" })
  } catch (error) {
    logger.error('Error fetching medias', error)
    res.status(500).json({ success: false, message: 'Error fetching medias' })
  }
}

module.exports = {
  createMedia,
  getMedias,
}
