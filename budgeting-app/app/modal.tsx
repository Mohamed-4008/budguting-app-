import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback, SafeAreaView, Alert, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { useCurrency } from '@/context/currency-context';

export default function Modal() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const { formatCurrency } = useCurrency();

  const [categoryName, setCategoryName] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [spendTarget, setSpendTarget] = useState('');
  const [recurrence, setRecurrence] = useState('weekly');
  const [selectedDay, setSelectedDay] = useState<string>('Mon'); // Default to Monday
  const [showCustomSelectors, setShowCustomSelectors] = useState({
    day: false,
    month: false,
    year: false
  });
  const [customValues, setCustomValues] = useState({
    day: '1',
    month: '1',
    year: '1'
  });
  const [selectedGroup, setSelectedGroup] = useState('');
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [dropdownAnimation] = useState(new Animated.Value(0));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isRepeating, setIsRepeating] = useState(false); // New state for repeat functionality
  const [toggleAnimation] = useState(new Animated.Value(0)); // Animation for toggle switch
  
  // Refs for scroll views
  const dayScrollViewRef = useRef<ScrollView>(null);
  const monthScrollViewRef = useRef<ScrollView>(null);
  const yearScrollViewRef = useRef<ScrollView>(null);
  
  // Initialize toggle animation value based on initial state
  useEffect(() => {
    toggleAnimation.setValue(isRepeating ? 1 : 0);
  }, []);
  
  // Sample data for categories
  const categoriesData = {
    Bills: [],
    Needs: [],
    Wants: [],
    'Non-Monthly': [],
  };

  
  // Group options from dashboard
  const groupOptions = ['Bills', 'Needs', 'Wants', 'Non-Monthly'];

  // Days of week for weekly recurrence
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Days of month for monthly recurrence
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  
  // Months (1-12)
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  
  // Years (1-10 for simplicity)
  const years = Array.from({ length: 10 }, (_, i) => (i + 1).toString());

  // Update default day when recurrence changes
  useEffect(() => {
    if (recurrence === 'weekly') {
      setSelectedDay('Mon'); // Default to Monday
    } else if (recurrence === 'monthly') {
      setSelectedDay('1'); // Default to 1st
    } else {
      setSelectedDay('');
    }
  }, [recurrence]);

  // Reset scroll position when date picker opens
  useEffect(() => {
    if (showDatePicker) {
      // Reset the selected date to January 1st of current year to ensure we start from beginning
      setSelectedDate(new Date(new Date().getFullYear(), 0, 1));
      
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

  const toggleCustomSelector = (type: 'day' | 'month' | 'year') => {
    // Close group selector when opening custom selectors
    if (showGroupSelector) {
      setShowGroupSelector(false);
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
    
    setShowCustomSelectors(prev => ({
      day: type === 'day' ? !prev.day : false,
      month: type === 'month' ? !prev.month : false,
      year: type === 'year' ? !prev.year : false
    }));
  };

  const selectCustomValue = (type: 'day' | 'month' | 'year', value: string) => {
    setCustomValues(prev => ({
      ...prev,
      [type]: value
    }));
    setShowCustomSelectors(prev => ({
      ...prev,
      [type]: false
    }));
  };

  const toggleGroupSelector = () => {
    // Close other dropdowns when opening group selector
    setShowCustomSelectors({
      day: false,
      month: false,
      year: false
    });
    
    const newValue = !showGroupSelector;
    setShowGroupSelector(newValue);
    
    // Animate the dropdown
    Animated.timing(dropdownAnimation, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
      delay: newValue ? 0 : 0, // No delay when opening, slight delay when closing for better UX
    }).start();
  };

  const toggleRepeat = () => {
    const newValue = !isRepeating;
    setIsRepeating(newValue);
    
    // Animate the toggle switch
    Animated.timing(toggleAnimation, {
      toValue: newValue ? 1 : 0,
      duration: 200, // Adjust duration for smoother animation
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const selectGroup = (group: string) => {
    setSelectedGroup(group);
    setShowGroupSelector(false);
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // Close all dropdowns when tapping outside
  const closeAllDropdowns = () => {
    setShowCustomSelectors({
      day: false,
      month: false,
      year: false
    });

    
    // Close group selector if open
    if (showGroupSelector) {
      setShowGroupSelector(false);
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
    
    // Close date picker if open
    if (showDatePicker) {
      setShowDatePicker(false);
    }
  };

  // Handle adding a new expense
  const handleAddExpense = () => {
    // Validate all fields are filled
    if (categoryName.trim() && spendTarget.trim() && selectedGroup && recurrence) {
      // Check if a category with the same name already exists
      const trimmedCategoryName = categoryName.trim();
      let categoryExists = false;
      
      // Check all spending category groups for duplicate names
      for (const group in state.spendingCategories) {
        const category = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
          (cat: any) => cat.name.toLowerCase() === trimmedCategoryName.toLowerCase()
        );
        if (category) {
          categoryExists = true;
          break;
        }
      }
      
      // If category already exists, show an error and return
      if (categoryExists) {
        setDuplicateError('This category name is already in use. Please choose a different name.');
        return;
      }
      
      // Create date string based on recurrence selection to match dashboard format
      let dateString = '';
      if (recurrence === 'weekly') {
        // For weekly, use the proper format that the dashboard expects
        dateString = `Weekly on ${selectedDay}`;
      } else if (recurrence === 'monthly') {
        // For monthly, show month abbreviation and selected day (e.g., "Nov 13")
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = monthNames[now.getMonth()];
        dateString = `${currentMonth} ${selectedDay}`;
      } else {
        // Format custom date as DD/MM/YYYY (hardcoded format)
        dateString = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
      }

      // Create a new category object
      const newCategory: any = {
        id: Date.now().toString(), // Simple ID generation
        name: trimmedCategoryName,
        date: dateString,
        spent: 0, // New category starts with 0 spent
        target: parseFloat(spendTarget),
        status: 'remaining',
        statusAmount: parseFloat(spendTarget), // Initially all amount is remaining
        isRepeating: isRepeating, // Add repeat functionality
      };

      // Dispatch action to add the new category
      dispatch({
        type: 'ADD_SPENDING_CATEGORY',
        group: selectedGroup,
        category: newCategory,
      });

      // Navigate back to dashboard
      router.dismiss();
    } else {
      // Show alert if fields are missing
      alert('Please fill in all required fields: Category Name, Spend Target, and Assign to Group');
    }
  };

  // Format the amount as the user types to ensure only numeric input
  const handleSpendTargetChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      setSpendTarget(parts.join('.'));
      return;
    }
    
    setSpendTarget(numericValue);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1D2543" />
      <View style={styles.header}>
        <Text style={[styles.title, { flex: 1, textAlign: 'center' }]}>New Expense</Text>
      </View>
      <ScrollView style={styles.content} onTouchStart={closeAllDropdowns}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Groceries"
                placeholderTextColor="#94A3B8"
                value={categoryName}
                onChangeText={(text) => {
                  setCategoryName(text);
                  // Clear duplicate error when user types
                  if (duplicateError) setDuplicateError('');
                }}
              />
            </View>
            {duplicateError ? <Text style={styles.errorText}>{duplicateError}</Text> : null}
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Spend Target</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={spendTarget}
                onChangeText={handleSpendTargetChange}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Recurrence</Text>
            <View style={styles.selectorContainer}>
              <TouchableOpacity 
                style={[styles.selectorOption, recurrence === 'weekly' && styles.selectedOption]}
                onPress={() => setRecurrence('weekly')}
              >
                <Text style={[styles.selectorText, recurrence === 'weekly' && styles.selectedOptionText]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.selectorOption, recurrence === 'monthly' && styles.selectedOption]}
                onPress={() => setRecurrence('monthly')}
              >
                <Text style={[styles.selectorText, recurrence === 'monthly' && styles.selectedOptionText]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.selectorOption, recurrence === 'custom' && styles.selectedOption]}
                onPress={() => setRecurrence('custom')}
              >
                <Text style={[styles.selectorText, recurrence === 'custom' && styles.selectedOptionText]}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>By</Text>
            <View style={styles.inputContainer}>
              {recurrence === 'weekly' && (
                <View style={styles.inlineSelectorContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
                    <View style={styles.daysContainer}>
                      {daysOfWeek.map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayOption,
                            selectedDay === day && styles.selectedDayOption
                          ]}
                          onPress={() => setSelectedDay(day)}
                        >
                          <Text style={[
                            styles.dayOptionText,
                            selectedDay === day && styles.selectedDayOptionText
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
              
              {recurrence === 'monthly' && (
                <View style={styles.inlineSelectorContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
                    <View style={styles.daysContainer}>
                      {daysOfMonth.map((day) => (
                        <TouchableOpacity
                          key={day}
                          style={[
                            styles.dayOption,
                            selectedDay === day && styles.selectedDayOption
                          ]}
                          onPress={() => setSelectedDay(day)}
                        >
                          <Text style={[
                            styles.dayOptionText,
                            selectedDay === day && styles.selectedDayOptionText
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
              
              {recurrence === 'custom' && (
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
                          {selectedDate.getDate().toString().padStart(2, '0')}/{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.getFullYear()}
                        </Text>
                        <IconSymbol name="calendar" size={20} color="#94A3B8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
          

          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Assign to Group</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inlineSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
                  <View style={styles.daysContainer}>
                    {groupOptions.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.dayOption,
                          selectedGroup === group && styles.selectedDayOption
                        ]}
                        onPress={() => setSelectedGroup(group)}
                      >
                        <Text style={[
                          styles.dayOptionText,
                          selectedGroup === group && styles.selectedDayOptionText
                        ]}>
                          {group}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
          
          {/* Repeat Toggle */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Repeat</Text>
              <TouchableOpacity 
                style={styles.repeatToggle}
                onPress={toggleRepeat}
              >
                <Animated.View style={[styles.toggleSwitch, {
                  backgroundColor: toggleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#334155', '#bbeeee'], // Inactive to active color
                  }),
                }]}>
                  <Animated.View style={[styles.toggleKnob, {
                    backgroundColor: toggleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['#E2E8F0', '#1D2543'], // Light to dark color
                    }),
                    transform: [{
                      translateX: toggleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 18], // Movement from left to right
                      }),
                    }],
                  }]} />
                </Animated.View>
              </TouchableOpacity>
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
                        selectedComponents.day && selectedDate.getDate() === day && styles.datePickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(day);
                        setSelectedDate(newDate);
                        const newComponents = { ...selectedComponents, day: true };
                        setSelectedComponents(newComponents);
                        // Check if all components are selected, then close
                        if (newComponents.day && newComponents.month && newComponents.year) {
                          setTimeout(() => setShowDatePicker(false), 100);
                        }
                      }}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedComponents.day && selectedDate.getDate() === day && styles.datePickerItemTextSelected
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
                        selectedComponents.month && (selectedDate.getMonth() + 1) === month && styles.datePickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(month - 1);
                        setSelectedDate(newDate);
                        const newComponents = { ...selectedComponents, month: true };
                        setSelectedComponents(newComponents);
                        // Check if all components are selected, then close
                        if (newComponents.day && newComponents.month && newComponents.year) {
                          setTimeout(() => setShowDatePicker(false), 100);
                        }
                      }}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedComponents.month && (selectedDate.getMonth() + 1) === month && styles.datePickerItemTextSelected
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
                        selectedComponents.year && selectedDate.getFullYear() === year && styles.datePickerItemSelected
                      ]}
                      onPress={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setFullYear(year);
                        setSelectedDate(newDate);
                        const newComponents = { ...selectedComponents, year: true };
                        setSelectedComponents(newComponents);
                        // Check if all components are selected, then close
                        if (newComponents.day && newComponents.month && newComponents.year) {
                          setTimeout(() => setShowDatePicker(false), 100);
                        }
                      }}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        selectedComponents.year && selectedDate.getFullYear() === year && styles.datePickerItemTextSelected
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
          style={[styles.addButton, 
            !(categoryName.trim() && spendTarget.trim() && selectedGroup && recurrence) && { backgroundColor: '#1E293B', borderColor: '#334155' }]}
          onPress={handleAddExpense}
          disabled={!(categoryName.trim() && spendTarget.trim() && selectedGroup && recurrence)}
        >
          <Text style={[styles.addButtonText, 
            !(categoryName.trim() && spendTarget.trim() && selectedGroup && recurrence) && { color: '#94A3B8' }]}>Add Expense</Text>
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
    marginBottom: 100, // Add margin to prevent content from going behind buttons
  },
  form: {
    position: 'relative',
  },
  formGroup: {
    marginBottom: 20,
    position: 'relative', // Add positioning context
  },
  assignGroupForm: {
    marginBottom: 20,
    position: 'relative',
    zIndex: 20, // Higher z-index to ensure dropdown appears above other elements
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
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  selectedOption: {
    backgroundColor: '#bbeeee',
    borderColor: '#bbeeee',
  },
  selectorText: {
    color: '#E2E8F0',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#000000',
    fontWeight: '500',
  },
  inlineSelectorContainer: {
    padding: 8,
  },
  daysScrollView: {
    paddingVertical: 4,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    minWidth: 40,
    alignItems: 'center',
  },
  selectedDayOption: {
    backgroundColor: '#bbeeee',
  },
  dayOptionText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayOptionText: {
    color: '#1D2543',
  },
  customContainer: {
    backgroundColor: 'transparent',
  },
  customSelectorGroup: {
    flex: 1,
  },
  customSelectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  customSelectorItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    position: 'relative',
    overflow: 'visible',
  },
  customSelectorContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  customSelectorButton: {
    backgroundColor: 'transparent',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  customSelectorText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  customSelectorLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
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
    color: '#94A3B8', // Match the navigation icon color
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
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
    maxHeight: 350, // Adjusted height without header/footer
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    padding: 16, // Add padding since we removed header
  },
  datePickerContent: {
    padding: 0, // Remove padding since we added it to popup
    maxHeight: 320, // Adjusted height
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
    paddingVertical: 12, // Increased padding for better visibility
    paddingHorizontal: 20,
    marginHorizontal: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    minWidth: 60, // Increased width for better visibility
    alignItems: 'center',
    justifyContent: 'center',
    height: 40, // Fixed height for consistency
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

  dropdown: {
    position: 'relative',
    flex: 1,
    marginHorizontal: 8,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  dateDropdown: {
    flex: 1,
    marginHorizontal: 4,
    position: 'relative',
  },
  dropdownSelect: {
    backgroundColor: '#0d2f2a',
    color: '#e0e0e0',
    borderWidth: 1,
    borderColor: '#1a4b44',
    borderRadius: 6,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  groupDropdownSelect: {
    backgroundColor: 'transparent',
    padding: 12,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
  },
  dropdownSelectText: {
    color: '#e0e0e0',
    fontSize: 14,
    fontFamily: 'sans-serif',
  },
  arrow: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  arrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#0d2f2a',
    borderWidth: 1,
    borderColor: '#1a4b44',
    borderRadius: 6,
    marginTop: 4,
    zIndex: 100, // Reduce z-index
    display: 'none',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 100,
  },
  customDropdownMenu: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    maxHeight: 200,
    minWidth: 100,
    left: 0,
    right: 0,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 100, // Reduce z-index
  },
  dateDropdownMenu: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    maxHeight: 200,
    minWidth: 80,
    zIndex: 100, // Reduce z-index
  },
  groupDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    marginTop: 2,
    zIndex: 1000, // Increased z-index to appear above other elements
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownMenuOpen: {
    display: 'flex',
  },
  dropdownScrollView: {
    padding: 0,
  },
  dropdownMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  dropdownMenuItemText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '400',
  },
  selectedDropdownItem: {
    backgroundColor: '#334155',
  },
  selectedDropdownItemText: {
    color: '#1e6469',
    fontWeight: '600',
  },
  
  // Repeat Toggle Styles
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  repeatToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 0,
  },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#334155',
    justifyContent: 'center',
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    transform: [{ translateX: 0 }],
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  cancelButton: {
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
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  cancelButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
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
    backgroundColor: '#1e6469',
    borderColor: '#334155',
  },
  addButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});