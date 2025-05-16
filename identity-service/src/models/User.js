const mongoose = require('mongoose')
const argon2 = require('argon2')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
}, {
  timestamps: true
})

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) this.password = await argon2.hash(this.password)
})

userSchema.methods.comparePassword = async function(password) {
  return await argon2.verify(this.password, password)
}

userSchema.index({ username: 'text' })

const User = mongoose.model('User', userSchema)

module.exports = User
