'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Save } from 'lucide-react';
import { format, parse } from 'date-fns';

interface ExerciseInput {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export default function EditWorkoutPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;
  
  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [exercises, setExercises] = useState<ExerciseInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        
        setWorkoutName(workout.name);
        setDate(parse(workout.date, 'yyyy-MM-dd', new Date()));
        setExercises(workout.exercises.map((ex: any) => ({
          id: crypto.randomUUID(),
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight
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

  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: crypto.randomUUID(), name: '', sets: 3, reps: 10, weight: 0 }
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(exercise => exercise.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof ExerciseInput, value: string | number) => {
    setExercises(exercises.map(exercise => 
      exercise.id === id ? { ...exercise, [field]: value } : exercise
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!workoutName.trim() || exercises.some(ex => !ex.name.trim())) {
      alert('Please fill in all exercise names and workout name');
      setIsSubmitting(false);
      return;
    }
    
    const workoutData = {
      name: workoutName,
      date: format(date, 'yyyy-MM-dd'),
      exercises: exercises.map(({ id, ...rest }) => rest) // Remove temporary IDs
    };
    
    try {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });
      
      if (response.ok) {
        router.push('/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update workout');
      }
    } catch (error) {
      console.error('Error updating workout:', error);
      alert('Failed to update workout. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Edit Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="workout-name">Workout Name</Label>
                <Input
                  id="workout-name"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="e.g., Upper Body, Leg Day, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => date && setDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Exercises</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addExercise}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Exercise
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {exercises.map((exercise, index) => (
                    <div key={exercise.id} className="border rounded-md p-4 space-y-4">
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 space-y-1">
                          <Label htmlFor={`name-${index}`}>Exercise Name</Label>
                          <Input
                            id={`name-${index}`}
                            value={exercise.name}
                            onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                            placeholder="e.g., Bench Press, Squats, etc."
                            required
                          />
                        </div>
                        
                        <div className="col-span-4 md:col-span-2 space-y-1">
                          <Label htmlFor={`sets-${index}`}>Sets</Label>
                          <Input
                            id={`sets-${index}`}
                            type="number"
                            min="1"
                            value={exercise.sets}
                            onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        
                        <div className="col-span-4 md:col-span-2 space-y-1">
                          <Label htmlFor={`reps-${index}`}>Reps</Label>
                          <Input
                            id={`reps-${index}`}
                            type="number"
                            min="1"
                            value={exercise.reps}
                            onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                            required
                          />
                        </div>
                        
                        <div className="col-span-4 md:col-span-3 space-y-1">
                          <Label htmlFor={`weight-${index}`}>Weight (lbs)</Label>
                          <Input
                            id={`weight-${index}`}
                            type="number"
                            min="0"
                            step="2.5"
                            value={exercise.weight}
                            onChange={(e) => updateExercise(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        
                        <div className="col-span-12 md:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(exercise.id)}
                            disabled={exercises.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <CardFooter className="px-0 pt-4 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Update Workout'}
                  <Save className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 