'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNotification } from '@/components/notification-provider';
import { SearchableSelect } from '@/components/ui/searchable-select';

interface ExerciseInput {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

interface SavedExercise {
  _id: string;
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

export default function NewWorkoutPage() {
  const { status } = useSession();
  const router = useRouter();
  const { showNotification } = useNotification();
  const [workoutName, setWorkoutName] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { id: crypto.randomUUID(), name: '', sets: 3, reps: 10, weight: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedExercises, setSavedExercises] = useState<SavedExercise[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSavedExercises();
    }
  }, [status]);

  const fetchSavedExercises = async () => {
    try {
      setIsLoadingExercises(true);
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

  if (status === 'loading') {
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

  const selectSavedExercise = (exerciseId: string, targetId: string) => {
    const savedExercise = savedExercises.find(ex => ex._id === exerciseId);
    
    if (savedExercise) {
      setExercises(exercises.map(exercise => 
        exercise.id === targetId 
          ? { 
              id: exercise.id, 
              name: savedExercise.name, 
              sets: savedExercise.defaultSets, 
              reps: savedExercise.defaultReps, 
              weight: savedExercise.defaultWeight 
            } 
          : exercise
      ));
    }
  };

  // Convert saved exercises to select options format
  const getExerciseOptions = () => {
    return savedExercises.map(exercise => ({
      value: exercise._id,
      label: exercise.name
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form
    if (!workoutName.trim() || exercises.some(ex => !ex.name.trim())) {
      showNotification(
        "Please fill in all exercise names and workout name",
        "error",
        "Validation Error"
      );
      setIsSubmitting(false);
      return;
    }
    
    const workoutData = {
      name: workoutName,
      date: format(date, 'yyyy-MM-dd'),
      exercises: exercises.map(exercise => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = exercise;
        return rest;
      })
    };
    
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData)
      });
      
      if (response.ok) {
        showNotification(
          "Workout created successfully",
          "success",
          "Success"
        );
        router.push('/dashboard');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create workout');
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      showNotification(
        "Failed to save workout. Please try again.",
        "error",
        "Error"
      );
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workout-name">Workout Name</Label>
                    <Input
                      id="workout-name"
                      placeholder="e.g., Upper Body, Leg Day"
                      value={workoutName}
                      onChange={(e) => setWorkoutName(e.target.value)}
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
                      <Plus className="h-4 w-4 mr-1" /> Add Exercise
                    </Button>
                  </div>
                  
                  {exercises.map((exercise, index) => (
                    <div 
                      key={exercise.id} 
                      className="grid grid-cols-12 gap-2 items-end border p-3 rounded-md"
                    >
                      <div className="col-span-12 space-y-1">
                        <div className="flex justify-between items-center">
                          <Label htmlFor={`exercise-${index}`}>Exercise Name</Label>
                          {isLoadingExercises ? (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Loading...
                            </div>
                          ) : savedExercises.length > 0 ? (
                            <div className="w-[200px]">
                              <SearchableSelect
                                options={getExerciseOptions()}
                                value=""
                                onChange={(value) => selectSavedExercise(value, exercise.id)}
                                placeholder="Select exercise"
                              />
                            </div>
                          ) : null}
                        </div>
                        <Input
                          id={`exercise-${index}`}
                          placeholder="e.g., Bench Press"
                          value={exercise.name}
                          onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
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
                  {isSubmitting ? 'Saving...' : 'Save Workout'}
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