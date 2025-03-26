import mongoose from 'mongoose';

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an exercise name'],
    trim: true,
  },
  category: {
    type: String,
    enum: ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Other'],
    default: 'Strength',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID'],
  },
  defaultSets: {
    type: Number,
    default: 3,
    min: 1,
  },
  defaultReps: {
    type: Number,
    default: 10,
    min: 1,
  },
  defaultWeight: {
    type: Number,
    default: 0,
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

// Create compound index for userId and name to ensure uniqueness per user
ExerciseSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Exercise || mongoose.model('Exercise', ExerciseSchema); 