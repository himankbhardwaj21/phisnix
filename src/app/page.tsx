import { AppHeader } from '@/components/phishnix/header';
import { AnalysisTabs } from '@/components/phishnix/analysis-tabs';

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
    </div>
  );
}
