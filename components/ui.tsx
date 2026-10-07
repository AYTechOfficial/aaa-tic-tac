"use client";

import React from 'react';

export type Record = { id: string; title: string; notes: string; createdAt: string };

const STORAGE_KEY = "lastmile:aaa-tic-tac:match_history";

export function getMatchHistory(): Record[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMatchHistory(history: Record[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to persist match history", e);
  }
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded px-4 py-2 font-mono text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0d10] disabled:cursor-not-allowed disabled:opacity-50";
  
  const variants = {
    primary: "bg-[#4f8cff] text-[#0b0d10] hover:bg-[#6ba3ff] active:bg-[#3a75e6] focus:ring-[#4f8cff]",
    secondary: "bg-[#14171c] text-[#e6e9ef] border border-[#e6e9ef]/20 hover:border-[#e6e9ef]/40 hover:bg-[#1a1e25] focus:ring-[#e6e9ef]/20",
    danger: "bg-red-900/40 text-red-200 border border-red-800/40 hover:bg-red-900/60 focus:ring-red-900/50"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div 
      className={`rounded-lg border border-[#e6e9ef]/10 bg-[#14171c] p-5 shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message = 'No matches played yet', icon = null }: EmptyStateProps) {
  return (
    <div 
      data-testid="empty-history" 
      className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12 text-center"
    >
      {icon && <div className="mb-2 opacity-50">{icon}</div>}
      <p className="font-mono text-sm tracking-wide text-[#e6e9ef]/60">
        {message}
      </p>
    </div>
  );
}

interface ListRowProps {
  record: Record;
}

export function ListRow({ record }: ListRowProps) {
  const dateStr = new Date(record.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="group flex flex-col gap-3 border-b border-[#e6e9ef]/5 p-4 last:border-0 transition-colors hover:bg-[#14171c]/60">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-mono text-sm font-semibold text-[#e6e9ef] truncate" title={record.title}>
            {record.title}
          </h3>
          <p 
            className="mt-1 max-w-full overflow-hidden text-xs leading-relaxed text-[#e6e9ef]/70 line-clamp-2" 
            title={record.notes}
          >
            {record.notes}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block font-mono text-[10px] font-medium text-[#4f8cff]">
            {record.id.slice(0, 8)}
          </span>
          <span className="block font-mono text-[10px] text-[#e6e9ef]/40">
            {dateStr}
          </span>
        </div>
      </div>
    </div>
  );
}