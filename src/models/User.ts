import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  nickname: {
    type: String,
    required: [true, 'Please provide a nickname'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema); 