"use client";

import React from 'react';

// --- Shared Record Type (as per brief) ---
export type Record = {
  id: string;
  title: string;
  notes: string;
  createdAt: string;
};

// --- Button Component ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary'; // Primary for main actions, secondary for less prominent
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className,
  ...props
}) => {
  const baseStyles = "px-4 py-2 rounded-md font-inter text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0d10]";
  const primaryStyles = "bg-[#4f8cff] text-[#e6e9ef] hover:bg-[#3a70d9] focus:ring-[#4f8cff]";
  const secondaryStyles = "bg-[#14171c] text-[#e6e9ef] border border-[#2a2e36] hover:bg-[#1f232b] focus:ring-[#4f8cff]"; // A more subtle button
  const disabledStyles = "opacity-50 cursor-not-allowed";

  return (
    <button
      className={`${baseStyles} ${variant === 'primary' ? primaryStyles : secondaryStyles} ${props.disabled ? disabledStyles : ''} ${className || ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- Card Component ---
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={`bg-[#14171c] rounded-lg p-6 shadow-lg border border-[#2a2e36] ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
};

// --- ListRow Component ---
interface ListRowProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean; // For selected theme, etc.
}

export const ListRow: React.FC<ListRowProps> = ({ children, onClick, active, className, ...props }) => {
  const baseStyles = "flex items-center justify-between px-4 py-3 rounded-md cursor-pointer transition-colors duration-200 text-[#e6e9ef] font-inter text-sm";
  const hoverStyles = "hover:bg-[#1f232b]";
  const activeStyles = "bg-[#4f8cff] hover:bg-[#4f8cff]/90 text-[#e6e9ef]"; // Accent for active state

  return (
    <div
      className={`${baseStyles} ${onClick ? hoverStyles : ''} ${active ? activeStyles : ''} ${className || ''}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// --- EmptyState Component ---
interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  icon?: React.ReactNode; // Optional icon
  actionButton?: React.ReactNode; // Optional button for action
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon, actionButton, className, ...props }) => {
  return (
    <Card className={`flex flex-col items-center justify-center text-center p-8 min-h-[200px] ${className || ''}`} {...props}>
      {icon && <div className="mb-4 text-[#4f8cff] text-4xl">{icon}</div>}
      <p className="text-[#e6e9ef] text-lg font-inter mb-4 max-w-prose break-words">
        {message}
      </p>
      {actionButton && <div className="mt-4">{actionButton}</div>}
    </Card>
  );
};

// --- Typography Helper for Monospace Font ---
interface MonospaceTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const MonospaceText: React.FC<MonospaceTextProps> = ({ children, className, ...props }) => {
  return (
    <span className={`font-jetbrains-mono text-[#e6e9ef] ${className || ''}`} {...props}>
      {children}
    </span>
  );
};
