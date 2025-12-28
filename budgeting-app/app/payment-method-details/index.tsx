import { StyleSheet, View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { useTheme } from '@/context/ThemeContext'; // Import useTheme hook
import { useCurrency } from '@/context/currency-context'; // Import useCurrency hook
import { Colors } from '@/constants/theme'; // Import Colors

export default function PaymentMethodDetailsScreen() {
  const router = useRouter();
  const { period, startDate, endDate } = useLocalSearchParams();
  const { state } = useBudget();
  const { theme } = useTheme(); // Use the theme context
  const { formatCurrency } = useCurrency(); // Use the currency context
  // Use dark theme colors regardless of theme setting
  const colors = Colors.dark; // Always use dark theme
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Auto-select the first account when the screen loads
  useEffect(() => {
    if (state.accounts.length > 0 && selectedAccountId === null) {
      setSelectedAccountId(state.accounts[0].id);
    }
  }, [state.accounts, selectedAccountId]);

  // Calculate spending per account based on selected period
  const accountSpending = useMemo(() => {
    const spending: Record<string, number> = {};
    
    // Initialize all accounts with 0 spending
    state.accounts.forEach(account => {
      spending[account.name] = 0;
    });
    
    // Filter transactions based on selected period
    let filteredTransactions = state.transactions;
    
    if (period) {
      const now = new Date();
      let periodStartDate, periodEndDate;
      
      switch (period) {
        case 'this-month':
          periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          periodEndDate.setHours(23, 59, 59, 999);
          break;
        case 'last-month':
          periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          periodEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
          periodEndDate.setHours(23, 59, 59, 999);
          break;
        case 'custom':
          if (startDate && endDate) {
            periodStartDate = new Date(startDate as string);
            periodEndDate = new Date(endDate as string);
            periodEndDate.setHours(23, 59, 59, 999);
          }
          break;
      }
      
      if (periodStartDate && periodEndDate) {
        filteredTransactions = state.transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= periodStartDate && transactionDate <= periodEndDate;
        });
      }
    }
    
    // Sum up expenses for each account
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'Expense') {
        if (spending[transaction.account]) {
          spending[transaction.account] += Math.abs(transaction.amount);
        } else {
          spending[transaction.account] = Math.abs(transaction.amount);
        }
      }
    });
    
    return spending;
  }, [state.accounts, state.transactions, period, startDate, endDate]);

  // Filter transactions for the selected account and period
  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    
    const selectedAccount = state.accounts.find(account => account.id === selectedAccountId);
    if (!selectedAccount) return [];
    
    console.log('Selected account:', selectedAccount);
    console.log('All transactions:', state.transactions);
    
    // Filter transactions based on selected period
    let filteredTransactions = state.transactions.filter(transaction => {
      // Log transaction account and selected account name for debugging
      console.log(`Transaction account: "${transaction.account}", Selected account name: "${selectedAccount.name}"`);
      console.log(`Match: ${transaction.account === selectedAccount.name}`);
      return transaction.account === selectedAccount.name;
    });
    
    console.log('Filtered transactions by account:', filteredTransactions);
    
    if (period) {
      const now = new Date();
      let periodStartDate, periodEndDate;
      
      switch (period) {
        case 'this-month':
          periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          periodEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          periodEndDate.setHours(23, 59, 59, 999);
          break;
        case 'last-month':
          periodStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          periodEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
          periodEndDate.setHours(23, 59, 59, 999);
          break;
        case 'custom':
          if (startDate && endDate) {
            periodStartDate = new Date(startDate as string);
            periodEndDate = new Date(endDate as string);
            periodEndDate.setHours(23, 59, 59, 999);
          }
          break;
      }
      
      if (periodStartDate && periodEndDate) {
        filteredTransactions = filteredTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= periodStartDate && transactionDate <= periodEndDate;
        });
      }
    }
    
    const sortedTransactions = filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    console.log('Final sorted transactions:', sortedTransactions);
    return sortedTransactions;
  }, [selectedAccountId, state.accounts, state.transactions, period, startDate, endDate]);

  // Render a single transaction item
  const renderTransactionItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.dateContainer, { backgroundColor: colors.border, borderColor: colors.border }]}>
          <Text style={[styles.dateMonth, { color: colors.weakText }]}>{new Date(item.date).toLocaleString('default', { month: 'short' }).substring(0, 3)}</Text>
          <Text style={[styles.dateDay, { color: colors.text }]}>{new Date(item.date).getDate()}</Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={[styles.transactionName, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.transactionCategory, { color: colors.weakText }]} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: item.type === 'Income' ? '#4ADE80' : '#F87171' }]}>
          {item.type === 'Income' ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
        </Text>
      </View>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Spending by Payment Method</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Horizontal scrolling payment methods list - fixed at top */}
      <View style={[styles.fixedPaymentMethodsContainer, { backgroundColor: colors.background }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {state.accounts.map((account) => (
            <TouchableOpacity 
              key={account.id} 
              style={[styles.paymentMethodCard, { 
                backgroundColor: selectedAccountId === account.id ? colors.addButton : colors.background,
                borderColor: selectedAccountId === account.id ? '#4F46E5' : colors.border,
                borderWidth: selectedAccountId === account.id ? 3 : 1,
              }]}
              onPress={() => setSelectedAccountId(account.id)}
            >
              <Text style={[styles.accountName, { color: selectedAccountId === account.id ? '#FFFFFF' : colors.text }]}>{account.name}</Text>
              <Text style={[styles.spendingAmount, { color: selectedAccountId === account.id ? '#E2E8F0' : colors.weakText }]}>{formatCurrency(accountSpending[account.name] || 0)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transactions title */}
      <View style={[styles.transactionsTitleContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.transactionsTitle, { color: colors.text }]}>Transactions</Text>
      </View>

      {/* Scrollable transactions list */}
      <View style={[styles.transactionsContainer, { backgroundColor: colors.background }]}>
        {selectedAccountId ? (
          filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.transactionsList}
            />
          ) : (
            <View style={styles.noTransactionsContainer}>
              <Text style={[styles.noTransactionsText, { color: colors.weakText }]}>
                No transactions found for this payment method
              </Text>
              <Text style={[styles.noTransactionsText, { color: colors.weakText, fontSize: 12, marginTop: 10 }]}>
                Account: {state.accounts.find(a => a.id === selectedAccountId)?.name || 'Unknown'}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.noSelectionContainer}>
            <Text style={[styles.noSelectionText, { color: colors.weakText }]}>Select a payment method to view transactions</Text>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 48,
  },
  fixedPaymentMethodsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 100,
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollView: {
    flexGrow: 0, // Prevent ScrollView from growing unnecessarily
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paymentMethodCard: {
    borderRadius: 16, // More rounded corners
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    minWidth: 110, // Slightly smaller minimum width
    borderWidth: 1,
    alignItems: 'center',
  },
  selectedPaymentMethodCard: {
    // backgroundColor: '#334155', // Darker background for selected card - moved to inline style
    // borderColor: '#4F46E5', // Purple border for selected card - moved to inline style
  },
  accountName: {
    fontSize: 14, // Slightly smaller font
    fontWeight: '600',
    marginBottom: 4, // Reduced margin
    textAlign: 'center',
  },
  selectedAccountName: {
    // color: '#4F46E5', // Purple color for selected account name - moved to inline style
  },
  spendingAmount: {
    fontSize: 12, // Even smaller font size for amounts
    fontWeight: '400', // Lighter font weight
  },
  selectedSpendingAmount: {
    // color: '#A5B4FC', // Light purple color for selected amount - moved to inline style
  },
  transactionsTitleContainer: {
    position: 'absolute',
    top: 177, // Moved down further
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  transactionsContainer: {
    flex: 1,
    marginTop: 145, // Adjusted to maintain proper spacing with the title at top: 177
    paddingHorizontal: 16,
  },
  transactionsList: {
    paddingBottom: 20,
    paddingTop: 0, // Remove top padding since we want it to start directly below the title
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    marginLeft: 5, // Move transaction icon slightly to the left
  },
  dateMonth: {
    fontSize: 10,
    textAlign: 'center',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    paddingLeft: 5, // Move transaction name slightly to the right
  },
  transactionCategory: {
    fontSize: 12,
    paddingLeft: 5,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flex: 1,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginRight: 10, // Move transaction amount to the right side
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 5,
  },
  incomeAmount: {
    // color: '#4ADE80', // Green for income - moved to inline style
  },
  expenseAmount: {
    // color: '#F87171', // Red for expenses - moved to inline style
  },
  noTransactionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '0%', // Use full height to ensure proper centering
  },
  noTransactionsText: {
    fontSize: 16,
  },
  noSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%', // Use full height to ensure proper centering
  },
  noSelectionText: {
    fontSize: 16,
  },
});