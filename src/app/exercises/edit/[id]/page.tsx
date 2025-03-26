'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import { useNotification } from '@/components/notification-provider';

interface Exercise {
  _id: string;
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  notes?: string;
}

export default function EditExercisePage() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params.id as string;
  const { status } = useSession();
  const { showNotification } = useNotification();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Strength');
  const [defaultSets, setDefaultSets] = useState(3);
  const [defaultReps, setDefaultReps] = useState(10);
  const [defaultWeight, setDefaultWeight] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingExercise, setIsDeletingExercise] = useState(false);
  
  useEffect(() => {
    if (status === 'authenticated' && exerciseId) {
      fetchExercise(exerciseId);
    }
  }, [status, exerciseId]);
  
  const fetchExercise = async (id: string) => {
    try {
      const response = await fetch(`/api/exercises/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        const exercise: Exercise = data.exercise;
        
        setName(exercise.name);
        setCategory(exercise.category);
        setDefaultSets(exercise.defaultSets);
        setDefaultReps(exercise.defaultReps);
        setDefaultWeight(exercise.defaultWeight);
        setNotes(exercise.notes || '');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch exercise');
      }
    } catch (error) {
      console.error('Error fetching exercise:', error);
      showNotification(
        "Failed to load exercise details",
        "error",
        "Error"
      );
      router.push('/exercises');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      showNotification(
        "Exercise name is required",
        "error",
        "Validation Error"
      );
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category,
          defaultSets,
          defaultReps,
          defaultWeight,
          notes,
        }),
      });
      
      if (response.ok) {
        showNotification(
          "Exercise updated successfully",
          "success",
          "Success"
        );
        router.push('/exercises');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update exercise');
      }
    } catch (error: unknown) {
      console.error('Error updating exercise:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update exercise";
      showNotification(
        errorMessage,
        "error",
        "Error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteExercise = async () => {
    setIsDeletingExercise(true);
    
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showNotification(
          "Exercise deleted successfully",
          "success",
          "Success"
        );
        router.push('/exercises');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete exercise');
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
      showNotification(
        "Failed to delete exercise",
        "error",
        "Error"
      );
    } finally {
      setIsDeletingExercise(false);
      setShowDeleteConfirm(false);
    }
  };
  
  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }
  
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/exercises">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit Exercise</h1>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Edit Exercise</CardTitle>
            {!showDeleteConfirm ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Exercise
                <Trash2 className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
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
                  onClick={handleDeleteExercise}
                  disabled={isDeletingExercise}
                >
                  {isDeletingExercise ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Exercise Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                  placeholder="e.g., Bench Press, Squats, etc."
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Strength">Strength</SelectItem>
                    <SelectItem value="Cardio">Cardio</SelectItem>
                    <SelectItem value="Flexibility">Flexibility</SelectItem>
                    <SelectItem value="Balance">Balance</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultSets">Default Sets</Label>
                  <Input
                    id="defaultSets"
                    type="number"
                    min="1"
                    value={defaultSets}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultSets(parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultReps">Default Reps</Label>
                  <Input
                    id="defaultReps"
                    type="number"
                    min="1"
                    value={defaultReps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultReps(parseInt(e.target.value) || 1)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="defaultWeight">Default Weight (lbs)</Label>
                  <Input
                    id="defaultWeight"
                    type="number"
                    min="0"
                    step="2.5"
                    value={defaultWeight}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDefaultWeight(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                  placeholder="Add any notes about this exercise..."
                  className="min-h-[100px]"
                />
              </div>
              
              <CardFooter className="px-0 pt-4 flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/exercises')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Update Exercise'}
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