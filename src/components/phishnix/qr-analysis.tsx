
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, Search, LoaderCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { performQrAnalysis, type AnalysisState } from '@/app/actions';
import type { AnalyzeQrCodeSafetyOutput } from '@/ai/flows/analyze-qr-code-safety';
import { Button } from '../ui/button';
import { AnalysisResult } from './analysis-result';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <Search />
      )}
      <span className="ml-2">Analyze QR Code</span>
    </Button>
  );
}

export function QrAnalysis() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [state, formAction] = useFormState<AnalysisState<AnalyzeQrCodeSafetyOutput>, FormData>(
    performQrAnalysis,
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
        setImagePreview(null);
    }
  },[state.data])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        toast({
            variant: 'destructive',
            title: 'File too large',
            description: 'Please upload an image smaller than 4MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <form ref={formRef} action={formAction} className="w-full space-y-4">
        <input
          type="file"
          name="qrCodeFile"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        <input type="hidden" name="qrCodeDataUri" value={imagePreview || ''} />

        {imagePreview ? (
          <div className="w-full space-y-4">
            <div className="relative mx-auto h-48 w-48 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden">
                <Image src={imagePreview} alt="QR Code Preview" fill className='object-contain p-2' />
                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7 z-10" onClick={handleRemoveImage}>
                    <X className='h-4 w-4' />
                </Button>
            </div>
            <SubmitButton />
          </div>
        ) : (
          <div
            className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-accent/50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag & drop</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 4MB</p>
          </div>
        )}
      </form>
      <AnalysisResult<AnalyzeQrCodeSafetyOutput> state={state} />
    </div>
  );
}
