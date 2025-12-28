import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define types
type Currency = 'USD' | 'EUR';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (amount: number) => string;
}

// Create context
const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Provider component
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');

  // Function to format currency based on selected currency
  const formatCurrency = (amount: number): string => {
    if (amount === undefined || amount === null) return getCurrencySymbol() + '0';
    
    // Handle negative amounts
    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);
    
    // Format without trailing zeros
    const formattedAmount = absoluteAmount % 1 === 0 ? absoluteAmount.toFixed(0) : absoluteAmount.toFixed(2);
    
    // Add minus sign for negative amounts
    return (isNegative ? '-' : '') + getCurrencySymbol() + formattedAmount;
  };

  // Function to get currency symbol
  const getCurrencySymbol = (): string => {
    switch (currency) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      default:
        return '$';
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// Hook to use the context
export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}