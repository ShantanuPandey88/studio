
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
import { Building2, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string()
    .email('Please enter a valid email address')
    .refine(email => email.toLowerCase().endsWith('@t-systems.com'), {
        message: 'Only @t-systems.com emails are allowed',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { signup, user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user && !isSuccess) { // prevent redirect if success message is shown
      router.push('/');
    }
  }, [user, router, isSuccess]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
        await signup(data.email, data.password, `${data.firstName} ${data.lastName}`);
        setIsSuccess(true);
    } catch(err: any) {
        if (err.message.includes('email-already-in-use')) {
             setError('Email already exists, please sign in.');
        } else {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        }
    } finally {
        setIsLoading(false);
    }
  };

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
          <CardTitle className="text-2xl font-bold">{isSuccess ? 'Registration Successful!' : 'Create an Account'}</CardTitle>
          {!isSuccess && <CardDescription>Enter your details to get started.</CardDescription>}
        </CardHeader>
        {isSuccess ? (
             <CardContent className="text-center">
                <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700 dark:text-green-400">Congratulations!</AlertTitle>
                    <AlertDescription className="text-green-600 dark:text-green-500">
                       You have successfully registered.
                    </AlertDescription>
                </Alert>
            </CardContent>
        ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...register('firstName')} />
                        {errors.firstName && <p className="text-sm font-medium text-destructive">{errors.firstName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...register('lastName')} />
                        {errors.lastName && <p className="text-sm font-medium text-destructive">{errors.lastName.message}</p>}
                    </div>
                </div>
                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...register('email')} placeholder="your.name@t-systems.com" type="email"/>
                {errors.email && <p className="text-sm font-medium text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>) : "Sign Up"}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    Log In
                </Link>
                </p>
            </CardFooter>
            </form>
        )}
         {isSuccess && (
            <CardFooter className="flex-col">
                 <Button asChild className="w-full">
                    <Link href="/login">Go to Log In</Link>
                </Button>
            </CardFooter>
        )}
      </Card>
    </main>
  );
}
