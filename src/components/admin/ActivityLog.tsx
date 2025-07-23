
"use client";

import * as React from "react";
import { format } from "date-fns";
import type { Booking } from "@/types";
import { getUsers, User } from "@/lib/firestore-adapter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";


// In a real app, this data would come from a dedicated 'activity' collection in Firestore.
// For simplicity, we are not implementing a separate activity log system.
// This component is now a placeholder.

export function ActivityLog() {
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(
    null
  );
  const { db } = useAuth();

  React.useEffect(() => {
    async function fetchUsers() {
        if (!db) return;
        const allUsers = await getUsers(db);
        setUsers(allUsers);
    }
    fetchUsers();
  }, [db]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity Log</CardTitle>
        <CardDescription>
            Select a user to view their booking and cancellation history. (Feature coming soon)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs">
          <Select onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.uid} value={user.uid}>
                  {user.displayName} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-96">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Desk ID</TableHead>
                <TableHead>For Date</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Activity logging is not yet implemented.
                    </TableCell>
                  </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
