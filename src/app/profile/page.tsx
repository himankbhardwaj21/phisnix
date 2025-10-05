'use client';

import { useState, useEffect, useTransition } from 'react';
import { useUser } from '@/firebase';
import { AppHeader } from '@/components/phishnix/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Save, ShieldQuestion, LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ProfilePage() {
  const { user, auth, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setPhone(user.phoneNumber || '');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateUserProfile({ name, phone });
      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: result.error,
        });
      } else {
        toast({
          title: 'Profile Updated',
          description: 'Your changes have been saved successfully.',
        });
      }
    });
  };

  const handlePasswordReset = async () => {
    if (user?.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        toast({
          title: 'Password Reset Email Sent',
          description: 'Check your inbox for instructions to reset your password.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to send password reset email.',
        });
      }
    }
  };


  const UserSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Separator />
      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-10">
        <div className="w-full max-w-3xl">
          <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
            My Profile
          </h1>
          <Card>
            <CardContent className="p-6">
              {isUserLoading ? (
                <UserSkeleton />
              ) : user ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={user.photoURL || undefined} data-ai-hint="user avatar" />
                      <AvatarFallback>
                        <User className="h-12 w-12" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold font-headline">{user.displayName || 'Anonymous User'}</h2>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <Separator />
                  <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="Your full name" disabled={isPending}/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="email" type="email" defaultValue={user.email || ''} className="pl-10" disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" placeholder="No phone number provided" disabled={isPending}/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                       <Button variant="outline" className="w-full md:w-auto" type="button" onClick={handlePasswordReset} disabled={isPending}>
                        <ShieldQuestion className="mr-2 h-4 w-4" />
                        Send Password Reset Email
                      </Button>
                      <p className="text-sm text-muted-foreground">For security reasons, you can reset your password via email.</p>
                    </div>

                    <Separator className="!mt-6 !mb-4" />

                    <Button type="submit" className="w-full md:w-auto" disabled={isPending}>
                      {isPending ? <LoaderCircle className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                      {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Please sign in to view your profile.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
