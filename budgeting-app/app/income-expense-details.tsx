import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { useCurrency } from '@/context/currency-context';

export default function IncomeExpenseDetailsScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { theme } = useTheme();
  const { formatCurrency } = useCurrency();
  
  // Use dark theme colors regardless of theme setting
  const colors = {
    background: Colors.dark.background,
    cardBackground: Colors.dark.cardBackground,
    text: Colors.dark.text,
    weakText: Colors.dark.weakText,
    border: Colors.dark.border,
    tabBackground: Colors.dark.tabBackground,
    tabBorder: Colors.dark.tabBorder,
    addButton: Colors.dark.addButton,
    progressBarBackground: Colors.dark.progressBar,
    activeTabText: Colors.dark.activeTab,
    inactiveTabText: Colors.dark.inactiveTab,
    tabIndicator: Colors.dark.tabIndicator,
  };
  
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [period, setPeriod] = useState('this-month');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  
  // Get all transactions
  const transactions = state.transactions;

  // Filter transactions based on selected filter, period, and date range
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply period filter (but not the type filter for totals calculation)
    const now = new Date();
    if (period === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      // Set end of day for endOfMonth
      endOfMonth.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });
    } else if (period === 'last-month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      // Set end of day for endOfLastMonth
      endOfLastMonth.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
      });
    } else if (period === 'custom' && startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      // Set end of day for end date
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= start && transactionDate <= end;
      });
    }
    
    // Store filtered transactions for display (apply type filter here)
    let displayFiltered = [...filtered];
    
    // Apply type filter only for display
    if (selectedFilter === 'Income') {
      displayFiltered = displayFiltered.filter(t => t.type === 'Income');
    } else if (selectedFilter === 'Expenses') {
      displayFiltered = displayFiltered.filter(t => t.type === 'Expense');
    }
    
    setFilteredTransactions(displayFiltered);
    
    // Calculate income and expense totals based on ALL transactions in the date range (not filtered by type)
    const income = filtered
      .filter(t => t.type === 'Income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = filtered
      .filter(t => t.type === 'Expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    setTotalIncome(income);
    setTotalExpense(expense);
  }, [transactions, selectedFilter, period, startDate, endDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    // Format month with proper capitalization (first letter uppercase, rest lowercase)
    const month = date.toLocaleString('default', { month: 'short' });
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    return {
      month: formattedMonth,
      day: date.getDate().toString()
    };
  };

  // const formatCurrency = (amount: number, type: 'income' | 'expense') => {
  //   return `${type === 'income' ? '+' : '-'}$${amount.toFixed(2)}`;
  // };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, styles.fixedHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Income vs. Expense</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Cards - Fixed at the top */}
      <View style={[styles.summaryContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.topSummaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.weakText }]}>Total Income</Text>
            <Text style={[styles.summaryIncomeAmount, { color: '#4ADE80' }]}>{formatCurrency(totalIncome)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.weakText }]}>Total Expense</Text>
            <Text style={[styles.summaryExpenseAmount, { color: '#F87171' }]}>{formatCurrency(Math.abs(totalExpense))}</Text>
          </View>
        </View>
        <View style={styles.bottomSummaryRow}>
          <View style={[styles.summaryCard, styles.balanceCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.weakText }]}>Net Balance</Text>
            <Text style={[
              styles.summaryBalanceAmount,
              (totalIncome - totalExpense) >= 0 ? styles.positiveBalance : styles.negativeBalance,
              { color: (totalIncome - totalExpense) >= 0 ? '#4ADE80' : '#F87171' }
            ]}>
              {formatCurrency(Math.abs(totalIncome - totalExpense))}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs - Fixed below summary */}
      <View style={[styles.fixedFilterContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.filterTabs, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'All' && styles.activeFilterTab, selectedFilter === 'All' && { backgroundColor: colors.addButton }]}
            onPress={() => setSelectedFilter('All')}
          >
            <Text style={[styles.filterText, selectedFilter === 'All' && styles.activeFilterText, { color: selectedFilter === 'All' ? '#FFFFFF' : colors.weakText }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'Income' && styles.activeFilterTab, selectedFilter === 'Income' && { backgroundColor: colors.addButton }]}
            onPress={() => setSelectedFilter('Income')}
          >
            <Text style={[styles.filterText, selectedFilter === 'Income' && styles.activeFilterText, { color: selectedFilter === 'Income' ? '#FFFFFF' : colors.weakText }]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'Expenses' && styles.activeFilterTab, selectedFilter === 'Expenses' && { backgroundColor: colors.addButton }]}
            onPress={() => setSelectedFilter('Expenses')}
          >
            <Text style={[styles.filterText, selectedFilter === 'Expenses' && styles.activeFilterText, { color: selectedFilter === 'Expenses' ? '#FFFFFF' : colors.weakText }]}>Expenses</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions Header - Fixed below filter options */}
      <View style={[styles.fixedTransactionsHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.transactionsTitle, { color: colors.text }]}>Transactions</Text>
      </View>

      <ScrollView style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        {/* Transactions List */}
        {filteredTransactions.map((transaction) => {
          const { month, day } = formatDate(transaction.date);
          return (
            <View key={transaction.id} style={[styles.transactionItem, { backgroundColor: colors.background }]}>
              <View style={styles.transactionLeft}>
                <View style={[styles.dateContainer, { backgroundColor: colors.border, borderColor: colors.border }]}>
                  <Text style={[styles.dateMonth, { color: colors.weakText }]}>{month}</Text>
                  <Text style={[styles.dateDay, { color: colors.text }]}>{day}</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionDescription, { color: colors.text }]} numberOfLines={1}>
                    {transaction.name}
                  </Text>
                  <Text style={[styles.transactionCategory, { color: colors.weakText }]} numberOfLines={1}>
                    {transaction.type === 'Income' ? transaction.account : transaction.category}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionAmountContainer}>
                <Text style={[styles.transactionAmount, transaction.type === 'Income' ? styles.incomeAmount : styles.expenseAmount, { color: transaction.type === 'Income' ? '#4ADE80' : '#F87171' }]}>
                  {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    paddingVertical: 8,
    // borderBottomWidth: 1,  // Removed border line below main title
    // borderBottomColor: colors.border,  // Removed border line below main title
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
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
  summaryContainer: {
    padding: 16,
    borderBottomWidth: 1,
    position: 'absolute',
    top: 50, // Adjusted for smaller header height
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fixedFilterContainer: {
    position: 'absolute',
    top: 250, // Position below Net Balance box
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  fixedTransactionsHeader: {
    position: 'absolute',
    top: 310, // Position below filter container
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    // borderBottomWidth: 1,  // Removed border line below transaction title
  },
  contentContainer: {
    flex: 1,
    marginTop: 370,
  },
  topSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Center the boxes
    marginBottom: 0, // Keep minimal spacing
    paddingHorizontal: 20, // Add some padding
  },
  bottomSummaryRow: {
    alignItems: 'center',
    marginTop: 4, // Keep minimal spacing
  },
  summaryCard: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 110,
    minHeight: 60,
  },
  incomeCard: {
    flex: 1, // Make it flexible
    minWidth: 140, // Increase minimum width
    minHeight: 80, // Increase minimum height
    paddingHorizontal: 20, // Increase padding
    paddingVertical: 15, // Increase padding
    marginHorizontal: 2, // Add small margin to create space between boxes
    borderTopRightRadius: 20, // Restore border radius
    borderBottomRightRadius: 20, // Restore border radius
    borderRightWidth: 1, // Restore full border
  },
  expenseCard: {
    flex: 1, // Make it flexible
    minWidth: 140, // Increase minimum width
    minHeight: 80, // Increase minimum height
    paddingHorizontal: 20, // Increase padding
    paddingVertical: 15, // Increase padding
    marginHorizontal: 2, // Add small margin to create space between boxes
    borderTopLeftRadius: 20, // Restore border radius
    borderBottomLeftRadius: 20, // Restore border radius
    borderLeftWidth: 1, // Restore full border
  },
  balanceCard: {
    width: '90%', // Increase width to be closer to the combined width of top boxes
    alignItems: 'center',
    minHeight: 70,
    borderRadius: 20,
    paddingHorizontal: 20, // Increase padding
    paddingVertical: 15, // Increase padding
    marginTop: 0, // Keep minimal spacing
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 14, // Increased from 11
    fontWeight: '600',
    marginBottom: 6, // Increased from 4
    textAlign: 'center',
  },
  incomeAmount: {
    textAlign: 'center',
  },
  expenseAmount: {
    textAlign: 'center',
  },
  balanceAmount: {
    textAlign: 'center',
  },
  summaryIncomeAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryExpenseAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  summaryBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  positiveBalance: {
    // color: '#4ADE80', // Green for positive balance - moved to inline style
  },
  negativeBalance: {
    // color: '#F87171', // Red for negative balance - moved to inline style
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    // backgroundColor: '#1e6469', // Moved to inline style
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    // color: '#FFFFFF', // Moved to inline style
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
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
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    maxWidth: 200,
  },
  transactionCategory: {
    fontSize: 12,
    maxWidth: 200,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});
