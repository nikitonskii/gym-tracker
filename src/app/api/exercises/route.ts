import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectToDB } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import mongoose from 'mongoose';

// GET all exercises for the current user
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDB();
    
    // Get the user by email
    const user = await mongoose.model('User').findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Fetch all exercises for this user
    const exercises = await Exercise.find({ userId: user._id }).sort({ name: 1 });
    
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 });
  }
}

// POST to create a new exercise
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, category, defaultSets, defaultReps, defaultWeight, notes } = await req.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Exercise name is required' }, { status: 400 });
    }
    
    await connectToDB();
    
    // Get the user by email
    const user = await mongoose.model('User').findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if an exercise with the same name already exists
    const existingExercise = await Exercise.findOne({ 
      userId: user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') } // Case insensitive search
    });
    
    if (existingExercise) {
      return NextResponse.json({ error: 'An exercise with this name already exists' }, { status: 409 });
    }
    
    // Create the new exercise
    const exercise = await Exercise.create({
      name,
      category: category || 'Strength',
      userId: user._id,
      defaultSets: defaultSets || 3,
      defaultReps: defaultReps || 10,
      defaultWeight: defaultWeight || 0,
      notes: notes || ''
    });
    
    return NextResponse.json({ exercise }, { status: 201 });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 });
  }
} 