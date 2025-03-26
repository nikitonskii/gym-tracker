'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PencilIcon, ArrowLeft, Plus, Trash2, Save, LineChart, Dumbbell, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { format, parse } from 'date-fns';
import { useNotification } from '@/components/notification-provider';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface Exercise {
  _id: string;
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
  notes?: string;
}

interface ExerciseEntry {
  _id: string;
  date: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
}

export default function ExerciseDetailPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const exerciseId = params.id as string;
  const { showNotification } = useNotification();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [entries, setEntries] = useState<ExerciseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({
    date: new Date(),
    sets: '',
    reps: '',
    weight: '',
    notes: '',
  });
  
  // Editing entry state
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: new Date(),
    sets: '',
    reps: '',
    weight: '',
    notes: '',
  });

  useEffect(() => {
    if (status === 'authenticated' && exerciseId) {
      fetchExercise();
      fetchExerciseHistory();
    }
  }, [status, exerciseId]);

  const fetchExercise = async () => {
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`);
      if (response.ok) {
        const data = await response.json();
        setExercise(data.exercise);
        
        // Pre-populate the new entry form with default values
        setNewEntry({
          date: new Date(),
          sets: data.exercise.defaultSets.toString(),
          reps: data.exercise.defaultReps.toString(),
          weight: data.exercise.defaultWeight.toString(),
          notes: '',
        });
      } else {
        console.error('Failed to fetch exercise');
        router.push('/exercises');
      }
    } catch (error) {
      console.error('Error fetching exercise:', error);
      router.push('/exercises');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchExerciseHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/history`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries);
      } else {
        console.error('Failed to fetch exercise history');
      }
    } catch (error) {
      console.error('Error fetching exercise history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const startEditing = (entry: ExerciseEntry) => {
    setEditingEntry(entry._id);
    setEditFormData({
      date: parse(entry.date, 'yyyy-MM-dd', new Date()),
      sets: entry.sets.toString(),
      reps: entry.reps.toString(),
      weight: entry.weight.toString(),
      notes: entry.notes || '',
    });
  };
  
  const cancelEditing = () => {
    setEditingEntry(null);
  };
  
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(newEntry.date, 'yyyy-MM-dd'),
          sets: parseInt(newEntry.sets) || 0,
          reps: parseInt(newEntry.reps) || 0,
          weight: parseFloat(newEntry.weight) || 0,
          notes: newEntry.notes
        })
      });
      
      if (response.ok) {
        showNotification(
          "Entry added successfully",
          "success",
          "Success"
        );
        
        // Reset form and reload entries
        if (exercise) {
          setNewEntry({
            date: new Date(),
            sets: exercise.defaultSets.toString(),
            reps: exercise.defaultReps.toString(),
            weight: exercise.defaultWeight.toString(),
            notes: '',
          });
        }
        setIsAddingEntry(false);
        fetchExerciseHistory();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      showNotification(
        "Failed to add entry. Please try again.",
        "error",
        "Error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleUpdateEntry = async (entryId: string) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/history/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(editFormData.date, 'yyyy-MM-dd'),
          sets: parseInt(editFormData.sets) || 0,
          reps: parseInt(editFormData.reps) || 0,
          weight: parseFloat(editFormData.weight) || 0,
          notes: editFormData.notes
        })
      });
      
      if (response.ok) {
        showNotification(
          "Entry updated successfully",
          "success",
          "Success"
        );
        setEditingEntry(null);
        fetchExerciseHistory();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update entry');
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      showNotification(
        "Failed to update entry. Please try again.",
        "error",
        "Error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/history/${entryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        showNotification(
          "Entry deleted successfully",
          "success",
          "Success"
        );
        fetchExerciseHistory();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      showNotification(
        "Failed to delete entry. Please try again.",
        "error",
        "Error"
      );
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  if (!exercise) {
    return <div className="flex items-center justify-center min-h-screen">Exercise not found</div>;
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center mb-2">
              <Button variant="ghost" size="sm" asChild className="mr-2">
                <Link href="/exercises">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Link>
              </Button>
            </div>
            <div className="flex items-center">
              <h1 className="text-2xl font-bold flex items-center">
                <Dumbbell className="h-6 w-6 mr-3 text-primary" />
                {exercise.name}
              </h1>
              <div className="ml-3 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                {exercise.category}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingEntry(!isAddingEntry)}
              className="flex items-center"
            >
              {isAddingEntry ? 'Cancel' : 'Add Entry'}
              {!isAddingEntry && <Plus className="ml-2 h-4 w-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
            >
              <Link href={`/exercises/edit/${exercise._id}`} className="flex items-center">
                Edit Exercise
                <PencilIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        
        {isAddingEntry && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {format(newEntry.date, 'PPP')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newEntry.date}
                          onSelect={(date) => date && setNewEntry({...newEntry, date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <label htmlFor="sets" className="text-sm font-medium">Sets</label>
                      <Input
                        id="sets"
                        name="sets"
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={newEntry.sets}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="reps" className="text-sm font-medium">Reps</label>
                      <Input
                        id="reps"
                        name="reps"
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        value={newEntry.reps}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="weight" className="text-sm font-medium">Weight (lbs)</label>
                      <Input
                        id="weight"
                        name="weight"
                        type="text"
                        inputMode="decimal"
                        value={newEntry.weight}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Notes (optional)</label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={newEntry.notes}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="How did this set feel? Any additional details worth noting?"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddingEntry(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Entry'}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Exercise Details</CardTitle>
              <CardDescription>{exercise.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Default Sets</p>
                  <p className="font-medium">{exercise.defaultSets}</p>
                  {entries.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last: <span className="font-medium">{entries[0]?.sets}</span>
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Reps</p>
                  <p className="font-medium">{exercise.defaultReps}</p>
                  {entries.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last: <span className="font-medium">{entries[0]?.reps}</span>
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Default Weight</p>
                  <p className="font-medium">{exercise.defaultWeight} lbs</p>
                  {entries.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last: <span className="font-medium">{entries[0]?.weight} lbs</span>
                    </p>
                  )}
                </div>
              </div>
              
              {exercise.notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{exercise.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-primary" />
                Progress Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Weight</p>
                    <p className="font-medium text-lg">{entries[0]?.weight} lbs</p>
                    
                    {entries.length > 1 && (
                      <div className="text-xs mt-1">
                        {entries[0]?.weight > entries[1]?.weight ? (
                          <span className="text-green-500 font-medium">
                            +{(entries[0]?.weight - entries[1]?.weight).toFixed(1)} lbs from previous
                          </span>
                        ) : entries[0]?.weight < entries[1]?.weight ? (
                          <span className="text-red-500 font-medium">
                            -{(entries[1]?.weight - entries[0]?.weight).toFixed(1)} lbs from previous
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Same as previous workout
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Weight Progress</p>
                    <div className="h-60 w-full">
                      {entries.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart
                            data={entries.slice(0, 10).reverse().map(entry => {
                              let formattedDate = '';
                              try {
                                const date = parse(entry.date, 'yyyy-MM-dd', new Date());
                                formattedDate = format(date, 'MMM d');
                              } catch {
                                formattedDate = entry.date && entry.date.includes('T') 
                                  ? entry.date.split('T')[0]
                                  : 'Date';
                              }
                              return {
                                date: formattedDate,
                                weight: entry.weight,
                                sets: entry.sets,
                                reps: entry.reps
                              };
                            })}
                            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 10 }}
                              tickMargin={5}
                            />
                            <YAxis 
                              domain={[
                                (dataMin: number) => Math.max(0, dataMin - 5), 
                                (dataMax: number) => dataMax + 5
                              ]}
                              tick={{ fontSize: 10 }}
                              tickMargin={5}
                              width={30}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                fontSize: '12px'
                              }}
                              labelStyle={{
                                fontWeight: 'bold',
                                marginBottom: '4px'
                              }}
                              formatter={(value: number | string, name: string) => {
                                return [`${value} ${name === 'weight' ? 'lbs' : ''}`, name];
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="weight" 
                              stroke="var(--primary)" 
                              strokeWidth={2}
                              dot={{ 
                                stroke: 'var(--primary)',
                                strokeWidth: 2,
                                r: 4,
                                fill: 'var(--background)'
                              }}
                              activeDot={{ r: 6 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-muted-foreground text-sm">Need at least 2 entries to show chart</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                    <p className="font-medium">{entries.length}</p>
                    {entries.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Since {
                          (() => {
                            try {
                              const date = parse(entries[entries.length - 1]?.date, 'yyyy-MM-dd', new Date());
                              return format(date, 'MMMM d, yyyy');
                            } catch {
                              return 'earlier date';
                            }
                          })()
                        }
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <LineChart className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No entries yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingHistory ? (
              <div className="flex justify-center items-center py-8">Loading history...</div>
            ) : entries.length > 0 ? (
              <div className="divide-y">
                {entries.map(entry => (
                  <div key={entry._id} className="p-4">
                    {editingEntry === entry._id ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Date</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  {format(editFormData.date, 'PPP')}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={editFormData.date}
                                  onSelect={(date) => date && setEditFormData({...editFormData, date})}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-2">
                              <label htmlFor={`edit-sets-${entry._id}`} className="text-sm font-medium">Sets</label>
                              <Input
                                id={`edit-sets-${entry._id}`}
                                name="sets"
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={editFormData.sets}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor={`edit-reps-${entry._id}`} className="text-sm font-medium">Reps</label>
                              <Input
                                id={`edit-reps-${entry._id}`}
                                name="reps"
                                type="text"
                                pattern="[0-9]*"
                                inputMode="numeric"
                                value={editFormData.reps}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <label htmlFor={`edit-weight-${entry._id}`} className="text-sm font-medium">Weight (lbs)</label>
                              <Input
                                id={`edit-weight-${entry._id}`}
                                name="weight"
                                type="text"
                                inputMode="decimal"
                                value={editFormData.weight}
                                onChange={handleEditInputChange}
                                required
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor={`edit-notes-${entry._id}`} className="text-sm font-medium">Notes (optional)</label>
                          <Textarea
                            id={`edit-notes-${entry._id}`}
                            name="notes"
                            value={editFormData.notes}
                            onChange={handleEditInputChange}
                            rows={2}
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button"
                            onClick={() => handleUpdateEntry(entry._id)}
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Saving...' : 'Update'}
                            <Save className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">
                            {(() => {
                              try {
                                // Try to parse the date, but handle invalid dates gracefully
                                const date = parse(entry.date, 'yyyy-MM-dd', new Date());
                                return format(date, 'MMMM d, yyyy');
                              } catch {
                                // Format the raw date string if possible
                                if (entry.date && entry.date.includes('T')) {
                                  return entry.date.split('T')[0].replace(/-/g, '/');
                                }
                                // Fall back to a simple display if parsing fails
                                return entry.date || 'Unknown date';
                              }
                            })()}
                          </p>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => startEditing(entry)}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteEntry(entry._id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground mr-1">Sets:</span>
                            <span>{entry.sets}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground mr-1">Reps:</span>
                            <span>{entry.reps}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground mr-1">Weight:</span>
                            <span>{entry.weight} lbs</span>
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">Notes:</p>
                            <p>{entry.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <LineChart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No entries yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first entry to start tracking progress for this exercise.
                </p>
                <Button onClick={() => setIsAddingEntry(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Entry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 