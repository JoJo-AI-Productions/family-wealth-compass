import { useState } from 'react';
import { TimePeriod } from '@/hooks/useFinanceStats';

interface PeriodTabsProps {
  value: TimePeriod;
  onChange: (v: TimePeriod) => void;
}

const tabs: { label: string; value: TimePeriod }[] = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本年', value: 'year' },
];

export default function PeriodTabs({ value, onChange }: PeriodTabsProps) {
  return (
    <div className="flex items-center justify-center gap-1 rounded-full bg-card/60 p-1 backdrop-blur-sm">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
            value === tab.value
              ? 'bg-card text-foreground shadow-card'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
