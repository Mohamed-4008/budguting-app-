import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Animated, Easing } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useBudget } from '@/context/budget-context';

interface TransactionItem {
  id: string;
  name: string;
  amount: number;
  category: string;
  type: 'Income' | 'Expense';
  date: string;
  account: string;
  day: string;
  month: string;
}

export default function SpendingCategoryDetailsScreen() {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const { state, dispatch } = useBudget();
  const [category, setCategory] = useState<any>(null);
  const [categoryTransactions, setCategoryTransactions] = useState<TransactionItem[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  // Handle both string and array parameters
  const categoryNameStr = Array.isArray(categoryName) ? categoryName[0] : categoryName;

  // Find the selected spending category
  useEffect(() => {
    console.log('Received categoryName parameter:', categoryName);
    console.log('Converted categoryNameStr:', categoryNameStr);
    console.log('Available spending categories:', state.spendingCategories);
    
    if (categoryNameStr) {
      // Search through all spending category groups
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
      
      console.log('Final found category:', foundCategory);
      setCategory(foundCategory || null);
    }
  }, [categoryNameStr, state.spendingCategories]);

  // Get transactions for this category
  useEffect(() => {
    if (categoryNameStr) {
      const transactions = state.transactions
        .filter((transaction: any) => transaction.category === categoryNameStr && transaction.clearedForCategory !== categoryNameStr)
        .map((transaction: any) => ({
          ...transaction,
          day: new Date(transaction.date).getDate().toString().padStart(2, '0'),
          month: new Date(transaction.date).toLocaleString('default', { month: 'short' }),
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setCategoryTransactions(transactions);
    }
  }, [categoryNameStr, state.transactions]);

  // Format currency to show decimals only when needed
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) return '$0.00';
    return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
  };

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

  // Handle edit action
  const handleEdit = () => {
    setMenuVisible(false);
    // Navigate to edit screen
    router.push({
      pathname: '/edit-spending-category',
      params: { 
        categoryName: category.name,
        categoryGroup: getCategoryGroup(category.name)
      }
    });
  };

  // Helper function to find which group a category belongs to
  const getCategoryGroup = (categoryName: string) => {
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
    dispatch({
      type: 'DELETE_SPENDING_CATEGORY',
      categoryName: categoryNameStr
    });
    
    // Navigate back after deletion
    router.back();
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  // Handle delete action (show confirmation)
  const handleDelete = () => {
    setShowDeleteConfirmation(true);
  };

  // Toggle menu with improved animation
  const toggleMenu = () => {
    if (menuVisible) {
      // Hide menu with animation
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => setMenuVisible(false));
    } else {
      // Show menu with animation
      setMenuVisible(true);
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  };

  // Close menu when pressing outside
  const closeMenu = () => {
    Animated.timing(menuAnimation, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => setMenuVisible(false));
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
      <View style={styles.container}>
        <View style={[styles.header, styles.fixedHeader]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <AntDesign name="left" size={15} color="#E2E8F0" />
          </TouchableOpacity>
          <Text style={styles.title}>Category Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.notFoundText}>Spending category not found: {categoryNameStr}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, styles.fixedHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <AntDesign name="left" size={15} color="#E2E8F0" />
        </TouchableOpacity>
        
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {category ? category.name : 'Category Details'}
        </Text>
        
        {category && (
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={toggleMenu}
          >
            <AntDesign name="bars" size={24} color="#E2E8F0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Fixed Monthly Spending Progress */}
      {category && (
        <View style={[styles.summaryBox, styles.fixedSummaryBox]}>
          <View style={styles.amountAndStatusContainer}>
            <Text style={styles.summaryAmount}>{formatCurrency(spent)} / {formatCurrency(isWeekly ? weeklyTarget : (isWeekly && category.target ? category.target * 4.33 : target))}</Text>
            {target > 0.01 && spent < target && (
              <Text style={[styles.amountNeededText, { color: statusTextColor }]}>
                {formatCurrency((isWeekly ? weeklyTarget : (isWeekly && category.target ? category.target * 4.33 : target)) - spent)} remaining
              </Text>
            )}
            {target > 0.01 && spent >= target && (
              <Text style={[styles.goalAchievedText, { color: statusTextColor }]}>
                {formatCurrency(spent - (isWeekly ? weeklyTarget : (isWeekly && category.target ? category.target * 4.33 : target)))} over
              </Text>
            )}
          </View>
          <Text style={styles.categoryDateText}>{formatCategoryDate(category.date)}</Text>
          {target > 0.01 && (
            <View style={styles.progressBarContainer}>
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

      {/* Scrollable Content */}
      <ScrollView style={styles.contentContainer}>
        {/* Fixed Transactions Title */}
        <View style={styles.fixedSectionHeader}>
          <Text style={styles.sectionTitleOutside}>Transactions</Text>
        </View>
        {/* Transaction List - No container styling */}
        <View>
          {categoryTransactions.length > 0 ? (
            categoryTransactions.map((transaction, index) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.dateIconContainer}>
                  <Text style={styles.monthText}>{transaction.month}</Text>
                  <Text style={styles.dayText}>{transaction.day}</Text>
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionName}>{transaction.name}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
                <Text style={[styles.transactionAmount, 
                  transaction.amount >= 0 ? styles.incomeAmount : styles.expenseAmount]}>
                  {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noTransactionsText}>No transactions yet</Text>
          )}
        </View>
      </ScrollView>
      
      {/* Floating Action Buttons at Bottom */}
      {category && (
        <View style={styles.bottomActionsContainer}>
          <TouchableOpacity 
            style={[styles.bottomActionButton, styles.editActionButton]}
            onPress={handleEdit}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bottomActionButton, styles.deleteActionButton]}
            onPress={handleDelete}
          >
            <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirmation && category && (
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationDialog}>
            <Text style={styles.confirmationTitle}>Confirm Deletion</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to delete "{category.name}"? This action cannot be undone.
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={styles.confirmationButton}
                onPress={handleDeleteCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
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
      
      {/* Overlay to close menu when tapping outside */}
      {menuVisible && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          onPress={closeMenu}
          activeOpacity={1}
        />
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1D2543',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 30,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  headerDateText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  placeholder: {
    width: 48,
  },
  menuButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 18,
    color: '#E2E8F0',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    alignItems: 'center',
  },
  menuOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuOptionText: {
    fontSize: 16,
    color: '#E2E8F0',
    marginLeft: 10,
  },
  deleteOption: {
    color: '#EF4444',
  },
  fixedSummaryBox: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  contentContainer: {
    flex: 1,
    marginTop: 170, // Adjusted to account for fixed header (80px) + summary box (80px) + additional spacing (10px)
    marginBottom: 80, // Make space for bottom buttons
    paddingHorizontal: 20,
  },
  notFoundText: {
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
    marginTop: 50,
  },
  summaryBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  amountAndStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#334155',
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
    color: '#E2E8F0',
    marginBottom: 12,
    marginTop: 10,
  },
  categoryDateText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },

  detailsSection: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scheduleSection: {
    // Removed box styling for a flat list appearance
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 16,
  },

  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 8,
  },
  scheduleHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
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
    backgroundColor: '#334155',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  monthText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#94A3B8',
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
    borderBottomColor: '#334155',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 16,
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 16,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  overBudgetStatus: {
    color: '#EF4444',
  },
  noTransactionsText: {
    fontSize: 16,
    color: '#94A3B8',
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
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 60,
    borderWidth: 1,
    borderColor: '#334155',
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
    borderBottomColor: '#334155',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  },
  editActionButton: {
    backgroundColor: '#334155',
  },
  deleteActionButton: {
    backgroundColor: '#334155', // Same background as edit button
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionButtonText: {
    color: '#E2E8F0',
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
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationMessage: {
    fontSize: 16,
    color: '#94A3B8',
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
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  fixedSectionHeader: {
    position: 'relative',
    marginTop: 30, // Increased from 20 to 30 for more spacing between summary box and transactions title
    marginBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#1D2543',
    zIndex: 15,
  },
});