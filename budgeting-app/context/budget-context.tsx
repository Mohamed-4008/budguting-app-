import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { NotificationService } from '@/services/notification-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to check if alert has been triggered for a category
const hasAlertBeenTriggered = async (categoryName: string): Promise<boolean> => {
  try {
    const triggeredAlerts = await AsyncStorage.getItem('triggeredBudgetAlerts');
    const alerts = triggeredAlerts ? JSON.parse(triggeredAlerts) : [];
    return alerts.includes(categoryName);
  } catch (error) {
    console.error('Error checking if alert was triggered:', error);
    return false;
  }
};

// Helper function to mark alert as triggered for a category
const markAlertAsTriggered = async (categoryName: string): Promise<void> => {
  try {
    const triggeredAlerts = await AsyncStorage.getItem('triggeredBudgetAlerts');
    const alerts = triggeredAlerts ? JSON.parse(triggeredAlerts) : [];
    if (!alerts.includes(categoryName)) {
      alerts.push(categoryName);
      await AsyncStorage.setItem('triggeredBudgetAlerts', JSON.stringify(alerts));
    }
  } catch (error) {
    console.error('Error marking alert as triggered:', error);
  }
};

// Helper function to reset alerts for a category (when month changes or target is updated)
export const resetBudgetAlertForCategory = async (categoryName: string): Promise<void> => {
  try {
    const triggeredAlerts = await AsyncStorage.getItem('triggeredBudgetAlerts');
    const alerts = triggeredAlerts ? JSON.parse(triggeredAlerts) : [];
    const updatedAlerts = alerts.filter((name: string) => name !== categoryName);
    await AsyncStorage.setItem('triggeredBudgetAlerts', JSON.stringify(updatedAlerts));
  } catch (error) {
    console.error('Error resetting budget alert for category:', error);
  }
};

// Helper function to reset all alerts (when month changes)
export const resetAllBudgetAlerts = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('triggeredBudgetAlerts');
  } catch (error) {
    console.error('Error resetting all budget alerts:', error);
  }
};

// Define types
interface Category {
  id: string;
  name: string;
  date: string;
  spent?: number;
  target?: number;
  status?: 'remaining' | 'over';
  statusAmount?: number;
  targetDate?: string;
  neededStatus?: string;
  generalSaved?: number;
  generalTarget?: number;
  monthlySaved?: number;
  monthlyTarget?: number;
  lastResetDate?: string; // For tracking when weekly categories were last reset
  isRepeating?: boolean; // For tracking if the category should repeat
}

interface PaymentScheduleItem {
  month: string;
  year: number;
  days: number;
  payment: number;
  endDate: number;
}

interface SavingsCategory {
  id: string;
  name: string;
  targetDate: string;
  numberOfMonths?: number;
  neededStatus: string;
  statusAmount: number;
  generalSaved: number;
  generalTarget: number;
  monthlySaved: number;
  monthlyTarget: number;
  paymentSchedule?: PaymentScheduleItem[];
  lastUpdatedMonth?: number; // Track last updated month
  lastUpdatedYear?: number;   // Track last updated year
  carryoverAmount?: number;   // Track carryover from previous months
  creationDate?: string;      // Track creation date
}

interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: 'Income' | 'Expense';
  date: string;
  account: string;
  day?: string;
  month?: string;
  clearedForCategory?: string; // Track which category this transaction was cleared for
}

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  bankName?: string;
}

interface BudgetState {
  spendingCategories: {
    Bills: Category[];
    Needs: Category[];
    Wants: Category[];
    'Non-Monthly': Category[];
  };
  savingsCategories: {
    'Savings Goals': SavingsCategory[];
  };
  transactions: Transaction[]; // Add transactions array
  accounts: Account[]; // Add accounts array
}

type BudgetAction =
  | { type: 'ADD_SPENDING_CATEGORY'; group: string; category: Category }
  | { type: 'ADD_SAVINGS_CATEGORY'; category: SavingsCategory }
  | { type: 'UPDATE_SPENDING_CATEGORY'; group: string; id: string; updates: Partial<Category> }
  | { type: 'MOVE_SPENDING_CATEGORY'; categoryName: string; fromGroup: string; toGroup: string; updates: Partial<Category> }
  | { type: 'UPDATE_SAVINGS_CATEGORY'; id: string; updates: Partial<SavingsCategory> }
  | { type: 'DELETE_SPENDING_CATEGORY'; categoryName: string } // Add this action
  | { type: 'DELETE_SAVINGS_CATEGORY'; id: string }
  | { type: 'SPEND_SAVINGS_CATEGORY'; id: string }
  | { type: 'ADD_TRANSACTION'; transaction: Transaction }
  | { type: 'UPDATE_TRANSACTION'; transactionId: string; updates: Partial<Transaction> } // Add this action
  | { type: 'DELETE_TRANSACTION'; transactionId: string } // Add delete transaction action
  | { type: 'ADD_ACCOUNT'; account: Account }
  | { type: 'DELETE_ACCOUNT'; accountId: string }
  | { type: 'UPDATE_ACCOUNT'; accountId: string; updates: Partial<Account> } // Add update account action
  | { type: 'MARK_CATEGORY_TRANSACTIONS_CLEARED'; categoryName: string }; // Add action to mark transactions as cleared for a category

// Function to calculate monthly savings goals
interface MonthlySavingsGoal {
  year: number;
  month: number; // 0-11
  daysInMonth: number;
  savingsGoal: number;
}

interface SavingsCalculationResult {
  totalDays: number;
  dailySavings: number;
  monthlyGoals: MonthlySavingsGoal[];
  totalCalculatedSavings: number;
}

/**
 * Calculate monthly savings goals based on creation date, target date, and savings target
 * @param creationDate - The date when the savings category was created
 * @param targetDate - The target date for completing the savings
 * @param totalTarget - The total savings target amount
 * @param currentSaved - Optional current saved amount (default 0)
 * @returns Object with calculation results including monthly goals
 */
