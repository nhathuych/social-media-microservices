const logger = require('../utils/logger')

const authenticateRequest = (req, res, next) => {
  // Extract user ID from request headers (usually injected by gateway).
  const userId = req.headers['x-user-id']

  if (!userId) {
    logger.warn('Access attempted without user ID.')
    return res.status(401).json({ success: false, message: 'Authentication required! Please login to continue.' })
  }

  // Attach user info to request object for downstream access.
  req.user = { userId }
  next()
}

module.exports = {
  authenticateRequest,
}
