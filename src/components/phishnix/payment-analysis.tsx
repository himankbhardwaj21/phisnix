
'use client';

import { useActionState, useEffect, useRef, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { Search, LoaderCircle } from 'lucide-react';

import { performPaymentAnalysis, type AnalysisState } from '@/app/actions';
import {
  AnalyzeWebsiteSafetyOutput,
} from '@/ai/flows/analyze-website-safety';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { AnalysisResult } from './analysis-result';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <Search />
      )}
      <span className="ml-2">Analyze Link</span>
    </Button>
  );
}

export function PaymentAnalysis() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState<AnalysisState<AnalyzeWebsiteSafetyOutput>, FormData>(
    performPaymentAnalysis,
    {}
  );
  
  const formActionWithToken = (formData: FormData) => {
    startTransition(async () => {
        if (user) {
            const token = await user.getIdToken();
            formData.append('idToken', token);
        }
        formAction(formData);
    });
  };

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
      <form ref={formRef} action={formActionWithToken} className="flex w-full items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            name="paymentLink"
            placeholder="https://payment.provider.com/..."
            className="text-base"
            required
            type="url"
          />
          {state.fieldErrors?.paymentLink && (
            <p className="text-sm text-destructive">{state.fieldErrors.paymentLink[0]}</p>
          )}
        </div>
        <SubmitButton />
      </form>
      <AnalysisResult<AnalyzeWebsiteSafetyOutput> state={state} pending={isPending} />
    </div>
  );
}
