'use client';

import { AppHeader } from '@/components/phishnix/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Phone, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-10">
        <div className="w-full max-w-2xl">
          <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8 text-center">
            Get in Touch
          </h1>
           <p className="max-w-[700px] text-center mx-auto text-muted-foreground md:text-xl mb-8">
            We're here to help. Reach out to our support team with any questions or concerns.
          </p>
          <Card>
            <CardHeader>
              <CardTitle>Support Information</CardTitle>
              <CardDescription>
                You can reach us via phone or email during business hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Phone Number</h3>
                  <p className="text-muted-foreground">Our support team is available by phone.</p>
                  <Link href="tel:+919258312301" className="text-lg font-mono text-primary hover:underline mt-1 block">
                    +91 9258312301
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Email Address</h3>
                  <p className="text-muted-foreground">For general inquiries and support.</p>
                  <Link href="mailto:phisnix@gmail.com" className="text-lg font-mono text-primary hover:underline mt-1 block">
                    phisnix@gmail.com
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
