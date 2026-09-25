'use client';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function PrintButton() {
  return <Button type="button" variant="outline" className="print-button" onClick={() => window.print()}><Printer size={16}/> Print sample</Button>;
}
