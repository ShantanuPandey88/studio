
"use client"

import * as React from "react";
import { getUsers, User } from "@/lib/firestore-adapter";
import { setUserDisabledStatusAction, deleteUserAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddUserDialog } from "./AddUserDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { useAuth } from "@/context/AuthContext";

export function UserManagement() {
  const [users, setUsers] = React.useState<User[]>([]);
  const { toast } = useToast();
  const { user, db } = useAuth();

  const refreshUsers = React.useCallback(async () => {
    if (!user || !db) return;
    const allUsers = await getUsers(db);
    setUsers(allUsers);
  }, [user, db]);

  React.useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);


  const handleToggleUserStatus = async (uid: string, disabled: boolean) => {
    try {
        await setUserDisabledStatusAction(uid, disabled);
        refreshUsers();
        toast({
            title: "User Updated",
            description: `User has been ${disabled ? 'disabled' : 'enabled'}.`,
        });
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Action Forbidden",
            description: e.message || "You cannot disable this user.",
        });
    }
  };
  
  const handleRemoveUser = async (uid: string, name: string) => {
    try {
        await deleteUserAction(uid);
        refreshUsers();
        toast({
            title: "User Removed",
            description: `User ${name} has been removed from the system.`,
        });
    } catch (e: any) {
        toast({
            variant: "destructive",
            title: "Action Forbidden",
            description: e.message || "This user cannot be removed.",
        });
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View, add, remove, and manage all registered users.</CardDescription>
        </div>
        <AddUserDialog onUserAdded={refreshUsers} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.team || 'N/A'}</TableCell>
                <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                </TableCell>
                <TableCell>
                   <Badge variant={user.disabled ? 'destructive' : 'outline'}>{user.disabled ? 'Disabled' : 'Active'}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <EditUserDialog 
                    user={user} 
                    onUserUpdated={refreshUsers} 
                  />
                  <Switch
                    checked={!user.disabled}
                    onCheckedChange={(checked) => handleToggleUserStatus(user.uid, !checked)}
                    aria-label={`Toggle status for ${user.displayName}`}
                    disabled={user.email === 'admin@example.com'}
                  />
                   <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" disabled={user.email === 'admin@example.com'}>
                                <Trash2 className="h-4 w-4"/>
                                <span className="sr-only">Remove User</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the user account for <span className="font-bold">{user.displayName}</span>.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveUser(user.uid, user.displayName)}>Confirm Deletion</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
