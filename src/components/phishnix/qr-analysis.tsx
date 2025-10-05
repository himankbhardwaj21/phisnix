
'use client';

import { useActionState, useEffect, useRef, useState, ChangeEvent, useTransition } from 'react';
import React from 'react';
import Image from 'next/image';
import { Upload, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'react-qr-scanner';
import jsQR from 'jsqr';

import { performQrAnalysis, type AnalysisState } from '@/app/actions';
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
import { useUser } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


export function QrAnalysis() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [qrContent, setQrContent] = useState<string | null>(null);
  const [isAnalysisPending, startAnalysisTransition] = useTransition();

  const [state, formAction, isActionPending] = useActionState<
    AnalysisState<AnalyzeQrCodeSafetyOutput>,
    FormData
  >(performQrAnalysis, {});

  const isPending = isAnalysisPending || isActionPending;

  useEffect(() => {
    if (user) {
      user.getIdToken().then(setIdToken);
    } else {
      setIdToken(null);
    }
  }, [user]);

  useEffect(() => {
    if (qrContent && idToken !== undefined) {
      startAnalysisTransition(() => {
        const formData = new FormData();
        formData.append('qrCodeContent', qrContent);
        if (idToken) {
          formData.append('idToken', idToken);
        }
        formAction(formData);
      });
    }
  }, [qrContent, idToken, formAction]);


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
      setQrContent(null);
    }
  }, [state.data]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setImagePreview(imageUrl);

      const image = document.createElement('img');
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            toast({
                variant: 'destructive',
                title: 'Scan Failed',
                description: 'Could not process the image.',
            });
            return;
        }
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          setQrContent(code.data);
        } else {
          toast({
            variant: 'destructive',
            title: 'Scan Failed',
            description: 'No QR code could be found in the uploaded image.',
          });
          handleRemoveImage();
        }
      };
      image.src = imageUrl;
    };
    reader.readAsDataURL(file);
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
      setQrContent(data.text);
    }
  };

  const handleScannerError = (err: any) => {
    console.error('Scanner Error:', err);
    toast({
        variant: 'destructive',
        title: 'Scanner Error',
        description: 'An error occurred while scanning. Please try again.'
    })
  };
  
  const handleScannerOpen = async () => {
    setScannerOpen(true);
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access not supported by this browser.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if(videoRef.current){
          videoRef.current.srcObject = stream;
        }
        setHasCameraPermission(true);
    } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to scan QR codes.',
        });
        setScannerOpen(false);
    }
  }


  return (
    <div className="space-y-6">
      <form ref={formRef} className="w-full space-y-4">
        <input
          type="file"
          name="qrCodeFile"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />

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
                PNG, JPG, WEBP
              </p>
            </div>
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleScannerOpen}
            >
              <Camera className="mr-2" />
              Scan QR Code with Camera
            </Button>
          </div>
        )}
      </form>

      <Dialog open={isScannerOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Stop camera stream when dialog closes
          const stream = videoRef.current?.srcObject as MediaStream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        }
        setScannerOpen(isOpen)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Point your camera at a QR code to scan it.
            </DialogDescription>
          </DialogHeader>
           <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                {hasCameraPermission === true && (
                    <QrScanner
                        onScan={handleScan}
                        onError={handleScannerError}
                        constraints={{ video: { facingMode: 'environment' } }}
                        className="w-full h-full"
                        videoRef={videoRef}
                    />
                )}
                {hasCameraPermission === false && (
                    <Alert variant="destructive">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                        Please allow camera access in your browser to use this feature.
                        </AlertDescription>
                    </Alert>
                )}
           </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AnalysisResult state={state} pending={isPending} />
    </div>
  );
}
