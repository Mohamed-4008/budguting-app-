import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBudget, calculateSavingsSchedule } from '@/context/budget-context';

export default function SavingsModalScreen() {
  const router = useRouter();
  const { dispatch } = useBudget();
  const [categoryName, setCategoryName] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [dropdownAnimation] = useState(new Animated.Value(0));

  // Refs for scroll views
  const dayScrollViewRef = React.useRef<ScrollView>(null);
  const monthScrollViewRef = React.useRef<ScrollView>(null);
  const yearScrollViewRef = React.useRef<ScrollView>(null);

  // Update default date
  React.useEffect(() => {
    const today = new Date();
    setTargetDate(today);
  }, []);

  // Reset scroll position when date picker opens
  React.useEffect(() => {
    if (showDatePicker) {
      // Reset the target date to January 1st of current year to ensure we start from beginning
      setTargetDate(new Date(new Date().getFullYear(), 0, 1));
      
      // Reset scroll positions with multiple attempts to ensure content is rendered
      const resetScroll = () => {
        if (dayScrollViewRef.current) {
          dayScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
        }
        if (monthScrollViewRef.current) {
          monthScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
        }
        if (yearScrollViewRef.current) {
          yearScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
        }
      };
      
      // Try immediately
      resetScroll();
      
      // Try after short delays to ensure content is rendered
      const timer1 = setTimeout(resetScroll, 50);
      const timer2 = setTimeout(resetScroll, 100);
      const timer3 = setTimeout(resetScroll, 200);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [showDatePicker]);
  
  // State to track which date components have been selected
  const [selectedComponents, setSelectedComponents] = useState({
    day: false,
    month: false,
    year: false
  });

  // Handle adding a new savings goal
  const handleAddSavings = () => {
    // Validate all fields are filled
    if (categoryName.trim() && savingsTarget.trim()) {
      // Calculate the precise daily savings amount
      const currentDate = new Date();
      const targetDateObj = targetDate;
      
      // Calculate using the new function
      const totalTarget = parseFloat(savingsTarget);
      const calculationResult = calculateSavingsSchedule(currentDate, targetDateObj, totalTarget);
      
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
      const averageMonthlyTarget = averageMonths > 0 ? totalTarget / averageMonths : 0;
      
      // Get the current month's payment amount for the initial status amount
      let initialStatusAmount = averageMonthlyTarget;
      const currentMonthPayment = paymentSchedule && paymentSchedule.length > 0 ? paymentSchedule[0] : null;
      if (currentMonthPayment) {
        initialStatusAmount = currentMonthPayment.payment;
      }
      
      // Create a new savings category object
      const newCategory: any = {
        id: Date.now().toString(), // Simple ID generation
        name: categoryName.trim(),
        targetDate: `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getFullYear()}`,
        numberOfMonths: averageMonths, // Store for reference
        generalSaved: 0, // New category starts with 0 saved
        generalTarget: totalTarget,
        monthlySaved: 0, // New category starts with 0 saved
        monthlyTarget: averageMonthlyTarget,
        neededStatus: 'Needed',
        statusAmount: initialStatusAmount, // Show current month's payment amount initially
        paymentSchedule: paymentSchedule, // Store the payment schedule
        creationDate: currentDate.toISOString(), // Store the creation date
      };

      // Dispatch action to add the new savings category
      dispatch({
        type: 'ADD_SAVINGS_CATEGORY',
        category: newCategory,
      });

      // Navigate back to dashboard
      router.dismiss();
    } else {
      // Show alert if fields are missing
      alert('Please fill in all required fields: Category Name and Savings Target');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1D2543" />
      <View style={styles.header}>
        <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>New Savings</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor="#94A3B8"
                value={categoryName}
                onChangeText={setCategoryName}
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
                      <IconSymbol name="calendar" size={20} color="#94A3B8" />
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
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => router.dismiss()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddSavings}
        >
          <Text style={styles.addButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2543',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1D2543',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  content: {
    flex: 1,
    padding: 20,
    position: 'relative',
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
  addButton: {
    flex: 1,
    backgroundColor: '#1e6469',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginLeft: 12,
  },
  addButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
});