export const calculateSavingsSchedule = (
  creationDate: Date,
  targetDate: Date,
  totalTarget: number,
  currentSaved: number = 0
): SavingsCalculationResult => {
  // Validate inputs
  if (!(creationDate instanceof Date) || !(targetDate instanceof Date)) {
    throw new Error('Creation date and target date must be valid Date objects');
  }
  
  if (creationDate >= targetDate) {
    throw new Error('Creation date must be before target date');
  }
  
  if (typeof totalTarget !== 'number' || totalTarget <= 0) {
    throw new Error('Total target must be a positive number');
  }
  
  if (typeof currentSaved !== 'number' || currentSaved < 0) {
    throw new Error('Current saved amount must be a non-negative number');
  }
  
  if (currentSaved >= totalTarget) {
    throw new Error('Current saved amount cannot be greater than or equal to total target');
  }
  
  // Calculate the total number of days between creation date and target date
  const timeDiff = targetDate.getTime() - creationDate.getTime();
  const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  // Compute daily savings = (total target - current saved) / total days
  const remainingAmount = totalTarget - currentSaved;
  const dailySavings = remainingAmount / totalDays;
  
  // Initialize variables for calculation
  const monthlyGoals: MonthlySavingsGoal[] = [];
  let currentDate = new Date(creationDate);
  let totalCalculatedSavings = 0;
  
  // Process each month until we reach or exceed the target date
  while (currentDate < targetDate) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Determine the start and end day for this month
    let startDay = 1;
    let endDay = daysInMonth;
    
    // For the creation month, adjust the start day
    if (currentDate.getFullYear() === creationDate.getFullYear() && 
        currentDate.getMonth() === creationDate.getMonth()) {
      startDay = creationDate.getDate();
    }
    
    // For the target month, adjust the end day
    if (currentDate.getFullYear() === targetDate.getFullYear() && 
        currentDate.getMonth() === targetDate.getMonth()) {
      endDay = targetDate.getDate();
    }
    
    // Calculate the number of days in this period
    const daysInPeriod = Math.max(0, endDay - startDay + 1);
    
    // Only add month if it has days in the savings period
    if (daysInPeriod > 0) {
      // Calculate the savings goal for this month
      const monthSavingsGoal = daysInPeriod * dailySavings;
      totalCalculatedSavings += monthSavingsGoal;
      
      monthlyGoals.push({
        year: currentYear,
        month: currentMonth,
        daysInMonth: daysInPeriod,
        savingsGoal: monthSavingsGoal
      });
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1); // Set to first day of the month
  }
  
  // Adjust the last month's payment to ensure the total is exactly the target amount
  // This fixes any rounding discrepancies
  if (monthlyGoals.length > 0) {
    const calculatedTotal = monthlyGoals.reduce((sum, goal) => sum + goal.savingsGoal, 0);
    const difference = remainingAmount - calculatedTotal;
    
    // Add the difference to the last month's payment
    if (Math.abs(difference) > 0.01) { // Only adjust if difference is significant
      const lastMonthIndex = monthlyGoals.length - 1;
      monthlyGoals[lastMonthIndex].savingsGoal += difference;
      totalCalculatedSavings = remainingAmount; // Update total to match exactly
    }
  }
  
  return {
    totalDays,
    dailySavings,
    monthlyGoals,
    totalCalculatedSavings
  };
};

// Function to check all spending categories for 90% threshold alerts
export const checkBudgetAlerts = (state: BudgetState): string[] => {
  const alertMessages: string[] = [];
  
  // Check all spending categories
  Object.values(state.spendingCategories).forEach(group => {
    group.forEach(category => {
      // Only check categories with targets
      if (category.target && category.target > 0) {
        const spent = category.spent || 0;
        const target = category.target;
        const progress = (spent / target) * 100;
        
        // Check if category has reached 90% of target
        if (progress >= 90 && progress < 100) {
          alertMessages.push(`Category "${category.name}" has reached ${progress.toFixed(1)}% of its target!`);
        }
      }
    });
  });
  
  return alertMessages;
};

// Initial state with sample data
const initialState: BudgetState = {
  spendingCategories: {
    Bills: [],
    Needs: [],
    Wants: [],
    'Non-Monthly': [],
  },
  savingsCategories: {
    'Savings Goals': [],
  },
  transactions: [],
  accounts: []
};

// Create context
const BudgetContext = createContext<{ state: BudgetState; dispatch: React.Dispatch<BudgetAction> } | undefined>(undefined);

