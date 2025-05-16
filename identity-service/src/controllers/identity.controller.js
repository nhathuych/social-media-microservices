const logger = require('../utils/logger')
const { validateRegistration } = require('../utils/validation')
const User = require('../models/User')
const { generateToken } = require('../utils/auth')

// registration
const registerUser = async (req, res) => {
  try {
    logger.info('Registration enpoint hit...')

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

    return res.status(201).json({
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

// login

// refresh token

// logout

module.exports = {
  registerUser,
}
