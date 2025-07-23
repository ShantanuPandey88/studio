
"use client"

import * as React from "react";
import { getDesks, Unsubscribe } from "@/lib/firestore-adapter";
import { addDesk, deleteDesk } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Desk } from "@/types";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useAuth } from "@/context/AuthContext";


const formSchema = z.object({
  deskNumber: z.coerce.number().min(1, "Required").max(999, "Invalid number"),
});

export function DeskManagement() {
  const [desks, setDesks] = React.useState<Desk[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const { user, db } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deskNumber: '' as any,
    },
  });

  React.useEffect(() => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }; 

    setIsLoading(true);
    const unsubscribe = getDesks(
       db,
       (newDesks) => {
           setDesks(newDesks);
           setIsLoading(false);
           setError(null);
       },
       (e) => {
           console.error(e);
           setError("Failed to fetch desks. Check Firestore security rules and project configuration.");
           setIsLoading(false);
       }
   );
    return () => unsubscribe?.();
  }, [user, db]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    const deskId = `6.W.WS.${values.deskNumber.toString().padStart(3,'0')}`;
    try {
        await addDesk({ id: deskId });
        toast({
            title: "Desk Added",
            description: `Desk ${deskId} has been added.`,
        });
        form.reset();
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Desk Exists",
            description: e.message || "This desk number already exists.",
        });
    }
  }

  const handleRemoveDesk = async (deskId: string) => {
    try {
        await deleteDesk(deskId);
        toast({
            title: "Desk Removed",
            description: `Desk ${deskId} has been removed.`,
        });
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "Could not remove desk. It might have active bookings.",
        });
        console.error("Error removing desk:", e);
    }
  };

  const sortedDesks = React.useMemo(() => {
    return [...desks].sort((a,b) => {
      const numA = parseInt(a.id.split('.').pop() || '0', 10);
      const numB = parseInt(b.id.split('.').pop() || '0', 10);
      return numA - numB;
    })
  }, [desks]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add New Desk</CardTitle>
          <CardDescription>Add a new individual desk by its number.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="deskNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desk Number (e.g., 136)</FormLabel>
                    <div className="flex items-start gap-2">
                        <span className="text-muted-foreground pt-2">6.W.WS.</span>
                        <FormControl>
                            <Input placeholder="136" type="number" {...field} />
                        </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Desk</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Available Desks</CardTitle>
          <CardDescription>A list of all currently configured desks.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-72">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                {error} Please check the browser's developer console (F12) for more details.
              </AlertDescription>
            </Alert>
          ) : sortedDesks.length === 0 ? (
             <Alert>
              <AlertTitle>No Desks Found</AlertTitle>
              <AlertDescription>
                The desk list is empty. You can add desks one by one using the form on the left.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-72">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Desk ID</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                  </TableHeader>
                <TableBody>
                  {sortedDesks.map((desk) => (
                    <TableRow key={desk.id}>
                      <TableCell className="font-mono">{desk.id}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDesk(desk.id)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove desk</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
