'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  AuthError,
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, AlertCircle, Eye, EyeOff, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import { Logo } from '@/components/phishnix/logo';

function PasswordResetFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth } = useFirebase();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Effect to check for oobCode in URL on component mount
  useEffect(() => {
    const codeFromUrl = searchParams.get('oobCode');
    if (codeFromUrl) {
      setIsLoading(true);
      setError(null);
      verifyPasswordResetCode(auth, codeFromUrl)
        .then((verifiedEmail) => {
          setEmail(verifiedEmail);
          setOobCode(codeFromUrl);
          setStep('confirm');
          toast({ title: 'Code verified!', description: 'You can now set a new password.' });
        })
        .catch((err) => {
          setError(handleAuthError(err).message);
          toast({ variant: 'destructive', title: 'Invalid Link', description: 'The password reset link is invalid or has expired.' });
        })
        .finally(() => setIsLoading(false));
    }
    setIsVerifying(false);
  }, [searchParams, auth, toast]);

  const handleAuthError = (err: AuthError): { title: string; message: string } => {
    switch (err.code) {
      case 'auth/invalid-email':
        return { title: 'Invalid Email', message: 'Please enter a valid email address.' };
      case 'auth/user-not-found':
        return { title: 'User Not Found', message: 'No account found with this email address.' };
      case 'auth/missing-password':
        return { title: 'Missing Password', message: 'Please enter a new password.' };
      case 'auth/weak-password':
        return { title: 'Weak Password', message: 'Password should be at least 6 characters long.' };
      case 'auth/expired-action-code':
        return { title: 'Expired Code', message: 'The password reset code has expired. Please request a new one.' };
      case 'auth/invalid-action-code':
        return { title: 'Invalid Code', message: 'The password reset code is invalid. Please check the link or request a new one.' };
      default:
        console.error('Password Reset Error:', err);
        return { title: 'Error', message: 'An unexpected error occurred. Please try again.' };
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // The actionCodeSettings will redirect the user back to this page with the oobCode
      const actionCodeSettings = {
        url: `${window.location.origin}/reset-password`,
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your email for a link to reset your password.',
      });
      // We don't change step here. The user must click the link in their email.
    } catch (err) {
      const { title, message } = handleAuthError(err as AuthError);
      setError(message);
      toast({ variant: 'destructive', title, description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!oobCode) {
      setError('No valid reset code found. Please restart the process.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast({
        title: 'Password Reset Successful!',
        description: 'You can now sign in with your new password.',
      });
      router.push('/login');
    } catch (err) {
      const { title, message } = handleAuthError(err as AuthError);
      setError(message);
      toast({ variant: 'destructive', title, description: message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
        <LoaderCircle className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link href="/" aria-label="PhishNix Home">
          <Logo />
        </Link>
      </div>

      <Card className="w-full max-w-md">
        {step === 'request' && (
          <>
            <CardHeader>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoaderCircle className="animate-spin" /> : 'Send Reset Link'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Remember your password?{' '}
                <Link href="/login" className="underline">
                  Sign In
                </Link>
              </div>
            </CardContent>
          </>
        )}

        {step === 'confirm' && (
          <>
            <CardHeader>
              <CardTitle>Create a New Password</CardTitle>
              <CardDescription>
                Your new password must be at least 6 characters long.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleConfirmSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="email" type="email" value={email} disabled className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                     <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                   <div className="relative">
                     <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoaderCircle className="animate-spin" /> : 'Set New Password'}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}


export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="w-full min-h-screen flex items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin text-primary" /></div>}>
            <PasswordResetFlow />
        </Suspense>
    )
}
