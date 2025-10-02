
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Search, LoaderCircle } from 'lucide-react';

import { performUrlAnalysis, type AnalysisState } from '@/app/actions';
import {
  AnalyzeWebsiteSafetyOutput,
} from '@/ai/flows/analyze-website-safety';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { AnalysisResult } from './analysis-result';
import { useToast } from '@/hooks/use-toast';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <Search />
      )}
      <span className="ml-2">Analyze URL</span>
    </Button>
  );
}

export function UrlAnalysis() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<AnalysisState<AnalyzeWebsiteSafetyOutput>, FormData>(
    performUrlAnalysis,
    {}
  );

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: state.error,
      });
    }
  }, [state.error, toast]);
  
  useEffect(() => {
    if (state.data) {
        formRef.current?.reset();
    }
  },[state.data])

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="flex w-full items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            name="url"
            placeholder="https://example.com"
            className="text-base"
            required
            type="url"
          />
          {state.fieldErrors?.url && (
            <p className="text-sm text-destructive">{state.fieldErrors.url[0]}</p>
          )}
        </div>
        <SubmitButton />
      </form>
      <AnalysisResult<AnalyzeWebsiteSafetyOutput> state={state} />
    </div>
  );
}
