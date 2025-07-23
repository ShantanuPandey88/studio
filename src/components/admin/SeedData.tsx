
"use client";

import * as React from "react";
import { setupInitialDesks } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function SeedData() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSeedData = async () => {
    setIsLoading(true);
    const result = await setupInitialDesks();
    if (result.success) {
      toast({
        title: "Success!",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: result.message,
      });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initial Data Setup</CardTitle>
        <CardDescription>
          This action will populate your database with the initial set of desks.
          It only needs to be run once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-4">
          <p>
            Click the button below to create desks from 6.W.WS.019 to
            6.W.WS.135. If desks already exist, this operation will be skipped.
          </p>
          <Button onClick={handleSeedData} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding...
              </>
            ) : (
              "Seed Initial Desks"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
