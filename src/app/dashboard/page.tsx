'use client'

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, ChevronRight, Dumbbell, PencilIcon, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { CalendarWithHighlights } from '@/components/ui/calendar-with-highlights';

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

interface SavedExercise {
  _id: string;
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

export default function DashboardPage() {
  const { status } = useSession();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [savedExercises, setSavedExercises] = useState<SavedExercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  
  useEffect(() => {
    if (date && status === 'authenticated') {
      fetchWorkouts(date);
      fetchSavedExercises();
      fetchWorkoutDates();
    }
  }, [date, status]);

  // Fetch workouts for the selected date
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

  // Fetch all workout dates for the current month
  const fetchWorkoutDates = async () => {
    if (!date) return;
    
    setIsLoadingDates(true);
    try {
      const start = format(startOfMonth(date), 'yyyy-MM-dd');
      const end = format(endOfMonth(date), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/workouts/dates?start=${start}&end=${end}`);
      
      if (response.ok) {
        const data = await response.json();
        // Convert string dates to Date objects
        const dates = data.dates.map((dateString: string) => parseISO(dateString));
        setWorkoutDates(dates);
      } else {
        console.error('Failed to fetch workout dates');
        setWorkoutDates([]);
      }
    } catch (error) {
      console.error('Error fetching workout dates:', error);
      setWorkoutDates([]);
    } finally {
      setIsLoadingDates(false);
    }
  };

  const fetchSavedExercises = async () => {
    setIsLoadingExercises(true);
    try {
      const response = await fetch('/api/exercises');
      
      if (response.ok) {
        const data = await response.json();
        setSavedExercises(data.exercises || []);
      } else {
        console.error('Failed to load exercises');
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const filteredExercises = savedExercises.filter(exercise => 
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add console log to debug workout dates
  useEffect(() => {
    console.log('Workout dates:', workoutDates);
  }, [workoutDates]);

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }
  
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </div>
            ) : workouts.length > 0 ? (
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
        
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Workout Calendar</CardTitle>
              {isLoadingDates && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Loading calendar...
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <CalendarWithHighlights
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate);
                // If the month changes, fetch new workout dates
                if (newDate && date && newDate.getMonth() !== date.getMonth()) {
                  setTimeout(() => fetchWorkoutDates(), 0);
                }
              }}
              className="rounded-md border"
              highlightedDates={workoutDates}
            />
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
            {isLoadingExercises ? (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Loading exercises...
              </div>
            ) : savedExercises.length > 0 ? (
              <div className="space-y-3">
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
                
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {filteredExercises.length > 0 ? (
                    filteredExercises.map(exercise => (
                      <Link href={`/exercises/${exercise._id}`} key={exercise._id}>
                        <div className="border rounded-lg p-2 hover:bg-accent/50 transition-colors group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Dumbbell className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">{exercise.name}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {exercise.defaultSets} sets × {exercise.defaultReps} reps @ {exercise.defaultWeight} lbs
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      No matches found
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
