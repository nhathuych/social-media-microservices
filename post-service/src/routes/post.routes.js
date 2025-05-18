const express = require('express')
const { createPost, getById, getPosts, deleteById } = require('../controllers/post.controller')
const { authenticateRequest } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(authenticateRequest)
router.get('/', getPosts)
router.get('/:id', getById)
router.post('/', createPost)
router.delete('/:id', deleteById)

module.exports = router
