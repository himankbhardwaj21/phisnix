
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

type AnalysisResultProps<T> = {
  state: AnalysisState<T & { isSafe?: boolean; reasoning?: string }>;
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

export function AnalysisResult<T extends { isSafe?: boolean; reasoning?: string }>({ state }: AnalysisResultProps<T>) {
  const { pending } = useFormStatus();

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

  const { isSafe, reasoning } = state.data;

  return (
    <Card className={isSafe ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
      <CardHeader className="items-center text-center">
        {isSafe ? (
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        ) : (
          <XCircle className="h-16 w-16 text-red-500" />
        )}
        <CardTitle className={`text-2xl font-bold font-headline ${isSafe ? 'text-green-600' : 'text-red-600'}`}>
          This link is {isSafe ? 'likely safe' : 'potentially unsafe'}
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
