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
  const [manualCode, setManualCode] = useState('');

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const codeFromUrl = searchParams.get('oobCode');
    if (codeFromUrl) {
      handleCodeVerification(codeFromUrl);
    } else {
        setIsVerifying(false);
    }
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
        return { title: 'Expired Code', message: 'The reset code has expired. Please request a new one.' };
      case 'auth/invalid-action-code':
        return { title: 'Invalid Code', message: 'The reset code is invalid. Please check the code or request a new one.' };
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
      const actionCodeSettings = {
        url: `${window.location.origin}/login`, // We don't need user to come back to reset page
        handleCodeInApp: true,
      };
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for a link containing the reset code (oobCode).',
      });
      setStep('confirm'); // Move to confirmation step to enter OTP
    } catch (err) {
      const { title, message } = handleAuthError(err as AuthError);
      setError(message);
      toast({ variant: 'destructive', title, description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerification = async (code: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const verifiedEmail = await verifyPasswordResetCode(auth, code);
        setEmail(verifiedEmail);
        setOobCode(code);
        setStep('confirm');
        toast({ title: 'Code verified!', description: 'You can now set a new password.' });
      } catch (err) {
          const { title, message } = handleAuthError(err as AuthError);
          setError(message);
          toast({ variant: 'destructive', title, description: message });
      } finally {
        setIsVerifying(false);
        setIsLoading(false);
      }
  }

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    const codeToUse = oobCode || manualCode;
    if (!codeToUse) {
      setError('A reset code is required. Please enter it above.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, codeToUse, newPassword);
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
        <p className="mt-4 text-muted-foreground">Checking for reset code...</p>
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
                Enter your email address to receive a password reset code.
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
                  {isLoading ? <LoaderCircle className="animate-spin" /> : 'Send Reset Code'}
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
                Enter the reset code from your email and set a new password.
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
                 {!oobCode && (
                   <div className="space-y-2">
                    <Label htmlFor="reset-code">Reset Code (OTP)</Label>
                    <div className="relative">
                        <Input
                        id="reset-code"
                        type="text"
                        placeholder="Enter code from email"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        required
                        disabled={isLoading}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Find the link in your email and copy the value of the `oobCode` parameter.</p>
                 </div>
                 )}

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
                 <Button variant="link" size="sm" className="w-full" onClick={() => { setStep('request'); setError(null); }}>
                    Didn't get a code? Send again.
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
