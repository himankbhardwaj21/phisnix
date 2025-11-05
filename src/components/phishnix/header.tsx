'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Logo } from './logo';
import { useFirebase, useUser } from '@/firebase';
import { User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';

export function AppHeader() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { auth } = useFirebase();

  const handleContactClick = () => {
    router.push('/contact');
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      // Optionally, show a toast notification for the error
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="sr-only">PhishNix Home</span>
      </Link>
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                {!isUserLoading && user?.photoURL && <AvatarImage src={user.photoURL} />}
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user ? user.displayName || user.email : 'My Account'}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleContactClick}>Contact Us</DropdownMenuItem>
            <DropdownMenuItem disabled>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
