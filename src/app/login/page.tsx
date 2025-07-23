
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResettingPassword, setIsResettingPassword] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { login, user, claims, forgotPassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) {
      if(claims?.admin) {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, claims, router]);


  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
        const { claims } = await login(data.email, data.password);
        if (claims?.admin) {
          router.push('/admin');
        } else {
          router.push('/');
        }
    } catch(err: any) {
        const errorCode = err.code;
        if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
            setError('Invalid email or password.');
        } else if (errorCode === 'auth/user-disabled') {
            setError('Your account has been disabled.');
        } else {
            setError('An unexpected error occurred. Please try again.');
        }
        setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = getValues("email");
    if (!email) {
      toast({
        variant: "destructive",
        title: 'Email Required',
        description: 'Please enter your email address before requesting a password reset.',
      });
      return;
    }
    
    setIsResettingPassword(true);
    try {
      await forgotPassword(email);
      toast({
        title: 'Password Reset',
        description: 'If an account with this email exists, a reset link has been sent.',
      });
    } catch (e: any) {
       toast({
          variant: "destructive",
          title: 'Failed to Send',
          description: e.message || 'Could not send password reset email. Please try again later.',
       });
    } finally {
        setIsResettingPassword(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
                <Building2 className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-headline text-foreground tracking-tight">
                    SeatServe
                </h1>
            </div>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...register('email')} placeholder="your.email@example.com" type="email"/>
              {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    
                    <button type="button" onClick={handleForgotPassword} className="text-sm font-medium text-primary hover:underline focus:outline-none" disabled={isResettingPassword}>
                        {isResettingPassword ? "Sending..." : "Forgot Password?"}
                    </button>
                    
                </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="pr-10"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-sm font-medium text-destructive">{errors.password.message}</p>}
            </div>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || isResettingPassword}>
              {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>) : "Log In"}
            </Button>
             <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
