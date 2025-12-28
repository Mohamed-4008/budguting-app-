import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Animated, Easing, SafeAreaView, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useBudget } from '@/context/budget-context';
import { useTheme } from '@/context/ThemeContext'; // Import useTheme hook
import { Colors } from '@/constants/theme'; // Import Colors

export default function EditSpendingCategoryScreen() {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const { state, dispatch } = useBudget();
  const { theme } = useTheme(); // Use the theme context
  // Always use dark theme regardless of the system theme
  const colors = Colors.dark;
  const [categoryNameValue, setCategoryNameValue] = useState('');
  const [spendTarget, setSpendTarget] = useState('');
  const [recurrence, setRecurrence] = useState('weekly');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('Bills');
  const [isRepeating, setIsRepeating] = useState(false);
  const [toggleAnimation] = useState(new Animated.Value(0));

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

  // Load category data when component mounts
  useEffect(() => {
    if (categoryName) {
      const categoryNameStr = Array.isArray(categoryName) ? categoryName[0] : categoryName;
      
      // Find the category in the budget state
      let foundCategory = null;
      let foundGroup = null;
      for (const group in state.spendingCategories) {
        const category = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
          (cat: any) => cat.name === categoryNameStr
        );
        if (category) {
          foundCategory = category;
          foundGroup = group;
          break;
        }
      }
      
      if (foundCategory) {
        // Set the form values based on the found category
        setCategoryNameValue(foundCategory.name || '');
        setSpendTarget(foundCategory.target?.toString() || '');
        setSelectedGroup(foundGroup || 'Bills');
        
        // Parse recurrence from date field
        const dateStr = foundCategory.date || '';
        
        if (typeof dateStr === 'string' && dateStr.includes('Weekly on')) {
          setRecurrence('weekly');
          const day = dateStr.replace('Weekly on ', '');
          setSelectedDay(day);
        } else if (typeof dateStr === 'string' && dateStr.includes('Monthly on')) {
          setRecurrence('monthly');
          const day = dateStr.replace('Monthly on ', '');
          setSelectedDay(day);
        } else if (typeof dateStr === 'string' && dateStr.includes('/')) {
          setRecurrence('custom');
          // Parse the date string (e.g., "15/06/2025")
          const dateParts = dateStr.split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(dateParts[2], 10);
            setSelectedDate(new Date(year, month, day));
          }
        } else if (typeof dateStr === 'string' && dateStr.trim() !== '') {
          // Check if it's a monthly format like "Nov 13"
          const monthlyRegex = /^[A-Za-z]{3} \d+$/;
          if (monthlyRegex.test(dateStr.trim())) {
            setRecurrence('monthly');
            const parts = dateStr.trim().split(' ');
            if (parts.length === 2) {
              setSelectedDay(parts[1]);
            }
          } else {
            // Try to parse as a date to see if it's a valid date format
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              // It's a valid date, so set to custom
              setRecurrence('custom');
              setSelectedDate(date);
            } else {
              // Default to weekly
              setRecurrence('weekly');
              setSelectedDay('Mon');
            }
          }
        } else {
          // Default to weekly
          setRecurrence('weekly');
          setSelectedDay('Mon');
        }
        
        // Set repeat status (using the correct property name)
        setIsRepeating((foundCategory as any).isRepeating || false);
      }
    }
  }, [categoryName]);

  // Helper function to find which group a category belongs to
  const getCategoryGroup = (categoryName: string) => {
    for (const group in state.spendingCategories) {
      const category = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
        (cat: any) => cat.name === categoryName
      );
      if (category) {
        return group;
      }
    }
    return 'Bills'; // Default group
  };

  // Days of week for weekly recurrence
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Days of month for monthly recurrence
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  // Group options
  const groupOptions = ['Bills', 'Needs', 'Wants', 'Non-Monthly'];
  
  // Reset scroll position when date picker opens
  const resetScrollPosition = () => {
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

  const toggleRepeat = () => {
    const newValue = !isRepeating;
    setIsRepeating(newValue);
    
    // Animate the toggle switch
    Animated.timing(toggleAnimation, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  // Close date picker when tapping outside
  const closeDatePicker = () => {
    setShowDatePicker(false);
    // Reset selection tracking when closing
    setSelectedComponents({ day: false, month: false, year: false });
  };

  // Handle save functionality
  const handleSave = () => {
    if (categoryName) {
      const categoryNameStr = Array.isArray(categoryName) ? categoryName[0] : categoryName;
      
      // Find the original group of the category
      let originalGroup = 'Bills'; // Default group
      let originalCategory = null;
      for (const group in state.spendingCategories) {
        const category = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
          (cat: any) => cat.name === categoryNameStr
        );
        if (category) {
          originalCategory = category;
          originalGroup = group;
          break;
        }
      }
      
      // Format the date based on recurrence
      let formattedDate = '';
      if (recurrence === 'weekly') {
        formattedDate = `Weekly on ${selectedDay}`;
      } else if (recurrence === 'monthly') {
        formattedDate = `Monthly on ${selectedDay}`;
      } else {
        // Format as DD/MM/YYYY
        formattedDate = `${selectedDate.getDate().toString().padStart(2, '0')}/${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/${selectedDate.getFullYear()}`;
      }
      
      // Check if group has changed
      if (selectedGroup !== originalGroup) {
        // Dispatch move action when group changes
        dispatch({
          type: 'MOVE_SPENDING_CATEGORY',
          categoryName: categoryNameStr,
          fromGroup: originalGroup,
          toGroup: selectedGroup,
          updates: {
            name: categoryNameValue,
            target: parseFloat(spendTarget) || 0,
            date: formattedDate,
            // Preserve other properties that we're not editing
            ...(originalCategory && {
              spent: originalCategory.spent,
              status: originalCategory.status,
              statusAmount: originalCategory.statusAmount,
            })
          }
        });
      } else {
        // Dispatch update action when group hasn't changed
        dispatch({
          type: 'UPDATE_SPENDING_CATEGORY',
          group: originalGroup,
          id: getCategoryID(categoryNameStr, originalGroup),
          updates: {
            name: categoryNameValue,
            target: parseFloat(spendTarget) || 0,
            date: formattedDate,
            // Preserve other properties that we're not editing
            ...(originalCategory && {
              spent: originalCategory.spent,
              status: originalCategory.status,
              statusAmount: originalCategory.statusAmount,
            })
          }
        });
      }
      
      // Navigate back to the previous screen
      router.back();
    }
  };

  // Helper function to get category ID
  const getCategoryID = (categoryName: string, group: string) => {
    const category = state.spendingCategories[group as keyof typeof state.spendingCategories].find(
      (cat: any) => cat.name === categoryName
    );
    return category ? category.id : '';
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={colors.background}
      />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Category</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} onTouchStart={closeDatePicker}>
        <View style={styles.form}>
          {/* Category Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>Category Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., Groceries"
                placeholderTextColor={colors.weakText}
                value={categoryNameValue}
                onChangeText={setCategoryNameValue}
              />
            </View>
          </View>
          
          {/* Spend Target */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>Spend Target</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="$0.00"
                placeholderTextColor={colors.weakText}
                keyboardType="numeric"
                value={spendTarget}
                onChangeText={handleSpendTargetChange}
              />
            </View>
          </View>
          
          {/* Recurrence */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>Recurrence</Text>
            <View style={styles.selectorContainer}>
              <TouchableOpacity 
                style={[styles.selectorOption, recurrence === 'weekly' && styles.selectedOption, { backgroundColor: recurrence === 'weekly' ? '#cce8e8' : colors.cardBackground, borderColor: recurrence === 'weekly' ? '#cce8e8' : colors.border }]}
                onPress={() => setRecurrence('weekly')}
              >
                <Text style={[styles.selectorText, recurrence === 'weekly' && styles.selectedOptionText, { color: recurrence === 'weekly' ? '#1D2543' : colors.text }]}>Weekly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.selectorOption, recurrence === 'monthly' && styles.selectedOption, { backgroundColor: recurrence === 'monthly' ? '#cce8e8' : colors.cardBackground, borderColor: recurrence === 'monthly' ? '#cce8e8' : colors.border }]}
                onPress={() => setRecurrence('monthly')}
              >
                <Text style={[styles.selectorText, recurrence === 'monthly' && styles.selectedOptionText, { color: recurrence === 'monthly' ? '#1D2543' : colors.text }]}>Monthly</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.selectorOption, recurrence === 'custom' && styles.selectedOption, { backgroundColor: recurrence === 'custom' ? '#cce8e8' : colors.cardBackground, borderColor: recurrence === 'custom' ? '#cce8e8' : colors.border }]}
                onPress={() => setRecurrence('custom')}
              >
                <Text style={[styles.selectorText, recurrence === 'custom' && styles.selectedOptionText, { color: recurrence === 'custom' ? '#1D2543' : colors.text }]}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* By */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>By</Text>
            {recurrence === 'custom' ? (
              // For custom recurrence, don't wrap in inputContainer to remove the box
              <View style={styles.customContainer}>
                <View style={styles.customSelectorGroup}>
                  <View style={styles.datePickerContainer}>
                    <TouchableOpacity 
                      style={[styles.datePickerButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                      onPress={() => {
                        setShowDatePicker(true);
                        // Reset selection tracking when opening
                        setSelectedComponents({ day: false, month: false, year: false });
                      }}
                    >
                      <Text style={[styles.datePickerButtonText, { color: colors.text }]}>
                        {selectedDate.getDate().toString().padStart(2, '0')}/{(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/{selectedDate.getFullYear()}
                      </Text>
                      <AntDesign name="calendar" size={20} color={colors.weakText} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              // For weekly and monthly, keep the inputContainer box
              <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                {recurrence === 'weekly' && (
                  <View style={styles.inlineSelectorContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
                      <View style={styles.daysContainer}>
                        {daysOfWeek.map((day) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayOption,
                              selectedDay === day && styles.selectedDayOption,
                              { backgroundColor: selectedDay === day ? '#cce8e8' : colors.cardBackground }
                            ]}
                            onPress={() => setSelectedDay(day)}
                          >
                            <Text style={[
                              styles.dayOptionText,
                              selectedDay === day && styles.selectedDayOptionText,
                              { color: selectedDay === day ? '#1D2543' : colors.text }
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
                              selectedDay === day && styles.selectedDayOption,
                              { backgroundColor: selectedDay === day ? '#cce8e8' : colors.cardBackground }
                            ]}
                            onPress={() => setSelectedDay(day)}
                          >
                            <Text style={[
                              styles.dayOptionText,
                              selectedDay === day && styles.selectedDayOptionText,
                              { color: selectedDay === day ? '#1D2543' : colors.text }
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
          </View>
          
          {/* Assign to Group */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>Assign to Group</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <View style={styles.inlineSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
                  <View style={styles.daysContainer}>
                    {groupOptions.map((group) => (
                      <TouchableOpacity
                        key={group}
                        style={[
                          styles.dayOption,
                          selectedGroup === group && styles.selectedDayOption,
                          { backgroundColor: selectedGroup === group ? '#cce8e8' : colors.cardBackground }
                        ]}
                        onPress={() => setSelectedGroup(group)}
                      >
                        <Text style={[
                          styles.dayOptionText,
                          selectedGroup === group && styles.selectedDayOptionText,
                          { color: selectedGroup === group ? '#1D2543' : colors.text }
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
              <Text style={[styles.label, { color: colors.weakText }]}>Repeat</Text>
              <TouchableOpacity 
                style={styles.repeatToggle}
                onPress={toggleRepeat}
              >
                <Animated.View style={[styles.toggleSwitch, {
                  backgroundColor: toggleAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.border, colors.addButton],
                  }),
                }]}>
                  <Animated.View style={[styles.toggleKnob, {
                    backgroundColor: toggleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [colors.text, colors.background],
                    }),
                    transform: [{
                      translateX: toggleAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 18],
                      }),
                    }],
                  }]} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Bottom Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButtonBottom, { backgroundColor: colors.addButton, borderColor: colors.border }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonTextBottom, { color: '#FFFFFF' }]}>Save</Text>
        </TouchableOpacity>
      </View>
      
      {/* Custom Date Picker Overlay - Close after all 3 elements selected */}
      {showDatePicker && (
        <View style={styles.datePickerOverlay} onTouchEnd={closeDatePicker}>
          <View style={[styles.datePickerPopup, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onTouchEnd={(e) => e.stopPropagation()}>
            <View style={styles.datePickerContent}>
              {/* Day Selector */}
              <View style={styles.datePickerSection}>
                <Text style={[styles.datePickerSectionLabel, { color: colors.weakText }]}>Day</Text>
                <ScrollView 
                  ref={dayScrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerScrollView}
                  contentContainerStyle={styles.datePickerScrollContent}
                  snapToInterval={112}
                  decelerationRate="fast"
                  snapToAlignment="center"
                  pagingEnabled={false}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerItem,
                        selectedComponents.day && selectedDate.getDate() === day && styles.datePickerItemSelected,
                        { backgroundColor: selectedComponents.day && selectedDate.getDate() === day ? '#cce8e8' : colors.cardBackground }
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
                        selectedComponents.day && selectedDate.getDate() === day && styles.datePickerItemTextSelected,
                        { color: selectedComponents.day && selectedDate.getDate() === day ? '#1D2543' : colors.text }
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Month Selector */}
              <View style={styles.datePickerSection}>
                <Text style={[styles.datePickerSectionLabel, { color: colors.weakText }]}>Month</Text>
                <ScrollView 
                  ref={monthScrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerScrollView}
                  contentContainerStyle={styles.datePickerScrollContent}
                  snapToInterval={112}
                  decelerationRate="fast"
                  snapToAlignment="center"
                  pagingEnabled={false}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerItem,
                        selectedComponents.month && (selectedDate.getMonth() + 1) === month && styles.datePickerItemSelected,
                        { backgroundColor: selectedComponents.month && (selectedDate.getMonth() + 1) === month ? '#cce8e8' : colors.cardBackground }
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
                        selectedComponents.month && (selectedDate.getMonth() + 1) === month && styles.datePickerItemTextSelected,
                        { color: selectedComponents.month && (selectedDate.getMonth() + 1) === month ? '#1D2543' : colors.text }
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Year Selector */}
              <View style={styles.datePickerSection}>
                <Text style={[styles.datePickerSectionLabel, { color: colors.weakText }]}>Year</Text>
                <ScrollView 
                  ref={yearScrollViewRef}
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.datePickerScrollView}
                  contentContainerStyle={styles.datePickerScrollContent}
                  snapToInterval={112}
                  decelerationRate="fast"
                  snapToAlignment="center"
                  pagingEnabled={false}
                >
                  {Array.from({ length: 11 }, (_, i) => 2025 + i).map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerItem,
                        selectedComponents.year && selectedDate.getFullYear() === year && styles.datePickerItemSelected,
                        { backgroundColor: selectedComponents.year && selectedDate.getFullYear() === year ? '#cce8e8' : colors.cardBackground }
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
                        selectedComponents.year && selectedDate.getFullYear() === year && styles.datePickerItemTextSelected,
                        { color: selectedComponents.year && selectedDate.getFullYear() === year ? '#1D2543' : colors.text }
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
    </SafeAreaView>
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
    paddingVertical: 16,
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
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 48,
  },
  content: {
    flex: 1,
    padding: 20,
    marginBottom: 100, // Add margin to prevent content from going behind buttons
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
    fontFamily: 'sans-serif',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    padding: 12,
    fontSize: 16,
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  selectedOption: {
    borderColor: '#bbeeee',
  },
  selectorText: {
    fontWeight: '500',
  },
  selectedOptionText: {
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
    minWidth: 40,
    alignItems: 'center',
  },
  selectedDayOption: {
  },
  dayOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayOptionText: {
  },
  customContainer: {
    backgroundColor: 'transparent',
    padding: 12,
  },
  customSelectorGroup: {
    flex: 1,
  },
  datePickerContainer: {
    alignItems: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    minHeight: 50,
  },
  datePickerButtonText: {
    fontSize: 16,
    flex: 1,
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
    zIndex: 1000,
  },
  datePickerPopup: {
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 9999,
    maxHeight: 350,
    overflow: 'hidden',
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
    width: 'auto',
    paddingHorizontal: 20,
  },
  datePickerSection: {
    marginBottom: 16,
    width: '100%',
  },
  datePickerSectionLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  datePickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  datePickerItemSelected: {
  },
  datePickerItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerItemTextSelected: {
    fontWeight: '700',
  },
  repeatToggle: {
    width: 40,
    height: 24,
    justifyContent: 'center',
  },
  toggleSwitch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonBottom: {
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
  saveButtonTextBottom: {
    fontSize: 16,
    fontWeight: '600',
  },
});