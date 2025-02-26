'use client'

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusIcon } from 'lucide-react';
import Link from 'next/link';

export default function ExercisesPage() {
  const { status } = useSession();
  
  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (status === 'unauthenticated') {
    redirect('/login');
  }
  
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
            <h1 className="text-2xl font-bold">My Exercises</h1>
          </div>
          <Button asChild size="sm">
            <Link href="/exercises/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Exercise
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Exercise Library</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You haven't created any custom exercises yet. Create your first exercise to get started.
            </p>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/exercises/new">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Exercise
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 