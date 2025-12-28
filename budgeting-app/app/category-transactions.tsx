import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { useCurrency } from '@/context/currency-context';

export default function CategoryTransactionsScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { formatCurrency } = useCurrency();
  const { categoryName, period, startDate, endDate } = useLocalSearchParams();
  
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [totalSpending, setTotalSpending] = useState(0);
  
  // Get all transactions
  const transactions = state.transactions.filter(t => t.category === categoryName);

  // Filter transactions based on period and date range
  useEffect(() => {
    let filtered = [...transactions];
    
    // Apply period filter
    if (period === 'this-month') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });
    } else if (period === 'last-month') {
      const now = new Date();
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
      });
    } else if (period === 'custom' && startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= start && transactionDate <= end;
      });
    }
    
    // Sort transactions from newest to oldest
    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    setFilteredTransactions(filtered);
    
    // Calculate total spending for this category
    const spending = filtered.reduce((sum, t) => sum + t.amount, 0);
    setTotalSpending(spending);
  }, [transactions, categoryName, period, startDate, endDate]);

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

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, styles.fixedHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{categoryName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Card - Fixed at the top */}
      <View style={[styles.summaryContainer, styles.fixedSummary]}>
        <View style={[styles.summaryCard, styles.spendingCard]}>
          <Text style={styles.summaryLabel}>Total Spending</Text>
          <Text style={styles.spendingAmount}>${totalSpending.toFixed(2)}</Text>
        </View>
      </View>

      {/* Transactions Title - Fixed below summary */}
      <View style={[styles.transactionsTitleContainer, styles.fixedTransactionsTitle]}>
        <Text style={styles.transactionsTitle}>Transactions</Text>
      </View>

      {/* Transactions List - Scrollable content starts below fixed elements */}
      <ScrollView style={styles.contentContainer}>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => {
            const { month, day } = formatDate(transaction.date);
            return (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateMonth}>{month}</Text>
                    <Text style={styles.dateDay}>{day}</Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionCategory} numberOfLines={1}>
                      {transaction.category}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, styles.expenseAmount]}>
                  {formatCurrency(transaction.amount, transaction.type)}
                </Text>
              </View>
            );
          })
        ) : (
          // Example transactions when no real data is available
          <>
            <View style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateMonth}>Nov</Text>
                  <Text style={styles.dateDay}>15</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    Sample Transaction 1
                  </Text>
                  <Text style={styles.transactionCategory} numberOfLines={1}>
                    {categoryName}
                  </Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, styles.expenseAmount]}>
                -$50.00
              </Text>
            </View>
            <View style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateMonth}>Nov</Text>
                  <Text style={styles.dateDay}>12</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    Sample Transaction 2
                  </Text>
                  <Text style={styles.transactionCategory} numberOfLines={1}>
                    {categoryName}
                  </Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, styles.expenseAmount]}>
                -$25.00
              </Text>
            </View>
            <View style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateMonth}>Nov</Text>
                  <Text style={styles.dateDay}>10</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    Sample Transaction 3
                  </Text>
                  <Text style={styles.transactionCategory} numberOfLines={1}>
                    {categoryName}
                  </Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, styles.expenseAmount]}>
                -$75.00
              </Text>
            </View>
            <View style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateMonth}>Nov</Text>
                  <Text style={styles.dateDay}>5</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDescription} numberOfLines={1}>
                    Sample Transaction 4
                  </Text>
                  <Text style={styles.transactionCategory} numberOfLines={1}>
                    {categoryName}
                  </Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, styles.expenseAmount]}>
                -$30.00
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2543', // Match dashboard background color
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1D2543',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
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
    fontSize: 24,
    color: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  placeholder: {
    width: 48,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: '#1D2543',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    position: 'absolute',
    top: 50, // Adjusted for smaller header height
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fixedSummary: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  summaryCard: {
    backgroundColor: '#1E293B', // Match non-selected option button background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155', // Match non-selected option button border
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
  spendingCard: {
    backgroundColor: '#1E293B', // Match non-selected option button background
    borderWidth: 1,
    borderColor: '#334155', // Match non-selected option button border
    width: '100%', // Full width for single card
    alignItems: 'center',
    minHeight: 70,
    borderRadius: 20,
    paddingHorizontal: 20, // Increase padding
    paddingVertical: 15, // Increase padding
  },
  summaryLabel: {
    fontSize: 14, // Increased from 11
    color: '#CBD5E1', // Match option button text color
    fontWeight: '600',
    marginBottom: 6, // Increased from 4
    textAlign: 'center',
  },
  spendingAmount: {
    fontSize: 20, // Increased from 16
    fontWeight: 'bold',
    color: '#F87171', // Red color for expenses
    textAlign: 'center',
  },
  transactionsTitleContainer: {
    backgroundColor: '#1D2543',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  fixedTransactionsTitle: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  contentContainer: {
    flex: 1,
    marginTop: 200, // Adjusted to account for header, summary, and transactions title
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
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginRight: 12,
  },
  dateMonth: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
    maxWidth: 200,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#94A3B8',
    maxWidth: 200,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  expenseAmount: {
    color: '#F87171', // Red color for expenses
  },
});