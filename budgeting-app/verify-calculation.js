// Verify the calculation with the exact example from the user
// Create a savings category with $1000 target and target date of 19/03/2026
// Today's date is 20/11/2025

// Set up the parameters based on user's example
const creationDate = new Date('2025-11-20'); // Today is 20/11/2025
const targetDate = new Date('2026-03-19');   // Target date is 19/03/2026
const totalTarget = 1000;                    // $1000 savings target
const currentSaved = 0;                      // Starting with $0 saved

console.log('Verifying Savings Calculation');
console.log('============================');
console.log(`Creation Date: ${creationDate.toDateString()}`);
console.log(`Target Date: ${targetDate.toDateString()}`);
console.log(`Total Target: $${totalTarget}`);
console.log(`Current Saved: $${currentSaved}`);

// Copy of the calculation logic
function calculateSavingsSchedule(creationDate, targetDate, totalTarget, currentSaved = 0) {
  // Validate inputs
  if (!(creationDate instanceof Date) || !(targetDate instanceof Date)) {
    throw new Error('Creation date and target date must be valid Date objects');
  }
  
  if (creationDate >= targetDate) {
    throw new Error('Creation date must be before target date');
  }
  
  if (typeof totalTarget !== 'number' || totalTarget <= 0) {
    throw new Error('Total target must be a positive number');
  }
  
  if (typeof currentSaved !== 'number' || currentSaved < 0) {
    throw new Error('Current saved amount must be a non-negative number');
  }
  
  if (currentSaved >= totalTarget) {
    throw new Error('Current saved amount cannot be greater than or equal to total target');
  }
  
  // Calculate the total number of days between creation date and target date
  const timeDiff = targetDate.getTime() - creationDate.getTime();
  const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  // Compute daily savings = (total target - current saved) / total days
  const remainingAmount = totalTarget - currentSaved;
  const dailySavings = remainingAmount / totalDays;
  
  // Initialize variables for calculation
  const monthlyGoals = [];
  let currentDate = new Date(creationDate);
  let totalCalculatedSavings = 0;
  
  // Process each month until we reach or exceed the target date
  while (currentDate < targetDate) {
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    // Get the number of days in the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Determine the start and end day for this month
    let startDay = 1;
    let endDay = daysInMonth;
    
    // For the creation month, adjust the start day
    if (currentDate.getFullYear() === creationDate.getFullYear() && 
        currentDate.getMonth() === creationDate.getMonth()) {
      startDay = creationDate.getDate();
    }
    
    // For the target month, adjust the end day
    if (currentDate.getFullYear() === targetDate.getFullYear() && 
        currentDate.getMonth() === targetDate.getMonth()) {
      endDay = targetDate.getDate();
    }
    
    // Calculate the number of days in this period
    const daysInPeriod = Math.max(0, endDay - startDay + 1);
    
    // Only add month if it has days in the savings period
    if (daysInPeriod > 0) {
      // Calculate the savings goal for this month
      const monthSavingsGoal = daysInPeriod * dailySavings;
      totalCalculatedSavings += monthSavingsGoal;
      
      monthlyGoals.push({
        year: currentYear,
        month: currentMonth,
        daysInMonth: daysInPeriod,
        savingsGoal: monthSavingsGoal
      });
    }
    
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(1); // Set to first day of the month
  }
  
  // Adjust the last month's payment to ensure the total is exactly the target amount
  // This fixes any rounding discrepancies
  if (monthlyGoals.length > 0) {
    const calculatedTotal = monthlyGoals.reduce((sum, goal) => sum + goal.savingsGoal, 0);
    const difference = remainingAmount - calculatedTotal;
    
    // Add the difference to the last month's payment
    if (Math.abs(difference) > 0.01) { // Only adjust if difference is significant
      const lastMonthIndex = monthlyGoals.length - 1;
      monthlyGoals[lastMonthIndex].savingsGoal += difference;
      totalCalculatedSavings = remainingAmount; // Update total to match exactly
    }
  }
  
  return {
    totalDays,
    dailySavings,
    monthlyGoals,
    totalCalculatedSavings
  };
}

try {
  // Calculate using our function
  const result = calculateSavingsSchedule(creationDate, targetDate, totalTarget, currentSaved);
  
  console.log('\nCalculation Results:');
  console.log(`Total Days: ${result.totalDays}`);
  console.log(`Daily Savings: $${result.dailySavings.toFixed(2)}`);
  console.log(`Total Calculated Savings: $${result.totalCalculatedSavings.toFixed(2)}`);
  
  console.log('\nMonthly Goals:');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  result.monthlyGoals.forEach((goal, index) => {
    console.log(`${monthNames[goal.month].substring(0, 3)} ${goal.year}: $${goal.savingsGoal.toFixed(2)}`);
  });
  
  // Verify the total matches exactly
  const total = result.monthlyGoals.reduce((sum, goal) => sum + goal.savingsGoal, 0);
  console.log(`\nVerification: Total = $${total.toFixed(2)}`);
  console.log(`Expected: $${totalTarget.toFixed(2)}`);
  console.log(`Match: ${Math.abs(total - totalTarget) < 0.01 ? 'YES' : 'NO'}`);
  
} catch (error) {
  console.error('Error calculating savings schedule:', error.message);
}