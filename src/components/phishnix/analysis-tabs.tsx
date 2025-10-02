import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, CreditCard, QrCode } from 'lucide-react';
import { UrlAnalysis } from './url-analysis';
import { PaymentAnalysis } from './payment-analysis';
import { QrAnalysis } from './qr-analysis';
import { Card, CardContent } from '../ui/card';

export function AnalysisTabs() {
  return (
    <div className="w-full max-w-3xl">
      <Tabs defaultValue="url">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="url">
            <Globe className="mr-2 h-4 w-4" />
            Website URL
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment Link
          </TabsTrigger>
          <TabsTrigger value="qr">
            <QrCode className="mr-2 h-4 w-4" />
            QR Code
          </TabsTrigger>
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-6">
            <TabsContent value="url" className="mt-0">
              <UrlAnalysis />
            </TabsContent>
            <TabsContent value="payment" className="mt-0">
              <PaymentAnalysis />
            </TabsContent>
            <TabsContent value="qr" className="mt-0">
              <QrAnalysis />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
