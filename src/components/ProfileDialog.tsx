
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Info, KeyRound } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

type ProfileDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const passwordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters long."),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


export default function ProfileDialog({ isOpen, onOpenChange }: ProfileDialogProps) {
  const { user, changePassword, claims } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
        password: "",
        confirmPassword: ""
    }
  });

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  const onSubmit = async (data: z.infer<typeof passwordSchema>) => {
      setIsLoading(true);
      try {
        await changePassword(data.password);
        toast({
            title: "Password Updated",
            description: "Your password has been changed successfully.",
        });
        form.reset();
        setIsChangingPassword(false);
      } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Could not update password. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
  }

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      form.reset();
      setIsChangingPassword(false);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-md grid-rows-[auto_minmax(0,1fr)] max-h-[90vh]">
        <DialogHeader className="items-center text-center">
            <Avatar className="h-24 w-24 text-3xl mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {getInitials(user.displayName || user.email!)}
                </AvatarFallback>
            </Avatar>
          <DialogTitle className="text-3xl font-headline">{user.displayName}</DialogTitle>
          <DialogDescription className="text-lg">{user.email}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-6 -mr-6">
            <div className="space-y-6 pt-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                        To change your name or email, please contact an administrator.
                    </AlertDescription>
                </Alert>
                
                <Separator />

                {isChangingPassword ? (
                    <div>
                        <h3 className="text-lg font-medium">Change Password</h3>
                        <p className="text-sm text-muted-foreground">Enter a new password below.</p>
                    
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl>
                                                <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="ghost" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</>) : "Update Password"}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                ) : (
                    <Button className="w-full" onClick={() => setIsChangingPassword(true)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Change Password
                    </Button>
                )}
            </div>
        </ScrollArea>
        <DialogClose asChild>
            <Button type="button" variant="secondary" className="mt-4">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
