const logger = require('../utils/logger')
const SearchPost = require('../models/search-post')

const searchPosts = async (req, res) => {
  logger.info('Search enpoint hit...')

  try {
    const { query } = req.query

    if (!query) {
      const results = await SearchPost.find().sort({ _id: -1 }).limit(10)
      return res.json(results)
    }

    const results = await SearchPost.find(
      { $text: { $search: query } },      // Full-text search query
      { score: { $meta: 'textScore' } },  // Add the textScore field to each result
    ).sort({
      score: { $meta: 'textScore' }       // Sort by relevance score (descending)
    }).limit(10)

    res.json(results)
  } catch (error) {
    logger.error('Error searching posts', error)
    res.status(500).json({ success: false, message: 'Error searching posts.' })
  }
}

module.exports = {
  searchPosts,
}
