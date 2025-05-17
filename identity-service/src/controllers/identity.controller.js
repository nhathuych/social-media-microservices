const logger = require('../utils/logger')
const { validateRegistration, validateLogin } = require('../utils/validation')
const User = require('../models/User')
const { generateToken } = require('../utils/auth')
const RefreshToken = require('../models/RefreshToken')

const handleRegister = async (req, res) => {
  logger.info('Registration enpoint hit...')

  try {
    const { error } = validateRegistration(req.body)
    if (error) {
      logger.warn('Validation error:', error.details[0].message)
      return res.status(400).json({ success: false, message: error.details[0].message })
    }

    const { username, email, password } = req.body
    let user = await User.findOne({ $or: [{email}, {username}] })
    if (user) {
      logger.warn('User already exists.')
      return res.status(400).json({ success: false, message: 'User already exists.' })
    }

    user = new User({ username, email, password })
    await user.save()
    logger.info(`User [${user._id}] saved successfully.`)

    const { accessToken, refreshToken } = await generateToken(user)

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      accessToken,
      refreshToken,
    })
  } catch (error) {
    logger.error('Registration failed:', error)
    res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

const handleLogin = async (req, res) => {
  logger.info('Registration enpoint hit...')

  try {
    const { error } = validateLogin(req.body)
    if (error) {
      logger.warn('Validation error:', error.details[0].message)
      return res.status(400).json({ success: false, message: error.details[0].message })
    }

    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      logger.warn('Invalid credentials.')
      return res.status(400).json({ success: false, message: 'Invalid credentials.' })
    }

    const isValidPassword = await user.comparePassword(password)
    if (!isValidPassword) {
      logger.warn('Invalid password.')
      return res.status(400).json({ success: false, message: 'Invalid password.' })
    }

    const { accessToken, refreshToken } = await generateToken(user)
    res.json({ userId: user._id, accessToken, refreshToken, })
  } catch (error) {
    logger.error('Login failed:', error)
    res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

const handleRefreshToken = async (req, res) => {
  logger.info('Refresh token enpoint hit...')

  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      logger.warn('Refresh token is missing.')
      return res.status(400).json({ success: false, message: 'Refresh token is missing.' })
    }

    const storedToken = await RefreshToken.findOne({ token: refreshToken })
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn('Invalid or expired refresh token.')
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' })
    }

    const user = await User.findById(storedToken.user)
    if (!user) {
      logger.warn('User not found.')
      return res.status(400).json({ success: false, message: 'User not found.' })
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user)
    await storedToken.deleteOne()

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch (error) {
    logger.error('Refresh token failed:', error)
    res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

const handleLogout = async (req, res) => {
  logger.info('Logout enpoint hit...')

  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      logger.warn('Refresh token is missing.')
      return res.status(400).json({ success: false, message: 'Refresh token is missing.' })
    }

    await RefreshToken.deleteOne({ token: refreshToken })
    logger.info('Refresh token deleted.')
    
    res.json({ success: true, message: 'Logged out successfully.' })
  } catch (error) {
    logger.error('Logout failed:', error)
    res.status(500).json({ success: false, message: 'Internal server error.' })
  }
}

module.exports = {
  handleRegister,
  handleLogin,
  handleRefreshToken,
  handleLogout,
}
