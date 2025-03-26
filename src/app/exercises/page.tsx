'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  PlusCircle, 
  PencilIcon,
  Trash2, 
  Search as SearchIcon,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useNotification } from '@/components/notification-provider';
import { Input } from '@/components/ui/input';

interface Exercise {
  _id: string;
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

export default function ExercisesPage() {
  const { status } = useSession();
  const { showNotification } = useNotification();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchExercises();
    }
  }, [status]);
  
  const fetchExercises = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/exercises');
      
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
      } else {
        console.error('Failed to fetch exercises');
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        const response = await fetch(`/api/exercises/${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          showNotification(
            "Exercise deleted successfully",
            "success",
            "Success"
          );
          setExercises(exercises.filter(ex => ex._id !== id));
        } else {
          throw new Error('Failed to delete exercise');
        }
      } catch (error) {
        console.error('Error deleting exercise:', error);
        showNotification(
          "Failed to delete exercise",
          "error",
          "Error"
        );
      }
    }
  };

  const filteredExercises = exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }
  
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <CardTitle>My Exercises</CardTitle>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <div className="relative">
                <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 max-w-[300px]"
                />
              </div>
              <Button asChild>
                <Link href="/exercises/new">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Exercise
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">Loading exercises...</div>
            ) : filteredExercises.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map(exercise => (
                  <div key={exercise._id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors relative">
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/exercises/edit/${exercise._id}`}>
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(exercise._id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Dumbbell className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-lg">
                        <Link href={`/exercises/${exercise._id}`} className="hover:underline">
                          {exercise.name}
                        </Link>
                      </h3>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        Category: <span className="text-foreground">{exercise.category}</span>
                      </p>
                      <p className="text-muted-foreground">
                        Default: <span className="text-foreground">
                          {exercise.defaultSets} sets × {exercise.defaultReps} reps @ {exercise.defaultWeight} lbs
                        </span>
                      </p>
                      <Link 
                        href={`/exercises/${exercise._id}`}
                        className="text-primary text-sm hover:underline inline-flex items-center mt-2"
                      >
                        View History
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-2">No exercises found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? "No exercises match your search. Try different keywords."
                    : "Start by adding your first exercise to your collection."
                  }
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link href="/exercises/new">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add First Exercise
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 