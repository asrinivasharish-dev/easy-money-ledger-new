import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, FolderKanban } from 'lucide-react';
import { Loan } from '../types';
import { calculateLoan, formatINR } from '../utils/interestCalculator';
import { getCategoryTheme } from '../utils/categoryUtils';
import { TransactionCard } from './TransactionCard';

interface CategoryGroupViewProps {
  loans: Loan[];
  selectedLoanId: string | null;
  onSelectLoan: (loanId: string) => void;
  isTabletGrid?: boolean;
}

export const CategoryGroupView: React.FC<CategoryGroupViewProps> = ({
  loans,
  selectedLoanId,
  onSelectLoan,
  isTabletGrid = false,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const groups = useMemo(() => {
    const map = new Map<string, Loan[]>();
    loans.forEach((loan) => {
      const cat = loan.category?.trim() || 'Personal';
      const list = map.get(cat) || [];
      list.push(loan);
      map.set(cat, list);
    });

    // Sort categories: ones with most loans first
    return Array.from(map.entries())
      .map(([category, items]) => {
        let categoryReceivable = 0;
        let categoryPayable = 0;

        items.forEach((item) => {
          const calc = calculateLoan(item);
          if (item.transactionType === 'GIVEN') {
            categoryReceivable += calc.remainingBalance;
          } else {
            categoryPayable += calc.remainingBalance;
          }
        });

        return {
          category,
          items,
          count: items.length,
          categoryReceivable,
          categoryPayable,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [loans]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map(({ category, items, count, categoryReceivable, categoryPayable }) => {
        const theme = getCategoryTheme(category);
        const isCollapsed = !!collapsedCategories[category];

        return (
          <div
            key={category}
            className="rounded-2xl border border-slate-200/90 bg-slate-50/60 overflow-hidden shadow-2xs transition"
          >
            {/* Group Header */}
            <div
              onClick={() => toggleCategory(category)}
              className="px-3.5 py-2.5 bg-white flex items-center justify-between cursor-pointer select-none hover:bg-slate-50/80 transition border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                >
                  {theme.icon}
                </span>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{category}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {count} {count === 1 ? 'loan' : 'loans'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold">
                  {categoryReceivable > 0 && (
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                      Recv: {formatINR(categoryReceivable)}
                    </span>
                  )}
                  {categoryPayable > 0 && (
                    <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60">
                      Pay: {formatINR(categoryPayable)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Group Cards */}
            {!isCollapsed && (
              <div className="p-2.5 sm:p-3">
                <div className={isTabletGrid ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2.5'}>
                  {items.map((loan) => (
                    <TransactionCard
                      key={loan.id}
                      loan={loan}
                      isSelected={selectedLoanId === loan.id}
                      onClick={() => onSelectLoan(loan.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
