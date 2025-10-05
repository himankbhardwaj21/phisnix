
'use client';

import { useActionState } from 'react-dom';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Upload, Search, LoaderCircle, X, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'react-qr-scanner';

import { performQrAnalysis, performUrlAnalysis, type AnalysisState } from '@/app/actions';
import type {
  AnalyzeQrCodeSafetyOutput,
} from '@/ai/flows/analyze-qr-code-safety';
import { Button } from '../ui/button';
import { AnalysisResult } from './analysis-result';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { AnalyzeWebsiteSafetyOutput } from '@/ai/flows/analyze-website-safety';
import { useUser } from '@/firebase';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <LoaderCircle className="animate-spin" /> : <Search />}
      <span className="ml-2">Analyze QR Code</span>
    </Button>
  );
}

export function QrAnalysis() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [isUrlAnalysisPending, startUrlAnalysisTransition] = useTransition();

  const [qrState, qrFormAction] = useActionState<
    AnalysisState<AnalyzeQrCodeSafetyOutput>,
    FormData
  >(performQrAnalysis, {});

  const [urlState, urlFormAction] = useActionState<
    AnalysisState<AnalyzeWebsiteSafetyOutput>,
    FormData
  >(performUrlAnalysis, {});

  const state = qrState.data ? qrState : urlState;

  const qrFormActionWithToken = async (formData: FormData) => {
    if (user) {
      const token = await user.getIdToken();
      formData.append('idToken', token);
    }
    qrFormAction(formData);
  };
  
  const urlFormActionWithToken = async (formData: FormData) => {
    if (user) {
      const token = await user.getIdToken();
      formData.append('idToken', token);
    }
    urlFormAction(formData);
  };

  useEffect(() => {
    if (qrState.error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: qrState.error,
      });
    }
  }, [qrState.error, toast]);

  useEffect(() => {
    if (urlState.error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Error',
        description: urlState.error,
      });
    }
  }, [urlState.error, toast]);

  useEffect(() => {
    if (qrState.data) {
      formRef.current?.reset();
      setImagePreview(null);
    }
  }, [qrState.data]);

  useEffect(() => {
    if (urlState.data) {
      formRef.current?.reset();
      setImagePreview(null);
    }
  }, [urlState.data]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        // 4MB limit
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleScan = (data: any) => {
    if (data) {
      setScannerOpen(false);
      const formData = new FormData();
      formData.append('url', data.text);
      startUrlAnalysisTransition(() => {
        urlFormActionWithToken(formData);
      });
    }
  };

  const handleError = (err: any) => {
    console.error(err);
    setScannerOpen(false);
    toast({
        variant: 'destructive',
        title: 'Scanner Error',
        description: 'Could not access the camera. Please ensure you have given permission.'
    })
  };

  return (
    <div className="space-y-6">
      <form ref={formRef} action={qrFormActionWithToken} className="w-full space-y-4">
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
              <Image
                src={imagePreview}
                alt="QR Code Preview"
                fill
                className="object-contain p-2"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7 z-10"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SubmitButton />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div
              className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-accent/50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WEBP up to 4MB
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setScannerOpen(true)}
            >
              <Camera className="mr-2" />
              Scan QR Code
            </Button>
          </div>
        )}
      </form>

      <Dialog open={isScannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at a QR code to scan it.
            </DialogDescription>
          </DialogHeader>
          {isScannerOpen && ( // Conditionally render to re-initialize on open
             <QrScanner
                onScan={handleScan}
                onError={handleError}
                constraints={{
                    audio: false,
                    video: { facingMode: "environment" }
                }}
                className="w-full"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AnalysisResult state={state} pending={isUrlAnalysisPending} />
    </div>
  );
}
