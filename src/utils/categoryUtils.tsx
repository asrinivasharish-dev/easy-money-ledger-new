import React from 'react';
import {
  User,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Home,
  AlertCircle,
  Tag,
} from 'lucide-react';

export interface CategoryTheme {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  headerBg: string;
  icon: React.ReactNode;
}

export function getCategoryTheme(category?: string): CategoryTheme {
  const norm = (category || '').toLowerCase().trim();

  if (norm.includes('business') || norm.includes('shop') || norm.includes('trade')) {
    return {
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      headerBg: 'from-blue-600 to-indigo-700',
      icon: <Briefcase className="w-3.5 h-3.5" />,
    };
  }

  if (norm.includes('medic') || norm.includes('health') || norm.includes('hospital')) {
    return {
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      headerBg: 'from-rose-600 to-pink-700',
      icon: <HeartPulse className="w-3.5 h-3.5" />,
    };
  }

  if (norm.includes('educat') || norm.includes('college') || norm.includes('school') || norm.includes('book')) {
    return {
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      badgeBorder: 'border-purple-200',
      headerBg: 'from-purple-600 to-indigo-800',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
    };
  }

  if (norm.includes('home') || norm.includes('house') || norm.includes('rent')) {
    return {
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700',
      badgeBorder: 'border-teal-200',
      headerBg: 'from-teal-600 to-emerald-800',
      icon: <Home className="w-3.5 h-3.5" />,
    };
  }

  if (norm.includes('emergenc') || norm.includes('urgent')) {
    return {
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      headerBg: 'from-amber-600 to-orange-700',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    };
  }

  if (norm.includes('personal') || norm.includes('family') || norm.includes('friend')) {
    return {
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      headerBg: 'from-emerald-700 to-teal-800',
      icon: <User className="w-3.5 h-3.5" />,
    };
  }

  return {
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    headerBg: 'from-slate-700 to-slate-900',
    icon: <Tag className="w-3.5 h-3.5" />,
  };
}
