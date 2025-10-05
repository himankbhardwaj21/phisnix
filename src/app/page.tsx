import { AppHeader } from '@/components/phishnix/header';
import { AnalysisTabs } from '@/components/phishnix/analysis-tabs';
import { Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col items-center gap-4 p-4 md:gap-8 md:p-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Stay Secure, Stay Ahead
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            Your AI-powered shield against online fraud. Analyze links and QR codes before you click.
          </p>
        </div>
        <AnalysisTabs />
      </main>
      <footer className="mt-auto py-8 text-center text-xs text-muted-foreground">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Lock className="h-4 w-4" />
            <p className="font-semibold">Your Privacy is Protected</p>
          </div>
          <p className="max-w-md mx-auto">
            For authenticated users, analysis history is saved to your account for your convenience. We are committed to your privacy and do not share your data with third parties.
          </p>
      </footer>
    </div>
  );
}
