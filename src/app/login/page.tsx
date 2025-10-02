
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/phishnix/logo';
import { GoogleIcon, OutlookIcon } from '@/components/icons';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const loginImage = PlaceHolderImages.find((img) => img.id === 'login-hero');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Mock authentication: just redirect to home page
    router.push('/');
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo />
            <h1 className="text-3xl font-bold font-headline">{isSignUp ? 'Create an account' : 'Welcome back'}</h1>
            <p className="text-balance text-muted-foreground">
              {isSignUp ? 'Enter your information to create an account' : 'Enter your credentials to access your account'}
            </p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{isSignUp ? 'Sign Up' : 'Sign In'}</CardTitle>
              <CardDescription>
                {isSignUp ? 'Or sign up with a provider' : 'Or sign in with a provider'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant="outline">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button variant="outline">
                  <OutlookIcon className="mr-2 h-4 w-4" />
                  Outlook
                </Button>
              </div>
              <div className="relative mb-6">
                <Separator />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 bg-card text-muted-foreground text-sm">
                  OR
                </div>
              </div>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email or Phone</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <Link href="#" className="ml-auto inline-block text-sm underline">
                        Forgot your password?
                      </Link>
                    )}
                  </div>
                  <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => setIsSignUp(!isSignUp)} className="underline ml-1">
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            data-ai-hint={loginImage.imageHint}
            fill
            className="object-cover dark:brightness-[0.4]"
          />
        )}
      </div>
    </div>
  );
}
