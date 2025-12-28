import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { ThemedView } from '@/components/themed-view';
import { useCurrency } from '@/context/currency-context';
import { NotificationService } from '@/services/notification-service';

export default function TransactionModal() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const { formatCurrency } = useCurrency();
  const { id: editTransactionId } = useLocalSearchParams();
  const [transactionName, setTransactionName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [account, setAccount] = useState('');
  const [date, setDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'Expense' | 'Income'>('Expense');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [zeroBalanceError, setZeroBalanceError] = useState('');
  const [insufficientFundsError, setInsufficientFundsError] = useState('');

  // Load transaction data if in edit mode
  useEffect(() => {
    if (editTransactionId) {
      const transaction = state.transactions.find(t => t.id === editTransactionId);
      console.log('Found transaction:', transaction);
      if (transaction) {
        setTransactionName(transaction.name);
        // For expenses, amount is negative, so we need to make it positive for display
        setAmount(Math.abs(transaction.amount).toString());
        setCategory(transaction.category);
        setAccount(transaction.account);
        setActiveTab(transaction.type);
        setDate(new Date(transaction.date));
      }
    } else {
      // Reset to default when not in edit mode
      setTransactionName('');
      setAmount('');
      setCategory('');
      setAccount(state.accounts.length > 0 ? state.accounts[0].name : ''); // Set default account
      setActiveTab('Expense');
      setDate(new Date());
    }
  }, [editTransactionId, state.transactions, state.accounts]);

  // Ensure today's date is always set when component mounts (only for new transactions)
  useEffect(() => {
    if (!editTransactionId) {
      setDate(new Date());
    }
  }, [editTransactionId]);

  // Helper function to check if a date is today
  const isToday = (dateToCheck: Date) => {
    const today = new Date();
    return dateToCheck.getDate() === today.getDate() &&
           dateToCheck.getMonth() === today.getMonth() &&
           dateToCheck.getFullYear() === today.getFullYear();
  };

  // Use actual user accounts instead of hardcoded ones
  const userAccounts = state.accounts.map(acc => acc.name);

  // Get all spending categories from the dashboard
  const getAllSpendingCategories = () => {
    const allCategories: string[] = [];
    
    // Add categories from each spending group
    if (state.spendingCategories.Bills) {
      state.spendingCategories.Bills.forEach(cat => {
        if (!allCategories.includes(cat.name)) {
          allCategories.push(cat.name);
        }
      });
    }
    
    if (state.spendingCategories.Needs) {
      state.spendingCategories.Needs.forEach(cat => {
        if (!allCategories.includes(cat.name)) {
          allCategories.push(cat.name);
        }
      });
    }
    
    if (state.spendingCategories.Wants) {
      state.spendingCategories.Wants.forEach(cat => {
        if (!allCategories.includes(cat.name)) {
          allCategories.push(cat.name);
        }
      });
    }
    
    if (state.spendingCategories['Non-Monthly']) {
      state.spendingCategories['Non-Monthly'].forEach(cat => {
        if (!allCategories.includes(cat.name)) {
          allCategories.push(cat.name);
        }
      });
    }
    
    return allCategories;
  };

  // Get all categories for expense selection
  const expenseCategories = getAllSpendingCategories();

  // Sample categories for income (these can remain hardcoded or be expanded later)
  const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift'];

  // Format the amount as the user types to ensure only numeric input
  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      setAmount(parts.join('.'));
      return;
    }
    
    setAmount(numericValue);
  };

  // Handle adding a new transaction
  const handleAddTransaction = () => {
    // Handle regular expense/income transactions
    // Validate all fields are filled
    if (transactionName.trim() && amount.trim() && account && (activeTab === 'Expense' ? category : true)) {
      // Find the selected account
      const selectedAccount = state.accounts.find(acc => acc.name === account);
      
      // Check if account has zero balance and is not a credit card
      if (selectedAccount && selectedAccount.type !== 'Credit Card' && selectedAccount.balance === 0) {
        setZeroBalanceError('Account has zero balance');
        return;
      }
      
      // Clear errors if validation passes
      setZeroBalanceError('');
      setInsufficientFundsError('');
      
      // Check if expense amount exceeds account balance (for non-credit card accounts)
      if (activeTab === 'Expense' && selectedAccount && selectedAccount.type !== 'Credit Card') {
        const expenseAmount = parseFloat(amount);
        if (expenseAmount > selectedAccount.balance) {
          setInsufficientFundsError(`Insufficient funds. Account balance: ${formatCurrency(selectedAccount.balance)}`);
          return;
        }
      }
      
      // Format date to YYYY-MM-DD in local timezone
      const formattedDate = date.getFullYear() + '-' + 
                           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(date.getDate()).padStart(2, '0');

      // Calculate the transaction amount
      const transactionAmount = activeTab === 'Income' ? parseFloat(amount) : -parseFloat(amount);
      
      if (editTransactionId) {
        // Update existing transaction
        const updatedTransaction = {
          name: transactionName.trim(),
          amount: transactionAmount,
          category: category || 'Income',
          type: activeTab,
          date: formattedDate,
          account: account,
          day: date.getDate().toString(),
          month: date.toLocaleString('default', { month: 'short' })
        };

        // Dispatch the updated transaction to the budget context
        dispatch({ type: 'UPDATE_TRANSACTION', transactionId: editTransactionId as string, updates: updatedTransaction });

        // Show success message
        alert('Transaction updated successfully!');
      } else {
        // Create a new transaction object
        const newTransaction = {
          id: Date.now().toString(), // Simple ID generation
          name: transactionName.trim(),
          amount: transactionAmount,
          category: category || 'Income',
          type: activeTab,
          date: formattedDate, // Store date in local timezone format
          account: account,
          day: date.getDate().toString(),
          month: date.toLocaleString('default', { month: 'short' })
        };

        // Dispatch the new transaction to the budget context
        dispatch({ type: 'ADD_TRANSACTION', transaction: newTransaction });

        // Update account balance if account exists
        if (selectedAccount) {
          // For credit cards, expenses increase debt (more negative balance) and income decreases debt (less negative balance)
          // For other accounts, expenses decrease balance and income increases balance
          let newBalance;
          if (selectedAccount.type === 'Credit Card') {
            // Credit card balances should become more negative with expenses
            // If balance is -500 and we spend 20, it should become -520
            if (activeTab === 'Expense') {
              // Expense: make balance more negative
              newBalance = selectedAccount.balance - parseFloat(amount);
            } else {
              // Income: make balance less negative (pay off debt)
              newBalance = selectedAccount.balance + parseFloat(amount);
            }
          } else {
            // Regular accounts: expenses decrease balance, income increases balance
            newBalance = selectedAccount.balance + transactionAmount;
          }
          
          dispatch({
            type: 'UPDATE_ACCOUNT',
            accountId: selectedAccount.id,
            updates: {
              balance: newBalance
            }
          });
        }

        // Show success message
        alert('Transaction added successfully!');
      }

      // Navigate back to transactions screen
      router.back();
    } else {
      // Show alert if fields are missing
      alert('Please fill in all required fields: Transaction Name, Amount, and Account' + (activeTab === 'Expense' ? ', Category' : ''));
    }
  };

  // Check if we're in edit mode
  const isEditMode = !!editTransactionId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.dismiss()}>
          <Text style={[styles.backIcon, { color: '#E2E8F0' }]}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Transaction' : 'New Transaction'}</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Expense' && styles.activeTab]}
          onPress={() => setActiveTab('Expense')}
        >
          <Text style={[styles.tabText, activeTab === 'Expense' ? styles.activeTabText : styles.inactiveTabText]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Income' && styles.activeTab]}
          onPress={() => setActiveTab('Income')}
        >
          <Text style={[styles.tabText, activeTab === 'Income' ? styles.activeTabText : styles.inactiveTabText]}>Income</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Transaction Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={activeTab === 'Expense' ? "e.g. Groceries" : "e.g. Salary"}
                placeholderTextColor="#94A3B8"
                value={transactionName}
                onChangeText={setTransactionName}
              />
            </View>
          </View>
          
          {/* Amount */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              {activeTab === 'Expense' ? (
                <>
                  <Text style={styles.currencySymbol}>-$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={handleAmountChange}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.currencySymbol}>+$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={handleAmountChange}
                  />
                </>
              )}
            </View>
          </View>
          
          {/* Account Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Account</Text>
            <View style={styles.selectionContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {state.accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.name}
                    style={[
                      styles.selectionItem,
                      account === acc.name && styles.selectedSelectionItem
                    ]}
                    onPress={() => {
                      // Check if account has zero balance and is not a credit card
                      if (acc.type !== 'Credit Card' && acc.balance === 0) {
                        setZeroBalanceError('Account has zero balance');
                      } else {
                        setAccount(acc.name);
                        // Clear errors when selecting a valid account
                        setZeroBalanceError('');
                        setInsufficientFundsError('');
                      }
                    }}
                  >
                    <Text style={[
                      styles.selectionItemText,
                      account === acc.name && styles.selectedSelectionItemText
                    ]}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {zeroBalanceError ? <Text style={styles.errorText}>{zeroBalanceError}</Text> : null}
            {insufficientFundsError ? <Text style={styles.errorText}>{insufficientFundsError}</Text> : null}
          </View>
          
          {/* Category Selection */}
          {activeTab === 'Expense' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.selectionContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {expenseCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.selectionItem,
                        category === cat && styles.selectedSelectionItem
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text style={[
                        styles.selectionItemText,
                        category === cat && styles.selectedSelectionItemText
                      ]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
          
          {/* Date */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.dateDisplayContainer}>
              <Text style={styles.dateDisplayText}>
                {date.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
              <TouchableOpacity 
                style={[
                  styles.todayButton,
                  isToday(date) && styles.todayButtonActive
                ]}
                onPress={() => {
                  setDate(new Date());
                }}
              >
                <Text style={[
                  styles.todayButtonText,
                  isToday(date) && styles.todayButtonTextActive
                ]}>
                  Today
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Day Selection */}
            <View style={styles.daySelectionContainer}>
              <View style={styles.daySelectionControls}>
                <TouchableOpacity 
                  style={styles.dayAdjustmentButton}
                  onPress={() => {
                    const currentDay = date.getDate();
                    const currentMonth = date.getMonth();
                    const currentYear = date.getFullYear();
                    
                    if (currentDay > 1) {
                      // If not at the beginning of the month, decrement the day
                      const newDate = new Date(currentYear, currentMonth, currentDay - 1);
                      setDate(newDate);
                    } else {
                      // If at the beginning of the month, go to the last day of the previous month
                      const prevMonth = currentMonth - 1;
                      // Get the number of days in the previous month
                      const daysInPreviousMonth = new Date(currentYear, currentMonth, 0).getDate();
                      const newDate = new Date(currentYear, prevMonth, daysInPreviousMonth);
                      setDate(newDate);
                    }
                  }}
                >
                  <Text style={styles.dayAdjustmentButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.dayValue}>{date.getDate()}</Text>
                <TouchableOpacity 
                  style={styles.dayAdjustmentButton}
                  onPress={() => {
                    const currentDay = date.getDate();
                    const currentMonth = date.getMonth();
                    const currentYear = date.getFullYear();
                    // Get the number of days in the current month
                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                    
                    // Create today's date for comparison
                    const today = new Date();
                    const todayYear = today.getFullYear();
                    const todayMonth = today.getMonth();
                    const todayDay = today.getDate();
                    
                    // Check if we're trying to go beyond today's date
                    if (currentYear > todayYear || 
                        (currentYear === todayYear && currentMonth > todayMonth) ||
                        (currentYear === todayYear && currentMonth === todayMonth && currentDay >= todayDay)) {
                      // If we're at or beyond today, don't allow incrementing
                      return;
                    }
                    
                    if (currentDay < daysInMonth) {
                      // If not at the end of the month, increment the day
                      const newDate = new Date(currentYear, currentMonth, currentDay + 1);
                      setDate(newDate);
                    } else {
                      // If at the end of the month, go to the first day of the next month
                      const newDate = new Date(currentYear, currentMonth + 1, 1);
                      setDate(newDate);
                    }
                  }}
                >
                  <Text style={styles.dayAdjustmentButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.dismiss()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.addButton, 
            !((transactionName.trim() && amount.trim() && account) && (activeTab === 'Expense' ? category : true)) && styles.disabledAddButton]}
          onPress={handleAddTransaction}
          disabled={!((transactionName.trim() && amount.trim() && account) && (activeTab === 'Expense' ? category : true))}
        >
          <Text style={[styles.addButtonText, 
            !((transactionName.trim() && amount.trim() && account) && (activeTab === 'Expense' ? category : true)) && { color: '#94A3B8' }]}> 
            {isEditMode ? 'Update Transaction' : 'Add Transaction'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2543',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#1D2543',
  },
  backIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#1D2543',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1e6469',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#E2E8F0',
  },
  inactiveTabText: {
    color: '#94A3B8',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    fontSize: 12,
    color: '#94A3B8',
  },
  inputContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 40,
  },
  input: {
    padding: 10,
    fontSize: 14,
    color: '#E2E8F0',
  },
  amountInputContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  currencySymbol: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#E2E8F0',
  },
  dateDisplayContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
  dateDisplayText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  todayButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  todayButtonActive: {
    backgroundColor: '#cce8e8',
    borderColor: '#cce8e8',
  },
  todayButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  todayButtonTextActive: {
    color: '#1D2543',
  },
  daySelectionContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    alignSelf: 'center',
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  daySelectionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayAdjustmentButton: {
    backgroundColor: '#1E293B',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayAdjustmentButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  dayValue: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  selectionContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    minHeight: 50,
  },
  selectionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSelectionItem: {
    backgroundColor: '#cce8e8',
  },
  selectionItemText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedSelectionItemText: {
    color: '#1D2543',
    fontWeight: '600',
  },
  noAccountsText: {
    color: '#94A3B8',
    fontSize: 14,
    fontStyle: 'italic',
    padding: 10,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#1e6469',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledAddButton: {
    backgroundColor: 'transparent',
    borderColor: '#334155',
  },
  addButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});