import { StyleSheet, View, Text, TouchableOpacity, FlatList } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useBudget } from '@/context/budget-context';
import { Colors } from '@/constants/theme';
import { useCurrency } from '@/context/currency-context';

export default function AccountsScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { formatCurrency } = useCurrency();
  
  // Use dark theme colors only
  const colors = Colors.dark;
  
  // State for balance calculations
  const [totalBalance, setTotalBalance] = useState(0);
  const [reservedForSavings, setReservedForSavings] = useState(0);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [hasPreviousMonthData, setHasPreviousMonthData] = useState(false);
  const [variationAmount, setVariationAmount] = useState(0);
  const [isPositive, setIsPositive] = useState(true);

  // Calculate total balance from accounts and reserved amount for savings
  useEffect(() => {
    // Calculate total account balance (subtract credit card balances as they represent debt)
    const balance = state.accounts.reduce((total, account) => {
      const accountBalance = account.type === 'Credit Card' ? -(Math.abs(account.balance || 0)) : (account.balance || 0);
      return total + accountBalance;
    }, 0);
    
    // Calculate total reserved for savings
    const reserved = state.savingsCategories['Savings Goals'].reduce((total, category) => {
      return total + (category.generalSaved || 0);
    }, 0);
    
    setReservedForSavings(reserved);
    // Total balance should include both account balances and reserved savings
    setTotalBalance(balance + reserved);
  }, [state.accounts, state.savingsCategories]);

  // Calculate previous month's net balance (variation)
  useEffect(() => {
    // Get transactions from context
    const transactions = state.transactions;
    
    // Check if user has any transactions
    setHasTransactions(transactions.length > 0);
    
    // If no transactions, no need to calculate variation
    if (transactions.length === 0) {
      setHasPreviousMonthData(false);
      return;
    }
    
    // Calculate previous month's date range
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Filter transactions for last month
    const lastMonthTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
    });
    
    // Check if we have data from last month
    setHasPreviousMonthData(lastMonthTransactions.length > 0);
    
    // If no transactions last month, no variation to show
    if (lastMonthTransactions.length === 0) {
      return;
    }
    
    // Calculate income and expenses for last month
    const lastMonthIncome = lastMonthTransactions
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const lastMonthExpense = lastMonthTransactions
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Calculate net balance (income - expenses) for last month
    const netBalance = lastMonthIncome - lastMonthExpense;
    
    setVariationAmount(Math.abs(netBalance));
    setIsPositive(netBalance >= 0);
  }, [state.transactions]);

  const renderAccount = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.accountItem}
      onPress={() => router.push(`/account-details?accountId=${item.id}`)}
    >
      <View style={styles.accountInfo}>
        <Text style={[styles.accountName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.accountType, { color: colors.weakText }]}>{item.type}</Text>
      </View>
      <Text style={[
        styles.accountBalance,
        item.type === 'Credit Card' ? styles.negativeBalance : styles.whiteBalance,
        { color: item.type === 'Credit Card' ? '#F87171' : colors.text }
      ]}>
        {item.type === 'Credit Card' ? formatCurrency(Math.abs(item.balance || 0)) : formatCurrency(item.balance || 0)}
      </Text>
    </TouchableOpacity>
  );

  // Function to handle the add button press
  const handleAddAccount = () => {
    // Navigate to the new account screen
    router.push('/new-account');
  };
  
  // Function to handle the transfer button press
  const handleTransferFunds = () => {
    // Navigate to the transfer funds screen
    router.push('/transfer-funds');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.titleContainer}>
        <View style={{ width: 40 }} />
        <Text style={[styles.title, { color: colors.text }]}>
          Accounts
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddAccount}>
          <Text style={[styles.addButtonText, { color: colors.text }]}>+</Text>
        </TouchableOpacity>
      </View>
      
      {/* Balance Box */}
      <View style={[styles.balanceBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.totalBalanceLabel, { color: colors.weakText }]}>Total Balance</Text>
        <View style={styles.balanceRow}>
          <Text style={[styles.totalBalanceAmount, { color: totalBalance >= 0 ? colors.text : '#F87171' }]}>{formatCurrency(totalBalance)}</Text>
          {hasPreviousMonthData && variationAmount >= 0 && (
            <Text style={[styles.variation, isPositive ? styles.positiveVariation : styles.negativeVariation]}>
              ({isPositive ? '+' : '-'}{formatCurrency(variationAmount)} last month)
            </Text>
          )}
        </View>
        {reservedForSavings > 0 && (
          <Text style={[styles.reservedForSavings, { color: colors.weakText }]}>
            Reserved for Savings: {formatCurrency(reservedForSavings)}
          </Text>
        )}
      </View>
      
      {/* Accounts List - Simplified without boxes and subtitles */}
      <View style={[styles.accountsListContainer, { backgroundColor: colors.background }]}>
        <FlatList
          data={state.accounts}
          renderItem={renderAccount}
          keyExtractor={(item) => item.id}
          scrollEnabled={true}
        />
      </View>
      
      {/* Transfer Button - Fixed position at bottom right */}
      <TouchableOpacity style={[styles.transferButton, { backgroundColor: colors.addButton }]} onPress={handleTransferFunds}>
        <Text style={styles.transferButtonText}>⇄</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  transferButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  transferButtonText: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceBox: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 1,
    alignItems: 'flex-start',
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  totalBalanceLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  totalBalanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  variation: {
    fontSize: 14,
    marginLeft: 10,
  },
  positiveVariation: {
    color: '#4ADE80',
  },
  negativeVariation: {
    color: '#F87171',
  },
  lastSynced: {
    fontSize: 14,
  },
  reservedForSavings: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 2,
  },
  accountsListContainer: {
    marginTop: 220,
    marginHorizontal: 20,
    flex: 1,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  accountInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountType: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '400',
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveBalance: {
    color: '#4ADE80',
  },
  negativeBalance: {
    color: '#F87171',
  },
  whiteBalance: {
    color: '#FFFFFF',
  },
});