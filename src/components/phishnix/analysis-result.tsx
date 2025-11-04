'use client';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, CheckCircle2, Info, LoaderCircle, XCircle, User, AtSign, IndianRupee } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AnalysisState } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { AmazonPayIcon, GooglePayIcon, PaytmIcon, PhonePeIcon } from '../icons';

type AnalysisResultProps<T> = {
  state: AnalysisState<T & { isSafe?: boolean; reasoning?: string, trustScore?: number, payeeName?: string, vpa?: string, amount?: string }>;
  pending?: boolean;
  type: 'url' | 'payment' | 'qr';
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

export function AnalysisResult<T extends { isSafe?: boolean; reasoning?: string, trustScore?: number, payeeName?: string, vpa?: string, amount?: string }>({ state, pending: externalPending, type }: AnalysisResultProps<T>) {
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

  const { isSafe, reasoning, trustScore, payeeName, vpa, amount } = state.data;
  const isUpiPayment = type === 'qr' && state.data.contentType === 'UPI Payment';
  const showPaymentApps = isUpiPayment && isSafe;


  return (
    <Card className={isSafe ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}>
      <CardHeader className="items-center text-center pb-4">
        <div className="relative mb-4">
          {isSafe ? (
            <CheckCircle2 className="h-20 w-20 text-green-500" />
          ) : (
            <XCircle className="h-20 w-20 text-red-500" />
          )}
        </div>
        <CardTitle className={`text-2xl font-bold font-headline ${isSafe ? 'text-green-600' : 'text-red-600'}`}>
          This is {isSafe ? 'likely safe' : 'potentially unsafe'}
        </CardTitle>
        {trustScore !== undefined && (
             <CardDescription>
                Verdict Score: <span className="font-bold">{trustScore}</span> ({isSafe ? 'Safe' : 'Unsafe'})
            </CardDescription>
        )}
      </CardHeader>
      <CardContent>
         {isUpiPayment && (
            <div className="mb-4 space-y-3 rounded-lg border bg-background p-4">
                <h3 className="font-semibold text-center text-lg">Payment Details</h3>
                <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">
                        <div className="text-muted-foreground">Payee Name</div>
                        <div className="font-medium">{payeeName || 'Not Provided'}</div>
                    </div>
                </div>
                 <div className="flex items-center gap-3">
                    <AtSign className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm">
                        <div className="text-muted-foreground">VPA / UPI ID</div>
                        <div className="font-mono text-xs md:text-sm">{vpa || 'Not Provided'}</div>
                    </div>
                </div>
                {amount && (
                    <div className="flex items-center gap-3">
                        <IndianRupee className="h-5 w-5 text-muted-foreground" />
                        <div className="text-sm">
                            <div className="text-muted-foreground">Amount</div>
                            <div className="font-semibold">{amount}</div>
                        </div>
                    </div>
                )}
            </div>
        )}
        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
          <AccordionItem value="item-1" className={showPaymentApps ? 'border-b' : 'border-b-0'}>
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
        {showPaymentApps && (
            <div className="pt-4 text-center">
                <p className="text-sm font-medium text-muted-foreground mb-4">Ready to pay? Open a payment app:</p>
                <div className="grid grid-cols-4 gap-4">
                    <Link href="paytmmp://" target="_blank" className="flex flex-col items-center gap-2 text-xs font-medium text-center transition-transform hover:scale-105">
                        <PaytmIcon className="w-12 h-12" />
                        <span>Paytm</span>
                    </Link>
                    <Link href="gpay://" target="_blank" className="flex flex-col items-center gap-2 text-xs font-medium text-center transition-transform hover:scale-105">
                        <GooglePayIcon className="w-12 h-12" />
                        <span>Google Pay</span>
                    </Link>
                    <Link href="phonepe://" target="_blank" className="flex flex-col items-center gap-2 text-xs font-medium text-center transition-transform hover:scale-105">
                        <PhonePeIcon className="w-12 h-12" />
                        <span>PhonePe</span>
                    </Link>
                    <Link href="upi://pay" target="_blank" className="flex flex-col items-center gap-2 text-xs font-medium text-center transition-transform hover:scale-105">
                        <AmazonPayIcon className="w-12 h-12" />
                        <span>Amazon Pay</span>
                    </Link>
                </div>
                 <p className="text-xs text-muted-foreground mt-4">(This will only work on mobile devices with the app installed)</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
