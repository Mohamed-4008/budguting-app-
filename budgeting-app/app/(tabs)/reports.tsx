import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import React, { useState, useRef, useEffect } from 'react';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { Svg, Path, Text as SvgText, Line, Rect, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { useTheme } from '@/context/ThemeContext'; // Import useTheme hook
import { useCurrency } from '@/context/currency-context'; // Import useCurrency hook
import { Colors } from '@/constants/theme'; // Import Colors

// Helper function to truncate text based on available space
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
};

// Helper function to measure text width (approximation)
const measureTextWidth = (text: string, fontSize: number) => {
  // Approximate width calculation: character count * average width per character
  // This is a simplified estimation, more accurate would require actual text measurement
  return text.length * fontSize * 0.6;
};

// Custom Circle Chart Component for spending by category
// Each segment's area is proportional to its percentage of total spending
const CustomCircleChart = ({ data, width, height }: { data: Array<{ name: string; population: number; color: string }>; width: number; height: number }) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const containerRadius = Math.min(width, height) / 2 - 15; // Container circle radius
  
  // Calculate the total percentage to normalize values
  const totalPercentage = data.reduce((sum, item) => sum + item.population, 0);
  
  // Create segments for each category with proportional areas
  let startAngle = 0;
  const segments = data.map((item, index) => {
    // Special handling for single category - occupy full circle
    let segmentAngle, endAngle;
    if (data.length === 1) {
      // If there's only one category, make it a full circle
      segmentAngle = 2 * Math.PI;
      endAngle = 2 * Math.PI;
    } else {
      // Calculate angle based on percentage
      segmentAngle = (item.population / totalPercentage) * 2 * Math.PI;
      endAngle = startAngle + segmentAngle;
    }
    
    // Calculate mid angle for text positioning
    const midAngle = startAngle + segmentAngle / 2;
    
    // Calculate position for text (center of the ray from center to edge)
    const textRadius = containerRadius * 0.5;
    let textX = centerX + textRadius * Math.cos(midAngle);
    let textY = centerY + textRadius * Math.sin(midAngle);
    
    // For categories with less than 12%, position them differently from the center
    const percentage = item.population;
    if (percentage < 12) {
      // Position small segments closer to the edge for better visibility
      const outerTextRadius = containerRadius * 0.7;
      textX = centerX + outerTextRadius * Math.cos(midAngle);
      textY = centerY + outerTextRadius * Math.sin(midAngle);
    }
    
    const segment = {
      ...item,
      startAngle,
      endAngle,
      midAngle,
      textX,
      textY,
      segmentAngle // Store the angle for size calculations
    };
    
    startAngle = endAngle;
    return segment;
  });
  
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Main container circle outline */}
        <Circle
          cx={centerX}
          cy={centerY}
          r={containerRadius}
          fill="none"
          stroke="#334155"
          strokeWidth="1"
        />
        
        {/* Segments for each category */}
        {segments.map((segment, index) => {
          // For single category, draw a full circle with text positioned in the center
          if (data.length === 1) {
            return (
              <React.Fragment key={index}>
                {/* Full circle segment fill */}
                <Circle
                  cx={centerX}
                  cy={centerY}
                  r={containerRadius}
                  fill={segment.color}
                />
                
                {/* Category name and percentage - positioned in the center */}
                {/* Dynamic sizing based on text length */}
                {
                  (() => {
                    const containerDiameter = containerRadius * 2;
                    const availableWidth = containerDiameter * 0.8; // 80% of diameter for padding
                    let nameFontSize = 18;
                    let valueFontSize = 17;
                    
                    // Adjust font size based on text width vs available space
                    const textWidth = measureTextWidth(segment.name, nameFontSize);
                    if (textWidth > availableWidth * 0.9) { // If text is wider than 90% of available space
                      const ratio = (availableWidth * 0.9) / textWidth;
                      nameFontSize = Math.max(14, Math.floor(nameFontSize * ratio));
                      valueFontSize = Math.max(13, Math.floor(valueFontSize * ratio));
                    }
                    
                    // Calculate max chars for truncation
                    const maxChars = Math.max(15, Math.floor(availableWidth / (nameFontSize * 0.5)));
                    
                    return (
                      <React.Fragment>
                        <SvgText
                          x={centerX}
                          y={centerY - (nameFontSize / 2 + 2)}
                          fill="#F1F5F9"
                          fontSize={nameFontSize}
                          fontWeight="600"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {segment.name.length > maxChars ? truncateText(segment.name, maxChars - 3) : segment.name}
                        </SvgText>
                        <SvgText
                          x={centerX}
                          y={centerY + (valueFontSize / 2 + 2)}
                          fill="#F1F5F9"
                          fontSize={valueFontSize}
                          fontWeight="bold"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                        >
                          {`${segment.population.toFixed(1)}%`}
                        </SvgText>
                      </React.Fragment>
                    );
                  })()
                }
              </React.Fragment>
            );
          }
          
          // Create a path for each segment
          const x1 = centerX + containerRadius * Math.cos(segment.startAngle);
          const y1 = centerY + containerRadius * Math.sin(segment.startAngle);
          
          const x2 = centerX + containerRadius * Math.cos(segment.endAngle);
          const y2 = centerY + containerRadius * Math.sin(segment.endAngle);
          
          // For very small segments, draw a line instead of an arc
          const largeArcFlag = segment.endAngle - segment.startAngle > Math.PI ? 1 : 0;
          
          // Create path data for the segment
          let pathData;
          if (segment.endAngle - segment.startAngle < 0.1) {
            // Very small segment - draw a line
            pathData = `M ${centerX} ${centerY} L ${x1} ${y1} L ${x1 + 1} ${y1 + 1} Z`;
          } else {
            // Regular segment - draw an arc
            pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${containerRadius} ${containerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          }
          
          // Show text for all segments, but position small ones differently
          // Convert angle from radians to degrees for easier comparison
          const segmentAngleDegrees = (segment.segmentAngle * 180) / Math.PI;
          const showText = true; // Always show text, regardless of segment size
          
          // For very small segments, we might want to adjust text positioning
          let textX = segment.textX;
          let textY = segment.textY;
          let fontSize = 12;
          
          // If segment is small but not tiny, reduce font size
          if (segmentAngleDegrees < 25 && segmentAngleDegrees > 12) {
            fontSize = 10;
          }
          
          // For segments less than 12%, use a consistent font size
          if (segment.population < 12) {
            fontSize = 11;
          }
          
          // Always position text at the center of the ray from center to edge
          if (showText) {
            const midAngle = (segment.startAngle + segment.endAngle) / 2;
            // For small segments (<12%), position text closer to the edge
            const safeTextRadius = segment.population < 12 ? containerRadius * 0.7 : containerRadius * 0.5;
            
            textX = centerX + safeTextRadius * Math.cos(midAngle);
            textY = centerY + safeTextRadius * Math.sin(midAngle);
          }
          
          // Calculate max text length based on segment size - more generous calculation
          // Dynamic sizing based on actual segment radius
          let dynamicFontSize = fontSize;
          const textWidth = measureTextWidth(segment.name, fontSize);
          const availableWidth = containerRadius * 0.7 * 2; // Approximate available width
          if (textWidth > availableWidth * 0.9) { // If text is wider than 90% of available space
            // Reduce font size proportionally
            const ratio = (availableWidth * 0.9) / textWidth;
            dynamicFontSize = Math.max(10, Math.floor(fontSize * ratio));
          }
          
          const pixelsPerChar = dynamicFontSize * 0.45; // Reduced pixels per character for better fit
          const maxTextLength = Math.max(10, Math.floor(containerRadius / pixelsPerChar));
          
          return (
            <React.Fragment key={index}>
              {/* Segment fill */}
              <Path
                d={pathData}
                fill={segment.color}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
              
              {/* Category name and percentage - only show if segment is large enough */}
              {showText && (
                <React.Fragment>
                  <SvgText
                    x={textX}
                    y={textY - (dynamicFontSize / 2 + 2)}
                    fill="#F1F5F9"
                    fontSize={dynamicFontSize}
                    fontWeight="500"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {segment.name.length > maxTextLength ? truncateText(segment.name, maxTextLength - 3) : segment.name}
                  </SvgText>
                  <SvgText
                    x={textX}
                    y={textY + (dynamicFontSize / 2 + 2)}
                    fill="#F1F5F9"
                    fontSize={dynamicFontSize === 10 ? 9 : 11}
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {`${segment.population}%`}
                  </SvgText>
                </React.Fragment>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};



export default function ReportsScreen() {
  const router = useRouter();
  const { state } = useBudget();
  const { theme } = useTheme(); // Use the theme context
  const { formatCurrency } = useCurrency(); // Use the currency context
  // Use dark theme colors regardless of theme setting
  const colors = Colors.dark; // Always use dark theme

  const [selectedPeriod, setSelectedPeriod] = useState('this-month');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [incomeData, setIncomeData] = useState(0);
  const [expenseData, setExpenseData] = useState(0);
  const [loading, setLoading] = useState(false);
  const [categoryData, setCategoryData] = useState<Array<{name: string, amount: number, percentage: number, color: string}>>([]);
  const [budgetComparisonData, setBudgetComparisonData] = useState<Array<{
    category: string;
    budgeted: number;
    lastMonthSpent: number;
    thisMonthSpent: number;
    lastMonthVariance: number;
    thisMonthVariance: number;
  }>>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<Array<{
    name: string;
    totalAmount: number;
    transactionCount: number;
  }>>([]);

  const startDateRef = useRef(new Date());
  const endDateRef = useRef(new Date());

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setShowCustomRange(false);
  };

  const handleCustomRange = () => {
    setSelectedPeriod('custom');
    setShowCustomRange(true);
  };

  const handleStartDateChange = (date: Date) => {
    startDateRef.current = date;
  };

  const handleEndDateChange = (date: Date) => {
    endDateRef.current = date;
  };

  const handleFetchCustomData = () => {
    fetchFinancialData();
    fetchCategoryData();
    fetchBudgetComparisonData();
    fetchPaymentMethodData();
  };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReportData = async () => {
    setLoading(true);

    try {
      // Use the local data fetching functions instead of API call
      fetchFinancialData();
      fetchCategoryData();
      fetchBudgetComparisonData();
      fetchPaymentMethodData();
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refs for auto focus
  const fromDayRef = useRef<TextInput>(null);
  const fromMonthRef = useRef<TextInput>(null);
  const fromYearRef = useRef<TextInput>(null);
  const toDayRef = useRef<TextInput>(null);
  const toMonthRef = useRef<TextInput>(null);
  const toYearRef = useRef<TextInput>(null);

  // Initialize with default dates (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Format date components
  const formatDay = (date: Date) => String(date.getDate()).padStart(2, '0');
  const formatMonth = (date: Date) => String(date.getMonth() + 1).padStart(2, '0');
  const formatYear = (date: Date) => String(date.getFullYear());

  // State for date components
  const [fromDay, setFromDay] = useState(formatDay(thirtyDaysAgo));
  const [fromMonth, setFromMonth] = useState(formatMonth(thirtyDaysAgo));
  const [fromYear, setFromYear] = useState(formatYear(thirtyDaysAgo));
  const [toDay, setToDay] = useState(formatDay(today));
  const [toMonth, setToMonth] = useState(formatMonth(today));
  const [toYear, setToYear] = useState(formatYear(today));

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Set time to end of day for endDate
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last-month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        // Set time to end of day for endDate
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        startDate = new Date(parseInt(fromYear), parseInt(fromMonth) - 1, parseInt(fromDay));
        endDate = new Date(parseInt(toYear), parseInt(toMonth) - 1, parseInt(toDay));
        // Set time to end of day for endDate
        endDate.setHours(23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Set time to end of day for endDate
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  };

  // Fetch income and expense data based on date range
  const fetchFinancialData = () => {
    setLoading(true);
    
    // Transform transactions from context to match the format used in reports
    const transformTransactions = () => {
      return state.transactions.map(transaction => ({
        id: transaction.id,
        user: 'user1', // Default user
        amount: Math.abs(transaction.amount),
        description: transaction.name,
        category: transaction.category,
        date: transaction.date,
        type: transaction.type === 'Income' ? ('income' as const) : ('expense' as const),
        account: transaction.account,
        createdAt: transaction.date,
        updatedAt: transaction.date
      }));
    };
    
    // Get transactions from context
    const transactions = transformTransactions();
    
    const { startDate, endDate } = getDateRange();
    
    // Filter transactions based on date range
    const filteredTransactions = transactions.filter((transaction: any) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
    
    // Calculate totals
    const incomeTotal = filteredTransactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
      
    const expenseTotal = filteredTransactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    
    setIncomeData(incomeTotal);
    setExpenseData(expenseTotal);
    setLoading(false);
  };

  // Fetch spending by category data based on date range
  const fetchCategoryData = () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Transform transactions from context to match the format used in reports
      const transformTransactions = () => {
        return state.transactions.map(transaction => ({
          id: transaction.id,
          user: 'user1', // Default user
          amount: Math.abs(transaction.amount),
          description: transaction.name,
          category: transaction.category,
          date: transaction.date,
          type: transaction.type === 'Income' ? ('income' as const) : ('expense' as const),
          account: transaction.account,
          createdAt: transaction.date,
          updatedAt: transaction.date
        }));
      };
      
      // Get transactions from context
      const transactions = transformTransactions();
      
      // Filter transactions based on date range and type (only expenses)
      const filteredTransactions = transactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate && transaction.type === 'expense';
      });
      
      // Group transactions by category and calculate totals
      const categoryTotals: Record<string, number> = {};
      filteredTransactions.forEach((transaction: any) => {
        if (categoryTotals[transaction.category]) {
          categoryTotals[transaction.category] += transaction.amount;
        } else {
          categoryTotals[transaction.category] = transaction.amount;
        }
      });
      
      // Convert to array and sort by amount (descending)
      const categoryArray = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          name: category,
          amount: amount as number,
          percentage: 0, // Will calculate later
          color: '#4ADE80' // Default color, will be updated
        }))
        .sort((a, b) => b.amount - a.amount);
      
      // Calculate total expenses for percentage calculation
      const totalExpenses = categoryArray.reduce((sum, category) => sum + category.amount, 0);
      
      // If no expenses, set empty array
      if (totalExpenses === 0) {
        setCategoryData([]);
        return;
      }
      
      // Update percentages
      categoryArray.forEach(category => {
        category.percentage = parseFloat(((category.amount / totalExpenses) * 100).toFixed(1));
      });
      
      // Define colors for categories
      const colors = ['#4ADE80', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#F472B6', '#818CF8'];
      
      // Group into top 4 categories + Others
      if (categoryArray.length > 4) {
        // Take top 4 categories
        const topCategories = categoryArray.slice(0, 4);
        
        // Calculate Others category
        const othersAmount = categoryArray.slice(4).reduce((sum, category) => sum + category.amount, 0);
        const othersPercentage = parseFloat(((othersAmount / totalExpenses) * 100).toFixed(1));
        
        // Add Others category if it has value
        if (othersAmount > 0) {
          topCategories.push({
            name: 'Others',
            amount: othersAmount,
            percentage: othersPercentage,
            color: '#94A3B8'
          });
        }
        
        // Assign colors
        const coloredCategories = topCategories.map((category, index) => ({
          ...category,
          color: colors[index % colors.length]
        }));
        
        setCategoryData(coloredCategories);
      } else {
        // Assign colors to all categories
        const coloredCategories = categoryArray.map((category, index) => ({
          ...category,
          color: colors[index % colors.length]
        }));
        
        setCategoryData(coloredCategories);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      // Fallback to mock data
      const mockCategoryData = [
        { name: 'Food & Dining', amount: 450, percentage: 35.4, color: '#4ADE80' },
        { name: 'Transportation', amount: 300, percentage: 23.6, color: '#60A5FA' },
        { name: 'Entertainment', amount: 250, percentage: 19.7, color: '#FBBF24' },
        { name: 'Shopping', amount: 180, percentage: 14.2, color: '#F87171' },
        { name: 'Utilities', amount: 90, percentage: 7.1, color: '#A78BFA' },
      ];
      setCategoryData(mockCategoryData);
    }
  };

  // Fetch budget comparison data
  const fetchBudgetComparisonData = () => {
    try {
      // Only show budget comparison data for "this-month" and "last-month" periods
      // For custom periods, show empty data which will display "No budget data available"
      if (selectedPeriod !== 'this-month' && selectedPeriod !== 'last-month') {
        setBudgetComparisonData([]);
        return;
      }
      
      // Get date ranges for last month and this month
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Transform transactions from context to match the format used in reports
      const transformTransactions = () => {
        return state.transactions.map(transaction => ({
          id: transaction.id,
          user: 'user1', // Default user
          amount: Math.abs(transaction.amount),
          description: transaction.name,
          category: transaction.category,
          date: transaction.date,
          type: transaction.type === 'Income' ? ('income' as const) : ('expense' as const),
          account: transaction.account,
          createdAt: transaction.date,
          updatedAt: transaction.date
        }));
      };
      
      // Get transactions from context
      const transactions = transformTransactions();
      
      // Filter transactions for last month
      const lastMonthTransactions = transactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd && transaction.type === 'expense';
      });
      
      // Filter transactions for this month
      const thisMonthTransactions = transactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= thisMonthStart && transactionDate <= thisMonthEnd && transaction.type === 'expense';
      });
      
      // Group transactions by category and calculate totals for last month
      const lastMonthTotals: Record<string, number> = {};
      lastMonthTransactions.forEach((transaction: any) => {
        if (lastMonthTotals[transaction.category]) {
          lastMonthTotals[transaction.category] += transaction.amount;
        } else {
          lastMonthTotals[transaction.category] = transaction.amount;
        }
      });
      
      // Group transactions by category and calculate totals for this month
      const thisMonthTotals: Record<string, number> = {};
      thisMonthTransactions.forEach((transaction: any) => {
        if (thisMonthTotals[transaction.category]) {
          thisMonthTotals[transaction.category] += transaction.amount;
        } else {
          thisMonthTotals[transaction.category] = transaction.amount;
        }
      });
      
      // Get all unique categories from transactions instead of using hardcoded budget targets
      const allCategories = new Set<string>();
      [...lastMonthTransactions, ...thisMonthTransactions].forEach((transaction: any) => {
        allCategories.add(transaction.category);
      });
      
      // Convert Set to Array
      const categoryList = Array.from(allCategories);
      
      // Create a map of category names to their target values from the budget context
      const categoryTargets: Record<string, number> = {};
      
      // Collect targets from all spending category groups
      Object.values(state.spendingCategories).forEach(group => {
        group.forEach(category => {
          // Only set the target if it hasn't been set yet or if this category has a target
          if (category.target !== undefined && category.target !== null) {
            categoryTargets[category.name] = category.target;
          } else if (categoryTargets[category.name] === undefined) {
            // Default to 0 if no target is set for this category
            categoryTargets[category.name] = 0;
          }
        });
      });
      
      // Calculate budget comparison data using actual category targets
      const comparisonData = categoryList.map(category => {
        // Use the actual target from the category, or default to 500 if not found
        const budgeted = categoryTargets[category] !== undefined ? categoryTargets[category] : 500;
        const lastMonthSpent = lastMonthTotals[category] || 0;
        const thisMonthSpent = thisMonthTotals[category] || 0;
        const lastMonthVariance = lastMonthSpent - budgeted;
        const thisMonthVariance = thisMonthSpent - budgeted;
        
        return {
          category,
          budgeted,
          lastMonthSpent,
          thisMonthSpent,
          lastMonthVariance,
          thisMonthVariance
        };
      });
      
      setBudgetComparisonData(comparisonData);
    } catch (error) {
      console.error('Error fetching budget comparison data:', error);
      // Fallback to mock data
      const mockBudgetData = [
        {
          category: 'Groceries',
          budgeted: 500,
          lastMonthSpent: 550,
          thisMonthSpent: 450,
          lastMonthVariance: 50,
          thisMonthVariance: -50
        }
      ];
      setBudgetComparisonData(mockBudgetData);
    }
  };

  // Fetch payment method data based on date range
  const fetchPaymentMethodData = () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Transform transactions from context to match the format used in reports
      const transformTransactions = () => {
        return state.transactions.map(transaction => ({
          id: transaction.id,
          user: 'user1', // Default user
          amount: Math.abs(transaction.amount),
          description: transaction.name,
          category: transaction.category,
          date: transaction.date,
          type: transaction.type === 'Income' ? ('income' as const) : ('expense' as const),
          account: transaction.account,
          createdAt: transaction.date,
          updatedAt: transaction.date
        }));
      };
      
      // Get transactions from context
      const transactions = transformTransactions();
      
      // Filter transactions based on date range and type (only expenses)
      const filteredTransactions = transactions.filter((transaction: any) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate && transaction.type === 'expense';
      });
      
      // Group transactions by payment method (using account as payment method) and calculate totals
      const paymentMethodTotals: Record<string, { totalAmount: number; transactionCount: number }> = {};
      filteredTransactions.forEach((transaction: any) => {
        const paymentMethod = transaction.account || 'Unknown';
        if (paymentMethodTotals[paymentMethod]) {
          paymentMethodTotals[paymentMethod].totalAmount += transaction.amount;
          paymentMethodTotals[paymentMethod].transactionCount += 1;
        } else {
          paymentMethodTotals[paymentMethod] = {
            totalAmount: transaction.amount,
            transactionCount: 1
          };
        }
      });
      
      // Convert to array and sort by total amount (descending)
      const paymentMethodArray = Object.entries(paymentMethodTotals)
        .map(([paymentMethod, data]) => ({
          name: paymentMethod,
          totalAmount: data.totalAmount,
          transactionCount: data.transactionCount
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
      
      // Show all payment methods
      setPaymentMethodData(paymentMethodArray);
    } catch (error) {
      console.error('Error fetching payment method data:', error);
      // Fallback to mock data
      const mockPaymentMethodData = [
        { name: 'Credit Card', totalAmount: 1250.00, transactionCount: 12 },
        { name: 'Checking Account', totalAmount: 850.75, transactionCount: 8 },
        { name: 'Cash', totalAmount: 420.50, transactionCount: 15 }
      ];
      setPaymentMethodData(mockPaymentMethodData);
    }
  };

  // Fetch data when period changes
  useEffect(() => {
    fetchFinancialData();
    fetchCategoryData();
    fetchBudgetComparisonData();
    fetchPaymentMethodData();
  }, [state.transactions, selectedPeriod, fromDay, fromMonth, fromYear, toDay, toMonth, toYear]);

  // Chart configuration
  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#1E293B',
    backgroundGradientTo: '#1E293B',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, 0)`, // Keep labels transparent
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
    barPercentage: 1.4,
    yAxisLabel: '',
    yAxisSuffix: '',
    yAxisInterval: 1,
  };

  // Chart data with improved colors
  const chartData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [incomeData, expenseData],
        colors: [
          (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,  // Green for income
          (opacity = 1) => `rgba(248, 113, 113, ${opacity})`  // Red for expenses
        ]
      },
    ],
  };

  // Handle period selection
  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    if (period === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
    }
  };

  // Handle date input changes with numeric validation and auto-focus
  const handleFromDayChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 2) {
      setFromDay(numericValue);
      // Auto-focus to month when day is filled with 2 digits
      if (numericValue.length === 2 && fromMonthRef.current) {
        fromMonthRef.current.focus();
      }
    }
  };

  const handleFromMonthChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 2) {
      setFromMonth(numericValue);
      // Auto-focus to year when month is filled with 2 digits
      if (numericValue.length === 2 && fromYearRef.current) {
        fromYearRef.current.focus();
      }
    }
  };

  const handleFromYearChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 4) {
      setFromYear(numericValue);
      // Auto-focus to 'To' day when year is filled with 4 digits
      if (numericValue.length === 4 && toDayRef.current) {
        toDayRef.current.focus();
      }
    }
  };

  const handleToDayChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 2) {
      setToDay(numericValue);
      // Auto-focus to month when day is filled with 2 digits
      if (numericValue.length === 2 && toMonthRef.current) {
        toMonthRef.current.focus();
      }
    }
  };

  const handleToMonthChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 2) {
      setToMonth(numericValue);
      // Auto-focus to year when month is filled with 2 digits
      if (numericValue.length === 2 && toYearRef.current) {
        toYearRef.current.focus();
      }
    }
  };

  const handleToYearChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    if (numericValue.length <= 4) {
      setToYear(numericValue);
    }
  };

  // Calculate bar widths for the chart
  const maxBarWidth = 200;
  const maxData = Math.max(incomeData, expenseData);
  const incomeBarWidth = (incomeData / maxData) * maxBarWidth;
  const expenseBarWidth = (expenseData / maxData) * maxBarWidth;

  // Sample data for spending by category
  // This will be replaced by dynamic data
  /*
  const categoryData = [
    { name: 'Food & Dining', amount: 450, percentage: 35.4, color: '#4ADE80' },
    { name: 'Transportation', amount: 300, percentage: 23.6, color: '#60A5FA' },
    { name: 'Entertainment', amount: 250, percentage: 19.7, color: '#FBBF24' },
    { name: 'Shopping', amount: 180, percentage: 14.2, color: '#F87171' },
    { name: 'Utilities', amount: 90, percentage: 7.1, color: '#A78BFA' },
  ];
  */

  // Sample data for monthly budget comparison
  const budgetData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [5000, 5200, 4800, 5500, 5100, 5300], // Income
        color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`, // Green
      },
      {
        data: [4200, 4500, 4100, 4800, 4600, 4700], // Expenses
        color: (opacity = 1) => `rgba(248, 113, 113, ${opacity})`, // Red
      },
    ],
  };

  // Prepare data for pie chart with absolute values to show percentages
  const pieData = categoryData.map((category, index) => ({
    name: category.name,
    population: category.percentage,
    color: category.color,
    legendFontColor: '#94A3B8',
    legendFontSize: 12,
  }));

  // Prepare data for payment method pie chart
  const paymentMethodPieData = paymentMethodData.map((method, index) => {
    // Calculate total spending across all payment methods
    const totalSpending = paymentMethodData.reduce((sum, m) => sum + m.totalAmount, 0);
    const percentage = totalSpending > 0 ? (method.totalAmount / totalSpending) * 100 : 0;
    
    // Define colors for payment methods
    const colors = ['#4ADE80', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA'];
    
    return {
      name: method.name,
      population: percentage,
      color: colors[index % colors.length],
      legendFontColor: '#94A3B8',
      legendFontSize: 12,
    };
  });

  // Custom Donut Chart Component for payment methods
  const CustomPaymentMethodChart = ({ data, width, height }: { data: Array<{ name: string; population: number; color: string }>; width: number; height: number }) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 20; // Reduced from 15 to 20
    const innerRadius = outerRadius * 0.6; // Create empty center
    
    // Calculate the total percentage to normalize values
    const totalPercentage = data.reduce((sum, item) => sum + item.population, 0);
    
    // Calculate total spending amount
    const totalSpending = paymentMethodData.reduce((sum, method) => sum + method.totalAmount, 0);
    
    // Create segments for each payment method with proportional areas
    let startAngle = 0;
    const segments = data.map((item, index) => {
      // Special handling for single payment method - occupy full circle
      let segmentAngle, endAngle;
      if (data.length === 1) {
        // If there's only one payment method, make it a full circle
        segmentAngle = 2 * Math.PI;
        endAngle = 2 * Math.PI;
      } else {
        // Calculate angle based on percentage
        segmentAngle = (item.population / totalPercentage) * 2 * Math.PI;
        endAngle = startAngle + segmentAngle;
      }
      
      // Calculate mid angle for text positioning
      const midAngle = startAngle + segmentAngle / 2;
      
      // Calculate position for text (closer to edge for better visibility)
      const textRadius = innerRadius + (outerRadius - innerRadius) / 2;
      const textX = centerX + textRadius * Math.cos(midAngle);
      const textY = centerY + textRadius * Math.sin(midAngle);
      
      const segment = {
        ...item,
        startAngle,
        endAngle,
        midAngle,
        textX,
        textY
      };
      
      startAngle = endAngle;
      return segment;
    });
    
    return (
      <View style={{ width, height }}>
        <Svg width={width} height={height}>
          {/* Background circle */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={(innerRadius + outerRadius) / 2}
            fill="none"
            stroke="#334155"
            strokeWidth="1"
          />
          
          {/* Segments for each payment method */}
          {segments.map((segment, index) => {
            // For single payment method, draw a full donut segment with text positioned within the segment
            if (data.length === 1) {
              // Create a full circle donut segment (359 degrees to leave a small gap)
              const segmentAngle = 2 * Math.PI * 0.997; // Almost full circle
              const endAngle = segmentAngle;
              
              // Calculate segment width for text sizing
              const segmentWidth = outerRadius - innerRadius;
              
              // Create path for the full donut segment
              const x1 = centerX + innerRadius * Math.cos(0);
              const y1 = centerY + innerRadius * Math.sin(0);
              const x2 = centerX + outerRadius * Math.cos(0);
              const y2 = centerY + outerRadius * Math.sin(0);
              const x3 = centerX + outerRadius * Math.cos(endAngle);
              const y3 = centerY + outerRadius * Math.sin(endAngle);
              const x4 = centerX + innerRadius * Math.cos(endAngle);
              const y4 = centerY + innerRadius * Math.sin(endAngle);
              
              // Create path data for the full segment
              const largeArcFlag = 1; // Always use large arc for full circle
              const pathData = `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`;
              
              // Position text in the center of the donut segment
              const textRadius = innerRadius + segmentWidth * 0.5; // Center between inner and outer radius
              const textAngle = Math.PI; // 180 degrees
              const textX = centerX + textRadius * Math.cos(textAngle);
              const textY = centerY + textRadius * Math.sin(textAngle);
              
              // Dynamic text sizing based on segment dimensions
              let fontSize = Math.min(18, Math.max(12, segmentWidth * 0.15)); // Scale font size to segment width
              let nameFontSize = Math.min(16, Math.max(10, segmentWidth * 0.13));
              
              // Calculate max characters based on available space
              const maxChars = Math.max(12, Math.floor(segmentWidth / (nameFontSize * 0.5)));
              
              return (
                <React.Fragment key={index}>
                  {/* Full donut segment */}
                  <Path
                    d={pathData}
                    fill={segment.color}
                    stroke="#FFFFFF"
                    strokeWidth="1"
                  />
                  
                  {/* Payment method name and percentage - positioned within the segment */}
                  <SvgText
                    x={textX}
                    y={textY - (nameFontSize / 2 + 2)}
                    fill="#F1F5F9"
                    fontSize={nameFontSize}
                    fontWeight="500"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {segment.name.length > maxChars ? truncateText(segment.name, maxChars - 3) : segment.name}
                  </SvgText>
                  <SvgText
                    x={textX}
                    y={textY + (fontSize / 2 + 2)}
                    fill="#F1F5F9"
                    fontSize={fontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {`${segment.population.toFixed(1)}%`}
                  </SvgText>
                </React.Fragment>
              );
            }
            
            // Create path for each segment (arc)
            const x1 = centerX + innerRadius * Math.cos(segment.startAngle);
            const y1 = centerY + innerRadius * Math.sin(segment.startAngle);
            const x2 = centerX + outerRadius * Math.cos(segment.startAngle);
            const y2 = centerY + outerRadius * Math.sin(segment.startAngle);
            const x3 = centerX + outerRadius * Math.cos(segment.endAngle);
            const y3 = centerY + outerRadius * Math.sin(segment.endAngle);
            const x4 = centerX + innerRadius * Math.cos(segment.endAngle);
            const y4 = centerY + innerRadius * Math.sin(segment.endAngle);
            
            // For very small segments, draw a line instead of an arc
            const largeArcFlag = segment.endAngle - segment.startAngle > Math.PI ? 1 : 0;
            
            // Create path data for the segment
            let pathData;
            if (segment.endAngle - segment.startAngle < 0.1) {
              // Very small segment - draw a line
              pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
            } else {
              // Regular segment - draw an arc
              pathData = `M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1} ${y1}`;
            }
            
            // Check if segment is large enough to display text
            // Convert angle from radians to degrees for easier comparison
            const segmentAngleDegrees = ((segment.endAngle - segment.startAngle) * 180) / Math.PI;
            const showText = segmentAngleDegrees > 5; // Reduced threshold to show text in smaller segments
            
            // For very small segments, we might want to adjust text positioning
            let textX = segment.textX;
            let textY = segment.textY;
            let fontSize = 13; // Slightly larger default font size
            
            // If segment is small but not tiny, reduce font size
            if (segmentAngleDegrees < 20 && segmentAngleDegrees > 10) {
              fontSize = 11;
            }
            
            // Calculate safe text boundaries for multi-segment case - better centering
            if (showText) {
              // Calculate the exact center of the segment for better text positioning
              const safeInnerRadius = innerRadius + 5;  // Minimal padding
              const safeOuterRadius = outerRadius - 5;  // Minimal padding
              const midAngle = (segment.startAngle + segment.endAngle) / 2;
              // Position text exactly in the center of the segment
              const safeTextRadius = (safeInnerRadius + safeOuterRadius) / 2;
              
              textX = centerX + safeTextRadius * Math.cos(midAngle);
              textY = centerY + safeTextRadius * Math.sin(midAngle);
            }
            
            // Calculate max text length based on segment size - more generous and accurate calculation
            const segmentWidth = outerRadius - innerRadius;
            // Dynamic sizing based on actual segment width
            let dynamicFontSize = fontSize;
            const textWidth = measureTextWidth(segment.name, fontSize);
            if (textWidth > segmentWidth * 0.9) { // If text is wider than 90% of segment width
              // Reduce font size proportionally
              const ratio = (segmentWidth * 0.9) / textWidth;
              dynamicFontSize = Math.max(10, Math.floor(fontSize * ratio));
            }
            
            // More accurate: assume ~4.5 pixels per character for better fit with dynamic sizing
            const pixelsPerChar = dynamicFontSize * 0.45;
            const maxTextLength = Math.max(12, Math.floor(segmentWidth / pixelsPerChar));
            
            return (
              <React.Fragment key={index}>
                {/* Segment fill */}
                <Path
                  d={pathData}
                  fill={segment.color}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
                
                {/* Payment method name and percentage - only show if segment is large enough */}
                {showText && (
                  <React.Fragment>
                    <SvgText
                      x={textX}
                      y={textY - (dynamicFontSize / 2 + 2)}
                      fill="#F1F5F9"
                      fontSize={dynamicFontSize}
                      fontWeight="500"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {segment.name.length > maxTextLength ? truncateText(segment.name, maxTextLength - 3) : segment.name}
                    </SvgText>
                    <SvgText
                      x={textX}
                      y={textY + (dynamicFontSize / 2 + 2)}
                      fill="#F1F5F9"
                      fontSize={dynamicFontSize === 11 ? 10 : 12}
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {`${segment.population.toFixed(1)}%`}
                    </SvgText>
                  </React.Fragment>
                )}
              </React.Fragment>
            );
          })}
          
          {/* Total spending in the center */}
          <SvgText
            x={centerX}
            y={centerY}
            fill={colors.weakText}
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
          >
            Total Spent
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 20}
            fill={colors.weakText}
            fontSize="20"
            fontWeight="700"
            textAnchor="middle"
          >
            {formatCurrency(totalSpending)}
          </SvgText>
        </Svg>
      </View>
    );
  };

  // Pie chart configuration
  const pieChartConfig = {
    backgroundColor: 'transparent',
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  // Monthly budget comparison chart configuration
  const budgetChartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: '#1E293B',
    backgroundGradientTo: '#1E293B',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(148, 163, 184, 1)`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#fff',
    },
    barPercentage: 0.6,
  };

  return (
    <ThemedView style={styles.container}>
      {/* Fixed Header with Title and Options */}
      <View style={[styles.fixedHeader, { backgroundColor: colors.background }]}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Reports
          </Text>
        </View>
        
        {/* Period Selection Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={[
              styles.optionButton, 
              selectedPeriod === 'this-month' && styles.selectedOption,
              { 
                backgroundColor: selectedPeriod === 'this-month' ? colors.tabBackground : colors.background,
                borderColor: selectedPeriod === 'this-month' ? colors.tabIconSelected : colors.border
              }
            ]}
            onPress={() => handlePeriodSelect('this-month')}
          >
            <Text style={[
              styles.optionText,
              selectedPeriod === 'this-month' && styles.selectedOptionText,
              { 
                color: selectedPeriod === 'this-month' ? colors.text : colors.weakText
              }
            ]}>
              This Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.optionButton, 
              selectedPeriod === 'last-month' && styles.selectedOption,
              { 
                backgroundColor: selectedPeriod === 'last-month' ? colors.tabBackground : colors.background,
                borderColor: selectedPeriod === 'last-month' ? colors.tabIconSelected : colors.border
              }
            ]}
            onPress={() => handlePeriodSelect('last-month')}
          >
            <Text style={[
              styles.optionText,
              selectedPeriod === 'last-month' && styles.selectedOptionText,
              { 
                color: selectedPeriod === 'last-month' ? colors.text : colors.weakText
              }
            ]}>
              Last Month
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.optionButton, 
              selectedPeriod === 'custom' && styles.selectedOption,
              { 
                backgroundColor: selectedPeriod === 'custom' ? colors.tabBackground : colors.background,
                borderColor: selectedPeriod === 'custom' ? colors.tabIconSelected : colors.border
              }
            ]}
            onPress={() => handlePeriodSelect('custom')}
          >
            <Text style={[
              styles.optionText,
              selectedPeriod === 'custom' && styles.selectedOptionText,
              { 
                color: selectedPeriod === 'custom' ? colors.text : colors.weakText
              }
            ]}>
              Custom
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Custom Date Range Box - Fixed below options */}
        {showCustomRange && (
          <View style={styles.dateRow}>
            {/* From Date */}
            <View style={styles.dateInputGroup}>
              <View style={[styles.dateBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  ref={fromDayRef}
                  style={[styles.dateInput, { color: colors.text }]}
                  value={fromDay}
                  onChangeText={handleFromDayChange}
                  placeholder="DD"
                  placeholderTextColor={colors.weakText}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                  onSubmitEditing={() => fromMonthRef.current?.focus()}
                />
                <Text style={[styles.fixedSeparator, { color: colors.weakText }]}>/</Text>
                <TextInput
                  ref={fromMonthRef}
                  style={[styles.dateInput, { color: colors.text }]}
                  value={fromMonth}
                  onChangeText={handleFromMonthChange}
                  placeholder="MM"
                  placeholderTextColor={colors.weakText}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                  onSubmitEditing={() => fromYearRef.current?.focus()}
                />
                <Text style={[styles.fixedSeparator, { color: colors.weakText }]}>/</Text>
                <TextInput
                  ref={fromYearRef}
                  style={[styles.dateInput, { color: colors.text }]}
                  value={fromYear}
                  onChangeText={handleFromYearChange}
                  placeholder="YYYY"
                  placeholderTextColor={colors.weakText}
                  keyboardType="numeric"
                  maxLength={4}
                  selectTextOnFocus
                  onSubmitEditing={() => toDayRef.current?.focus()}
                />
              </View>
            </View>
            
            {/* To Label */}
            <Text style={[styles.toLabel, { color: colors.weakText }]}>To</Text>
            
            {/* To Date */}
            <View style={styles.dateInputGroup}>
              <View style={[styles.dateBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  ref={toDayRef}
                  style={[styles.dateInput, { color: colors.text }]}
                  value={toDay}
                  onChangeText={handleToDayChange}
                  placeholder="DD"
                  placeholderTextColor={colors.weakText}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                  onSubmitEditing={() => toMonthRef.current?.focus()}
                />
                <Text style={[styles.fixedSeparator, { color: colors.weakText }]}>/</Text>
                <TextInput
                  ref={toMonthRef}
                  style={[styles.dateInput, { color: colors.text }]}
                  value={toMonth}
                  onChangeText={handleToMonthChange}
                  placeholder="MM"
                  placeholderTextColor={colors.weakText}
                  keyboardType="numeric"
                  maxLength={2}
                  selectTextOnFocus
                  onSubmitEditing={() => toYearRef.current?.focus()}
                />
                <Text style={[styles.fixedSeparator, { color: colors.weakText }]}>/</Text>
                <TextInput
                  ref={toYearRef}
                  style={[styles.dateInput, { color: colors.text }]}
                  value={toYear}
                  onChangeText={handleToYearChange}
                  placeholder="YYYY"
                  placeholderTextColor={colors.weakText}
                  keyboardType="numeric"
                  maxLength={4}
                  selectTextOnFocus
                />
              </View>
            </View>
          </View>
        )}
      </View>
      
      {/* Background filler for the gap between header and scrollable content */}
      <View style={[styles.headerGapFiller, { backgroundColor: colors.background, height: 160 }]} />
      
      {/* Scrollable Content */}
      <ScrollView style={[styles.scrollContent, { backgroundColor: colors.background }]}>
        {/* Income vs Expense Chart */}
        <View>
          <Text style={[styles.standaloneChartTitle, { color: colors.text }]}>Income vs. Expenses</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.loadingText, { color: colors.weakText }]}>Loading...</Text>
              </View>
            ) : chartData.datasets[0].data.length === 0 && chartData.datasets[1].data.length === 0 ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.chartSubtitle, { color: colors.weakText }]}>No income or expense data available</Text>
              </View>
            ) : (
              <>
                <BarChart
                  data={chartData}
                  width={300}
                  height={250}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={chartConfig}
                  style={styles.chart}
                  verticalLabelRotation={0}
                  fromZero={true}
                  showValuesOnTopOfBars={true}
                  withCustomBarColorFromData={true}
                  flatColor={true}
                  withInnerLines={false}
                />
                {/* Axis line under the bars */}
                <View style={[styles.axisLine, { backgroundColor: colors.weakText }]} />
              </>
            )}
            
            {/* Legend for the chart */}
            <View style={styles.chartLegend}>
              <View style={[styles.legendItem, styles.incomeLegendItem]}>
                <View style={[styles.legendColor, styles.incomeLegend]} />
                <Text style={[styles.legendText, { color: colors.weakText }]}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, styles.expenseLegend]} />
                <Text style={[styles.legendText, { color: colors.weakText }]}>Expenses</Text>
              </View>
            </View>
            {/* View Details Button */}
            <TouchableOpacity 
              style={[
                styles.viewDetailsButton,
                (incomeData + expenseData === 0) && styles.disabledButton,
                { 
                  backgroundColor: colors.cardBackground,
                  borderColor: (incomeData + expenseData === 0) ? colors.border : colors.border
                }
              ]}
              onPress={() => router.push({
                pathname: '/income-expense-details',
                params: { 
                  period: selectedPeriod,
                  startDate: selectedPeriod === 'custom' ? `${fromYear}-${fromMonth}-${fromDay}` : undefined,
                  endDate: selectedPeriod === 'custom' ? `${toYear}-${toMonth}-${toDay}` : undefined
                }
              })}
              disabled={incomeData + expenseData === 0}
            >
              <Text style={[
                styles.viewDetailsText,
                (incomeData + expenseData === 0) && styles.disabledText,
                { 
                  color: (incomeData + expenseData === 0) ? colors.weakText : colors.text
                }
              ]}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Spending by Category Section */}
        <View>
          <Text style={[styles.standaloneChartTitle, { color: colors.text }]}>Spending by Category</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Custom Circle Chart visualization for spending by category */}
            <View style={styles.centeredPieChartContainer}>
              {pieData.length > 0 ? (
                <CustomCircleChart 
                  data={pieData} 
                  width={300} 
                  height={300} 
                />
              ) : (
                <Text style={[styles.chartSubtitle, { color: colors.weakText }]}>No category data available</Text>
              )}
            </View>
            
            {/* View Details Button */}
            <TouchableOpacity 
              style={[
                styles.viewDetailsButton,
                (pieData.length === 0) && styles.disabledButton,
                { 
                  backgroundColor: colors.cardBackground,
                  borderColor: (pieData.length === 0) ? colors.border : colors.border
                }
              ]}
              onPress={() => {
                console.log('=== DEBUG REPORTS SCREEN NAVIGATION ===');
                console.log('Navigating with params:', { 
                  period: selectedPeriod,
                  startDate: selectedPeriod === 'custom' ? `${fromYear}-${fromMonth}-${fromDay}` : undefined,
                  endDate: selectedPeriod === 'custom' ? `${toYear}-${toMonth}-${toDay}` : undefined
                });
                router.push({
                  pathname: '/category-details',
                  params: { 
                    period: selectedPeriod,
                    startDate: selectedPeriod === 'custom' ? `${fromYear}-${fromMonth}-${fromDay}` : undefined,
                    endDate: selectedPeriod === 'custom' ? `${toYear}-${toMonth}-${toDay}` : undefined
                  }
                });
              }}
              disabled={pieData.length === 0}
            >
              <Text style={[
                styles.viewDetailsText,
                (pieData.length === 0) && styles.disabledText,
                { 
                  color: (pieData.length === 0) ? colors.weakText : colors.text
                }
              ]}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Monthly Budget Comparison Section */}
        <View>
          <Text style={[styles.standaloneChartTitle, { color: colors.text }]}>Monthly Budget Comparison</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Budget Categories with Two Boxes - Show only first category */}
            {budgetComparisonData.length > 0 ? (
              <View style={styles.categoryContainer}>
                <Text style={[styles.categoryName, { color: colors.text }]}>{budgetComparisonData[0].category}</Text>
                <View style={styles.boxesContainer}>
                  <View style={[styles.monthBox, styles.lastMonthBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.boxLabel, styles.whiteText, { color: colors.weakText }]}>Last Month</Text>
                    <View style={styles.subtitleContainer}>
                      <Text style={[styles.boxSubtitle, { color: colors.weakText }]}>Budgeted</Text>
                      <Text style={[styles.boxAmount, { color: colors.text }]}>{formatCurrency(budgetComparisonData[0].budgeted)}</Text>
                      <Text style={[styles.boxSubtitle, { color: colors.weakText }]}>Spent</Text>
                      <Text style={[styles.boxAmount, { color: colors.text }]}>{formatCurrency(budgetComparisonData[0].lastMonthSpent)}</Text>
                      <Text style={[styles.boxSubtitle, { color: colors.weakText }]}>Variance</Text>
                      <Text style={[styles.boxAmount, budgetComparisonData[0].lastMonthVariance >= 0 ? styles.overBudget : styles.underBudget]}>
                        {formatCurrency(Math.abs(budgetComparisonData[0].lastMonthVariance))} {budgetComparisonData[0].lastMonthVariance >= 0 ? 'over' : 'under'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.monthBox, styles.thisMonthBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                    <Text style={[styles.boxLabel, styles.whiteText, { color: colors.weakText }]}>This Month</Text>
                    <View style={styles.subtitleContainer}>
                      <Text style={[styles.boxSubtitle, { color: colors.weakText }]}>Budgeted</Text>
                      <Text style={[styles.boxAmount, { color: colors.text }]}>{formatCurrency(budgetComparisonData[0].budgeted)}</Text>
                      <Text style={[styles.boxSubtitle, { color: colors.weakText }]}>Spent</Text>
                      <Text style={[styles.boxAmount, { color: colors.text }]}>{formatCurrency(budgetComparisonData[0].thisMonthSpent)}</Text>
                      <Text style={[styles.boxSubtitle, { color: colors.weakText }]}>Variance</Text>
                      <Text style={[styles.boxAmount, budgetComparisonData[0].thisMonthVariance >= 0 ? styles.overBudget : styles.underBudget]}>
                        {formatCurrency(Math.abs(budgetComparisonData[0].thisMonthVariance))} {budgetComparisonData[0].thisMonthVariance >= 0 ? 'over' : 'under'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <Text style={[styles.chartSubtitle, { color: colors.weakText }]}>No budget data available</Text>
              </View>
            )}
            
            {/* View Details Button */}
            <TouchableOpacity 
              style={[
                styles.viewDetailsButton,
                (budgetComparisonData.length === 0) && styles.disabledButton,
                { 
                  backgroundColor: colors.cardBackground,
                  borderColor: (budgetComparisonData.length === 0) ? colors.border : colors.border
                }
              ]}
              onPress={() => router.push({
                pathname: '/monthly-budget-comparison' as any,
                params: { 
                  period: selectedPeriod,
                  startDate: selectedPeriod === 'custom' ? `${fromYear}-${fromMonth}-${fromDay}` : undefined,
                  endDate: selectedPeriod === 'custom' ? `${toYear}-${toMonth}-${toDay}` : undefined
                }
              })}
              disabled={budgetComparisonData.length === 0}
            >
              <Text style={[
                styles.viewDetailsText,
                (budgetComparisonData.length === 0) && styles.disabledText,
                { 
                  color: (budgetComparisonData.length === 0) ? colors.weakText : colors.text
                }
              ]}>View More</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Spending by Payment Method Section */}
        <View>
          <Text style={[styles.standaloneChartTitle, { color: colors.text }]}>Spending by Payment Method</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Custom Circular Bar Chart for Payment Methods */}
            <View style={styles.centeredPieChartContainer}>
              {paymentMethodPieData.length > 0 ? (
                <CustomPaymentMethodChart 
                  data={paymentMethodPieData} 
                  width={300} 
                  height={300} 
                />
              ) : (
                <Text style={[styles.chartSubtitle, { color: colors.weakText }]}>No payment method data available</Text>
              )}
            </View>
            
            {/* View Details Button */}
            <TouchableOpacity 
              style={[
                styles.viewDetailsButton,
                (paymentMethodPieData.length === 0) && styles.disabledButton,
                { 
                  backgroundColor: colors.cardBackground,
                  borderColor: (paymentMethodPieData.length === 0) ? colors.border : colors.border
                }
              ]}
              onPress={() => router.push({
                pathname: '/payment-method-details',
                params: { 
                  period: selectedPeriod,
                  startDate: selectedPeriod === 'custom' ? `${fromYear}-${fromMonth}-${fromDay}` : undefined,
                  endDate: selectedPeriod === 'custom' ? `${toYear}-${toMonth}-${toDay}` : undefined
                },
              })}
              disabled={paymentMethodPieData.length === 0}
            >
              <Text style={[
                styles.viewDetailsText,
                (paymentMethodPieData.length === 0) && styles.disabledText,
                { 
                  color: (paymentMethodPieData.length === 0) ? colors.weakText : colors.text
                }
              ]}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Add some padding at the bottom for better scroll experience */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </ThemedView>
  );
}

// Simplified styles without theme colors (we'll apply theme colors inline)
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: 20,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  bottomPadding: {
    height: 50,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    // Add some padding top to create space between title and options
    paddingTop: 10,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedOption: {
    backgroundColor: '#334155',
    borderColor: '#4A5568',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#F1F5F9',
  },
  scrollContent: {
    flex: 1,
    marginTop: 160, // Increased margin to add spacing between options and content
    flexGrow: 1,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 47, // Changed back to 47 for consistency
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
    marginTop: 20, // Added marginTop to create space between title and chart
  },
  chartHeader: {
    marginBottom: 10,
    alignItems: 'flex-start',
    width: '100%',
    paddingLeft: 0,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 0,
    marginBottom: 10, // Add margin to separate from box
  },
  standaloneChartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
    marginLeft: 36, // Align with the content inside the box
    marginBottom: -8, // Increased from -8 to 10 for more spacing below title
  },
  chartSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  chart: {
    marginVertical: 10,
    borderRadius: 16,
    alignSelf: 'center',
    marginRight: 15,  // Reduced from 25 to 15 to prevent left overflow
    marginLeft: 5,    // Add a small left margin to ensure it stays within bounds
  },
  axisLine: {
    height: 2,
    width: 280,
    alignSelf: 'center',
    marginTop: -56,  // Remove negative margin to position at the base of the bars
    marginBottom: 15,
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    marginBottom: 5,
    width: '100%',
    paddingHorizontal: 30,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 0,
  },
  incomeLegendItem: {
    marginRight: 10, // Move income legend slightly to the right
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  incomeLegend: {
    backgroundColor: '#4ADE80',
  },
  expenseLegend: {
    backgroundColor: '#F87171',
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewDetailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: 8,  // Reduced from 15 to 8
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  viewDetailsText: {
    fontSize: 13,    // Reduced from 15
    fontWeight: '500', // Reduced from 600
  },
  disabledButton: {
    backgroundColor: '#334155',
    borderColor: '#4A5568',
  },
  disabledText: {
    color: '#CBD5E1',
  },
  treemapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  treemapBlock: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  treemapLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 5,
  },
  treemapValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateSelectorContainer: {
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    borderWidth: 1,
  },
  dateSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  dateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
  },
  dateInput: {
    fontSize: 14,
    fontWeight: '600',
    width: 35,
    textAlign: 'center',
    padding: 0,
  },
  monthSelector: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    padding: 0,
    width: 80,
  },
  yearSelector: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    padding: 0,
    width: 60,
  },
  arrowButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedSeparator: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 2,
  },
  toLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  headerGapFiller: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 99,
  },
  centeredPieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  categoryContainer: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  boxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  monthBox: {
    borderRadius: 12,
    padding: 15,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
  },
  lastMonthBox: {
    marginRight: 5,
  },
  thisMonthBox: {
    marginLeft: 5,
  },
  boxLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  boxAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  whiteText: {
    color: '#F1F5F9',
  },
  subtitleContainer: {
    alignItems: 'flex-start',
    marginTop: 10,
    width: '100%',
  },
  boxSubtitle: {
    fontSize: 12,     // Smaller than the main labels
    fontWeight: '400',
    marginBottom: 5,
  },
  overBudget: {
    color: '#F87171', // Red color for over budget
  },
  underBudget: {
    color: '#4ADE80', // Green color for under budget
  },
  merchantList: {
    width: '100%',
    marginBottom: 20,
  },
  merchantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  merchantInfo: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  merchantAmount: {
    fontSize: 14,  // Reduced from 16 to 14 for a more professional appearance
    fontWeight: '600',  // Reduced from 700 to 600 for a more subtle look
  },
  merchantTransactions: {
    fontSize: 14,
    fontWeight: '400',
  }
});

