import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/budget-context';

export default function TransferFundsScreen() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const [amount, setAmount] = useState('');
  const [transferFromAccount, setTransferFromAccount] = useState('');
  const [transferToAccount, setTransferToAccount] = useState('');
  const [date, setDate] = useState(new Date());
  const [fromAccountError, setFromAccountError] = useState('');

  // Helper function to check if a date is today
  const isToday = (dateToCheck: Date) => {
    const today = new Date();
    return dateToCheck.getDate() === today.getDate() &&
           dateToCheck.getMonth() === today.getMonth() &&
           dateToCheck.getFullYear() === today.getFullYear();
  };

  // Use actual user accounts
  const userAccounts = state.accounts.map(acc => acc.name);

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

  // Handle transferring funds
  const handleTransferFunds = () => {
    // Validate all fields are filled
    if (amount.trim() && transferFromAccount && transferToAccount && transferFromAccount !== transferToAccount) {
      // Clear previous error messages
      setFromAccountError('');
      
      // Find the selected accounts
      const fromAccount = state.accounts.find(acc => acc.name === transferFromAccount);
      const toAccount = state.accounts.find(acc => acc.name === transferToAccount);
      
      if (!fromAccount || !toAccount) {
        alert('Selected accounts not found');
        return;
      }
      
      // Check if from account has zero balance (for non-credit accounts)
      if (fromAccount.type !== 'Credit Card' && fromAccount.balance === 0) {
        setFromAccountError('Account has zero balance');
        return;
      }
      
      // Check if from account has sufficient balance (for non-credit accounts)
      if (fromAccount.type !== 'Credit Card' && fromAccount.balance < parseFloat(amount)) {
        setFromAccountError(`Insufficient funds. Balance: $${fromAccount.balance.toFixed(2)}`);
        return;
      }
      
      // Format date to YYYY-MM-DD in local timezone
      const formattedDate = date.getFullYear() + '-' + 
                           String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(date.getDate()).padStart(2, '0');
      
      // Create expense transaction (from account)
      const expenseTransaction = {
        id: `${Date.now()}_expense`,
        name: `Transfer to ${transferToAccount}`,
        amount: -parseFloat(amount),
        category: 'Transfer',
        type: 'Expense' as const,
        date: formattedDate,
        account: transferFromAccount,
        day: date.getDate().toString(),
        month: date.toLocaleString('default', { month: 'short' })
      };

      // Create income transaction (to account)
      const incomeTransaction = {
        id: `${Date.now()}_income`,
        name: `Transfer from ${transferFromAccount}`,
        amount: parseFloat(amount),
        category: 'Transfer',
        type: 'Income' as const,
        date: formattedDate,
        account: transferToAccount,
        day: date.getDate().toString(),
        month: date.toLocaleString('default', { month: 'short' })
      };

      // Dispatch both transactions to the budget context
      dispatch({ type: 'ADD_TRANSACTION', transaction: expenseTransaction });
      dispatch({ type: 'ADD_TRANSACTION', transaction: incomeTransaction });

      // Update from account balance
      let newFromBalance;
      if (fromAccount.type === 'Credit Card') {
        // For credit cards, transfers increase debt (more negative balance)
        newFromBalance = fromAccount.balance - parseFloat(amount);
      } else {
        // For other accounts, transfers decrease balance
        newFromBalance = fromAccount.balance - parseFloat(amount);
      }
      
      dispatch({
        type: 'UPDATE_ACCOUNT',
        accountId: fromAccount.id,
        updates: {
          balance: newFromBalance
        }
      });

      // Update to account balance
      let newToBalance;
      if (toAccount.type === 'Credit Card') {
        // For credit cards, transfers decrease debt (less negative balance)
        newToBalance = toAccount.balance + parseFloat(amount);
      } else {
        // For other accounts, transfers increase balance
        newToBalance = toAccount.balance + parseFloat(amount);
      }
      
      dispatch({
        type: 'UPDATE_ACCOUNT',
        accountId: toAccount.id,
        updates: {
          balance: newToBalance
        }
      });

      // Show success message
      alert('Transfer completed successfully!');

      // Navigate back to accounts screen
      router.back();
    } else {
      // Show alert if fields are missing
      alert('Please fill in all required fields: Amount, From Account, and To Account (must be different)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1D2543" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transfer Funds</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={handleAmountChange}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>From</Text>
            <View style={styles.selectionContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {userAccounts.map((acc: string) => (
                  <TouchableOpacity
                    key={acc}
                    style={[
                      styles.selectionItem,
                      transferFromAccount === acc && styles.selectedSelectionItem
                    ]}
                    onPress={() => {
                      // Find the full account object
                      const accountObj = state.accounts.find(account => account.name === acc);
                      // Check if account has zero balance (for non-credit accounts)
                      if (accountObj && accountObj.type !== 'Credit Card' && accountObj.balance === 0) {
                        setFromAccountError('Account has zero balance');
                      } else {
                        setTransferFromAccount(acc);
                        setFromAccountError(''); // Clear error when selecting a valid account
                      }
                    }}
                  >
                    <Text style={[
                      styles.selectionItemText,
                      transferFromAccount === acc && styles.selectedSelectionItemText
                    ]}>
                      {acc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {fromAccountError ? <Text style={styles.errorText}>{fromAccountError}</Text> : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>To</Text>
            <View style={styles.selectionContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {userAccounts.map((acc: string) => (
                  <TouchableOpacity
                    key={acc}
                    style={[
                      styles.selectionItem,
                      transferToAccount === acc && styles.selectedSelectionItem
                    ]}
                    onPress={() => setTransferToAccount(acc)}
                  >
                    <Text style={[
                      styles.selectionItemText,
                      transferToAccount === acc && styles.selectedSelectionItemText
                    ]}>
                      {acc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
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
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.transferButton, 
            !(amount.trim() && transferFromAccount && transferToAccount && transferFromAccount !== transferToAccount) && styles.disabledTransferButton]}
          onPress={handleTransferFunds}
          disabled={!(amount.trim() && transferFromAccount && transferToAccount && transferFromAccount !== transferToAccount)}
        >
          <Text style={[styles.transferButtonText, 
            !(amount.trim() && transferFromAccount && transferToAccount && transferFromAccount !== transferToAccount) && { color: '#94A3B8' }]}>Transfer</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#1D2543',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#E2E8F0',
    fontSize: 24,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  placeholder: {
    width: 30,
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
  transferButton: {
    flex: 1,
    backgroundColor: '#1e6469',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledTransferButton: {
    backgroundColor: 'transparent',
    borderColor: '#334155',
  },
  transferButtonText: {
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