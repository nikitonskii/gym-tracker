import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectToDB } from '@/lib/mongodb';
import Workout from '@/models/Workout';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, date, exercises } = await req.json();
    
    if (!name || !date || !exercises || !exercises.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await connectToDB();
    
    // Get the user by email since we don't have ID in the session
    const user = await mongoose.model('User').findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const workout = await Workout.create({
      name,
      date,
      userId: user._id,
      exercises
    });
    
    return NextResponse.json({ workout }, { status: 201 });
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    
    await connectToDB();
    
    // Get the user by email
    const user = await mongoose.model('User').findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const query: { userId: mongoose.Types.ObjectId, date?: string } = {
      userId: user._id
    };
    
    if (date) {
      query.date = date;
    }
    
    const workouts = await Workout.find(query).sort({ date: -1 });
    
    return NextResponse.json({ workouts });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
} 