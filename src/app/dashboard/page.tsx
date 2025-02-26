'use client'

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { PlusIcon, ChevronRight, Dumbbell, PencilIcon } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { format, addDays } from 'date-fns';

// Mock workout data - replace with actual API call later
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface Workout {
  _id: string;
  date: string;
  name: string;
  exercises: Exercise[];
}



export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (date && status === 'authenticated') {
      fetchWorkouts(date);
    }
  }, [date, status]);
  
  const fetchWorkouts = async (selectedDate: Date) => {
    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/workouts?date=${formattedDate}`);
      
      if (response.ok) {
        const data = await response.json();
        setWorkouts(data.workouts);
      } else {
        console.error('Failed to fetch workouts');
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
      setWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  };

  console.log(workouts);
  
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }
  
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workout Calendar</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
              <Button asChild size="sm">
                <Link href="/workout/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Workout
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {workouts.length > 0 ? (
              <div className="space-y-3">
                {workouts.map(workout => (
                  <div key={workout._id} className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{workout.name}</h3>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/workout/edit/${workout._id}`}>
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/workout/${workout._id}`}>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <Link href={`/workout/${workout._id}`} className="block">
                      <div className="space-y-2">
                        {workout.exercises.map((exercise, idx) => (
                          <div key={idx} className="flex items-center text-sm text-muted-foreground">
                            <Dumbbell className="h-3 w-3 mr-2" />
                            <span className="flex-1">{exercise.name}</span>
                            <span>{exercise.sets}×{exercise.reps}</span>
                          </div>
                        ))}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No workouts found for this date. Add a workout to get started.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/workout/new">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Workout
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Exercises</CardTitle>
              <Button asChild size="sm">
                <Link href="/exercises">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  New Exercise
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No custom exercises found. Start by adding your first exercise.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/exercises/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add First Exercise
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Friends Activity</CardTitle>
              <Button asChild size="sm">
                <Link href="/friends">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Friend
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                No friends added yet. Connect with friends to see their activity.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/friends">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Find Friends
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
