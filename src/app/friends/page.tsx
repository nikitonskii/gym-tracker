'use client'

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function FriendsPage() {
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
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Friends</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect with Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This feature is coming soon! You'll be able to connect with friends and see their workouts here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 