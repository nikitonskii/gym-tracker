import mongoose from 'mongoose';

// Add this interface above the schema definition
interface ExerciseDocument {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  completed?: boolean;
  actualReps?: number;
  actualWeight?: number;
}

const ExerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an exercise name'],
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
  completed: {
    type: Boolean,
    default: false
  },
  actualReps: {
    type: Number,
    default: function(this: ExerciseDocument) {
      return this.reps;
    }
  },
  actualWeight: {
    type: Number,
    default: function(this: ExerciseDocument) {
      return this.weight;
    }
  }
});

const WorkoutSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a workout name'],
  },
  date: {
    type: String,
    required: [true, 'Please provide a date'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID'],
  },
  exercises: [ExerciseSchema],
}, { timestamps: true });

export default mongoose.models.Workout || mongoose.model('Workout', WorkoutSchema); 