import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { useCurrency } from '@/context/currency-context'; // Add this import
import { Colors } from '@/constants/theme';

export default function SpendingCategoryDetailsScreen() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const { formatCurrency } = useCurrency(); // Add this line
  const { categoryName: categoryNameParam, period: periodParam, startDate: startDateParam, endDate: endDateParam, fromCategoryReport: fromCategoryReportParam } = useLocalSearchParams();
  
  // Convert array parameters to strings if needed
  const categoryNameStr = Array.isArray(categoryNameParam) ? categoryNameParam[0] : categoryNameParam;
  const periodStr = Array.isArray(periodParam) ? periodParam[0] : periodParam;
  const startDateStr = Array.isArray(startDateParam) ? startDateParam[0] : startDateParam;
  const endDateStr = Array.isArray(endDateParam) ? endDateParam[0] : endDateParam;
  const fromCategoryReportStr = Array.isArray(fromCategoryReportParam) ? fromCategoryReportParam[0] : fromCategoryReportParam;
  
  const [category, setCategory] = useState<any>(null);
  const [categoryTransactions, setCategoryTransactions] = useState<any[]>([]);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  
  // Use dark theme colors
  const colors = Colors.dark;
  
  console.log('SpendingCategoryDetailsScreen params:', { categoryNameStr, periodStr, startDateStr, endDateStr, fromCategoryReportStr });

  // Find the selected spending category
  useEffect(() => {
    console.log('Received categoryName parameter:', categoryNameStr);
    console.log('Available spending categories:', state.spendingCategories);

    if (categoryNameStr) {
      // Search through all spending category groups (original behavior)
      let foundCategory = null;
      
      for (const group in state.spendingCategories) {
        console.log(`Checking group: ${group}`);
        const categoryInGroup = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
          (cat: any) => {
            const match = cat.name === categoryNameStr;
            console.log(`Comparing "${cat.name}" with "${categoryNameStr}" - Match: ${match}`);
            return match;
          }
        );
        
        if (categoryInGroup) {
          foundCategory = categoryInGroup;
          console.log(`Found category in group ${group}:`, foundCategory);
          break;
        }
      }
      
      // If not found in spending categories, create a basic category for transaction-only view
      if (!foundCategory) {
        console.log('Category not found in spending categories, creating basic category');
        // Try to find the category in all groups again, more thoroughly
        let actualTarget = 0;
        let actualDate = '';
        
        for (const group in state.spendingCategories) {
          const categoryInGroup = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
            (cat: any) => cat.name === categoryNameStr
          );
          
          if (categoryInGroup) {
            actualTarget = categoryInGroup.target || 0;
            actualDate = categoryInGroup.date || '';
            console.log(`Found category target in group ${group}: target=${actualTarget}, date=${actualDate}`);
            break;
          }
        }
        
        setCategory({
          name: categoryNameStr,
          target: actualTarget,
          date: actualDate,
          spent: 0
        });
      } else {
        console.log('Final found category:', foundCategory);
        setCategory(foundCategory);
      }
    }
  }, [categoryNameStr, state.spendingCategories]);

  // Calculate spent amount for the selected period and get transactions
  useEffect(() => {
    if (categoryNameStr) {
      console.log('Fetching transactions for category:', categoryNameStr);
      console.log('Period params:', { period: periodStr, startDate: startDateStr, endDate: endDateStr });
      
      // Get date range if period parameters are provided, otherwise use current month
      let filteredTransactions = state.transactions;
      
      // Use the periodStr if it exists, otherwise default to 'this-month'
      const effectivePeriod = periodStr || 'this-month';
      
      if (effectivePeriod) {
        const { startDate: calcStartDate, endDate: calcEndDate } = getDateRange();
        console.log('Filtering transactions by date range:', calcStartDate, 'to', calcEndDate);
        filteredTransactions = filteredTransactions.filter((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          const isInDateRange = transactionDate >= calcStartDate && transactionDate <= calcEndDate;
          console.log('Transaction date:', transactionDate, 'is in range:', isInDateRange);
          return isInDateRange;
        });
      } else {
        // Filter by current month when no period is specified
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        
        console.log('Filtering by current month:', currentYear, currentMonth);
        filteredTransactions = filteredTransactions.filter((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          const isCurrentMonth = transactionDate.getFullYear() === currentYear && transactionDate.getMonth() === currentMonth;
          console.log('Transaction date:', transactionDate, 'is current month:', isCurrentMonth);
          return isCurrentMonth;
        });
      }
      
      console.log('Transactions after date filtering:', filteredTransactions.length);
      
      // Calculate spent amount for the selected period
      const periodSpent = filteredTransactions
        .filter((transaction: any) => transaction.category === categoryNameStr && transaction.type.toLowerCase() === 'expense')
        .reduce((sum: number, transaction: any) => sum + Math.abs(transaction.amount), 0);
        
      // Find the actual category target from spending categories
      let actualCategoryTarget = 0;
      let actualCategoryDate = '';
      if (categoryNameStr) {
        // Search through all spending category groups to find the actual category
        for (const group in state.spendingCategories) {
          const categoryInGroup = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
            (cat: any) => cat.name === categoryNameStr
          );
          
          if (categoryInGroup) {
            actualCategoryTarget = categoryInGroup.target || 0;
            actualCategoryDate = categoryInGroup.date || '';
            break;
          }
        }
      }
        
      // Update category with period-specific spent amount
      if (category) {
        setCategory({
          ...category,
          spent: periodSpent
        });
      } else if (!category && categoryNameStr) {
        // Create a temporary category if it doesn't exist, but use the actual target value
        setCategory({
          name: categoryNameStr,
          target: actualCategoryTarget,
          date: actualCategoryDate,
          spent: periodSpent
        });
      }
      
      const categoryFilteredTransactions = filteredTransactions
        .filter((transaction: any) => {
          const isCorrectCategory = transaction.category === categoryNameStr;
          const isExpense = transaction.type.toLowerCase() === 'expense';
          console.log('Transaction category:', transaction.category, 'matches:', isCorrectCategory);
          console.log('Transaction type:', transaction.type, 'is expense:', isExpense);
          return isCorrectCategory && isExpense;
        });
        
      console.log('Transactions after category filtering:', categoryFilteredTransactions.length);
      
      const transactions = categoryFilteredTransactions
        .map((transaction: any) => ({
          ...transaction,
          day: new Date(transaction.date).getDate().toString().padStart(2, '0'),
          month: new Date(transaction.date).toLocaleString('default', { month: 'short' }),
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('Final transactions count:', transactions.length);
      setCategoryTransactions(transactions);
    }
  }, [categoryNameStr, state.transactions, periodStr, startDateStr, endDateStr, category, state.spendingCategories]);

  // Format currency to show decimals only when needed - REPLACE THIS FUNCTION
  // const formatCurrency = (amount: number) => {
  //   if (amount === undefined || amount === null) return '$0.00';
  //   return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
  // };

  // Function to format category date - simplified version
  const formatCategoryDate = (dateString: string): string => {
    // For monthly categories in "Monthly on X" format, convert to "MMM X" format
    if (dateString && dateString.startsWith('Monthly on ')) {
      // Extract the day part (e.g., "7" from "Monthly on 7")
      const day = parseInt(dateString.replace('Monthly on ', ''), 10);
      
      // Get today's date
      const today = new Date();
      const todayDate = today.getDate();
      
      // If the target day has already passed this month, use next month
      let targetMonth, targetYear;
      if (day <= todayDate) {
        // Use next month
        targetMonth = today.getMonth() + 1;
        targetYear = today.getFullYear();
        // Handle December -> January
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear++;
        }
      } else {
        // Use current month
        targetMonth = today.getMonth();
        targetYear = today.getFullYear();
      }
      
      // Create date object for target month
      const targetDate = new Date(targetYear, targetMonth, day);
      
      // Get the month abbreviation
      const monthAbbrev = targetDate.toLocaleString('default', { month: 'short' });
      
      // Format as "Nov 7" (month abbreviation and day)
      return `${monthAbbrev} ${day}`;
    }
    // For weekly categories in "Weekly on Day" format
    else if (dateString && dateString.startsWith('Weekly on ')) {
      // Extract just the day part (e.g., "Mon" from "Weekly on Mon")
      const day = dateString.replace('Weekly on ', '');
      
      // Get the next occurrence of this day
      const nextDate = getNextDayOccurrence(day);
      
      // Format as "Mon 24" (day name and actual next occurrence date)
      return `${day} ${nextDate.getDate()}`;
    }
    // For date formats like "Nov 13" (created by modal)
    else if (dateString && dateString.includes(' ')) {
      // This is a date in "Nov 13" format
      // We need to extract the day and calculate the next occurrence
      const parts = dateString.split(' ');
      if (parts.length === 2) {
        const monthAbbrev = parts[0];
        const day = parseInt(parts[1], 10);
        
        // Get today's date
        const today = new Date();
        const todayDate = today.getDate();
        
        // If the target day has already passed this month, use next month
        let targetMonth, targetYear;
        if (day <= todayDate) {
          // Use next month
          targetMonth = today.getMonth() + 1;
          targetYear = today.getFullYear();
          // Handle December -> January
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear++;
          }
        } else {
          // Use current month
          targetMonth = today.getMonth();
          targetYear = today.getFullYear();
        }
        
        // Create date object for target month
        const targetDate = new Date(targetYear, targetMonth, day);
        
        // Get the month abbreviation
        const newMonthAbbrev = targetDate.toLocaleString('default', { month: 'short' });
        
        // Format as "Nov 7" (month abbreviation and day)
        return `${newMonthAbbrev} ${day}`;
      }
      return dateString;
    }
    // For all other date formats, return as is
    return dateString;
  };

  // Function to get the next occurrence of a specific day of the week
  const getNextDayOccurrence = (day: string): Date => {
    const daysMap: { [key: string]: number } = {
      'Sun': 0,
      'Mon': 1,
      'Tue': 2,
      'Wed': 3,
      'Thu': 4,
      'Fri': 5,
      'Sat': 6
    };
    
    const today = new Date();
    const todayDay = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const targetDay = daysMap[day];
    
    // Calculate days until next occurrence
    let daysUntil = targetDay - todayDay;
    
    // If the day has already passed this week or is today, add 7 days to get next week
    if (daysUntil <= 0) {
      daysUntil += 7;
    }
    
    // Create new date with the next occurrence
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    
    return nextDate;
  };

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let start, end;

    console.log('=== DEBUG SPENDING CATEGORY DETAILS SCREEN ===');
    console.log('Raw params received:', { period: periodStr, startDate: startDateStr, endDate: endDateStr });

    // Use the periodStr if it exists, otherwise default to 'this-month'
    const effectivePeriod = periodStr || 'this-month';

    switch (effectivePeriod) {
      case 'this-month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Set end time to end of day
        end.setHours(23, 59, 59, 999);
        break;
      case 'last-month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        // Set end time to end of day
        end.setHours(23, 59, 59, 999);
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
          
          start = new Date(startDateFormatted);
          end = new Date(endDateFormatted);
          console.log('Parsed custom dates:', start, end);
          // Set end time to end of day
          end.setHours(23, 59, 59, 999);
        } else {
          // Fallback to this month if custom dates are not provided
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          // Set end time to end of day
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        console.log('Using default date range (this month)');
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Set end time to end of day
        end.setHours(23, 59, 59, 999);
    }

    console.log('Final calculated date range - start:', start, 'end:', end);
    return { startDate: start, endDate: end };
  };

  // Handle edit action
  const handleEdit = () => {
    // Navigate to edit screen - only if not from category report
    if (category && !fromCategoryReportStr) {
      router.push({
        pathname: '/edit-spending-category',
        params: { 
          categoryName: category.name,
          categoryGroup: getCategoryGroup(category.name)
        }
      });
    }
  };

  // Helper function to find which group a category belongs to
  const getCategoryGroup = (categoryName: string) => {
    if (!categoryName) return 'Bills'; // Default group
    
    for (const group in state.spendingCategories) {
      const categoryInGroup = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
        (cat: any) => cat.name === categoryName
      );
      if (categoryInGroup) {
        return group;
      }
    }
    return 'Bills'; // Default group
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    console.log('Delete confirmed');
    // Implement delete logic here
    console.log('Delete category:', categoryNameStr);
    
    // Dispatch action to delete the spending category
    if (categoryNameStr) {
      dispatch({
        type: 'DELETE_SPENDING_CATEGORY',
        categoryName: categoryNameStr
      });
      
      // Navigate back after deletion
      router.back();
    }
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  // Handle delete action (show confirmation) - only if not from category report
  const handleDelete = () => {
    if (!fromCategoryReportStr) {
      setShowDeleteConfirmation(true);
    }
  };

  // Calculate progress
  const spent = category ? (category.spent || 0) : 0;
  // For weekly categories, convert target to monthly equivalent for calculations
  const isWeekly = category && category.date && category.date.startsWith('Weekly on ');
  const weeklyTarget = category ? (category.target || 0) : 0;
  const target = category ? (isWeekly && weeklyTarget ? weeklyTarget * 4.33 : (category.target || 0)) : 0;
  const progress = target > 0 ? (spent / target) * 100 : 0;
  
  // Determine progress bar colors to match dashboard
  let progressBarColor = '#4ADE80'; // Green (0-89.99%)
  if (progress >= 90 && progress < 100) {
    progressBarColor = '#F59E0B'; // Orange (90-99.99%)
  } else if (progress >= 100) {
    progressBarColor = '#F87171'; // Red (100%+)
  }
  
  // Determine status text color to match dashboard
  let statusTextColor = '#4ADE80'; // Green
  if (progress >= 90 && progress < 100) {
    statusTextColor = '#F59E0B'; // Orange
  } else if (progress >= 100) {
    statusTextColor = '#F87171'; // Red
  }
  
  // Determine status based on whether target is achieved
  const displayStatus = spent >= target && target > 0 ? 'Over Budget' : 'Under Budget';

  if (!category) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: colors.text }]}>Category Not Found</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
        <View style={[styles.contentContainer, { backgroundColor: colors.background, marginBottom: 20 }]}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>Spending category not found: {categoryNameStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {category ? category.name : 'Category Details'}
          </Text>
        </View>
        
        <View style={styles.placeholder} />
      </View>

      {/* Fixed Monthly Spending Progress */}
      {category && (
        <View style={[styles.summaryBox, styles.fixedSummaryBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.amountAndStatusContainer}>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>{formatCurrency(spent)} / {formatCurrency(category.target || 0)}</Text>
            {target > 0.01 && spent < target && (
              <Text style={[styles.amountNeededText, { color: statusTextColor }]}>
                {formatCurrency((target) - spent)} remaining
              </Text>
            )}
            {target > 0.01 && spent >= target && (
              <Text style={[styles.goalAchievedText, { color: statusTextColor }]}>
                {formatCurrency(spent - (target))} over
              </Text>
            )}
          </View>
          <Text style={[styles.categoryDateText, { color: colors.weakText }]}>{formatCategoryDate(category.date)}</Text>
          {target > 0.01 && (
            <View style={[styles.progressBarContainer, { backgroundColor: colors.progressBar }]}>
              <View 
                style={[styles.progressBar,
                { 
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: progressBarColor
                }
              ]} 
              />
            </View>
          )}
        </View>
      )}

      {/* Fixed Transactions Title */}
      <View style={[styles.fixedTransactionsHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.transactionsTitle, { color: colors.text }]}>Transactions</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={[styles.contentContainer, { backgroundColor: colors.background, marginBottom: 100 }]}>
        {/* Transaction List - No container styling */}
        <View>
          {categoryTransactions.length > 0 ? (
            categoryTransactions.map((transaction, index) => (
              <View key={transaction.id} style={[styles.transactionItem, { backgroundColor: colors.background }]}>
                <View style={[styles.dateIconContainer, { backgroundColor: colors.border }]}>
                  <Text style={[styles.monthText, { color: colors.weakText }]}>{transaction.month}</Text>
                  <Text style={[styles.dayText, { color: colors.text }]}>{transaction.day}</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={[styles.transactionName, { color: colors.text }]}>{transaction.name}</Text>
                  <Text style={[styles.transactionCategory, { color: colors.weakText }]}>{transaction.category}</Text>
                </View>
                <Text style={[styles.transactionAmount, 
                  transaction.amount >= 0 ? styles.incomeAmount : styles.expenseAmount, 
                  transaction.amount >= 0 ? { color: '#4ADE80' } : { color: '#F87171' }]}>
                  {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noTransactionsText, { color: colors.weakText }]}>No transactions yet</Text>
          )}
        </View>
      </ScrollView>
      
      {/* Floating Action Buttons at Bottom - only show when not from category report */}
      {category && !fromCategoryReportStr && (
        <View style={styles.bottomActionsContainer}>
          <TouchableOpacity 
            style={[styles.bottomActionButton, styles.editActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={handleEdit}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bottomActionButton, styles.deleteActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirmation && category && (
        <View style={styles.confirmationOverlay}>
          <View style={[styles.confirmationDialog, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>Confirm Deletion</Text>
            <Text style={[styles.confirmationMessage, { color: colors.weakText }]}>
              Are you sure you want to delete "{category?.name || 'this category'}"? This action cannot be undone.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={styles.confirmationButton}
                onPress={handleDeleteCancel}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmationButton}
                onPress={handleDeleteConfirm}
              >
                <Text style={[styles.cancelButtonText, { color: '#EF4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Use space-between for proper layout
    paddingHorizontal: 16,
    paddingVertical: 8,
    // borderBottomWidth: 1, // Removed line below main title
    zIndex: 30,
    position: 'relative',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: -10, // Move the title slightly to the left
  },
  headerDateText: {
    fontSize: 14,
    marginTop: 2,
  },
  placeholder: {
    width: 48,
  },
  backIcon: {
    fontSize: 26,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fixedSummaryBox: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  contentContainer: {
    flex: 1,
    marginTop: 190, // Reduced from 227 to decrease space between Transactions title and transaction list
    marginBottom: 100, // Add margin to prevent content from going behind buttons
    paddingHorizontal: 20,
  },
  notFoundText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  summaryBox: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  amountAndStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#60A5FA',
  },
  amountNeededText: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalAchievedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitleOutside: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 0,
    marginTop: 0,
    textAlign: 'left',
  },
  categoryDateText: {
    fontSize: 14,
    marginBottom: 8,
  },

  detailsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  scheduleSection: {
    // Removed box styling for a flat list appearance
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  scheduleHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleMonthHeader: {
    flex: 1,
  },
  scheduleAmountHeader: {
    width: 100,
    textAlign: 'right',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  dateIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthText: {
    fontSize: 10,
    textAlign: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  incomeAmount: {
    color: '#4ADE80',
  },
  expenseAmount: {
    color: '#F87171',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  overBudgetStatus: {
    color: '#EF4444',
  },
  noTransactionsText: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  titleMenuContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  animatedMenuContainer: {
    position: 'absolute',
    top: 50,
    right: 60,
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 60,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 25,
  },
  animatedMenuOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  bottomActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
  },
  editActionButton: {
  },
  deleteActionButton: {
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteActionText: {
    color: '#EF4444', // Red text for delete action
  },
  confirmationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmationDialog: {
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  fixedSectionHeader: {
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    zIndex: 10,
  },
  fixedTransactionsHeader: {
    position: 'absolute',
    top: 210,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 15,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});
