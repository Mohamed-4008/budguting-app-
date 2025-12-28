import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useBudget, calculateSavingsSchedule } from '@/context/budget-context';

export default function EditGoalScreen() {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const { state, dispatch } = useBudget();
  const [goalName, setGoalName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dropdownAnimation] = useState(new Animated.Value(0));

  // Refs for scroll views
  const dayScrollViewRef = React.useRef<ScrollView>(null);
  const monthScrollViewRef = React.useRef<ScrollView>(null);
  const yearScrollViewRef = React.useRef<ScrollView>(null);

  // State to track which date components have been selected
  const [selectedComponents, setSelectedComponents] = useState({
    day: false,
    month: false,
    year: false
  });

  // Find the current category to pre-fill the form
  React.useEffect(() => {
    console.log('Category name from params:', categoryName);
    console.log('Savings categories:', state.savingsCategories);
    
    if (categoryName && state.savingsCategories) {
      const category = state.savingsCategories['Savings Goals'].find(
        (cat: any) => cat.name === categoryName
      );
      console.log('Found category:', category);
      
      if (category) {
        setGoalName(category.name || '');
        setSavingsTarget(category.generalTarget?.toString() || '');
        // Parse the target date if it exists
        if (category.targetDate) {
          const dateParts = category.targetDate.split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
            const year = parseInt(dateParts[2]);
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
              setTargetDate(new Date(year, month, day));
            }
          }
        }
      }
    }
  }, [categoryName, state.savingsCategories]);

  // Function to calculate payment schedule based on daily savings rate
  const calculatePaymentSchedule = (currentDate: Date, targetDate: Date, totalTarget: number) => {
    // Calculate the exact number of days between dates
    const timeDiff = targetDate.getTime() - currentDate.getTime();
    const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    // Calculate daily savings amount
    const dailySavings = totalTarget / totalDays;
    
    // Initialize variables for calculation
    const schedule = [];
    let currentCalcDate = new Date(currentDate);
    let remainingAmount = totalTarget;
    
    // Get the current month and year
    let currentMonth = currentCalcDate.getMonth();
    let currentYear = currentCalcDate.getFullYear();
    
    // Process each month until we reach the target month
    while (currentCalcDate <= targetDate) {
      // Get the number of days in the current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Determine the start and end day for this month
      let startDay = 1;
      let endDay = daysInMonth;
      
      // For the current month (first month), adjust the start day
      if (currentCalcDate.getMonth() === currentDate.getMonth() && 
          currentCalcDate.getFullYear() === currentDate.getFullYear()) {
        startDay = currentDate.getDate();
        
        // Apply the rule: if current day is 1-19, treat as full month
        // if current day is 20+, don't include this month
        if (startDay >= 20) {
          // Move to next month
          currentMonth++;
          if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
          }
          currentCalcDate = new Date(currentYear, currentMonth, 1);
          continue;
        }
      }
      
      // For the target month (last month), adjust the end day
      if (currentCalcDate.getMonth() === targetDate.getMonth() && 
          currentCalcDate.getFullYear() === targetDate.getFullYear()) {
        endDay = targetDate.getDate();
        
        // Apply the rule: if target day is 1-19, don't include this month
        // if target day is 20+, treat as full month
        if (endDay < 20) {
          break;
        }
      }
      
      // Calculate the number of days in this period
      const daysInPeriod = endDay - startDay + 1;
      
      // Calculate the payment for this month
      const payment = daysInPeriod * dailySavings;
      
      // Add to schedule if payment is positive
      if (payment > 0) {
        // Format month name
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const monthName = monthNames[currentMonth];
        
        schedule.push({
          month: monthName,
          year: currentYear,
          days: daysInPeriod,
          payment: payment,
          endDate: endDay // Add the end date for display
        });
      }
      
      // Deduct from remaining amount
      remainingAmount -= payment;
      
      // Move to next month
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      currentCalcDate = new Date(currentYear, currentMonth, 1);
    }
    
    return schedule;
  };

  // Handle saving the edited goal
  const handleSaveGoal = () => {
    // Validate all fields are filled
    if (goalName.trim() && savingsTarget.trim()) {
      // Find the current category
      const category = state.savingsCategories['Savings Goals'].find(
        (cat: any) => cat.name === categoryName
      );
      
      if (category) {
        // Parse the savings target
        const target = parseFloat(savingsTarget);
        const currentSaved = category.generalSaved || 0;
        
        // Use the original creation date if available, otherwise use current date
        const creationDate = category.creationDate ? new Date(category.creationDate) : new Date();
        const targetDateObj = targetDate;
        
        // Calculate using the new function
        const calculationResult = calculateSavingsSchedule(creationDate, targetDateObj, target, currentSaved);
        
        // Convert to the format expected by the existing code
        const paymentSchedule = calculationResult.monthlyGoals.map(goal => {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          return {
            month: monthNames[goal.month],
            year: goal.year,
            days: goal.daysInMonth,
            payment: goal.savingsGoal,
            endDate: goal.daysInMonth // This is an approximation
          };
        });
        
        // Calculate average monthly target for display
        const averageMonths = paymentSchedule.length;
        const averageMonthlyTarget = averageMonths > 0 ? (target - currentSaved) / averageMonths : 0;
        
        // Get the current month's payment amount for the initial status amount
        let initialStatusAmount = averageMonthlyTarget;
        const currentMonthPayment = paymentSchedule && paymentSchedule.length > 0 ? paymentSchedule[0] : null;
        if (currentMonthPayment) {
          initialStatusAmount = currentMonthPayment.payment;
        }
        
        // Update the savings category, preserving the existing generalSaved value
        dispatch({
          type: 'UPDATE_SAVINGS_CATEGORY',
          id: category.id,
          updates: {
            name: goalName,
            generalSaved: category.generalSaved, // Preserve existing saved amount
            generalTarget: target,
            targetDate: `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getFullYear()}`,
            paymentSchedule: paymentSchedule,
            monthlyTarget: averageMonthlyTarget,
            statusAmount: initialStatusAmount,
            numberOfMonths: averageMonths
          }
        });
      }
      
      // Navigate back to the previous screen
      router.back();
    } else {
      // Show alert if fields are missing
      alert('Please fill in all required fields: Goal Name and Savings Target');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, styles.fixedHeader]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Goal</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Goal Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor="#94A3B8"
                value={goalName}
                onChangeText={setGoalName}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Savings Target</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={savingsTarget}
                onChangeText={setSavingsTarget}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Target Date</Text>
            <View style={styles.inputContainer}>
              <View style={styles.customContainer}>
                <View style={styles.customSelectorGroup}>
                  <View style={styles.datePickerContainer}>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => {
                        setShowDatePicker(true);
                        // Reset selection tracking when opening
                        setSelectedComponents({ day: false, month: false, year: false });
                      }}
                    >
                      <Text style={styles.datePickerButtonText}>
                        {targetDate.getDate().toString().padStart(2, '0')}/{(targetDate.getMonth() + 1).toString().padStart(2, '0')}/{targetDate.getFullYear()}
                      </Text>
                      <AntDesign name="calendar" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Custom Date Picker Overlay - Close after all 3 elements selected */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay} onTouchEnd={() => {
          setShowDatePicker(false);
          // Reset selection tracking when closing
          setSelectedComponents({ day: false, month: false, year: false });
        }}>
          <View style={styles.datePickerPopup} onTouchEnd={(e) => e.stopPropagation()}>
            <View style={styles.datePickerContent}>
              {/* Day Selector */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerSectionLabel}>Day</Text>
                <ScrollView 
                  ref={dayScrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerScrollView}
                  contentContainerStyle={styles.datePickerScrollContent}
                  snapToInterval={112}
                  decelerationRate="fast"
                  snapToAlignment="center"
                  pagingEnabled={false} // Keep paging disabled for smooth scrolling
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerItem,
                        selectedComponents.day && targetDate.getDate() === day && styles.datePickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(targetDate);
                        newDate.setDate(day);
                        setTargetDate(newDate);
                        setSelectedComponents(prev => ({ ...prev, day: true }));
                        // Check if all components are selected, then close
                        const newComponents = { ...selectedComponents, day: true };
                        if (newComponents.day && newComponents.month && newComponents.year) {
                          setTimeout(() => setShowDatePicker(false), 100);
                        }
                      }}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedComponents.day && targetDate.getDate() === day && styles.datePickerItemTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Month Selector */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerSectionLabel}>Month</Text>
                <ScrollView 
                  ref={monthScrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerScrollView}
                  contentContainerStyle={styles.datePickerScrollContent}
                  snapToInterval={112}
                  decelerationRate="fast"
                  snapToAlignment="center"
                  pagingEnabled={false} // Keep paging disabled for smooth scrolling
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerItem,
                        selectedComponents.month && (targetDate.getMonth() + 1) === month && styles.datePickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(targetDate);
                        newDate.setMonth(month - 1);
                        setTargetDate(newDate);
                        setSelectedComponents(prev => ({ ...prev, month: true }));
                        // Check if all components are selected, then close
                        const newComponents = { ...selectedComponents, month: true };
                        if (newComponents.day && newComponents.month && newComponents.year) {
                          setTimeout(() => setShowDatePicker(false), 100);
                        }
                      }}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedComponents.month && (targetDate.getMonth() + 1) === month && styles.datePickerItemTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Year Selector */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerSectionLabel}>Year</Text>
                <ScrollView 
                  ref={yearScrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerScrollView}
                  contentContainerStyle={styles.datePickerScrollContent}
                  snapToInterval={112}
                  decelerationRate="fast"
                  snapToAlignment="center"
                  pagingEnabled={false} // Keep paging disabled for smooth scrolling
                >
                  {Array.from({ length: 11 }, (_, i) => 2025 + i).map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerItem,
                        selectedComponents.year && targetDate.getFullYear() === year && styles.datePickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(targetDate);
                        newDate.setFullYear(year);
                        setTargetDate(newDate);
                        setSelectedComponents(prev => ({ ...prev, year: true }));
                        // Check if all components are selected, then close
                        const newComponents = { ...selectedComponents, year: true };
                        if (newComponents.day && newComponents.month && newComponents.year) {
                          setTimeout(() => setShowDatePicker(false), 100);
                        }
                      }}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedComponents.year && targetDate.getFullYear() === year && styles.datePickerItemTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      )}
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveGoal}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 16,
    backgroundColor: '#1D2543',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    color: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 48,
  },
  contentContainer: {
    flex: 1,
    marginTop: 80,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  form: {
    position: 'relative',
  },
  formGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    display: 'flex',
    marginBottom: 5,
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'sans-serif',
  },
  inputContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    padding: 12,
    fontSize: 16,
    color: '#E2E8F0',
  },
  customContainer: {
    backgroundColor: 'transparent',
  },
  customSelectorGroup: {
    flex: 1,
  },
  datePickerContainer: {
    alignItems: 'center',
    marginVertical: 0,
  },
  datePickerButton: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 50,
  },
  datePickerButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    flex: 1,
  },
  datePickerIcon: {
    fontSize: 18,
    color: '#94A3B8',
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  datePickerPopup: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 9999,
    zIndex: 9999,
    maxHeight: 350,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    padding: 16,
  },
  datePickerContent: {
    padding: 0,
    maxHeight: 320,
  },
  datePickerScrollView: {
    paddingVertical: 4,
    width: '100%',
    maxHeight: 70,
  },
  datePickerScrollContent: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 'auto', // Allow content to determine width
    paddingHorizontal: 20, // Add some padding at ends
  },
  datePickerSection: {
    marginBottom: 16,
    width: '100%',
  },
  datePickerSectionLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
    fontWeight: '500',
  },
  datePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  datePickerItemSelected: {
    backgroundColor: '#bbeeee',
  },
  datePickerItemText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerItemTextSelected: {
    color: '#1D2543',
    fontWeight: '700',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#1e6469',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginLeft: 12,
  },
  saveButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
});