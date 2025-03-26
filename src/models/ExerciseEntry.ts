import mongoose from 'mongoose';

const ExerciseEntrySchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: [true, 'Please provide an exercise ID'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID'],
  },
  date: {
    type: Date,
    required: [true, 'Please provide a date'],
    default: Date.now,
  },
  sets: {
    type: Number,
    required: [true, 'Please provide the number of sets'],
    min: 1,
  },
  reps: {
    type: Number,
    required: [true, 'Please provide the number of reps'],
    min: 1,
  },
  weight: {
    type: Number,
    required: [true, 'Please provide the weight'],
    min: 0,
  },
  notes: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

export default mongoose.models.ExerciseEntry || mongoose.model('ExerciseEntry', ExerciseEntrySchema); 