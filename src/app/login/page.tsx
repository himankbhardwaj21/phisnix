
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { useFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/phishnix/logo';
import { GoogleIcon, OutlookIcon } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LoaderCircle, Eye, EyeOff, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { auth } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This effect handles both redirect results and ensures the user is navigated away if already logged in.
  useEffect(() => {
    if (isUserLoading) {
      // Still checking for a user, do nothing yet. The loading screen will show.
      return;
    }

    if (user) {
      // If we have a user object, login is successful. Navigate away.
      router.push('/');
      return;
    }

    // If we've finished loading, and there's no user, check for a redirect result.
    // This runs only once after the initial user check.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // A user has just signed in via redirect. The `onAuthStateChanged` listener
          // (which powers the `useUser` hook) will pick up the new user, and this
          // effect will re-run, hitting the `if (user)` block above to redirect.
          toast({
            title: 'Signed In',
            description: `Welcome back, ${result.user.displayName || result.user.email}!`,
          });
        }
      })
      .catch((err) => {
        setError(handleAuthError(err as AuthError));
      });
  }, [user, isUserLoading, auth, router, toast]);

  const handleAuthError = (err: AuthError) => {
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in.';
      case 'auth/weak-password':
        return 'The password is too weak. Please use at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Sign-in process was cancelled.';
      case 'auth/popup-blocked':
        return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email address but different sign-in credentials.';
      default:
        console.error('OAuth Error:', err);
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Account Created',
          description: 'You have been successfully signed up!',
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // The useEffect hook will handle the redirect to '/' when the user state changes.
    } catch (err) {
      setError(handleAuthError(err as AuthError));
    } finally {
      setFormIsLoading(false);
    }
  };

  const handlePasswordReset = () => {
    router.push('/reset-password');
  };

  const handleOAuthSignIn = async (providerName: 'google' | 'outlook') => {
    setFormIsLoading(true); // Visually disable form while redirect is being initiated
    setError(null);
    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account',
        });
      } else {
        provider = new OAuthProvider('microsoft.com');
        provider.setCustomParameters({
          prompt: 'select_account',
          tenant: 'common',
        });
      }
      await signInWithRedirect(auth, provider);
      // Page will redirect, no need to set loading to false here.
    } catch (err) {
      setError(handleAuthError(err as AuthError));
      setFormIsLoading(false);
    }
  };
  
  // This is the primary loading screen, shown while Firebase determines the initial auth state.
  if (isUserLoading || user) {
      return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
      )
  }


  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute top-4 left-4">
        <Logo />
      </div>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
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
                <Button variant="outline" onClick={() => handleOAuthSignIn('google')} disabled={formIsLoading}>
                   <GoogleIcon className="mr-2 h-4 w-4" />
                  Google
                </Button>
                <Button variant="outline" onClick={() => handleOAuthSignIn('outlook')} disabled={formIsLoading}>
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
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Authentication Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your Email ID"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={formIsLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {!isSignUp && (
                      <button type="button" onClick={handlePasswordReset} className="ml-auto inline-block text-sm underline">
                        Forgot your password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={formIsLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                      disabled={formIsLoading}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={formIsLoading}>
                  {formIsLoading ? (
                    <LoaderCircle className="animate-spin" />
                  ) : isSignUp ? (
                    'Sign Up'
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                  }}
                  className="underline ml-1"
                  disabled={formIsLoading}
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
        <footer className="mt-8 text-center text-xs text-muted-foreground max-w-sm">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Lock className="h-4 w-4" />
            <p className="font-semibold">Your Privacy is Our Priority</p>
          </div>
          <p>
            Your password is end-to-end encrypted. This means we don't have the ability to see, read, or store your password. Your security is built into our system from the ground up.
          </p>
        </footer>
      </div>
    </div>
  );
}

    