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
import { PencilIcon, ArrowLeft, CheckCircle, Save } from 'lucide-react';
import Link from 'next/link';
import { format, parse } from 'date-fns';

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
  
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<(Exercise & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    
    const updatedExercises = exercises.map(({ id, ...rest }) => rest);
    
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
        setIsEditing(false);
        // Refresh the workout data
        fetchWorkout(workoutId);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update workout progress');
      }
    } catch (error) {
      console.error('Error updating workout progress:', error);
      alert('Failed to save progress. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{workout.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
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
          </div>
        </div>
        
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>{format(parse(workout.date, 'yyyy-MM-dd', new Date()), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <div className="flex items-center">
                    <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Exercises</h2>
          
          {exercises.map((exercise) => (
            <Card key={exercise.id} className={exercise.completed ? "border-green-500" : ""}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {isEditing && (
                      <Checkbox 
                        checked={exercise.completed}
                        onCheckedChange={() => toggleExerciseCompletion(exercise.id)}
                        className="mr-2"
                      />
                    )}
                    <h3 className="font-medium">{exercise.name}</h3>
                    {exercise.completed && !isEditing && (
                      <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sets</p>
                    <p>{exercise.sets}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isEditing ? "Planned Reps → Actual" : "Reps"}
                    </p>
                    {isEditing ? (
                      <div className="flex items-center">
                        <span className="mr-2">{exercise.reps} →</span>
                        <Input
                          type="number"
                          min="0"
                          value={exercise.actualReps}
                          onChange={(e) => updateExercise(exercise.id, 'actualReps', parseInt(e.target.value) || 0)}
                          className="w-16 h-8"
                        />
                      </div>
                    ) : (
                      <p>
                        {exercise.actualReps !== exercise.reps 
                          ? `${exercise.reps} → ${exercise.actualReps}` 
                          : exercise.reps}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {isEditing ? "Planned Weight → Actual" : "Weight (lbs)"}
                    </p>
                    {isEditing ? (
                      <div className="flex items-center">
                        <span className="mr-2">{exercise.weight} →</span>
                        <Input
                          type="number"
                          min="0"
                          step="2.5"
                          value={exercise.actualWeight}
                          onChange={(e) => updateExercise(exercise.id, 'actualWeight', parseFloat(e.target.value) || 0)}
                          className="w-16 h-8"
                        />
                      </div>
                    ) : (
                      <p>
                        {exercise.actualWeight !== exercise.weight 
                          ? `${exercise.weight} → ${exercise.actualWeight}` 
                          : exercise.weight}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {isEditing && (
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleSaveProgress} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Progress'}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
          
          {allExercisesCompleted && !isEditing && (
            <Card className="bg-green-50 border-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <p className="font-medium text-green-700">Workout completed! Great job!</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 