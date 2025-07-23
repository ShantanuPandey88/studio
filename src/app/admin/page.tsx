
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Building2, Users, CalendarDays, Armchair, BookOpen, ScrollText, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
// import AdminProtectedRoute from "@/components/AdminProtectedRoute";

import { UserManagement } from "@/components/admin/UserManagement";
import { DeskManagement } from "@/components/admin/DeskManagement";
import { BookingManagement } from "@/components/admin/BookingManagement";
import { DateManagement } from "@/components/admin/DateManagement";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { SeedData } from "@/components/admin/SeedData";


export default function AdminPage() {
  return (
    // <AdminProtectedRoute>
      <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-headline text-foreground tracking-tight">
              SeatServe Admin
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
              <Button asChild variant="outline">
                  <Link href="/">Back to App</Link>
              </Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
          <Tabs defaultValue="users">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 h-auto">
                  <TabsTrigger value="users" className="py-2"><Users className="mr-2"/>Users</TabsTrigger>
                  <TabsTrigger value="bookings" className="py-2"><BookOpen className="mr-2"/>Bookings</TabsTrigger>
                  <TabsTrigger value="desks" className="py-2"><Armchair className="mr-2"/>Desks</TabsTrigger>
                  <TabsTrigger value="dates" className="py-2"><CalendarDays className="mr-2"/>Dates</TabsTrigger>
                  <TabsTrigger value="activity" className="py-2"><ScrollText className="mr-2"/>Activity Log</TabsTrigger>
                  <TabsTrigger value="setup" className="py-2"><Database className="mr-2"/>Setup</TabsTrigger>
              </TabsList>
              <TabsContent value="users">
                  <UserManagement />
              </TabsContent>
              <TabsContent value="bookings">
                  <BookingManagement />
              </TabsContent>
              <TabsContent value="desks">
                  <DeskManagement />
              </TabsContent>
              <TabsContent value="dates">
                  <DateManagement />
              </TabsContent>
              <TabsContent value="activity">
                  <ActivityLog />
              </TabsContent>
              <TabsContent value="setup">
                  <SeedData />
              </TabsContent>
          </Tabs>
        </main>
      </div>
    // </AdminProtectedRoute>
  );
}
