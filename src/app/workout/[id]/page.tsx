'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PencilIcon, ArrowLeft, CheckCircle, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format, parse } from 'date-fns';
import { useNotification } from '@/components/notification-provider';

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  completed?: boolean;
  actualReps?: number;
  actualWeight?: number;
}

interface Workout {
  _id: string;
  name: string;
  date: string;
  exercises: Exercise[];
}

export default function WorkoutDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;
  const { showNotification } = useNotification();
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<(Exercise & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && workoutId) {
      fetchWorkout(workoutId);
    }
  }, [status, workoutId]);

  const fetchWorkout = async (id: string) => {
    try {
      const response = await fetch(`/api/workouts/${id}`);
      if (response.ok) {
        const data = await response.json();
        const workout = data.workout;
        
        setWorkout(workout);
        setExercises(workout.exercises.map((ex: Exercise) => ({
          ...ex,
          id: crypto.randomUUID(),
          completed: ex.completed || false,
          actualReps: ex.actualReps || ex.reps,
          actualWeight: ex.actualWeight || ex.weight
        })));
      } else {
        console.error('Failed to fetch workout');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching workout:', error);
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExerciseCompletion = (id: string) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, completed: !ex.completed } : ex
    ));
  };

  const updateExercise = (id: string, field: 'actualReps' | 'actualWeight', value: number) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const handleSaveProgress = async () => {
    if (!workout) return;
    
    setIsSubmitting(true);
    
    const updatedExercises = exercises.map(exercise => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = exercise;
      return rest;
    });
    
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workout,
          exercises: updatedExercises
        })
      });
      
      if (response.ok) {
        showNotification(
          "Workout progress saved successfully",
          "success",
          "Success"
        );
        setIsEditing(false);
        // Refresh the workout data
        fetchWorkout(workoutId);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update workout progress');
      }
    } catch (error) {
      console.error('Error updating workout progress:', error);
      showNotification(
        "Failed to save progress. Please try again.",
        "error",
        "Error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWorkout = async () => {
    setIsDeletingWorkout(true);
    
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showNotification(
          "Workout deleted successfully", 
          "success", 
          "Success"
        );
        router.push('/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete workout');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      showNotification(
        "Failed to delete workout. Please try again.",
        "error",
        "Error"
      );
      setIsDeletingWorkout(false);
      setShowDeleteConfirm(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (!workout) {
    return <div className="flex items-center justify-center min-h-screen">Workout not found</div>;
  }

  const allExercisesCompleted = exercises.every(ex => ex.completed);
  const progress = Math.round((exercises.filter(ex => ex.completed).length / exercises.length) * 100);

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{workout.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel Editing' : 'Track Progress'}
              {!isEditing && <PencilIcon className="ml-2 h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <Link href={`/workout/edit/${workout._id}`}>
                Edit Workout
                <PencilIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!showDeleteConfirm ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
                <Trash2 className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteWorkout}
                  disabled={isDeletingWorkout}
                >
                  {isDeletingWorkout ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>{format(parse(workout.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <div className="flex items-center">
                    <div className="w-full bg-accent h-2 rounded-full mr-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{progress}%</span>
                  </div>
                  {allExercisesCompleted && (
                    <div className="flex items-center mt-2 text-primary">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-2">Exercises</h2>
          
          {exercises.map((exercise) => (
            <Card key={exercise.id} className={exercise.completed ? "border-primary" : ""}>
              <CardContent className="p-4">
                <div className="grid gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center">
                      {isEditing && (
                        <Checkbox
                          id={`complete-${exercise.id}`}
                          checked={exercise.completed}
                          onCheckedChange={() => toggleExerciseCompletion(exercise.id)}
                          className="mr-2 data-[state=checked]:bg-primary"
                        />
                      )}
                      <h3 className="font-medium">{exercise.name}</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <div>
                        <span className="text-muted-foreground mr-1">Sets:</span>
                        <span>{exercise.sets}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground mr-1">Reps:</span>
                        <span>{exercise.reps}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground mr-1">Weight:</span>
                        <span>{exercise.weight} lbs</span>
                      </div>
                    </div>
                  </div>
                  
                  {isEditing && (
                    <div className="border-t pt-3 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor={`actual-reps-${exercise.id}`} className="text-sm font-medium">
                            Actual Reps
                          </label>
                          <Input
                            id={`actual-reps-${exercise.id}`}
                            type="number"
                            value={exercise.actualReps}
                            onChange={(e) => updateExercise(exercise.id, 'actualReps', parseInt(e.target.value) || 0)}
                            className="max-w-[150px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor={`actual-weight-${exercise.id}`} className="text-sm font-medium">
                            Actual Weight (lbs)
                          </label>
                          <Input
                            id={`actual-weight-${exercise.id}`}
                            type="number"
                            value={exercise.actualWeight}
                            onChange={(e) => updateExercise(exercise.id, 'actualWeight', parseFloat(e.target.value) || 0)}
                            className="max-w-[150px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!isEditing && exercise.completed && (
                    <div className="border-t pt-3 mt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground mr-1">Actual Reps:</span>
                          <span>{exercise.actualReps}</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground mr-1">Actual Weight:</span>
                          <span>{exercise.actualWeight} lbs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {isEditing && (
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={handleSaveProgress} 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Saving...' : 'Save Progress'}
              <Save className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 