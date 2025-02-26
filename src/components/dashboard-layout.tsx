'use client'


import { useSession, signOut } from 'next-auth/react';
import {  Dumbbell, LogOut, 
  Users, Home, PlusCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';




export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  
  if (!session) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col h-full py-4 border-r">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">
              Gym Tracker
            </h2>
            <div className="space-y-1">
              <Link href="/dashboard" className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md",
                pathname === "/dashboard" ? "bg-accent" : "hover:bg-accent/50"
              )}>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
              <Link href="/workout/new" className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md",
                pathname.startsWith("/workout/new") ? "bg-accent" : "hover:bg-accent/50"
              )}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Workout
              </Link>
              <Link href="/exercises" className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md",
                pathname.startsWith("/exercises") ? "bg-accent" : "hover:bg-accent/50"
              )}>
                <Dumbbell className="mr-2 h-4 w-4" />
                Exercises
              </Link>
              <Link href="/friends" className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md",
                pathname.startsWith("/friends") ? "bg-accent" : "hover:bg-accent/50"
              )}>
                <Users className="mr-2 h-4 w-4" />
                Friends
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navbar */}
      <div className="flex md:hidden flex-col fixed bottom-0 left-0 right-0 border-t bg-background z-10">
        <div className="flex justify-around items-center p-2">
          <Link href="/dashboard" className={cn(
            "flex flex-col items-center p-2 rounded-md",
            pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
          )}>
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link href="/workout/new" className={cn(
            "flex flex-col items-center p-2 rounded-md",
            pathname.startsWith("/workout/new") ? "text-primary" : "text-muted-foreground"
          )}>
            <PlusCircle className="h-5 w-5" />
            <span className="text-xs mt-1">New</span>
          </Link>
          <Link href="/exercises" className={cn(
            "flex flex-col items-center p-2 rounded-md",
            pathname.startsWith("/exercises") ? "text-primary" : "text-muted-foreground"
          )}>
            <Dumbbell className="h-5 w-5" />
            <span className="text-xs mt-1">Exercises</span>
          </Link>
          <Link href="/friends" className={cn(
            "flex flex-col items-center p-2 rounded-md",
            pathname.startsWith("/friends") ? "text-primary" : "text-muted-foreground"
          )}>
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Friends</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 md:ml-0 pb-16 md:pb-0">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
