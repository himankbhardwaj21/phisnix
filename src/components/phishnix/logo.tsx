import { Shield } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 justify-center">
      <Shield className="h-7 w-7 text-primary" />
      <span className="text-2xl font-bold font-headline tracking-tighter">PhishNix</span>
    </div>
  );
}
