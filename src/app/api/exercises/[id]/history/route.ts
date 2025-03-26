import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import ExerciseEntry from '@/models/ExerciseEntry';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

// GET - Fetch exercise history entries
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get exercise ID from params safely
    const params = await context.params;
    const exerciseId = params.id;
    
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    let userId;
    
    if (session.user.id) {
      userId = session.user.id;
    } else if (session.user.email) {
      await connectToDB();
      const user = await mongoose.model('User').findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user._id;
    } else {
      return NextResponse.json({ error: 'User identification missing' }, { status: 400 });
    }
    
    // Validate that the exercise belongs to the user
    await connectToDB();
    const exercise = await Exercise.findOne({ _id: exerciseId, userId });
    
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }
    
    // Fetch history entries
    const entries = await ExerciseEntry.find({ 
      exerciseId,
      userId
    }).sort({ date: -1 }); // newest first
    
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching exercise history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise history' },
      { status: 500 }
    );
  }
}

// POST - Add new exercise history entry
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get exercise ID from params safely
    const params = await context.params;
    const exerciseId = params.id;
    
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    let userId;
    
    if (session.user.id) {
      userId = session.user.id;
    } else if (session.user.email) {
      await connectToDB();
      const user = await mongoose.model('User').findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user._id;
    } else {
      return NextResponse.json({ error: 'User identification missing' }, { status: 400 });
    }
    
    const data = await request.json();
    
    // Validate that the exercise belongs to the user
    await connectToDB();
    const exercise = await Exercise.findOne({ _id: exerciseId, userId });
    
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }
    
    // Create new entry
    const newEntry = new ExerciseEntry({
      exerciseId,
      userId,
      date: data.date || new Date(),
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      notes: data.notes
    });
    
    await newEntry.save();
    
    return NextResponse.json({ 
      message: 'Exercise entry added successfully',
      entry: newEntry
    });
  } catch (error) {
    console.error('Error adding exercise entry:', error);
    return NextResponse.json(
      { error: 'Failed to add exercise entry' },
      { status: 500 }
    );
  }
} 