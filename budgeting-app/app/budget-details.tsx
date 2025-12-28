import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { ThemedView } from '@/components/themed-view';
import { useCurrency } from '@/context/currency-context';

export default function BudgetDetailsScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { formatCurrency } = useCurrency();
  const { category: categoryParam } = useLocalSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState(categoryParam as string || 'Groceries');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [period, setPeriod] = useState('this-month');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  
  // Budget targets for each category (mock data)
  const budgetTargets: Record<string, number> = {
    'Groceries': 400,
    'Gas': 200,
    'Entertainment': 150,
    'Dining Out': 300,
    'Shopping': 250,
    'Utilities': 300,
    'Rent': 1200,
    'Insurance': 150,
    'Healthcare': 200,
    'Education': 100,
    'Travel': 500,
    'Other': 200
  };

  // Get all transactions
  const transactions = state.transactions;

  // Filter transactions based on selected category, period, and date range
  useEffect(() => {
    let filtered = transactions.filter(t => t.category === selectedCategory);
    
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
    
    setFilteredTransactions(filtered);
  }, [transactions, selectedCategory, period, startDate, endDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      month: date.toLocaleString('default', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString()
    };
  };

  // const formatCurrency = (amount: number) => {
  //   return `-$${amount.toFixed(2)}`;
  // };

  // Calculate spending for the selected category
  const calculateCategorySpending = () => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const categorySpending = calculateCategorySpending();
  const budgetedAmount = budgetTargets[selectedCategory] || 0;
  const variance = categorySpending - budgetedAmount;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Budget Comparison</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Category Selector */}
      <View style={styles.categorySelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {Object.keys(budgetTargets).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category && styles.selectedCategoryButtonText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Budget Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.budgetCard}>
          <Text style={styles.budgetLabel}>Budgeted</Text>
          <Text style={styles.budgetAmount}>${budgetedAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.budgetCard}>
          <Text style={styles.budgetLabel}>Spent</Text>
          <Text style={styles.budgetAmount}>${categorySpending.toFixed(2)}</Text>
        </View>
        <View style={styles.budgetCard}>
          <Text style={styles.budgetLabel}>Variance</Text>
          <Text style={[
            styles.budgetAmount,
            variance >= 0 ? styles.overBudget : styles.underBudget
          ]}>
            ${Math.abs(variance).toFixed(2)} {variance >= 0 ? 'over' : 'under'}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'All' && styles.activeFilterTab]}
            onPress={() => setSelectedFilter('All')}
          >
            <Text style={[styles.filterText, selectedFilter === 'All' && styles.activeFilterText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'This Month' && styles.activeFilterTab]}
            onPress={() => setSelectedFilter('This Month')}
          >
            <Text style={[styles.filterText, selectedFilter === 'This Month' && styles.activeFilterText]}>This Month</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, selectedFilter === 'Last Month' && styles.activeFilterTab]}
            onPress={() => setSelectedFilter('Last Month')}
          >
            <Text style={[styles.filterText, selectedFilter === 'Last Month' && styles.activeFilterText]}>Last Month</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transactions Header */}
      <View style={styles.transactionsHeader}>
        <Text style={styles.transactionsTitle}>Transactions</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortText}>Sort by Date</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsContainer}>
        {filteredTransactions
          .filter(t => t.type === 'expense')
          .map((transaction) => {
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
                <Text style={styles.transactionAmount}>
                  {formatCurrency(transaction.amount)}
                </Text>
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
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#EAEAEA',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  placeholder: {
    width: 48,
  },
  categorySelector: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  categoryScroll: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  selectedCategoryButton: {
    backgroundColor: '#1e6469',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#A9A9A9',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#E2E8F0',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  budgetCard: {
    flex: 1,
    backgroundColor: 'rgba(234, 234, 234, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    color: '#A9A9A9',
    fontWeight: '500',
    marginBottom: 4,
  },
  budgetAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  overBudget: {
    color: '#FF7F50',
  },
  underBudget: {
    color: '#2ECC71',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(234, 234, 234, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#1e6469',
  },
  filterText: {
    fontSize: 14,
    color: '#A9A9A9',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#E2E8F0',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    color: '#1e6469',
    fontWeight: '500',
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 72,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: 'rgba(51, 225, 204, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e6469',
    textTransform: 'uppercase',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EAEAEA',
  },
  transactionInfo: {
    flexDirection: 'column',
  },
  transactionDescription: {
    fontSize: 16,
    color: '#EAEAEA',
    fontWeight: '500',
    marginBottom: 4,
    maxWidth: 200,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#A9A9A9',
    fontWeight: '400',
    maxWidth: 200,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF7F50',
  },
});