import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import ExerciseEntry from '@/models/ExerciseEntry';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

// DELETE - Remove a specific exercise history entry
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string, entryId: string } }
) {
  try {
    // Extract params safely
    const params = await context.params;
    const entryId = params.entryId;
    
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
    
    // Find and delete the entry, ensuring it belongs to the user
    const result = await ExerciseEntry.findOneAndDelete({
      _id: entryId,
      userId
    });
    
    if (!result) {
      return NextResponse.json(
        { error: 'Exercise entry not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Exercise entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting exercise entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete exercise entry' },
      { status: 500 }
    );
  }
}

// PUT - Update a specific exercise history entry
export async function PUT(
  request: NextRequest,
  context: { params: { id: string, entryId: string } }
) {
  try {
    // Extract params safely
    const params = await context.params;
    const entryId = params.entryId;
    
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
    
    // Find and update the entry, ensuring it belongs to the user
    const updatedEntry = await ExerciseEntry.findOneAndUpdate(
      { _id: entryId, userId },
      {
        date: data.date,
        sets: data.sets,
        reps: data.reps,
        weight: data.weight,
        notes: data.notes
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedEntry) {
      return NextResponse.json(
        { error: 'Exercise entry not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Exercise entry updated successfully',
      entry: updatedEntry
    });
  } catch (error) {
    console.error('Error updating exercise entry:', error);
    return NextResponse.json(
      { error: 'Failed to update exercise entry' },
      { status: 500 }
    );
  }
} 