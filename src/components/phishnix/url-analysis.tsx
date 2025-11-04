
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Search, LoaderCircle } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';

import { performUrlAnalysis, type AnalysisState } from '@/app/actions';
import {
  AnalyzeWebsiteSafetyOutput,
} from '@/ai/flows/analyze-website-safety';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { AnalysisResult } from './analysis-result';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';

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

async function saveUrlAnalysis(firestore: any, userId: string, data: any) {
    if (!firestore || !userId) return;
    try {
        const analysisData = {
        ...data,
        userId: userId,
        analysisDate: new Date().toISOString(),
        };
        const collectionRef = collection(firestore, 'users', userId, 'urlAnalysis');
        await addDoc(collectionRef, analysisData);
    } catch (error) {
        console.error("Error saving URL analysis:", error);
    }
}

export function UrlAnalysis() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { user, firestore } = useFirebase();

  const [state, formAction, isPending] = useActionState<AnalysisState<AnalyzeWebsiteSafetyOutput>, FormData>(
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
    if (state.data && user) {
        saveUrlAnalysis(firestore, user.uid, state.data);
        formRef.current?.reset();
    }
  },[state.data, user, firestore])

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="flex w-full items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            name="url"
            placeholder="www.example.com"
            className="text-base"
            required
            type="text"
          />
          {state.fieldErrors?.url && (
            <p className="text-sm text-destructive">{state.fieldErrors.url[0]}</p>
          )}
        </div>
        <SubmitButton />
      </form>
      <AnalysisResult<AnalyzeWebsiteSafetyOutput> state={state} pending={isPending} type="url" />
    </div>
  );
}
