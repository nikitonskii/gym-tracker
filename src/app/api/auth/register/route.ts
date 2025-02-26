import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { nickname, email, password } = await req.json();
    
    if (!nickname || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    await connectToDB();
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { nickname }]
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or nickname already exists' },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create a new user
    const newUser = new User({
      nickname,
      email,
      password: hashedPassword,
    });
    
    await newUser.save();
    
    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in registration:', error);
    return NextResponse.json(
      { message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}