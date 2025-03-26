import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Workout from '@/models/Workout';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      console.error('Auth error in /api/workouts/dates:', { session });
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user ID from session
    let userId;
    
    if (session.user.id) {
      // If ID is directly available in the session
      userId = session.user.id;
    } else if (session.user.email) {
      // If we need to look up the user by email
      await connectToDB();
      const user = await mongoose.model('User').findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      userId = user._id;
    } else {
      return NextResponse.json({ error: 'User identification missing' }, { status: 400 });
    }
    
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    if (!start || !end) {
      return NextResponse.json(
        { error: 'Missing required parameters: start and end dates' },
        { status: 400 }
      );
    }

    console.log('Fetching workout dates for:', { userId, start, end });

    await connectToDB();
    
    // Find all workouts within the date range, only get the date field
    const workouts = await Workout.find({
      userId,
      date: {
        $gte: start,
        $lte: end
      }
    }).select('date').lean();
    
    // Extract unique dates
    const dates = [...new Set(workouts.map(workout => workout.date))];
    
    console.log(`Found ${dates.length} unique workout dates`);
    
    return NextResponse.json({ dates });
  } catch (error) {
    console.error('Error fetching workout dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout dates' },
      { status: 500 }
    );
  }
} 