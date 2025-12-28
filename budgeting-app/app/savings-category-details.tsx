import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { Colors } from '@/constants/theme';
import { useCurrency } from '@/context/currency-context';

export default function SavingsCategoryDetailsScreen() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const { formatCurrency } = useCurrency();
  const { categoryName } = useLocalSearchParams();
  
  const colors = Colors.dark; // Always use dark theme
  const [category, setCategory] = useState<any>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSpendConfirmation, setShowSpendConfirmation] = useState(false);
  
  // Find the selected savings category
  useEffect(() => {
    const foundCategory = state.savingsCategories['Savings Goals'].find(
      (cat: any) => cat.name === categoryName
    );
    setCategory(foundCategory || null);
  }, [state.savingsCategories, categoryName]); // Add this dependency to ensure updates

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (category && category.id) {
      // Dispatch action to delete the savings category
      dispatch({
        type: 'DELETE_SAVINGS_CATEGORY',
        id: category.id
      });
      // Navigate back to the previous screen
      router.back();
    }
    setShowDeleteConfirmation(false);
  };

  // Handle spend funds action
  const handleSpendFunds = () => {
    if (category && category.id) {
      // Dispatch action to spend the savings category funds
      dispatch({
        type: 'SPEND_SAVINGS_CATEGORY',
        id: category.id
      });
      // Navigate back to the previous screen
      router.back();
    }
    setShowSpendConfirmation(false);
  };

  // Handle spend funds confirmation
  const handleSpendConfirm = () => {
    setShowSpendConfirmation(true);
  };

  // Handle spend funds cancel
  const handleSpendCancel = () => {
    setShowSpendConfirmation(false);
  };

  // Handle delete cancel
  const handleDeleteCancel = () => {
    setShowDeleteConfirmation(false);
  };

  // const formatCurrency = (amount: number) => {
  //   if (amount === undefined || amount === null) return '$0';
  //   return amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
  // };

  if (!category) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={[styles.header, styles.fixedHeader]}> 
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Category Not Found</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.notFoundText, { color: colors.text }]}>Savings category not found</Text>
        </View>
      </View>
    );
  }

  // Calculate progress percentages
  const generalSaved = category.generalSaved || 0;
  const generalTarget = category.generalTarget || 0;
  const monthlySaved = category.monthlySaved || 0;
  
  // Get the current or next month's target from payment schedule
  let monthlyTarget = 0;
  let targetPayment = null;
  if (category.paymentSchedule && category.paymentSchedule.length > 0) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Month name to index mapping
    const monthNameToIndex: { [key: string]: number } = {
      'January': 0,
      'February': 1,
      'March': 2,
      'April': 3,
      'May': 4,
      'June': 5,
      'July': 6,
      'August': 7,
      'September': 8,
      'October': 9,
      'November': 10,
      'December': 11
    };
    
    // Find the current month in the schedule
    const currentMonthPayment = category.paymentSchedule.find((item: any) => {
      const itemMonthIndex = monthNameToIndex[item.month];
      return item.year === currentYear && itemMonthIndex === currentMonth;
    });
    
    // If current month not found, find the next month in the schedule
    if (!currentMonthPayment) {
      // Find the first future month in the schedule
      for (let i = 0; i < category.paymentSchedule.length; i++) {
        const item = category.paymentSchedule[i];
        const itemMonthIndex = monthNameToIndex[item.month];
        
        if (item.year > currentYear || 
            (item.year === currentYear && itemMonthIndex >= currentMonth)) {
          targetPayment = item;
          break;
        }
      }
      
      // If no future month found, use the first month in schedule
      if (!targetPayment && category.paymentSchedule.length > 0) {
        targetPayment = category.paymentSchedule[0];
      }
    } else {
      targetPayment = currentMonthPayment;
    }
    
    // Use target payment's amount as the monthly target
    monthlyTarget = targetPayment ? targetPayment.payment : (category.monthlyTarget || 0);
  } else {
    // Fallback to category.monthlyTarget if no payment schedule
    monthlyTarget = category.monthlyTarget || 0;
  }
  
  const generalProgress = generalTarget > 0 ? (generalSaved / generalTarget) * 100 : 0;
  const monthlyProgress = monthlyTarget > 0 ? (monthlySaved / monthlyTarget) * 100 : 0;
  
  // Determine progress bar colors to match dashboard
  let monthlyProgressBarColor = '#60A5FA'; // Blue (0-94.99%)
  if (monthlyProgress >= 95 && monthlyProgress < 100) {
    monthlyProgressBarColor = '#F59E0B'; // Orange (95-99.99%)
  } else if (monthlyProgress >= 100) {
    monthlyProgressBarColor = '#4ADE80'; // Green (100%+)
  }
  
  // Determine status text color to match dashboard
  let statusTextColor = '#60A5FA'; // Blue
  if (monthlyProgress >= 95 && monthlyProgress < 100) {
    statusTextColor = '#F59E0B'; // Orange
  } else if (monthlyProgress >= 100) {
    statusTextColor = '#4ADE80'; // Green
  }
  
  // Determine status based on whether target is achieved
  const displayStatus = generalSaved >= generalTarget && generalTarget > 0.01 ? 'Completed' : (category.neededStatus || 'Needed');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <View style={[styles.header, styles.fixedHeader]}> 
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{category.name}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Fixed Monthly Savings Progress */}
      <View style={[styles.summaryBox, styles.fixedSummaryBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
        <View style={styles.amountAndStatusContainer}>
          <Text style={[styles.summaryAmount, { color: colors.text }]}>{formatCurrency(monthlySaved)} / {formatCurrency(monthlyTarget)}</Text>
          {monthlyTarget > 0.01 && monthlySaved < monthlyTarget && (
            <Text style={[styles.amountNeededText, { color: statusTextColor }]}>
              {formatCurrency(monthlyTarget - monthlySaved)} to go
            </Text>
          )}
          {monthlyTarget > 0.01 && monthlySaved >= monthlyTarget && (
            <Text style={[styles.goalAchievedText, { color: statusTextColor }]}>
              Goal achieved
            </Text>
          )}
        </View>
        {monthlyTarget > 0.01 && (
          <View style={[styles.progressBarContainer, { backgroundColor: colors.progressBar }]}> 
            <View 
              style={[styles.progressBar,
              { 
                width: `${Math.min(monthlyProgress, 100)}%`,
                backgroundColor: monthlyProgressBarColor
              }
            ]} 
          />
        </View>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.contentContainer}>
        {/* Savings Goal Details */}
        <Text style={[styles.sectionTitleOutside, { color: colors.text }]}>Savings Goal Details</Text>
        <View style={[styles.detailsSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.weakText }]}>Target Date:</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}> 
              {targetPayment ? `${targetPayment.month.substring(0, 3)} ${targetPayment.year}` : category.targetDate}
            </Text>
          </View>
          {category.numberOfMonths && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.weakText }]}>Duration:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {category.numberOfMonths % 1 === 0 
                  ? `${category.numberOfMonths} months` 
                  : `${category.numberOfMonths.toFixed(2)} months`}
              </Text>
            </View>
          )}
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={[styles.detailLabel, { color: colors.weakText }]}>Status:</Text>
            <Text style={[styles.detailValue, displayStatus === 'Completed' ? styles.completedStatus : null, { color: colors.text }]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        {/* Payment Schedule */}
        <Text style={[styles.sectionTitleOutside, { color: colors.text }]}>Payment Schedule</Text>
        {category.paymentSchedule && category.paymentSchedule.length > 0 && (
          <View style={[styles.scheduleSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <View style={[styles.scheduleHeader, { borderBottomColor: colors.border }]}> 
              <Text style={[styles.scheduleHeaderText, styles.scheduleMonthHeader, { color: colors.weakText }]}>Month</Text>
              <Text style={[styles.scheduleHeaderText, styles.scheduleAmountHeader, { color: colors.weakText }]}>Amount</Text>
            </View>
            {category.paymentSchedule.map((payment: any, index: number) => {
              // Determine if this specific month's goal has been achieved
              let isMonthAchieved = false;
              
              // Get the current date for comparison
              const currentDate = new Date();
              const currentYear = currentDate.getFullYear();
              const currentMonth = currentDate.getMonth(); // 0-11
              
              // Month name to index mapping
              const monthNameToIndex: { [key: string]: number } = {
                'January': 0,
                'February': 1,
                'March': 2,
                'April': 3,
                'May': 4,
                'June': 5,
                'July': 6,
                'August': 7,
                'September': 8,
                'October': 9,
                'November': 10,
                'December': 11
              };
              
              const paymentMonthIndex = monthNameToIndex[payment.month];
              
              // Check if the overall savings goal has been achieved
              const isGeneralGoalAchieved = generalSaved >= generalTarget;
              
              // If the overall goal is achieved, all months are considered achieved
              if (isGeneralGoalAchieved) {
                isMonthAchieved = true;
              } 
              // If this is a past month, check if we have enough savings to cover it
              else if (payment.year < currentYear || 
                  (payment.year === currentYear && paymentMonthIndex < currentMonth)) {
                // Calculate cumulative target up to this month
                let cumulativeTarget = 0;
                for (let i = 0; i <= index; i++) {
                  cumulativeTarget += category.paymentSchedule[i].payment;
                }
                // If we have saved enough to cover all months up to this one, mark as achieved
                isMonthAchieved = generalSaved >= cumulativeTarget;
              } 
              // If this is the current month, check if the monthly target is met
              else if (payment.year === currentYear && paymentMonthIndex === currentMonth) {
                isMonthAchieved = monthlySaved >= payment.payment;
              }
              // For future months, they are not yet achieved
              else {
                isMonthAchieved = false;
              }
              
              return (
                <View key={index} style={[
                  styles.scheduleItem,
                  index === category.paymentSchedule.length - 1 ? styles.scheduleItemLast : null,
                  { borderBottomColor: colors.border }
                ]}>
                  <View style={styles.scheduleItemLeft}>
                    <Text style={[
                      styles.scheduleMonth,
                      isMonthAchieved ? styles.achievedMonth : null,
                      { color: isMonthAchieved ? colors.weakText : colors.text }
                    ]}>
                      {payment.month.substring(0, 3)} {payment.year}
                    </Text>
                  </View>
                  <Text style={[
                    styles.scheduleAmount,
                    isMonthAchieved ? styles.achievedAmount : null,
                    { color: isMonthAchieved ? colors.weakText : colors.text }
                  ]}>
                    {formatCurrency(payment.payment)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      
      {/* Contribute to Goal Button - Above the action buttons */}
      {category && generalSaved < generalTarget && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.bottomActionButton, { backgroundColor: colors.addButton }]}
            onPress={() => router.push({
              pathname: '/contribute-to-goal' as any,
              params: { categoryName: category.name }
            })}
          >
            <Text style={[styles.actionButtonText, { color: '#1D2543', fontSize: 16 }]}>Contribute to Goal</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Spend Funds Button - Above the action buttons */}
      {category && generalSaved >= generalTarget && generalTarget > 0 && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.bottomActionButton, styles.spendFundsButton]}
            onPress={handleSpendConfirm}
          >
            <Text style={[styles.actionButtonText, { color: '#1D2543' }]}>Spend Funds</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Floating Action Buttons at Bottom */}
      {category && (
        <View style={styles.bottomActionsContainer}>
          <TouchableOpacity 
            style={[styles.bottomActionButton, styles.editActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => router.push({
              pathname: '/edit-goal',
              params: { categoryName: category.name }
            })}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bottomActionButton, styles.deleteActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => setShowDeleteConfirmation(true)}
          >
            <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Spend Funds Confirmation Dialog */}
      {showSpendConfirmation && (
        <View style={styles.confirmationOverlay}>
          <View style={[styles.confirmationDialog, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>Spend Funds</Text>
            <Text style={[styles.confirmationMessage, { color: colors.weakText }]}> 
              This will convert your saved funds into a spendable account named "{category.name.includes('Fund') ? category.name : category.name + ' Fund'}" with a balance of {formatCurrency(category.generalSaved || 0)} for tracking these funds, and create a spending category for "{category.name}".
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity 
                style={styles.confirmationButton}
                onPress={handleSpendCancel}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmationButton}
                onPress={handleSpendFunds}
              >
                <Text style={[styles.cancelButtonText, { color: '#4ADE80' }]}>Spend</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <View style={styles.confirmationOverlay}>
          <View style={[styles.confirmationDialog, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.confirmationTitle, { color: colors.text }]}>Confirm Deletion</Text>
            <Text style={[styles.confirmationMessage, { color: colors.weakText }]}> 
              Are you sure you want to delete "{category.name}"? This will return all contributed funds ({formatCurrency(category.generalSaved || 0)}) to their original accounts. This action cannot be undone.
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 48,
  },
  fixedSummaryBox: {
    position: 'absolute',
    top: 70, // Increased from 60 to 70 to add more space below the header
    left: 20,
    right: 20,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    marginTop: 140, // Adjusted to account for fixed header and fixed summary box
    padding: 20,
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
    marginBottom: 12,
    marginTop: 32, // Reduced from 29 to 15 to reduce space
  },
  detailsSection: {
    borderRadius: 12,
    padding: 20,
    marginBottom: -1,
    borderWidth: 1,
  },
  scheduleSection: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginTop: 1,
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
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  scheduleItemLast: {
    borderBottomWidth: 0,
  },
  scheduleItemLeft: {
    flex: 1,
  },
  scheduleMonth: {
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleAmount: {
    width: 100,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  achievedMonth: {
    textDecorationLine: 'line-through',
  },
  achievedAmount: {
    textDecorationLine: 'line-through',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
    fontWeight: '600',
  },
  completedStatus: {
    color: '#4ADE80', // Green color for completed status
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 60, // Reduced from 30 to 10 to move button up
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  spendFundsButton: {
    backgroundColor: '#4ADE80', // Green color for spend funds button
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  editButton: {
    // Background color will be applied inline
  },
  deleteButtonText: {
    color: '#EF4444', // Red color for delete text
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomActionsContainer: {
    position: 'absolute',
    bottom: 10, // Increased from 20 to 30 to move buttons up
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
    borderWidth: 1,
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
  cancelButton: {
    // Transparent background - no box
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  confirmationDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
