import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext'; // Import useTheme hook
import { Colors } from '@/constants/theme'; // Import Colors
import { useCurrency } from '@/context/currency-context'; // Add this import

interface CategorySpending {
  name: string;
  budgetedAmount: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
  thisMonthDifference: number; // Difference between this month spending and budget
  lastMonthDifference: number; // Difference between last month spending and budget
}

export default function MonthlyBudgetComparisonScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { theme } = useTheme();
  const { formatCurrency } = useCurrency(); // Add this line
  
  // Use dark theme colors regardless of theme setting
  const colors = {
    background: Colors.dark.background,
    cardBackground: Colors.dark.cardBackground,
    text: Colors.dark.text,
    weakText: Colors.dark.weakText,
    border: Colors.dark.border,
    tabBackground: Colors.dark.tabBackground,
    tabBorder: Colors.dark.tabBorder,
    addButton: Colors.dark.addButton,
    progressBarBackground: Colors.dark.progressBar,
    activeTabText: Colors.dark.activeTab,
    inactiveTabText: Colors.dark.inactiveTab,
    tabIndicator: Colors.dark.tabIndicator,
  };
  
  const [firstMonth, setFirstMonth] = useState('');
  const [secondMonth, setSecondMonth] = useState('');
  const [showFirstMonthPicker, setShowFirstMonthPicker] = useState(false);
  const [showSecondMonthPicker, setShowSecondMonthPicker] = useState(false);
  const [categorySpending, setCategorySpending] = useState<any[]>([]);
  
  // Initialize with current month and previous month
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    setFirstMonth(`${monthNames[previousMonth]} ${previousYear}`);
    setSecondMonth(`${monthNames[currentMonth]} ${currentYear}`);
  }, []);

  // Calculate spending data for the selected months
  useEffect(() => {
    if (!firstMonth || !secondMonth) return;
    
    // Parse month strings
    const [firstMonthName, firstYear] = firstMonth.split(' ');
    const [secondMonthName, secondYear] = secondMonth.split(' ');
    
    // Month name to index mapping
    const monthNameToIndex: { [key: string]: number } = {
      'Jan': 0,
      'Feb': 1,
      'Mar': 2,
      'Apr': 3,
      'May': 4,
      'Jun': 5,
      'Jul': 6,
      'Aug': 7,
      'Sep': 8,
      'Oct': 9,
      'Nov': 10,
      'Dec': 11
    };
    
    // Get date ranges for both months
    const firstMonthIndex = monthNameToIndex[firstMonthName];
    const secondMonthIndex = monthNameToIndex[secondMonthName];
    
    const firstMonthStart = new Date(parseInt(firstYear), firstMonthIndex, 1);
    const firstMonthEnd = new Date(parseInt(firstYear), firstMonthIndex + 1, 0);
    const secondMonthStart = new Date(parseInt(secondYear), secondMonthIndex, 1);
    const secondMonthEnd = new Date(parseInt(secondYear), secondMonthIndex + 1, 0);
    
    // Create a map of all categories with their budgeted amounts and spending for both months
    const individualCategoryMap: { [key: string]: { 
      budgetedAmount: number; 
      firstMonth: number; 
      secondMonth: number 
    } } = {};
    
    // Initialize with spending categories and their budgeted amounts
    Object.keys(state.spendingCategories).forEach(group => {
      state.spendingCategories[group as keyof typeof state.spendingCategories].forEach(category => {
        // Only include categories with a target amount
        if (category.target && category.target > 0) {
          individualCategoryMap[category.name] = {
            budgetedAmount: category.target,
            firstMonth: 0,
            secondMonth: 0
          };
        }
      });
    });
    
    // Add spending data for both months
    state.transactions.forEach(transaction => {
      if (transaction.type !== 'Expense') return;
      
      const transactionDate = new Date(transaction.date);
      const transactionAmount = Math.abs(transaction.amount);
      const transactionCategory = transaction.category;
      
      // Skip if category not in our map (not a budgeted category)
      if (!individualCategoryMap[transactionCategory]) return;
      
      // Determine which month this transaction belongs to
      let matchedMonth: 'first' | 'second' | null = null;
      
      if (transactionDate >= firstMonthStart && transactionDate <= firstMonthEnd) {
        matchedMonth = 'first';
      } else if (transactionDate >= secondMonthStart && transactionDate <= secondMonthEnd) {
        matchedMonth = 'second';
      }
      
      if (matchedMonth) {
        // Add to the appropriate month
        if (matchedMonth === 'first') {
          individualCategoryMap[transactionCategory].firstMonth += transactionAmount;
        } else {
          individualCategoryMap[transactionCategory].secondMonth += transactionAmount;
        }
      }
    });
    
    // Convert to array
    const spendingData: CategorySpending[] = Object.keys(individualCategoryMap)
      .map(categoryName => {
        const categoryData = individualCategoryMap[categoryName];
        return {
          name: categoryName,
          budgetedAmount: categoryData.budgetedAmount,
          thisMonthAmount: categoryData.firstMonth,
          lastMonthAmount: categoryData.secondMonth,
          thisMonthDifference: categoryData.firstMonth - categoryData.budgetedAmount,
          lastMonthDifference: categoryData.secondMonth - categoryData.budgetedAmount
        };
      })
      .filter(category => {
        // Only include categories that have budgeted amount or spending in either month
        return category.budgetedAmount > 0 || category.thisMonthAmount > 0 || category.lastMonthAmount > 0;
      });
    
    setCategorySpending(spendingData);
  }, [state.transactions, state.spendingCategories, firstMonth, secondMonth]);

  // const formatCurrency = (amount: number) => {
  //   // Format to 2 decimal places, then remove trailing zeros
  //   const formatted = amount.toFixed(2).replace(/\.?0+$/, '');
  //   return `$${formatted}`;
  // };

  // Format difference with appropriate color coding
  const formatDifference = (difference: number) => {
    // If exactly on target, show 0 in green
    if (Math.abs(difference) < 0.01) {
      return { text: '$0', style: styles.underBudget };
    }
    
    // If under budget (spent less than target), show negative in green
    if (difference < 0) {
      return { text: `-$${Math.abs(difference).toFixed(2).replace(/\.?0+$/, '')}`, style: styles.underBudget };
    }
    
    // If over budget (spent more than target), show positive in red
    return { text: `+$${difference.toFixed(2).replace(/\.?0+$/, '')}`, style: styles.overBudget };
  };

  // Generate list of months for the picker
  const generateMonths = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    // Generate months for the previous year
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      months.push({
        name: `${monthNames[monthIndex]} ${previousYear}`,
        value: `${monthNames[monthIndex]} ${previousYear}`
      });
    }
    
    // Generate months for the current year
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      months.push({
        name: `${monthNames[monthIndex]} ${currentYear}`,
        value: `${monthNames[monthIndex]} ${currentYear}`
      });
    }
    
    return months;
  };

  // Handle month selection
  const handleMonthSelect = (month: string, picker: 'first' | 'second') => {
    if (picker === 'first') {
      setFirstMonth(month);
      setShowFirstMonthPicker(false);
    } else {
      setSecondMonth(month);
      setShowSecondMonthPicker(false);
    }
  };

  // Open month picker for a specific input
  const openMonthPicker = (picker: 'first' | 'second') => {
    if (picker === 'first') {
      setShowFirstMonthPicker(!showFirstMonthPicker);
    } else {
      setShowSecondMonthPicker(!showSecondMonthPicker);
    }
  };

  // Close month pickers
  const closeMonthPickers = () => {
    setShowFirstMonthPicker(false);
    setShowSecondMonthPicker(false);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header - Fixed */}
      <View style={[styles.header, styles.fixedHeader, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Monthly Budget Comparison</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Header Row with aligned month selection boxes */}
      <View style={[styles.headerRow, styles.fixedHeaderRow, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.headerCategoryTitle, { color: colors.weakText }]}>Category</Text>
        <TouchableOpacity style={styles.headerMonthBoxFirst} onPress={() => openMonthPicker('first')}>
          <TextInput
            style={[styles.headerMonthInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
            value={firstMonth}
            editable={false}
            placeholder="dd/mm/yyyy"
            placeholderTextColor={colors.weakText}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerMonthBoxSecond} onPress={() => openMonthPicker('second')}>
          <TextInput
            style={[styles.headerMonthInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.cardBackground }]}
            value={secondMonth}
            editable={false}
            placeholder="dd/mm/yyyy"
            placeholderTextColor={colors.weakText}
          />
        </TouchableOpacity>
      </View>

      {/* Month Picker for First Month */}
      {showFirstMonthPicker && (
        <View style={[styles.monthPickerContainer, styles.fixedMonthPicker, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.monthPickerScrollView}>
            {generateMonths().map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthPickerItem,
                  firstMonth === month.value && styles.selectedMonthPickerItem,
                  { backgroundColor: firstMonth === month.value ? colors.tabBackground : colors.cardBackground, borderColor: firstMonth === month.value ? colors.tabIconSelected : colors.border }
                ]}
                onPress={() => handleMonthSelect(month.value, 'first')}
              >
                <Text style={[
                  styles.monthPickerText,
                  firstMonth === month.value && styles.selectedMonthPickerText,
                  { color: firstMonth === month.value ? colors.text : colors.weakText }
                ]}>
                  {month.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Month Picker for Second Month */}
      {showSecondMonthPicker && (
        <View style={[styles.monthPickerContainer, styles.fixedMonthPicker, { backgroundColor: colors.cardBackground, borderBottomColor: colors.border }]}>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.monthPickerScrollView}>
            {generateMonths().map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthPickerItem,
                  secondMonth === month.value && styles.selectedMonthPickerItem,
                  { backgroundColor: secondMonth === month.value ? colors.tabBackground : colors.cardBackground, borderColor: secondMonth === month.value ? colors.tabIconSelected : colors.border }
                ]}
                onPress={() => handleMonthSelect(month.value, 'second')}
              >
                <Text style={[
                  styles.monthPickerText,
                  secondMonth === month.value && styles.selectedMonthPickerText,
                  { color: secondMonth === month.value ? colors.text : colors.weakText }
                ]}>
                  {month.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Category List - Scrollable */}
      <ScrollView style={[styles.contentContainer, { backgroundColor: colors.background }]}>
        {categorySpending.map((category, index) => (
          <View key={category.name} style={[styles.categoryItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Line 1: Category name and spending amounts */}
            <View style={styles.line}>
              <Text style={[styles.categoryName, { color: colors.text }]}>{category.name}</Text>
              <View style={styles.amountsContainer}>
                <Text style={[styles.amountThisMonth, { color: colors.text }]}>{formatCurrency(category.thisMonthAmount)}</Text>
                <Text style={[styles.amountLastMonth, { color: colors.text }]}>{formatCurrency(category.lastMonthAmount)}</Text>
              </View>
            </View>
            
            {/* Line 2: Under/over budget indicators directly below their amounts */}
            <View style={[styles.line, styles.indicatorsLine]}>
              <Text style={[styles.budgetedAmount, { color: colors.weakText }]}>Target: {formatCurrency(category.budgetedAmount)}</Text>
              <View style={styles.differencesContainer}>
                <Text style={[
                  styles.differenceAmount,
                  formatDifference(category.thisMonthDifference).style,
                  { color: category.thisMonthDifference < 0 ? '#10B981' : (category.thisMonthDifference > 0 ? '#EF4444' : colors.weakText) }
                ]}>
                  {formatDifference(category.thisMonthDifference).text}
                </Text>
                <Text style={[
                  styles.differenceAmount,
                  formatDifference(category.lastMonthDifference).style,
                  { color: category.lastMonthDifference < 0 ? '#10B981' : (category.lastMonthDifference > 0 ? '#EF4444' : colors.weakText) }
                ]}>
                  {formatDifference(category.lastMonthDifference).text}
                </Text>
              </View>
            </View>
          </View>
        ))}
        
        {/* Example data when no real data is available */}
        {categorySpending.length === 0 && (
          <>
            <View style={[styles.categoryItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {/* Line 1: Category name and spending amounts */}
              <View style={styles.line}>
                <Text style={[styles.categoryName, { color: colors.text }]}>Groceries</Text>
                <View style={styles.amountsContainer}>
                  <Text style={[styles.amountThisMonth, { color: colors.text }]}>$145.6</Text>
                  <Text style={[styles.amountLastMonth, { color: colors.text }]}>$130.25</Text>
                </View>
              </View>
              
              {/* Line 2: Under/over budget indicators directly below their amounts */}
              <View style={[styles.line, styles.indicatorsLine]}>
                <Text style={[styles.budgetedAmount, { color: colors.weakText }]}>Target: $150</Text>
                <View style={styles.differencesContainer}>
                  <Text style={[styles.differenceAmount, styles.underBudget]}>-$4.4</Text>
                  <Text style={[styles.differenceAmount, styles.underBudget]}>-$19.75</Text>
                </View>
              </View>
            </View>
            <View style={[styles.categoryItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {/* Line 1: Category name and spending amounts */}
              <View style={styles.line}>
                <Text style={[styles.categoryName, { color: colors.text }]}>Transport</Text>
                <View style={styles.amountsContainer}>
                  <Text style={[styles.amountThisMonth, { color: colors.text }]}>$85.25</Text>
                  <Text style={[styles.amountLastMonth, { color: colors.text }]}>$76.7</Text>
                </View>
              </View>
              
              {/* Line 2: Under/over budget indicators directly below their amounts */}
              <View style={[styles.line, styles.indicatorsLine]}>
                <Text style={[styles.budgetedAmount, { color: colors.weakText }]}>Target: $80</Text>
                <View style={styles.differencesContainer}>
                  <Text style={[styles.differenceAmount, styles.overBudget]}>+$5.25</Text>
                  <Text style={[styles.differenceAmount, styles.underBudget]}>-$3.3</Text>
                </View>
              </View>
            </View>
            <View style={[styles.categoryItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              {/* Line 1: Category name and spending amounts */}
              <View style={styles.line}>
                <Text style={[styles.categoryName, { color: colors.text }]}>Entertainment</Text>
                <View style={styles.amountsContainer}>
                  <Text style={[styles.amountThisMonth, { color: colors.text }]}>$55.75</Text>
                  <Text style={[styles.amountLastMonth, { color: colors.text }]}>$60.5</Text>
                </View>
              </View>
              
              {/* Line 2: Under/over budget indicators directly below their amounts */}
              <View style={[styles.line, styles.indicatorsLine]}>
                <Text style={[styles.budgetedAmount, { color: colors.weakText }]}>Target: $60</Text>
                <View style={styles.differencesContainer}>
                  <Text style={[styles.differenceAmount, styles.underBudget]}>-$4.25</Text>
                  <Text style={[styles.differenceAmount, styles.overBudget]}>+$0.5</Text>
                </View>
              </View>
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
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 48,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  fixedHeaderRow: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  headerCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  headerMonthBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 160, // Match the width of the two amounts (80 + 80)
    position: 'relative',
  },
  headerMonthBoxFirst: {
    width: 80, // Match the width of each amount
  },
  headerMonthBoxSecond: {
    width: 80, // Match the width of each amount
    marginLeft: 10, // Add some spacing between boxes
  },
  headerMonthInput: {
    padding: 8,
    fontSize: 14,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    width: 80, // Match the width of each amount
  },
  monthPickerContainer: {
    borderBottomWidth: 1,
    paddingVertical: 4,
  },
  fixedMonthPicker: {
    position: 'absolute',
    top: 110,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  contentContainer: {
    flex: 1,
    marginTop: 120, // Adjusted to account for the new header row
  },
  categoryItem: {
    flexDirection: 'column',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  amountsContainer: {
    flexDirection: 'row',
  },
  amountThisMonth: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    width: 80,
    marginRight: 10,
  },
  amountLastMonth: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    width: 80,
  },
  budgetedAmount: {
    fontSize: 14,
    flex: 1,
  },
  differencesContainer: {
    flexDirection: 'row',
  },
  differenceAmount: {
    fontSize: 12, // Reduced from 14 to 12 for a more professional appearance
    fontWeight: '500', // Reduced from 600 to 500 for a more subtle look
    textAlign: 'center',
    width: 80,
    marginRight: 10,
  },
  underBudget: {
    // color: '#10B981', // Green color for under budget - moved to inline style
  },
  overBudget: {
    // color: '#EF4444', // Red color for over budget - moved to inline style
  },
  monthPickerScrollView: {
    marginVertical: 10,
  },
  monthPickerItem: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 1,
  },
  monthPickerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedMonthPickerItem: {
    // backgroundColor: '#334155', // Moved to inline style
    // borderColor: '#4A5568', // Moved to inline style
  },
  selectedMonthPickerText: {
    // color: '#F1F5F9', // Moved to inline style
  },
  indicatorsLine: {
    marginTop: 4, // Add a small gap between amounts and indicators
  },
});
