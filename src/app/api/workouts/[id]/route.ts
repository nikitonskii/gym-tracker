import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectToDB } from '@/lib/mongodb';
import Workout from '@/models/Workout';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const workoutId = pathParts[pathParts.length - 1];
    
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDB();
    
    const user = await mongoose.model('User').findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const workout = await Workout.findOne({
      _id: workoutId,
      userId: user._id
    });
    
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    
    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json({ error: 'Failed to fetch workout' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const workoutId = pathParts[pathParts.length - 1];
    
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, date, exercises } = await request.json();
    
    if (!name || !date || !exercises || !exercises.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await connectToDB();
    
    const user = await mongoose.model('User').findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const workout = await Workout.findOneAndUpdate(
      { _id: workoutId, userId: user._id },
      { name, date, exercises },
      { new: true }
    );
    
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    
    return NextResponse.json({ workout });
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const workoutId = pathParts[pathParts.length - 1];
    
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectToDB();
    
    const user = await mongoose.model('User').findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const workout = await Workout.findOneAndDelete({
      _id: workoutId,
      userId: user._id
    });
    
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 });
  }
} 