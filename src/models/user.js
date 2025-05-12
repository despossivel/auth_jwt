const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Por favor, insira um email válido']
  },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  mfaEnabled: { type: Boolean, default: false },
  emailMfaEnabled: { type: Boolean, default: false },
  pendingEmailMfaCode: { type: String, default: null },
  pendingEmailMfaCodeExpires: { type: Date, default: null },
  totpMfaEnabled: { type: Boolean, default: false },
  totpSecret: { type: String, default: null },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isModified('email')) {
    const emailExists = await mongoose.models.User.findOne({ email: new RegExp(`^${this.email}$`, 'i') });
    if (emailExists && emailExists._id.toString() !== this._id.toString()) return next(new Error('Este email já está em uso.'));
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;