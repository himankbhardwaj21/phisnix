
'use client';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, LoaderCircle, XCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalysisState } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { ProgressCircle } from '../ui/progress-circle';
import { cn } from '@/lib/utils';

type AnalysisResultProps<T> = {
  state: AnalysisState<T & { isSafe?: boolean; reasoning?: string, trustScore?: number }>;
  pending?: boolean;
};

const ResultSkeleton = () => (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-2">
        <LoaderCircle className="h-16 w-16 animate-spin text-muted-foreground" />
        <p className="text-lg font-medium text-muted-foreground">Analyzing...</p>
      </div>
      <div className="space-y-2 rounded-lg border p-4">
        <div className="h-6 w-1/3 animate-pulse rounded-md bg-muted"></div>
        <div className="h-4 w-full animate-pulse rounded-md bg-muted"></div>
        <div className="h-4 w-4/5 animate-pulse rounded-md bg-muted"></div>
      </div>
    </div>
);

export function AnalysisResult<T extends { isSafe?: boolean; reasoning?: string, trustScore?: number }>({ state, pending: externalPending }: AnalysisResultProps<T>) {
  const { pending: formPending } = useFormStatus();
  const pending = formPending || externalPending;

  if (pending) {
    return <ResultSkeleton />;
  }

  if (!state.data) {
    return (
        <Alert variant="default" className="bg-accent/30">
            <Info className="h-4 w-4" />
            <AlertTitle>Ready to Scan</AlertTitle>
            <AlertDescription>
            Enter a link or upload a QR code above to start the security analysis.
            </AlertDescription>
        </Alert>
    );
  }

  const { isSafe, reasoning, trustScore = 0 } = state.data;
  const scoreColor = trustScore > 75 ? 'text-green-500' : trustScore > 40 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Card className={isSafe ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
      <CardHeader className="items-center text-center pb-4">
        <div className="relative mb-4">
            <ProgressCircle value={trustScore} size={100} strokeWidth={8} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-3xl font-bold font-headline", scoreColor)}>{trustScore}</span>
                <span className="text-xs text-muted-foreground">Trust Score</span>
            </div>
        </div>
        <CardTitle className={`text-2xl font-bold font-headline ${isSafe ? 'text-green-600' : 'text-red-600'}`}>
          This is {isSafe ? 'likely safe' : 'potentially unsafe'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5' />
                AI Analysis & Reasoning
              </div>
            </AccordionTrigger>
            <AccordionContent className="whitespace-pre-wrap text-sm font-body leading-relaxed">
              {reasoning || 'No detailed reasoning provided.'}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
