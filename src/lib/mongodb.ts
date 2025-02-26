import mongoose from 'mongoose';

let isConnected = false;

export const connectToDB = async () => {
  if (isConnected) return;
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    // Log the first few characters to check format (don't log passwords!)
    const uriStart = process.env.MONGODB_URI.substring(0, 20) + '...';
    console.log('Connecting with URI starting with:', uriStart);
    
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.log('Error connecting to MongoDB:', error);
    throw error;
  }
}; 