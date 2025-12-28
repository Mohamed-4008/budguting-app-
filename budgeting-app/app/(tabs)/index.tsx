import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { useCurrency } from '@/context/currency-context';

export default function TabOneScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { formatCurrency } = useCurrency();
  const { theme } = useTheme();
  


  // Get screen dimensions
  const { width: screenWidth } = Dimensions.get('window');

  // Use dark theme colors regardless of theme setting
  const colorScheme = 'dark';
  // Use dark theme colors regardless of theme setting
  const colors = {
    background: Colors.dark.background,
    cardBackground: Colors.dark.cardBackground,
    textColor: Colors.dark.text,
    weakTextColor: Colors.dark.weakText,
    borderColor: Colors.dark.border,
    tabBackground: Colors.dark.tabBackground,
    tabBorder: Colors.dark.tabBorder,
    addButtonBackground: Colors.dark.addButton,
    progressBarBackground: Colors.dark.progressBar,
    activeTabText: Colors.dark.activeTab,
    inactiveTabText: Colors.dark.inactiveTab,
    tabIndicator: Colors.dark.tabIndicator,
  };
  const [activeTab, setActiveTab] = useState('spending');
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const isScrollingRef = useRef(false);
  
  // Debugging: Log the current theme
  React.useEffect(() => {
    console.log('Dashboard theme:', theme);
  }, [theme]);
  
  // Get the current target date based on the current month
  const getCurrentTargetDate = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return '';
    
    // Get the current date
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
    
    // Function to get the last day of a month
    const getLastDayOfMonth = (monthIndex: number, year: number): number => {
      return new Date(year, monthIndex + 1, 0).getDate();
    };
    
    // Find the current or next month in the schedule
    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];
      const itemMonthIndex = monthNameToIndex[item.month];
      
      // Check if this item is for the current month or a future month
      if (item.year > currentYear || 
          (item.year === currentYear && itemMonthIndex > currentMonth) ||
          (item.year === currentYear && itemMonthIndex === currentMonth)) {
        const monthAbbreviation = item.month.substring(0, 3);
        const lastDay = getLastDayOfMonth(itemMonthIndex, item.year);
        return `${monthAbbreviation} ${lastDay}`;
      }
    }
    
    // If no current or future month found, return the last month in the schedule
    const lastItem = schedule[schedule.length - 1];
    if (lastItem) {
      const monthAbbreviation = lastItem.month.substring(0, 3);
      const lastDay = getLastDayOfMonth(monthNameToIndex[lastItem.month], lastItem.year);
      return `${monthAbbreviation} ${lastDay}`;
    }
    
    return '';
  };

  // Get the current month's payment details
  const getCurrentMonthPayment = (schedule: any[]) => {
    if (!schedule || schedule.length === 0) return null;
    
    // Get the current date
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
    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];
      const itemMonthIndex = monthNameToIndex[item.month];
      
      // Check if this item is for the current month
      if (item.year === currentYear && itemMonthIndex === currentMonth) {
        return item;
      }
    }
    
    // If current month not found, return the first future month
    for (let i = 0; i < schedule.length; i++) {
      const item = schedule[i];
      const itemMonthIndex = monthNameToIndex[item.month];
      
      if (item.year > currentYear || 
          (item.year === currentYear && itemMonthIndex > currentMonth)) {
        return item;
      }
    }
    
    // If no current or future month found, return null (no payment for current context)
    return null;
  };

  // Handle scroll begin
  const handleScrollBeginDrag = () => {
    isScrollingRef.current = true;
  };

  // Handle scroll end
  const handleScrollEndDrag = () => {
    isScrollingRef.current = false;
  };

  // Handle momentum scroll end (for flick gestures)
  const handleMomentumScrollEnd = (event: any) => {
    isScrollingRef.current = false;
    const scrollPosition = event.nativeEvent.contentOffset.x;
    
    // Determine which tab should be active based on scroll position
    const newActiveTab = scrollPosition > screenWidth * 0.5 ? 'savings' : 'spending';
    
    // Switch tabs based on position
    if (newActiveTab !== activeTab) {
      setActiveTab(newActiveTab);
    }
  };

  // Handle scroll event to update indicator in real-time
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { 
      useNativeDriver: false
    }
  );

  // Handle tab press to scroll to the appropriate position
  const handleTabPress = (tab: string) => {
    // Only allow tab press when not scrolling
    if (!isScrollingRef.current) {
      setActiveTab(tab);
    }
  };

  // Scroll to the appropriate tab when activeTab changes
  useEffect(() => {
    // Only scroll programmatically if not currently being dragged by user
    if (scrollViewRef.current && !isScrollingRef.current) {
      scrollViewRef.current.scrollTo({
        x: activeTab === 'savings' ? screenWidth : 0,
        animated: true
      });
    }
  }, [activeTab]);

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

  // Function to get the next occurrence of a specific day of the month
  const getNextMonthOccurrence = (day: number): Date => {
    const today = new Date();
    const todayDate = today.getDate();
    
    // If the target day has already passed this month, use next month
    if (day <= todayDate) {
      // Create date for the same day next month
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day);
      return nextMonth;
    }
    // If the target day is in the future this month, use this month
    else {
      // Create date for the target day this month
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
      return thisMonth;
    }
  };

  // Function to calculate status amount for savings
  const calculateStatusAmount = (saved: number, target: number): string => {
    // If saved equals target, show $0 (no more needed)
    if (saved >= target) {
      return '$0';
    }
    // Otherwise show the remaining amount needed
    const remaining = target - saved;
    return formatCurrency(remaining);
  };

  // Handle add button press - navigate to new expense screen as modal
  const handleAddPress = () => {
    if (activeTab === 'spending') {
      router.push('/modal');
    } else if (activeTab === 'savings') {
      router.push('/savings-modal');
    }
  };

  const CategoryItem = ({ category }: { category: any }) => {
    const spent = category.spent || 0;
    // For weekly categories, convert target to monthly equivalent for calculations
    const isWeekly = category.date && category.date.startsWith('Weekly on ');
    const weeklyTarget = category.target || 0;
    const target = isWeekly && weeklyTarget ? weeklyTarget * 4.33 : (category.target || 0);
    const progress = target > 0 ? (spent / target) * 100 : 0;
    
    // Determine progress bar color based on spending percentage
    let progressBarColor = '#4ADE80'; // Green (0-89.99%)
    if (progress >= 90 && progress < 100) {
      progressBarColor = '#F59E0B'; // Orange (90-99.99%)
    } else if (progress >= 100) {
      progressBarColor = '#F87171'; // Red (100%+)
    }
    
    const styles = getStyles(colors);
    
    return (
      <TouchableOpacity 
        style={styles.categoryItem}
        onPress={() => router.push({
          pathname: '/spending-category-details' as any,
          params: { 
            categoryName: category.name,
            period: 'this-month' // Add period parameter
          }
        })}
      >
        {/* Line 1 */}
        <View style={styles.categoryLine1}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={[
            styles.statusAmount,
            category.status === 'remaining' ? styles.remainingAmount : styles.overAmount
          ]}>
            {category.status === 'remaining' ? formatCurrency(category.statusAmount) : formatCurrency(category.statusAmount)}
          </Text>
        </View>
        
        {/* Line 2 */}
        <View style={styles.categoryLine2}>
          <Text style={styles.categoryDate}>{formatCategoryDate(category.date)}</Text>
          <Text style={[
            styles.statusText,
            category.status === 'remaining' ? styles.remainingText : styles.overText
          ]}>
            {category.status === 'remaining' ? 'Remaining' : 'Over Budget'}
          </Text>
        </View>
        
        {/* Line 3 - Show weekly spent/weekly target for weekly categories, monthly for others */}
        <View style={styles.categoryLine3}>
          <Text style={styles.spentTarget}>
            {formatCurrency(spent)} / {formatCurrency(isWeekly ? weeklyTarget : target)}
          </Text>
        </View>
        
        {/* Line 4 - Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${Math.min(progress, 100)}%`,
                backgroundColor: progressBarColor
              }
            ]} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  const SavingsCategoryItem = ({ category }: { category: any }) => {
    // Calculate progress percentages with safety checks
    const generalSaved = category.generalSaved || 0;
    const generalTarget = category.generalTarget || 0;
    
    // Add defensive check to prevent incorrect achievement status
    const isGeneralTargetAchieved = generalTarget > 0.01 && generalSaved >= generalTarget;
    
    // Use the current month's actual payment amount from payment schedule
    const currentMonthPayment = category.paymentSchedule ? getCurrentMonthPayment(category.paymentSchedule) : null;
    
    // Get the next month's payment if current month is not found
    let nextMonthPayment = null;
    if (!currentMonthPayment && category.paymentSchedule && category.paymentSchedule.length > 0) {
      // Get the current date
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
      
      // Find the first future month in the schedule
      for (let i = 0; i < category.paymentSchedule.length; i++) {
        const item = category.paymentSchedule[i];
        const itemMonthIndex = monthNameToIndex[item.month];
        
        if (item.year > currentYear || 
            (item.year === currentYear && itemMonthIndex >= currentMonth)) {
          nextMonthPayment = item;
          break;
        }
      }
      
      // If no future month found, use the first month in schedule
      if (!nextMonthPayment) {
        nextMonthPayment = category.paymentSchedule[0];
      }
    }
    
    const monthlySaved = category.monthlySaved || 0;
    // Use next month's payment if current month not found, otherwise use current month's payment
    const targetPayment = nextMonthPayment || currentMonthPayment;
    const monthlyTarget = targetPayment ? targetPayment.payment : (category.monthlyTarget || 0);
    
    const generalProgress = generalTarget > 0 ? (generalSaved / generalTarget) * 100 : 0;
    // Only calculate monthly progress if general target hasn't been achieved
    const monthlyProgress = (generalSaved < generalTarget && monthlyTarget > 0) ? (monthlySaved / monthlyTarget) * 100 : 0;
    
    // Determine progress bar colors for savings (new color scheme)
    let generalProgressBarColor = '#60A5FA'; // Blue (0-94.99%)
    if (generalProgress >= 95 && generalProgress < 100) {
      generalProgressBarColor = '#F59E0B'; // Orange (95-99.99%)
    } else if (generalProgress >= 100) {
      generalProgressBarColor = '#4ADE80'; // Green (100%+)
    }
    
    // Only calculate monthly progress bar color if general target hasn't been achieved
    let monthlyProgressBarColor = '#60A5FA'; // Blue (0-94.99%)
    if (generalSaved < generalTarget) {
      if (monthlyProgress >= 95 && monthlyProgress < 100) {
        monthlyProgressBarColor = '#F59E0B'; // Orange (95-99.99%)
      } else if (monthlyProgress >= 100) {
        monthlyProgressBarColor = '#4ADE80'; // Green (100%+)
      }
    }
    
    // Determine status amount color based on monthly progress, only if general target hasn't been achieved
    let statusAmountColor = '#60A5FA'; // Blue
    if (generalSaved < generalTarget) {
      if (monthlyProgress >= 95 && monthlyProgress < 100) {
        statusAmountColor = '#F59E0B'; // Orange
      } else if (monthlyProgress >= 100) {
        statusAmountColor = '#4ADE80'; // Green
      }
    }
    
    // Use the formatCurrency function from the currency context
    
    // Calculate the status amount to display based on current or next month's progress
    const calculateMonthlyStatusAmount = () => {
      // If general target is achieved, show that the goal is completed
      if (generalSaved >= generalTarget) {
        return 'Goal Achieved';
      }
      
      // Use the target payment (current or next month) for calculating status amount
      if (targetPayment) {
        // Use the target payment amount as the target
        const currentMonthlyTarget = targetPayment.payment;
        const currentMonthlySaved = category.monthlySaved || 0;
        
        // If saved equals or exceeds target, show $0 (no more needed)
        if (currentMonthlySaved >= currentMonthlyTarget) {
          return '$0';
        }
        
        // Otherwise show the remaining amount needed for the target month
        const remaining = currentMonthlyTarget - currentMonthlySaved;
        return formatCurrency(remaining);
      } else {
        // Fallback to the original calculation if no target payment data
        const saved = category.monthlySaved || 0;
        const target = category.monthlyTarget || 0;
        
        // If saved equals or exceeds target, show $0 (no more needed)
        if (saved >= target) {
          return '$0.00';
        }
        
        // Otherwise show the remaining amount needed
        const remaining = target - saved;
        return formatCurrency(remaining);
      }
    };
    
    // Get the display status amount
    const displayStatusAmount = calculateMonthlyStatusAmount();
    
    // Get the current target date for display (using target payment month)
    let displayTargetDate = '';
    if (category.paymentSchedule) {
      if (targetPayment) {
        // Show the target payment month and year
        const monthAbbreviation = targetPayment.month.substring(0, 3);
        // Get last day of the month
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
        const monthIndex = monthNameToIndex[targetPayment.month];
        const lastDay = new Date(targetPayment.year, monthIndex + 1, 0).getDate();
        displayTargetDate = `${monthAbbreviation} ${lastDay}`;
      } else {
        // Fallback to original function if no target payment
        displayTargetDate = getCurrentTargetDate(category.paymentSchedule);
      }
    }
    
    // Get the current month's payment details
    const currentMonthPaymentDetail = category.paymentSchedule ? getCurrentMonthPayment(category.paymentSchedule) : null;
    
    const styles = getStyles(colors);
    
    return (
      <TouchableOpacity 
        style={styles.categoryItem}
        onPress={() => router.push({
          pathname: '/savings-category-details' as any,
          params: { categoryName: category.name }
        })}
      >
        {/* Line 1 */}
        <View style={styles.categoryLine1}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={[styles.statusAmount, styles.savingsAmount, generalSaved >= generalTarget ? styles.goalAchievedText : { color: statusAmountColor }]}>
            {displayStatusAmount} {/* Status amount or 'Goal Achieved' */}
          </Text>
        </View>
        
        {/* Line 2 - Display target date for current or next month */}
        <View style={styles.categoryLine2}>
          <Text style={styles.categoryDate}>
            {displayTargetDate || (category.numberOfMonths 
              ? `Payment schedule: ${category.numberOfMonths.toFixed(1)} months` 
              : `Target date: ${category.targetDate}`)}
          </Text>
          {/* Only show status if general target hasn't been achieved */}
          {generalSaved < generalTarget && (
            <Text style={[styles.statusText, { color: '#64748B' }]}> {/* Same color as date */}
              {category.neededStatus} {/* Always "Needed" */}
            </Text>
          )}
        </View>
        
        {/* Line 3 - Show target month's saved/target format */}
        <View style={styles.savingsLine3}>
          {/* Always show general savings progress */}
          <Text style={styles.spentTarget}>
            {formatCurrency(generalSaved)} / {formatCurrency(generalTarget)}
          </Text>
          
          {/* Only show monthly goal if general target hasn't been achieved */}
          {generalSaved < generalTarget && (
            targetPayment ? (
              <Text style={styles.spentTarget}>
                {formatCurrency(category.monthlySaved || 0)} / {formatCurrency(targetPayment.payment)}
              </Text>
            ) : category.paymentSchedule && category.paymentSchedule.length > 0 ? (
              <Text style={styles.spentTarget}>
                {formatCurrency(category.monthlySaved || 0)} / {formatCurrency(category.monthlyTarget || 0)}
              </Text>
            ) : (
              <Text style={styles.spentTarget}>
                {formatCurrency(monthlySaved)} / {formatCurrency(monthlyTarget)}
              </Text>
            )
          )}
        </View>
        
        {/* Line 4 - Progress Bars */}
        <View style={styles.savingsProgressContainer}>
          <View style={styles.longProgressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { 
                  width: `${Math.min(generalProgress, 100)}%`,
                  backgroundColor: generalProgressBarColor
                }
              ]} 
            />
          </View>
          {/* Only show monthly progress bar if general target hasn't been achieved */}
          {generalSaved < generalTarget && (
            <View style={styles.shortProgressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { 
                    width: `${Math.min(monthlyProgress, 100)}%`,
                    backgroundColor: monthlyProgressBarColor
                  }
                ]} 
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const CategoryGroup = ({ title, categories }: { title: string; categories: any[] }) => {
    const styles = getStyles(colors);
    // Only render the group if there are categories in it
    if (categories.length === 0) {
      return null;
    }
    return (
      <View style={styles.categoryGroup}>
        <Text style={styles.groupTitle}>{title.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</Text>
        {categories.map(category => (
          <CategoryItem key={category.id} category={category} />
        ))}
      </View>
    );
  };

  const SavingsCategoryGroup = ({ categories }: { categories: any[] }) => {
    const styles = getStyles(colors);
    return (
      <View style={styles.categoryGroup}>
        {categories.map(category => (
          <SavingsCategoryItem key={category.id} category={category} />
        ))}
      </View>
    );
  };

  // Calculate interpolated position for tab indicator with smoother animation
  const tabIndicatorPosition = scrollX.interpolate({
    inputRange: [0, screenWidth],
    outputRange: [0, screenWidth / 2],
    extrapolate: 'clamp',
    easing: Easing.out(Easing.ease)
  });

  const styles = getStyles(colors);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={Colors[colorScheme].background}
      />
      

      
      {/* Fixed Tabs at Top - Spending/Savings */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('spending')}
        >
          <Text style={[styles.tabText, activeTab === 'spending' && styles.activeTabText]}>
            Spending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress('savings')}
        >
          <Text style={[styles.tabText, activeTab === 'savings' && styles.activeTabText]}>
            Savings
          </Text>
        </TouchableOpacity>
        
        {/* Animated Tab Indicator */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              transform: [{ translateX: tabIndicatorPosition }],
            },
          ]}
        />
      </View>
      
      {/* Content Area with Horizontal Scrolling */}
      <Animated.ScrollView 
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.contentContainer}
      >
        {/* Spending Content - Full screen width */}
        <View style={{ width: screenWidth }}>
          <ScrollView style={styles.spendingContent}>
            <CategoryGroup title="Bills" categories={state.spendingCategories.Bills} />
            <CategoryGroup title="Needs" categories={state.spendingCategories.Needs} />
            <CategoryGroup title="Wants" categories={state.spendingCategories.Wants} />
            <CategoryGroup title="Non-Monthly" categories={state.spendingCategories['Non-Monthly']} />
            
            {/* Message when no spending categories exist */}
            {state.spendingCategories.Bills.length === 0 && 
             state.spendingCategories.Needs.length === 0 && 
             state.spendingCategories.Wants.length === 0 && 
             state.spendingCategories['Non-Monthly'].length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No spending categories yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first category to start tracking your expenses</Text>
              </View>
            )}
          </ScrollView>
        </View>
        
        {/* Savings Content - Full screen width */}
        <View style={{ width: screenWidth }}>
          <ScrollView style={styles.savingsContent}>
            <SavingsCategoryGroup categories={state.savingsCategories['Savings Goals']} />
            
            {/* Message when no savings categories exist */}
            {state.savingsCategories['Savings Goals'].length === 0 && (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No savings goals yet</Text>
                <Text style={styles.emptyStateSubtext}>Create your first savings goal to start saving for your future</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Animated.ScrollView>
      
      {/* Floating Add Button - Show on both spending and savings tabs */}
      {(activeTab === 'spending' || activeTab === 'savings') && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.tabBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.tabBorder,
    position: 'relative',
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  activeTab: {
    // Removed borderBottom styling since we're using animated indicator
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inactiveTabText,
  },
  activeTabText: {
    color: colors.activeTabText,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%', // Half the width since we have 2 tabs
    height: 2,
    backgroundColor: colors.tabIndicator,
    zIndex: 0,
  },
  contentContainer: {
    flex: 1,
  },
  spendingContent: {
    flex: 1,
    padding: 20,
  },
  savingsContent: {
    flex: 1,
    padding: 20,
  },
  categoryGroup: {
    marginBottom: 25,
  },
  groupTitle: {
    fontSize: 14, // Smaller font size
    fontWeight: '600',
    color: colors.weakTextColor,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  categoryItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderColor,
  },
  categoryLine1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textColor,
  },
  statusAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  remainingAmount: {
    color: '#4ADE80', // Light green
  },
  overAmount: {
    color: '#F87171', // Light red
  },
  categoryLine2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryDate: {
    fontSize: 14,
    color: colors.weakTextColor,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  remainingText: {
    color: '#4ADE80', // Light green
  },
  overText: {
    color: '#F87171', // Light red
  },
  categoryLine3: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  spentTarget: {
    fontSize: 14,
    color: colors.weakTextColor,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: colors.progressBarBackground,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4ADE80', // Default green
  },
  savingsAmount: {
    color: '#60A5FA', // Blue color for savings amount
  },
  goalAchievedText: {
    color: '#4ADE80', // Green color for goal achieved
    fontWeight: '600',
  },
  savingsLine3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  savingsProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  longProgressBarContainer: {
    height: 6,
    backgroundColor: colors.progressBarBackground,
    borderRadius: 3,
    overflow: 'hidden',
    width: '68%', // Reduced from 70% to make space
  },
  shortProgressBarContainer: {
    height: 6,
    backgroundColor: colors.progressBarBackground,
    borderRadius: 3,
    overflow: 'hidden',
    width: '30%', // Keep at 30%
    marginLeft: '2%', // Add space between bars
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textColor,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.weakTextColor,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.addButtonBackground,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});