// Add alert checking functionality to the reducer
const budgetReducer = (state: BudgetState, action: BudgetAction): BudgetState => {
  switch (action.type) {
    case 'ADD_SPENDING_CATEGORY':
      return {
        ...state,
        spendingCategories: {
          ...state.spendingCategories,
          [action.group as keyof typeof state.spendingCategories]: [
            ...state.spendingCategories[action.group as keyof typeof state.spendingCategories], 
            action.category
          ],
        },
      };
    case 'ADD_SAVINGS_CATEGORY':
      return {
        ...state,
        savingsCategories: {
          ...state.savingsCategories,
          'Savings Goals': [...state.savingsCategories['Savings Goals'], action.category],
        },
      };
    case 'UPDATE_SPENDING_CATEGORY':
      // If the target is being updated, reset the alert for this category
      if (action.updates.target !== undefined) {
        // Find the category to get its name
        const category = state.spendingCategories[action.group as keyof typeof state.spendingCategories].find(
          cat => cat.id === action.id
        );
        
        if (category) {
          // Reset the alert for this category since the target has changed
          resetBudgetAlertForCategory(category.name).catch(error => 
            console.error('Error resetting budget alert for category:', error)
          );
        }
      }
      
      return {
        ...state,
        spendingCategories: {
          ...state.spendingCategories,
          [action.group as keyof typeof state.spendingCategories]: 
            state.spendingCategories[action.group as keyof typeof state.spendingCategories].map(category =>
              category.id === action.id ? { ...category, ...action.updates } : category
            ),
        },
      };
    case 'MOVE_SPENDING_CATEGORY':
      // First, remove the category from the original group
      const fromGroupCategoriesMove = state.spendingCategories[action.fromGroup as keyof typeof state.spendingCategories];
      const categoryIndexMove = fromGroupCategoriesMove.findIndex(cat => cat.name === action.categoryName);
      
      if (categoryIndexMove !== -1) {
        // Create a new state with the category removed from the fromGroup
        const updatedStateMove = { ...state };
        
        // Remove the category from the fromGroup
        updatedStateMove.spendingCategories = {
          ...updatedStateMove.spendingCategories,
          [action.fromGroup]: fromGroupCategoriesMove.filter(cat => cat.name !== action.categoryName)
        };
        
        // Add the updated category to the toGroup
        const updatedCategoryMove = { ...fromGroupCategoriesMove[categoryIndexMove], ...action.updates };
        updatedStateMove.spendingCategories = {
          ...updatedStateMove.spendingCategories,
          [action.toGroup]: [
            ...(updatedStateMove.spendingCategories[action.toGroup as keyof typeof state.spendingCategories] || []),
            updatedCategoryMove
          ]
        };
        
        return updatedStateMove;
      }
      
      // If category not found, return state unchanged
      return state;
    case 'UPDATE_SAVINGS_CATEGORY':
      // Log the update for debugging
      const updatedCategory = state.savingsCategories['Savings Goals'].find(cat => cat.id === action.id);
      if (updatedCategory) {
        console.log('Updating savings category:', updatedCategory.name);
        console.log('Old values - generalSaved:', updatedCategory.generalSaved, 'monthlySaved:', updatedCategory.monthlySaved);
        console.log('Updates:', action.updates);
        // Calculate what the new values will be after the update
        const newGeneralSaved = action.updates.generalSaved !== undefined ? 
          action.updates.generalSaved : updatedCategory.generalSaved;
        const newMonthlySaved = action.updates.monthlySaved !== undefined ? 
          action.updates.monthlySaved : updatedCategory.monthlySaved;
        console.log('New values - generalSaved:', newGeneralSaved, 'monthlySaved:', newMonthlySaved);
      }
      
      return {
        ...state,
        savingsCategories: {
          ...state.savingsCategories,
          'Savings Goals': state.savingsCategories['Savings Goals'].map(category =>
            category.id === action.id ? { ...category, ...action.updates } : category
          ),
        },
      };
    case 'DELETE_SPENDING_CATEGORY':
      // Find which group the category belongs to and remove it
      let newState = { ...state };
      
      // Search through all spending category groups to find and remove the category
      for (const group in state.spendingCategories) {
        const groupCategories = state.spendingCategories[group as keyof typeof state.spendingCategories];
        const categoryIndex = groupCategories.findIndex(cat => cat.name === action.categoryName);
        
        if (categoryIndex !== -1) {
          // Remove the category from this group
          newState.spendingCategories = {
            ...newState.spendingCategories,
            [group]: groupCategories.filter(cat => cat.name !== action.categoryName)
          };
          break; // Found and removed, no need to continue searching
        }
      }
      
      return newState;
    case 'DELETE_SAVINGS_CATEGORY':
      // Find the category being deleted to get its name
      const categoryToDelete = state.savingsCategories['Savings Goals'].find(
        category => category.id === action.id
      );
      
      if (categoryToDelete) {
        // Find all transactions related to this savings category
        const relatedTransactions = state.transactions.filter(
          transaction => transaction.category === categoryToDelete.name
        );
        
        // Group transactions by account to consolidate refunds
        const transactionsByAccount: { [accountName: string]: typeof relatedTransactions } = {};
        relatedTransactions.forEach(transaction => {
          if (!transactionsByAccount[transaction.account]) {
            transactionsByAccount[transaction.account] = [];
          }
          transactionsByAccount[transaction.account].push(transaction);
        });
        
        // Create a new state with updated transactions and accounts
        let newState = { ...state };
        
        // Process each account's transactions to create consolidated reverse transactions
        Object.keys(transactionsByAccount).forEach(accountName => {
          const accountTransactions = transactionsByAccount[accountName];
          
          // Calculate total amount to refund for this account
          const totalRefundAmount = accountTransactions.reduce(
            (sum, transaction) => sum + transaction.amount,
            0
          );
          
          // Create a single consolidated reverse transaction for this account
          const reverseTransaction = {
            id: `reverse_${Date.now()}_${accountName}`,
            name: `Refund: ${categoryToDelete.name}`,
            amount: -totalRefundAmount, // Reverse the total amount
            category: 'Refund',
            type: totalRefundAmount > 0 ? ('Expense' as const) : ('Income' as const), // Reverse the type based on total
            date: new Date().toISOString().split('T')[0],
            account: accountName,
            day: new Date().getDate().toString(),
            month: new Date().toLocaleString('default', { month: 'short' })
          };
          
          // Add the consolidated reverse transaction
          newState.transactions = [...newState.transactions, reverseTransaction];
          
          // Find the account and update its balance
          const accountIndex = newState.accounts.findIndex(
            account => account.name === accountName
          );
          
          if (accountIndex !== -1) {
            const updatedAccounts = [...newState.accounts];
            updatedAccounts[accountIndex] = {
              ...updatedAccounts[accountIndex],
              balance: updatedAccounts[accountIndex].balance - totalRefundAmount // Add back the total amount
            };
            newState.accounts = updatedAccounts;
          }
        });
        
        // Remove the savings category
        newState.savingsCategories = {
          ...newState.savingsCategories,
          'Savings Goals': newState.savingsCategories['Savings Goals'].filter(category =>
            category.id !== action.id
          ),
        };
        
        return newState;
      }
      
      // Fallback if category not found
      return {
        ...state,
        savingsCategories: {
          ...state.savingsCategories,
          'Savings Goals': state.savingsCategories['Savings Goals'].filter(category =>
            category.id !== action.id
          ),
        },
      };
    case 'SPEND_SAVINGS_CATEGORY':
      // Find the category being spent to get its details
      const categoryToSpend = state.savingsCategories['Savings Goals'].find(
        category => category.id === action.id
      );
      
      if (categoryToSpend) {
        // Create a new spending category in the 'Non-Monthly' group
        const newSpendingCategory: Category = {
          id: `spent_${Date.now()}`,
          name: categoryToSpend.name,
          date: new Date().toLocaleString('default', { month: 'short', day: 'numeric' }),
          spent: 0,
          target: categoryToSpend.generalTarget,
          status: 'remaining',
          statusAmount: categoryToSpend.generalTarget,
          targetDate: categoryToSpend.targetDate,
          neededStatus: 'Needed'
        };
        
        // Create a new account for this savings goal with enhanced naming
        // If the category name already contains "Fund", use it as is
        // If not, append " Fund" to the category name
        const accountName = categoryToSpend.name.includes('Fund') 
          ? categoryToSpend.name 
          : `${categoryToSpend.name} Fund`;
          
        const newAccount: Account = {
          id: `account_${Date.now()}`,
          name: accountName,
          type: 'Savings',
          balance: categoryToSpend.generalSaved || 0,
          bankName: 'Personal Savings'
        };
        
        // Create a new state with updated transactions and accounts
        let newState = { ...state };
        
        // Add the new account
        newState.accounts = [...newState.accounts, newAccount];
        
        // Add the new spending category to the 'Non-Monthly' group
        newState.spendingCategories = {
          ...newState.spendingCategories,
          'Non-Monthly': [...newState.spendingCategories['Non-Monthly'], newSpendingCategory]
        };
        
        // Remove the savings category
        newState.savingsCategories = {
          ...newState.savingsCategories,
          'Savings Goals': newState.savingsCategories['Savings Goals'].filter(category =>
            category.id !== action.id
          ),
        };
        
        return newState;
      }
      
      // Fallback if category not found
      return {
        ...state,
        savingsCategories: {
          ...state.savingsCategories,
          'Savings Goals': state.savingsCategories['Savings Goals'].filter(category =>
            category.id !== action.id
          ),
        },
      };
    case 'ADD_TRANSACTION': {
      // When adding a transaction, we also need to update the corresponding spending category
      let updatedStateAdd = {
        ...state,
        transactions: [...(state.transactions || []), action.transaction],
      };
      
      // Check if transaction alerts are enabled before showing notification
      AsyncStorage.getItem('transactionAlerts')
        .then(setting => {
          const areTransactionAlertsEnabled = setting ? JSON.parse(setting) : true;
          if (areTransactionAlertsEnabled) {
            NotificationService.showImmediateNotification(
              'New Transaction Added',
              `Added ${action.transaction.name} for $${Math.abs(action.transaction.amount).toFixed(2)}`
            ).catch(error => console.error('Failed to show notification:', error));
          }
        })
        .catch(error => console.error('Error checking transaction alerts setting:', error));
      
      // If this is an expense transaction, update the corresponding spending category
      if (action.transaction.type === 'Expense') {
        // Find which spending category group this transaction belongs to
        let categoryGroup: keyof typeof state.spendingCategories | null = null;
        let categoryIndex = -1;
        
        // Search through all spending category groups
        for (const group in state.spendingCategories) {
          const groupIndex = state.spendingCategories[group as keyof typeof state.spendingCategories].findIndex(
            cat => cat.name === action.transaction.category
          );
          
          if (groupIndex !== -1) {
            categoryGroup = group as keyof typeof state.spendingCategories;
            categoryIndex = groupIndex;
            break;
          }
        }
        
        // If we found the category, update its spent amount only if the transaction is from the current month
        if (categoryGroup && categoryIndex !== -1) {
          const category = state.spendingCategories[categoryGroup][categoryIndex];
          
          // Check if the transaction date is in the current month
          const transactionDate = new Date(action.transaction.date);
          const currentDate = new Date();
          const isCurrentMonth = transactionDate.getMonth() === currentDate.getMonth() && 
                                transactionDate.getFullYear() === currentDate.getFullYear();
          
          // Only update category spent amount if transaction is from current month
          if (isCurrentMonth) {
            const currentSpent = category.spent || 0;
            const newSpent = currentSpent + Math.abs(action.transaction.amount); // Add the absolute value of the expense
            
            // Calculate new status
            const target = category.target || 0;
            let status: 'remaining' | 'over' = 'remaining';
            let statusAmount = Math.max(0, target - newSpent);
            
            if (newSpent > target) {
              status = 'over';
              statusAmount = newSpent - target;
            }
            
            // Check if category has reached 90% of target and show alert if needed
            const progress = target > 0 ? (newSpent / target) * 100 : 0;
            if (progress >= 90) { // Trigger when reaching or exceeding 90%
              // Check if alert has already been triggered for this category
              hasAlertBeenTriggered(category.name).then(alreadyTriggered => {
                if (!alreadyTriggered) {
                  // Check if budget alerts are enabled before showing notification
                  AsyncStorage.getItem('budgetAlerts')
                    .then(setting => {
                      const areBudgetAlertsEnabled = setting ? JSON.parse(setting) : true;
                      if (areBudgetAlertsEnabled) {
                        NotificationService.showImmediateNotification(
                          'Budget Alert',
                          `Category "${category.name}" has reached 90% of its target!`
                        ).catch(error => console.error('Failed to show notification:', error));
                        
                        // Mark alert as triggered for this category
                        markAlertAsTriggered(category.name);
                      }
                    })
                    .catch(error => console.error('Error checking budget alerts setting:', error));
                }
              }).catch(error => console.error('Error checking if alert was triggered:', error));
            }
            
            // Update the category with new spent amount and status
            updatedStateAdd = {
              ...updatedStateAdd,
              spendingCategories: {
                ...updatedStateAdd.spendingCategories,
                [categoryGroup]: updatedStateAdd.spendingCategories[categoryGroup].map((cat, index) =>
                  index === categoryIndex 
                    ? { 
                        ...cat, 
                        spent: newSpent,
                        status: status,
                        statusAmount: statusAmount
                      } 
                    : cat
                )
              }
            };
          }
        }
      }
      
      return updatedStateAdd;
    }
  
    case 'UPDATE_TRANSACTION': {
      // Find the existing transaction
      const existingTransaction = state.transactions.find(t => t.id === action.transactionId);
      
      // If transaction doesn't exist, return state unchanged
      if (!existingTransaction) {
        return state;
      }
      
      // Update the transaction
      const updatedTransactionsList = state.transactions.map(transaction =>
        transaction.id === action.transactionId ? { ...transaction, ...action.updates } : transaction
      );
      
      // Show notification for updated transaction
      if (action.updates.name || action.updates.amount !== undefined) {
        const updatedTransaction = { ...existingTransaction, ...action.updates };
        // Check if transaction alerts are enabled before showing notification
        AsyncStorage.getItem('transactionAlerts')
          .then(setting => {
            const areTransactionAlertsEnabled = setting ? JSON.parse(setting) : true;
            if (areTransactionAlertsEnabled) {
              NotificationService.showImmediateNotification(
                'Transaction Updated',
                `Updated ${updatedTransaction.name} to $${Math.abs(updatedTransaction.amount).toFixed(2)}`
              ).catch(error => console.error('Failed to show notification:', error));
            }
          })
          .catch(error => console.error('Error checking transaction alerts setting:', error));
      }
      
      // Create updated state with new transactions
      let finalStateUpdate = {
        ...state,
        transactions: updatedTransactionsList,
      };
      
      // If the transaction type or amount changed, we need to update spending categories
      const amountChanged = action.updates.amount !== undefined && action.updates.amount !== existingTransaction.amount;
      const categoryChanged = action.updates.category !== undefined && action.updates.category !== existingTransaction.category;
      const typeChanged = action.updates.type !== undefined && action.updates.type !== existingTransaction.type;
      
      if (amountChanged || categoryChanged || typeChanged) {
        // If the existing transaction was an expense, subtract its amount from the old category
        if (existingTransaction.type === 'Expense') {
          // Find which spending category group the old transaction belonged to
          let oldCategoryGroup: keyof typeof state.spendingCategories | null = null;
          let oldCategoryIndex = -1;
          
          // Search through all spending category groups
          for (const group in state.spendingCategories) {
            const groupIndex = state.spendingCategories[group as keyof typeof state.spendingCategories].findIndex(
              cat => cat.name === existingTransaction.category
            );
            
            if (groupIndex !== -1) {
              oldCategoryGroup = group as keyof typeof state.spendingCategories;
              oldCategoryIndex = groupIndex;
              break;
            }
          }
          
          // If we found the old category, update its spent amount only if the transaction is from the current month
          if (oldCategoryGroup && oldCategoryIndex !== -1) {
            const category = state.spendingCategories[oldCategoryGroup][oldCategoryIndex];
            
            // Check if the transaction date is in the current month
            const transactionDate = new Date(existingTransaction.date);
            const currentDate = new Date();
            const isCurrentMonth = transactionDate.getMonth() === currentDate.getMonth() && 
                                  transactionDate.getFullYear() === currentDate.getFullYear();
            
            // Only update category spent amount if transaction is from current month
            if (isCurrentMonth) {
              const currentSpent = category.spent || 0;
              const oldAmount = Math.abs(existingTransaction.amount);
              const newSpent = Math.max(0, currentSpent - oldAmount); // Subtract the absolute value of the old expense
              
              // Calculate new status
              const target = category.target || 0;
              let status: 'remaining' | 'over' = 'remaining';
              let statusAmount = Math.max(0, target - newSpent);
              
              if (newSpent > target) {
                status = 'over';
                statusAmount = newSpent - target;
              }
              
              // Update the category with new spent amount and status
              finalStateUpdate = {
                ...finalStateUpdate,
                spendingCategories: {
                  ...finalStateUpdate.spendingCategories,
                  [oldCategoryGroup]: finalStateUpdate.spendingCategories[oldCategoryGroup].map((cat: Category, index: number) =>
                    index === oldCategoryIndex 
                      ? { 
                          ...cat, 
                          spent: newSpent,
                          status: status,
                          statusAmount: statusAmount
                        } 
                      : cat
                  )
                }
              };
            }
          }
        }
        
        // If the updated transaction is an expense, add its amount to the new category
        const updatedTransaction = { ...existingTransaction, ...action.updates };
        if (updatedTransaction.type === 'Expense') {
          // Find which spending category group the new transaction belongs to
          let newCategoryGroup: keyof typeof state.spendingCategories | null = null;
          let newCategoryIndex = -1;
          
          // Search through all spending category groups
          for (const group in state.spendingCategories) {
            const groupIndex = state.spendingCategories[group as keyof typeof state.spendingCategories].findIndex(
              cat => cat.name === updatedTransaction.category
            );
            
            if (groupIndex !== -1) {
              newCategoryGroup = group as keyof typeof state.spendingCategories;
              newCategoryIndex = groupIndex;
              break;
            }
          }
          
          // If we found the new category, update its spent amount only if the transaction is from the current month
          if (newCategoryGroup && newCategoryIndex !== -1) {
            const category = finalStateUpdate.spendingCategories[newCategoryGroup][newCategoryIndex];
            
            // Check if the transaction date is in the current month
            const transactionDate = new Date(updatedTransaction.date);
            const currentDate = new Date();
            const isCurrentMonth = transactionDate.getMonth() === currentDate.getMonth() && 
                                  transactionDate.getFullYear() === currentDate.getFullYear();
            
            // Only update category spent amount if transaction is from current month
            if (isCurrentMonth) {
              const currentSpent = category.spent || 0;
              const newAmount = Math.abs(updatedTransaction.amount);
              const newSpent = currentSpent + newAmount; // Add the absolute value of the new expense
              
              // Calculate new status
              const target = category.target || 0;
              let status: 'remaining' | 'over' = 'remaining';
              let statusAmount = Math.max(0, target - newSpent);
              
              if (newSpent > target) {
                status = 'over';
                statusAmount = newSpent - target;
              }
              
              // Update the category with new spent amount and status
              finalStateUpdate = {
                ...finalStateUpdate,
                spendingCategories: {
                  ...finalStateUpdate.spendingCategories,
                  [newCategoryGroup]: finalStateUpdate.spendingCategories[newCategoryGroup].map((cat, index) =>
                    index === newCategoryIndex 
                      ? { 
                          ...cat, 
                          spent: newSpent,
                          status: status,
                          statusAmount: statusAmount
                        } 
                      : cat
                  )
                }
              };
            }
          }
        }
      }
      
      // Check if any spending category has reached 90% of its target after updating this transaction
      const updatedTransaction = { ...existingTransaction, ...action.updates };
      
      // If the amount, category, or type changed, we need to update the category spent amounts
      const amountChangedCheck = action.updates.amount !== undefined && action.updates.amount !== existingTransaction.amount;
      const categoryChangedCheck = action.updates.category !== undefined && action.updates.category !== existingTransaction.category;
      const typeChangedCheck = action.updates.type !== undefined && action.updates.type !== existingTransaction.type;
      
      if (amountChangedCheck || categoryChangedCheck || typeChangedCheck) {
        // If the existing transaction was an expense, subtract its amount from the old category
        if (existingTransaction.type === 'Expense') {
          // Find which spending category group the old transaction belonged to
          let oldCategoryGroup: keyof typeof state.spendingCategories | null = null;
          let oldCategoryIndex = -1;
          
          // Search through all spending category groups
          for (const group in state.spendingCategories) {
            const groupIndex = state.spendingCategories[group as keyof typeof state.spendingCategories].findIndex(
              cat => cat.name === existingTransaction.category
            );
            
            if (groupIndex !== -1) {
              oldCategoryGroup = group as keyof typeof state.spendingCategories;
              oldCategoryIndex = groupIndex;
              break;
            }
          }
          
          // If we found the old category, update its spent amount only if the transaction is from the current month
          if (oldCategoryGroup && oldCategoryIndex !== -1) {
            const category = state.spendingCategories[oldCategoryGroup][oldCategoryIndex];
            
            // Check if the transaction date is in the current month
            const transactionDate = new Date(existingTransaction.date);
            const currentDate = new Date();
            const isCurrentMonth = transactionDate.getMonth() === currentDate.getMonth() && 
                                  transactionDate.getFullYear() === currentDate.getFullYear();
            
            // Only update category spent amount if transaction is from current month
            if (isCurrentMonth) {
              const currentSpent = category.spent || 0;
              const oldAmount = Math.abs(existingTransaction.amount);
              const newSpent = Math.max(0, currentSpent - oldAmount); // Subtract the absolute value of the old expense
              
              // Calculate new status
              const target = category.target || 0;
              let status: 'remaining' | 'over' = 'remaining';
              let statusAmount = Math.max(0, target - newSpent);
              
              if (newSpent > target) {
                status = 'over';
                statusAmount = newSpent - target;
              }
              
              // Check if category has reached 90% of target and show alert if needed
              const progress = target > 0 ? (newSpent / target) * 100 : 0;
              if (progress >= 90) { // Trigger when reaching or exceeding 90%
                // Check if alert has already been triggered for this category
                hasAlertBeenTriggered(category.name).then(alreadyTriggered => {
                  if (!alreadyTriggered) {
                    // Check if budget alerts are enabled before showing notification
                    AsyncStorage.getItem('budgetAlerts')
                      .then(setting => {
                        const areBudgetAlertsEnabled = setting ? JSON.parse(setting) : true;
                        if (areBudgetAlertsEnabled) {
                          NotificationService.showImmediateNotification(
                            'Budget Alert',
                            `Category "${category.name}" has reached 90% of its target!`
                          ).catch(error => console.error('Failed to show notification:', error));
                          
                          // Mark alert as triggered for this category
                          markAlertAsTriggered(category.name);
                        }
                      })
                      .catch(error => console.error('Error checking budget alerts setting:', error));
                  }
                }).catch(error => console.error('Error checking if alert was triggered:', error));
              }
              
              // Update the category with new spent amount and status
              finalStateUpdate = {
                ...finalStateUpdate,
                spendingCategories: {
                  ...finalStateUpdate.spendingCategories,
                  [oldCategoryGroup]: finalStateUpdate.spendingCategories[oldCategoryGroup].map((cat: Category, index: number) =>
                    index === oldCategoryIndex 
                      ? { 
                          ...cat, 
                          spent: newSpent,
                          status: status,
                          statusAmount: statusAmount
                        } 
                      : cat
                  )
                }
              };
            }
          }
        }
        
        // If the updated transaction is an expense, add its amount to the new category
        if (updatedTransaction.type === 'Expense') {
          // Find which spending category group the new transaction belongs to
          let newCategoryGroup: keyof typeof state.spendingCategories | null = null;
          let newCategoryIndex = -1;
          
          // Search through all spending category groups
          for (const group in state.spendingCategories) {
            const groupIndex = state.spendingCategories[group as keyof typeof state.spendingCategories].findIndex(
              cat => cat.name === updatedTransaction.category
            );
            
            if (groupIndex !== -1) {
              newCategoryGroup = group as keyof typeof state.spendingCategories;
              newCategoryIndex = groupIndex;
              break;
            }
          }
          
          // If we found the new category, update its spent amount only if the transaction is from the current month
          if (newCategoryGroup && newCategoryIndex !== -1) {
            const category = finalStateUpdate.spendingCategories[newCategoryGroup][newCategoryIndex];
            
            // Check if the transaction date is in the current month
            const transactionDate = new Date(updatedTransaction.date);
            const currentDate = new Date();
            const isCurrentMonth = transactionDate.getMonth() === currentDate.getMonth() && 
                                  transactionDate.getFullYear() === currentDate.getFullYear();
            
            // Only update category spent amount if transaction is from current month
            if (isCurrentMonth) {
              const currentSpent = category.spent || 0;
              const newAmount = Math.abs(updatedTransaction.amount);
              const newSpent = currentSpent + newAmount; // Add the absolute value of the new expense
              
              // Calculate new status
              const target = category.target || 0;
              let status: 'remaining' | 'over' = 'remaining';
              let statusAmount = Math.max(0, target - newSpent);
              
              if (newSpent > target) {
                status = 'over';
                statusAmount = newSpent - target;
              }
              
              // Check if category has reached 90% of target and show alert if needed
              const progress = target > 0 ? (newSpent / target) * 100 : 0;
              if (progress >= 90) { // Trigger when reaching or exceeding 90%
                // Check if alert has already been triggered for this category
                hasAlertBeenTriggered(category.name).then(alreadyTriggered => {
                  if (!alreadyTriggered) {
                    // Check if budget alerts are enabled before showing notification
                    AsyncStorage.getItem('budgetAlerts')
                      .then(setting => {
                        const areBudgetAlertsEnabled = setting ? JSON.parse(setting) : true;
                        if (areBudgetAlertsEnabled) {
                          NotificationService.showImmediateNotification(
                            'Budget Alert',
                            `Category "${category.name}" has reached 90% of its target!`
                          ).catch(error => console.error('Failed to show notification:', error));
                          
                          // Mark alert as triggered for this category
                          markAlertAsTriggered(category.name);
                        }
                      })
                      .catch(error => console.error('Error checking budget alerts setting:', error));
                  }
                }).catch(error => console.error('Error checking if alert was triggered:', error));
              }
              
              // Update the category with new spent amount and status
              finalStateUpdate = {
                ...finalStateUpdate,
                spendingCategories: {
                  ...finalStateUpdate.spendingCategories,
                  [newCategoryGroup]: finalStateUpdate.spendingCategories[newCategoryGroup].map((cat, index) =>
                    index === newCategoryIndex 
                      ? { 
                          ...cat, 
                          spent: newSpent,
                          status: status,
                          statusAmount: statusAmount
                        } 
                      : cat
                  )
                }
              };
            }
          }
        }
      }
      
      return finalStateUpdate;
    }
    case 'ADD_ACCOUNT': // Add case for ADD_ACCOUNT
      return {
        ...state,
        accounts: [...(state.accounts || []), action.account],
      };
    case 'DELETE_ACCOUNT': // Add case for DELETE_ACCOUNT
      return {
        ...state,
        accounts: state.accounts.filter(account => account.id !== action.accountId),
        transactions: state.transactions.filter(transaction => transaction.account !== 
          state.accounts.find(acc => acc.id === action.accountId)?.name)
      };
    case 'UPDATE_ACCOUNT': // Add case for UPDATE_ACCOUNT
      // If the account name is being updated, we also need to update all transactions associated with this account
      const updatedAccount = state.accounts.find(account => account.id === action.accountId);
      const accountNameChanged = action.updates.name && updatedAccount && updatedAccount.name !== action.updates.name;
      
      let updatedTransactions = state.transactions;
      if (accountNameChanged && updatedAccount) {
        // Update all transactions that reference the old account name
        updatedTransactions = state.transactions.map(transaction => {
          // Update the account reference
          let updatedTransaction = transaction;
          if (transaction.account === updatedAccount.name) {
            updatedTransaction = { ...transaction, account: action.updates.name as string };
          }
          
          // For transfer transactions, also update the transaction name
          if (transaction.category === 'Transfer') {
            // If this is an expense transfer from the renamed account
            if (transaction.type === 'Expense' && transaction.name === `Transfer to ${updatedAccount.name}`) {
              updatedTransaction = { 
                ...updatedTransaction, 
                name: `Transfer to ${action.updates.name}` 
              };
            }
            // If this is an income transfer to the renamed account
            else if (transaction.type === 'Income' && transaction.name === `Transfer from ${updatedAccount.name}`) {
              updatedTransaction = { 
                ...updatedTransaction, 
                name: `Transfer from ${action.updates.name}` 
              };
            }
            // If this transfer involves the renamed account as the target (in the name)
            else if (transaction.name.includes(`Transfer to ${updatedAccount.name}`)) {
              updatedTransaction = { 
                ...updatedTransaction, 
                name: transaction.name.replace(`Transfer to ${updatedAccount.name}`, `Transfer to ${action.updates.name}`) 
              };
            }
            // If this transfer involves the renamed account as the source (in the name)
            else if (transaction.name.includes(`Transfer from ${updatedAccount.name}`)) {
              updatedTransaction = { 
                ...updatedTransaction, 
                name: transaction.name.replace(`Transfer from ${updatedAccount.name}`, `Transfer from ${action.updates.name}`) 
              };
            }
          }
          
          return updatedTransaction;
        });
      }
      
      return {
        ...state,
        transactions: updatedTransactions,
        accounts: state.accounts.map(account =>
          account.id === action.accountId ? { ...account, ...action.updates } : account
        )
      };
    case 'DELETE_TRANSACTION':
      // Find the transaction being deleted
      const transactionToDelete = state.transactions.find(t => t.id === action.transactionId);
      
      // If transaction doesn't exist, return state unchanged
      if (!transactionToDelete) {
        return state;
      }
      
      // Create updated state with transaction removed
      let updatedStateAfterDelete = {
        ...state,
        transactions: state.transactions.filter(transaction => transaction.id !== action.transactionId),
      };
      
      // Update account balances when deleting a transaction
      if (transactionToDelete.category === 'Transfer') {
        // Handle transfer transactions - they affect two accounts
        // Find the source account (for expense transfers)
        if (transactionToDelete.type === 'Expense') {
          const sourceAccountIndex = updatedStateAfterDelete.accounts.findIndex(
            account => account.name === transactionToDelete.account
          );
          
          if (sourceAccountIndex !== -1) {
            const sourceAccount = updatedStateAfterDelete.accounts[sourceAccountIndex];
            // Return the money to the source account (add back the amount)
            const newBalance = sourceAccount.balance + Math.abs(transactionToDelete.amount);
            
            updatedStateAfterDelete = {
              ...updatedStateAfterDelete,
              accounts: updatedStateAfterDelete.accounts.map((acc, index) =>
                index === sourceAccountIndex ? { ...acc, balance: newBalance } : acc
              ),
            };
          }
          
          // Find the destination account (extract from transaction name)
          // Transfer transactions have names like "Transfer to Checking Account"
          const destinationAccountName = transactionToDelete.name.replace('Transfer to ', '');
          const destinationAccountIndex = updatedStateAfterDelete.accounts.findIndex(
            account => account.name === destinationAccountName
          );
          
          if (destinationAccountIndex !== -1) {
            const destinationAccount = updatedStateAfterDelete.accounts[destinationAccountIndex];
            // Remove the money from the destination account (subtract the amount)
            const newBalance = destinationAccount.balance - Math.abs(transactionToDelete.amount);
            
            updatedStateAfterDelete = {
              ...updatedStateAfterDelete,
              accounts: updatedStateAfterDelete.accounts.map((acc, index) =>
                index === destinationAccountIndex ? { ...acc, balance: newBalance } : acc
              ),
            };
          }
        }
        // Find the destination account (for income transfers)
        else if (transactionToDelete.type === 'Income') {
          const destinationAccountIndex = updatedStateAfterDelete.accounts.findIndex(
            account => account.name === transactionToDelete.account
          );
          
          if (destinationAccountIndex !== -1) {
            const destinationAccount = updatedStateAfterDelete.accounts[destinationAccountIndex];
            // Remove the money from the destination account (subtract the amount)
            const newBalance = destinationAccount.balance - Math.abs(transactionToDelete.amount);
            
            updatedStateAfterDelete = {
              ...updatedStateAfterDelete,
              accounts: updatedStateAfterDelete.accounts.map((acc, index) =>
                index === destinationAccountIndex ? { ...acc, balance: newBalance } : acc
              ),
            };
          }
          
          // Find the source account (extract from transaction name)
          // Transfer transactions have names like "Transfer from Savings Account"
          const sourceAccountName = transactionToDelete.name.replace('Transfer from ', '');
          const sourceAccountIndex = updatedStateAfterDelete.accounts.findIndex(
            account => account.name === sourceAccountName
          );
          
          if (sourceAccountIndex !== -1) {
            const sourceAccount = updatedStateAfterDelete.accounts[sourceAccountIndex];
            // Return the money to the source account (add back the amount)
            const newBalance = sourceAccount.balance + Math.abs(transactionToDelete.amount);
            
            updatedStateAfterDelete = {
              ...updatedStateAfterDelete,
              accounts: updatedStateAfterDelete.accounts.map((acc, index) =>
                index === sourceAccountIndex ? { ...acc, balance: newBalance } : acc
              ),
            };
          }
        }
      } else {
        // Handle regular transactions - they affect only one account
        const accountIndex = updatedStateAfterDelete.accounts.findIndex(
          account => account.name === transactionToDelete.account
        );
        
        if (accountIndex !== -1) {
          const account = updatedStateAfterDelete.accounts[accountIndex];
          let newBalance = account.balance;
          
          // Return the money to the account
          if (transactionToDelete.type === 'Expense') {
            // For expenses, return the money (add back the amount)
            newBalance = account.balance + Math.abs(transactionToDelete.amount);
          } else if (transactionToDelete.type === 'Income') {
            // For income, remove the money (subtract the amount)
            newBalance = account.balance - Math.abs(transactionToDelete.amount);
          }
          
          // Update the account with new balance
          updatedStateAfterDelete = {
            ...updatedStateAfterDelete,
            accounts: updatedStateAfterDelete.accounts.map((acc, index) =>
              index === accountIndex ? { ...acc, balance: newBalance } : acc
            ),
          };
        }
      }
      
      // If the deleted transaction was an expense, subtract its amount from the corresponding spending category
      if (transactionToDelete.type === 'Expense') {
        // Find which spending category group this transaction belonged to
        let categoryGroup: keyof typeof state.spendingCategories | null = null;
        let categoryIndex = -1;
        
        // Search through all spending category groups
        for (const group in state.spendingCategories) {
          const groupIndex = state.spendingCategories[group as keyof typeof state.spendingCategories].findIndex(
            cat => cat.name === transactionToDelete.category
          );
          
          if (groupIndex !== -1) {
            categoryGroup = group as keyof typeof state.spendingCategories;
            categoryIndex = groupIndex;
            break;
          }
        }
        
        // If we found the category, update its spent amount only if the transaction is from the current month
        if (categoryGroup && categoryIndex !== -1) {
          const category = state.spendingCategories[categoryGroup][categoryIndex];
          
          // Check if the transaction date is in the current month
          const transactionDate = new Date(transactionToDelete.date);
          const currentDate = new Date();
          const isCurrentMonth = transactionDate.getMonth() === currentDate.getMonth() && 
                                transactionDate.getFullYear() === currentDate.getFullYear();
          
          // Only update category spent amount if transaction is from current month
          if (isCurrentMonth) {
            const currentSpent = category.spent || 0;
            const amountToRemove = Math.abs(transactionToDelete.amount);
            const newSpent = Math.max(0, currentSpent - amountToRemove); // Subtract the absolute value of the expense
            
            // Calculate new status
            const target = category.target || 0;
            let status: 'remaining' | 'over' = 'remaining';
            let statusAmount = Math.max(0, target - newSpent);
            
            if (newSpent > target) {
              status = 'over';
              statusAmount = newSpent - target;
            }
            
            // Update the category with new spent amount and status
            updatedStateAfterDelete = {
              ...updatedStateAfterDelete,
              spendingCategories: {
                ...updatedStateAfterDelete.spendingCategories,
                [categoryGroup]: updatedStateAfterDelete.spendingCategories[categoryGroup].map((cat, index) =>
                  index === categoryIndex 
                    ? { 
                        ...cat, 
                        spent: newSpent,
                        status: status,
                        statusAmount: statusAmount
                      } 
                    : cat
                )
              }
            };
          }
        }
      }
      
      return updatedStateAfterDelete;
    case 'MARK_CATEGORY_TRANSACTIONS_CLEARED': // Add case for MARK_CATEGORY_TRANSACTIONS_CLEARED
      // Mark all transactions associated with the specified category as cleared
      return {
        ...state,
        transactions: state.transactions.map(transaction => 
          transaction.category === action.categoryName
            ? { ...transaction, clearedForCategory: action.categoryName }
            : transaction
        )
      };
    default:
      return state;
  }
}

