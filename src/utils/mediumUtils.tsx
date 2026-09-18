import React from 'react';
import {
  Banknote,
  Smartphone,
  Building2,
  FileText,
  Globe,
} from 'lucide-react';
import { TransactionMedium } from '../types';

export interface MediumOption {
  id: TransactionMedium;
  label: string;
  shortLabel: string;
  sublabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBg: string;
  refPlaceholder: string;
  icon: React.ReactNode;
}

export const TRANSACTION_MEDIUMS: MediumOption[] = [
  {
    id: 'CASH',
    label: 'Cash',
    shortLabel: 'Cash',
    sublabel: 'Physical currency',
    description: 'Direct cash handover / physical notes',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    accentBg: 'bg-emerald-600',
    refPlaceholder: 'Receipt / voucher no. (optional)',
    icon: <Banknote className="w-3.5 h-3.5" />,
  },
  {
    id: 'UPI',
    label: 'UPI Transfer',
    shortLabel: 'UPI',
    sublabel: 'GPay / PhonePe / Paytm / BHIM',
    description: 'Instant UPI transaction via mobile or QR code',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    accentBg: 'bg-indigo-600',
    refPlaceholder: 'UPI Reference ID / 12-digit UTR (e.g. 409128...)',
    icon: <Smartphone className="w-3.5 h-3.5" />,
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    shortLabel: 'Bank Transfer',
    sublabel: 'IMPS / NEFT / RTGS',
    description: 'Direct internet banking or account transfer',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    accentBg: 'bg-blue-600',
    refPlaceholder: 'Bank transaction / IMPS reference no.',
    icon: <Building2 className="w-3.5 h-3.5" />,
  },
  {
    id: 'CHEQUE',
    label: 'Cheque / DD',
    shortLabel: 'Cheque',
    sublabel: 'Bank cheque or demand draft',
    description: 'Physical cheque clearing or Demand Draft',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    accentBg: 'bg-amber-600',
    refPlaceholder: '6-digit cheque number (e.g. 004821)',
    icon: <FileText className="w-3.5 h-3.5" />,
  },
  {
    id: 'OTHER_ONLINE',
    label: 'Other Online',
    shortLabel: 'Online',
    sublabel: 'Card / Wallet / Payment Link',
    description: 'Credit/debit card, digital wallet, or web gateway',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-200',
    accentBg: 'bg-purple-600',
    refPlaceholder: 'Gateway payment ID / order reference',
    icon: <Globe className="w-3.5 h-3.5" />,
  },
];

export function getMediumConfig(medium?: TransactionMedium | string): MediumOption {
  if (!medium) return TRANSACTION_MEDIUMS[0]; // defaults to Cash
  const found = TRANSACTION_MEDIUMS.find((m) => m.id === medium);
  return found || TRANSACTION_MEDIUMS[0];
}

/**
 * Reusable badge component for displaying transaction medium (Cash, UPI, etc.)
 */
export const TransactionMediumBadge: React.FC<{
  medium?: TransactionMedium | string;
  reference?: string;
  size?: 'sm' | 'xs';
  showRef?: boolean;
}> = ({ medium, reference, size = 'xs', showRef = false }) => {
  const config = getMediumConfig(medium);
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-md border ${
        config.badgeBg
      } ${config.badgeText} ${config.badgeBorder} ${
        isSm ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
      }`}
      title={`${config.label}${reference ? ` (Ref: ${reference})` : ''}`}
    >
      <span className="shrink-0">{config.icon}</span>
      <span>{config.shortLabel}</span>
      {showRef && reference && (
        <span className="font-mono opacity-80 border-l border-current/20 pl-1 ml-0.5 text-[9px]">
          {reference}
        </span>
      )}
    </span>
  );
};
