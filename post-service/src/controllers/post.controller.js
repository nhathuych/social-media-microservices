const logger = require('../utils/logger')
const Post = require('../models/post')
const mongoose = require('mongoose')
const { validateCreatePost } = require('../utils/validation')
const { publishEvent } = require('../utils/rabbitmq')

async function invalidatePostsCache(req, postId) {
  const cachedKey = `post:${postId?.toString()}`
  await req.redisClient.del(cachedKey)

  const keys = await req.redisClient.keys('posts:*')
  if (keys.length > 0) await req.redisClient.del(keys)
}

const createPost = async (req, res) => {
  logger.info('Create post endpoint hit...')

  try {
    const userId = req.user.userId // userId was attached to req.user by the authentication middleware.
    let { content, mediaIds } = req.body
    content = content?.trim()
    mediaIds = mediaIds || []

    const { error } = validateCreatePost(req.body)
    if (error) {
      logger.warn('Validation error:', error.details[0].message)
      return res.status(400).json({ success: false, message: error.details[0].message })
    }

    const newlyCreatedPost = new Post({ user: userId, mediaIds, content })
    await newlyCreatedPost.save()

    await publishEvent('post.created', {
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt: newlyCreatedPost.createdAt,
    })
    await invalidatePostsCache(req, newlyCreatedPost._id)

    logger.info('Post created successfully.', newlyCreatedPost)
    res.status(201).json({ success: true, message: 'Post created successfully.' })
  } catch (error) {
    logger.error('Error creating post', error)
    res.status(500).json({ success: false, message: 'Error creating post.', error })
  }
}

const getById = async (req, res) => {
  logger.info('Get post endpoint hit...')

  try {
    const { id } = req.params
    const cachedkey = `post:${id}`
    const cachedPost = await req.redisClient.get(cachedkey)

    if (cachedPost) {
      logger.info('Loaded data from Redis cache.')
      return res.json(JSON.parse(cachedPost))
    }

    const post = await Post.findById(id).lean()
    await req.redisClient.setex(cachedkey, 300, JSON.stringify(post))
    res.json(post)
  } catch (error) {
    logger.error('Error fetching post', error)
    res.status(500).json({ success: false, message: 'Error fetching post.' })
  }
}

const getPosts = async (req, res) => {
  logger.info('Get posts endpoint hit...')

  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const offset = (page - 1) * limit

    const cachedKey = `posts:${page}:${limit}`
    const cachedPosts = await req.redisClient.get(cachedKey)
    if (cachedPosts) {
      logger.info('Loaded data from Redis cache.')
      return res.json(JSON.parse(cachedPosts))
    }

    const posts = await Post.find().sort({ _id: -1 }).skip(offset).limit(limit).lean()
    const total = await Post.countDocuments()

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    }

    // setex = SET with EXpire
    await req.redisClient.setex(cachedKey, 300, JSON.stringify(result))

    res.json(result)
  } catch (error) {
    logger.error('Error fetching posts', error)
    res.status(500).json({ success: false, message: 'Error fetching posts.' })
  }
}

const deleteById = async (req, res) => {
  logger.info('Delete post endpoint hit...')

  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, user: req.user.userId })

    publishEvent('post.deleted', {
      postId: post._id.toString(),
      userId: post.user.toString(),
      mediaIds: post.mediaIds,
    })
    await invalidatePostsCache(req, post._id)

    await session.commitTransaction()
    session.endSession()

    res.json({ success: true, message: 'Deleted successfully.' })
  } catch (error) {
    await session.abortTransaction()
    session.endSession()

    logger.error('Error deleting posts', error)
    res.status(500).json({ success: false, message: 'Error deleting posts.' })
  }
}

module.exports = {
  getById,
  getPosts,
  createPost,
  deleteById,
}
