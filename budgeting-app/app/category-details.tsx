import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { ThemedView } from '@/components/themed-view';
import { useCurrency } from '@/context/currency-context';
import { Colors } from '@/constants/theme'; // Import Colors
import React, { useEffect, useState } from 'react';

export default function CategoryDetailsScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { formatCurrency } = useCurrency(); // Add this line
  const { period: periodParam, startDate: startDateParam, endDate: endDateParam } = useLocalSearchParams();
  
  // Convert array parameters to strings if needed
  const periodStr = Array.isArray(periodParam) ? periodParam[0] : periodParam;
  const startDateStr = Array.isArray(startDateParam) ? startDateParam[0] : startDateParam;
  const endDateStr = Array.isArray(endDateParam) ? endDateParam[0] : endDateParam;
  
  // Use dark theme colors
  const colors = Colors.dark;
  
  const [categorySummaries, setCategorySummaries] = useState<any[]>([]);
  
  console.log('CategoryDetailsScreen params:', { periodStr, startDateStr, endDateStr });

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDateParam, endDateParam;

    console.log('=== DEBUG CATEGORY DETAILS SCREEN ===');
    console.log('Raw params received:', { period: periodStr, startDate: startDateStr, endDate: endDateStr });
    console.log('Period type:', typeof periodStr);
    console.log('StartDate type:', typeof startDateStr);
    console.log('EndDate type:', typeof endDateStr);

    switch (periodStr) {
      case 'this-month':
        startDateParam = new Date(now.getFullYear(), now.getMonth(), 1);
        endDateParam = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Set end time to end of day
        endDateParam.setHours(23, 59, 59, 999);
        break;
      case 'last-month':
        startDateParam = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDateParam = new Date(now.getFullYear(), now.getMonth(), 0);
        // Set end time to end of day
        endDateParam.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (startDateStr && endDateStr) {
          console.log('Processing custom dates:', startDateStr, endDateStr);
          // Ensure the date strings are in a format that Date constructor can parse
          const startDateFormatted = String(startDateStr).includes('-') && String(startDateStr).split('-').length === 3 
            ? startDateStr 
            : new Date(String(startDateStr)).toISOString().split('T')[0];
          const endDateFormatted = String(endDateStr).includes('-') && String(endDateStr).split('-').length === 3 
            ? endDateStr 
            : new Date(String(endDateStr)).toISOString().split('T')[0];
          
          startDateParam = new Date(startDateFormatted);
          endDateParam = new Date(endDateFormatted);
          console.log('Parsed custom dates:', startDateParam, endDateParam);
          // Set end time to end of day
          endDateParam.setHours(23, 59, 59, 999);
        } else {
          // Fallback to this month if custom dates are not provided
          startDateParam = new Date(now.getFullYear(), now.getMonth(), 1);
          endDateParam = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          // Set end time to end of day
          endDateParam.setHours(23, 59, 59, 999);
        }
        break;
      default:
        console.log('Using default date range (this month)');
        startDateParam = new Date(now.getFullYear(), now.getMonth(), 1);
        endDateParam = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Set end time to end of day
        endDateParam.setHours(23, 59, 59, 999);
    }

    console.log('Final calculated date range - start:', startDateParam, 'end:', endDateParam);
    return { startDate: startDateParam, endDate: endDateParam };
  };

  // Calculate category summaries with the same logic as the pie chart
  useEffect(() => {
    try {
      const { startDate: startDateParam, endDate: endDateParam } = getDateRange();
      
      console.log('Filtering transactions by date range:', startDateParam, 'to', endDateParam);
      
      // Filter transactions by date range
      const filteredTransactions = state.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const isInDateRange = transactionDate >= startDateParam && transactionDate <= endDateParam;
        console.log('Transaction date:', transactionDate, 'is in range:', isInDateRange);
        return isInDateRange;
      });
      
      console.log('Filtered transactions count:', filteredTransactions.length);
      
      // Group transactions by category and calculate totals
      const categoryMap: Record<string, { total: number; count: number }> = {};
      
      filteredTransactions.forEach(transaction => {
        if (!categoryMap[transaction.category]) {
          categoryMap[transaction.category] = { total: 0, count: 0 };
        }
        categoryMap[transaction.category].total += transaction.amount;
        categoryMap[transaction.category].count += 1;
      });
      
      // Convert to array and sort by total spent (descending)
      // For display, we want to show absolute values without negative signs
      const categoryArray = Object.entries(categoryMap)
        .map(([categoryName, data]) => ({
          name: categoryName,
          totalSpent: Math.abs(data.total), // Use absolute value for display
          transactionCount: data.count,
          percentage: 0 // Will calculate later
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent);
      
      // Calculate total spending for percentage calculation (use absolute values)
      const totalSpending = categoryArray.reduce((sum, category) => sum + category.totalSpent, 0);
      
      console.log('Total spending:', totalSpending);
      console.log('Category array:', categoryArray);
      
      // If no spending, set empty array
      if (totalSpending === 0) {
        setCategorySummaries([]);
        return;
      }
      
      // Update percentages
      categoryArray.forEach(category => {
        category.percentage = parseFloat(((category.totalSpent / totalSpending) * 100).toFixed(1));
      });
      
      // Show all categories individually in the details screen
      setCategorySummaries(categoryArray);
    } catch (error) {
      console.error('Error calculating category summaries:', error);
      // Fallback to empty array
      setCategorySummaries([]);
    }
  }, [periodStr, startDateStr, endDateStr]);

  // Calculate total spending across all displayed categories
  const totalSpending = categorySummaries.reduce((total, category) => total + category.totalSpent, 0);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, styles.fixedHeader, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Spending by Category</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Summary Box - Fixed below header */}
      <View style={[styles.summaryBox, styles.fixedSummary, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.weakText }]}>Total Spending</Text>
        <Text style={[styles.summaryAmount, { color: colors.text }]}>{formatCurrency(totalSpending)}</Text>
      </View>

      {/* Category List - Scrollable content */}
      <ScrollView style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        {categorySummaries.map((category, index) => (
          <TouchableOpacity 
            key={category.name}
            style={styles.categoryItem}
            onPress={() => {
              console.log('Navigating to spending category details with:', {
                categoryName: category.name,
                fromCategoryReport: 'true',
                period: periodStr,
                startDate: startDateStr,
                endDate: endDateStr
              });
              router.push({
                pathname: '/spending-category-details',
                params: { 
                  categoryName: category.name,
                  fromCategoryReport: 'true',
                  period: periodStr,
                  startDate: startDateStr,
                  endDate: endDateStr
                }
              });
            }}
          >
            <View style={styles.categoryLeft}>
              {/* Circular percentage icon with number on top and % below */}
              <View style={[styles.percentageCircle, { borderColor: colors.border }]}>
                <View style={styles.percentageContainer}>
                  <Text style={[styles.percentageNumber, { color: colors.text }]}>{category.percentage}</Text>
                  <Text style={[styles.percentageSymbol, { color: colors.weakText }]}>%</Text>
                </View>
              </View>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
            </View>
            <View style={styles.categoryRight}>
              <Text style={[styles.categoryAmount, { color: colors.text }]}>
                {category.totalSpent <= 0 ? '-' : ''}{formatCurrency(category.totalSpent)}
              </Text>
              <Text style={[styles.arrowIcon, { color: colors.weakText }]}>{'>'}</Text>
            </View>
          </TouchableOpacity>
        ))}
        
        {/* Show message when no data is available */}
        {categorySummaries.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateText, { color: colors.weakText }]}>No spending data available for the selected period</Text>
          </View>
        )}
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
    // borderBottomWidth: 1,  // Removed line below main title
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
  fixedSummary: {
    position: 'absolute',
    top: 70, // Increased space below the header
    left: 20,
    right: 20,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    marginTop: 175, // Increased from 150 to 170 to add more space below the summary box
    padding: 20,
  },
  summaryBox: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  categoryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryPercentage: {
    fontSize: 14,
    marginLeft: 8,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  arrowIcon: {
    fontSize: 16,
  },
  percentageIcon: {
    // This style will be overridden inline, but we define it to avoid TS errors
  },
  percentageText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  percentageContainer: {
    alignItems: 'center',
  },
  percentageNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  percentageSymbol: {
    fontSize: 10,
    marginTop: -2,
  },
  dateContainer: {
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  dateDay: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateMonth: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 80,
  },
  percentageCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
});