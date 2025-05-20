const express = require('express')
const { searchPosts } = require('../controllers/search-post.controller')
const { authenticateRequest } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticateRequest)
router.get('/', searchPosts)

module.exports = router
