const express = require('express')
const { handleRegister, handleLogin, handleRefreshToken, handleLogout } = require('../controllers/identity.controller')

const router = express.Router()

router.post('/register', handleRegister)
router.post('/login', handleLogin)
router.post('/logout', handleLogout)
router.post('/refresh-token', handleRefreshToken)

module.exports = router