// Provider component
export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(budgetReducer, initialState);
  
  // Check if we need to reset budget alerts (at the start of each month)
  useEffect(() => {
    const checkAndResetAlerts = async () => {
      try {
        // Get the last reset date
        const lastResetDate = await AsyncStorage.getItem('lastBudgetAlertReset');
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        let shouldReset = false;
        
        if (lastResetDate) {
          const lastReset = new Date(lastResetDate);
          // Reset if we're in a different month or year
          if (lastReset.getMonth() !== currentMonth || lastReset.getFullYear() !== currentYear) {
            shouldReset = true;
          }
        } else {
          // If no last reset date, reset now and set the date
          shouldReset = true;
        }
        
        if (shouldReset) {
          // Reset all budget alerts
          await resetAllBudgetAlerts();
          // Save the current date as the last reset date
          await AsyncStorage.setItem('lastBudgetAlertReset', currentDate.toISOString());
        }
      } catch (error) {
        console.error('Error checking/resetting budget alerts:', error);
      }
    };
    
    checkAndResetAlerts();
  }, []);
  
  // Check for budget alerts when state changes
  useEffect(() => {
    const checkAndSendAlerts = async () => {
      try {
        // Check if budget alerts are enabled
        const budgetAlertsSetting = await AsyncStorage.getItem('budgetAlerts');
        const areBudgetAlertsEnabled = budgetAlertsSetting ? JSON.parse(budgetAlertsSetting) : true;
        
        if (areBudgetAlertsEnabled) {
          const alertMessages = checkBudgetAlerts(state);
          if (alertMessages.length > 0) {
            // Show notifications for budget alerts (but only for categories that haven't been alerted yet)
            for (const message of alertMessages) {
              // Extract category name from message (format: 'Category "{name}" has reached {progress}% of its target!')
              const categoryNameMatch = message.match(/Category "([^"]+)" has reached/);
              if (categoryNameMatch && categoryNameMatch[1]) {
                const categoryName = categoryNameMatch[1];
                
                // Check if alert has already been triggered for this category
                const alreadyTriggered = await hasAlertBeenTriggered(categoryName);
                if (!alreadyTriggered) {
                  NotificationService.showImmediateNotification(
                    'Budget Alert',
                    message
                  ).catch(error => console.error('Failed to show notification:', error));
                  
                  // Mark alert as triggered for this category
                  await markAlertAsTriggered(categoryName);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking budget alerts setting:', error);
      }
    };
    
    checkAndSendAlerts();
  }, [state]);
  
  return (
    <BudgetContext.Provider value={{ state, dispatch }}>
      {children}
    </BudgetContext.Provider>
  );
}

// Hook to use the context
export function useBudget() {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
