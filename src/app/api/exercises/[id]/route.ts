import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Exercise from '@/models/Exercise';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

// GET - fetch specific exercise
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
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
    
    await connectToDB();
    
    const exercise = await Exercise.findOne({ _id: exerciseId, userId });
    
    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exercise' },
      { status: 500 }
    );
  }
}

// PUT - Update an exercise
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
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
    
    await connectToDB();
    
    const updatedExercise = await Exercise.findOneAndUpdate(
      { _id: exerciseId, userId },
      { 
        name: data.name,
        category: data.category,
        defaultSets: data.defaultSets,
        defaultReps: data.defaultReps,
        defaultWeight: data.defaultWeight,
        notes: data.notes
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedExercise) {
      return NextResponse.json(
        { error: 'Exercise not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Exercise updated successfully',
      exercise: updatedExercise 
    });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an exercise
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
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
    
    await connectToDB();
    
    const result = await Exercise.findOneAndDelete({ _id: exerciseId, userId });
    
    if (!result) {
      return NextResponse.json(
        { error: 'Exercise not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    // TODO: Consider deleting associated exercise entries here
    
    return NextResponse.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise' },
      { status: 500 }
    );
  }
} 