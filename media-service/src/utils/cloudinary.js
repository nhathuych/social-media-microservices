const cloudinary = require('cloudinary').v2
const logger = require('./logger')
require('dotenv').config()

cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_secret: process.env.API_SECRET,
  api_key: process.env.API_KEY,
})

const uploadMedia = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder: 'medias', resource_type: 'auto' }, (error, result) => {
      if (error) {
        logger.error('Error while uploading media to cloudinary:', error)
        reject(error)
      }
      resolve(result)
    })

    uploadStream.end(file.buffer)
  })
}

const deleteUploadedMedia = (publicId) => {
  if (publicId) cloudinary.uploader.destroy(publicId)
  logger.info(`Media [${publicId}] deleted successfuly from cloudinary.`)
}

module.exports = {
  uploadMedia,
  deleteUploadedMedia,
}
