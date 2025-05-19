const express = require('express')
const multer = require('multer')

const { createMedia, getMedias } = require('../controllers/media.controller')
const { authenticateRequest } = require('../middleware/auth.middleware')
const logger = require('../utils/logger')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('file')

router.get('/', authenticateRequest, getMedias)
router.post('/', authenticateRequest, (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      logger.error('Multer error while uploading:', error)
      return res.status(400).json({ message: 'Multer error while uploading.', error: error.message, stack: error.stack })
    } else if (error) {
      logger.error('Unknow error occured while uploading:', error)
      return res.status(500).json({ message: 'Unknow error occured while uploading.', error: error.message, stack: error.stack })
    }
    if (!req.file) return res.status(400).json({ message: 'File not found.' })
    next()
  })
}, createMedia)

module.exports = router
