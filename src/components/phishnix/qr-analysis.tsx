
'use client';

import { useActionState, useEffect, useRef, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Upload, Search, LoaderCircle, X, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'react-qr-scanner';

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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <LoaderCircle className="animate-spin" /> : <Search />}
      <span className="ml-2">Analyze QR Code Image</span>
    </Button>
  );
}

export function QrAnalysis() {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScannerOpen, setScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isQrAnalysisPending, startQrAnalysisTransition] = useTransition();

  const [state, formAction] = useActionState<
    AnalysisState<AnalyzeQrCodeSafetyOutput>,
    FormData
  >(performQrAnalysis, {});

  const qrFormActionWithToken = (formData: FormData) => {
    if (user) {
      user.getIdToken().then(token => {
        formData.append('idToken', token);
        startQrAnalysisTransition(() => formAction(formData));
      });
    } else {
      startQrAnalysisTransition(() => formAction(formData));
    }
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
      setImagePreview(null);
    }
  }, [state.data]);


  useEffect(() => {
    if (isScannerOpen) {
      const getCameraPermission = async () => {
        try {
          // Check for mediaDevices support
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera access not supported by this browser.');
          }
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to scan QR codes.',
          });
          setScannerOpen(false); // Close dialog if permission is denied
        }
      };
      getCameraPermission();
    } else {
        // Stop camera stream when scanner is closed
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }
  }, [isScannerOpen, toast]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Decode the image file using react-qr-scanner's built-in logic
       const qrScanner = new QrScanner({
         onScan: () => {},
         onError: () => {},
         // A dummy component is needed but it won't be rendered
         legacyMode: true,
       });

       qrScanner.scanFile(file, true)
        .then((result: string | null) => {
            if (result) {
                const formData = new FormData();
                formData.append('qrCodeContent', result);
                qrFormActionWithToken(formData);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Scan Failed',
                    description: 'No QR code could be found in the uploaded image.',
                });
                handleRemoveImage();
            }
        })
        .catch((err: any) => {
            console.error('File Scan Error:', err)
            toast({
                variant: 'destructive',
                title: 'Scan Failed',
                description: err.message || 'Could not scan the selected file.',
            });
            handleRemoveImage();
        });
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
      formData.append('qrCodeContent', data.text);
      qrFormActionWithToken(formData);
    }
  };

  const handleScannerError = (err: any) => {
    console.error('Scanner Error:', err);
    setScannerOpen(false);
    toast({
        variant: 'destructive',
        title: 'Scanner Error',
        description: 'An error occurred while scanning. Please try again.'
    })
  };

  return (
    <div className="space-y-6">
      <form ref={formRef} onSubmit={(e) => {
          e.preventDefault();
          if (imagePreview) {
              // This submit is for file uploads, which are now handled in handleFileChange
              // So we can just prevent default and maybe trigger analysis if needed,
              // but the analysis is already triggered on file select.
          }
      }} className="w-full space-y-4">
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
            {/* The Submit button is no longer needed here as analysis happens on file select */}
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
              onClick={() => setScannerOpen(true)}
            >
              <Camera className="mr-2" />
              Scan QR Code with Camera
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
           <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                {isScannerOpen && (
                    <QrScanner
                        onScan={handleScan}
                        onError={handleScannerError}
                        constraints={{ video: { facingMode: 'environment' } }}
                        className="w-full h-full"
                    />
                )}
           </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AnalysisResult state={state} pending={isQrAnalysisPending} />
    </div>
  );
}
