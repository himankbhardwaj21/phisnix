'use client';

import { useUser } from '@/firebase';
import { AppHeader } from '@/components/phishnix/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Save, ShieldQuestion } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();

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
                <form className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input id="name" defaultValue={user.displayName || ''} className="pl-10" placeholder="Your full name" />
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
                            <Input id="phone" type="tel" defaultValue={user.phoneNumber || ''} className="pl-10" placeholder="No phone number provided" />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Button variant="outline" className="w-full md:w-auto" type="button">
                        <ShieldQuestion className="mr-2 h-4 w-4" />
                        Send Password Reset Email
                      </Button>
                      <p className="text-sm text-muted-foreground">For security reasons, you can reset your password via email.</p>
                    </div>

                    <Separator className="!mt-6 !mb-4" />

                    <Button type="submit" className="w-full md:w-auto">
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
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
