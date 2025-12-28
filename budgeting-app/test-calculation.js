// Simplified test for the calculation logic

// Set up the parameters based on user's example
// Today is 20/11/2025, target is 19/03/2026, amount is $1000
const creationDate = new Date('2025-11-20'); // Today is 20/11/2025
const targetDate = new Date('2026-03-19');   // Target date is 19/03/2026
const totalTarget = 1000;                    // $1000 savings target
const currentSaved = 0;                      // Starting with $0 saved

console.log('Savings Calculation Test');
console.log('======================');
console.log(`Creation Date: ${creationDate.toDateString()}`);
console.log(`Target Date: ${targetDate.toDateString()}`);
console.log(`Total Target: $${totalTarget}`);
console.log(`Current Saved: $${currentSaved}`);

try {
  // Calculate the total number of days between creation date and target date
  const timeDiff = targetDate.getTime() - creationDate.getTime();
  const totalDays = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  // Compute daily savings = (total target - current saved) / total days
  const remainingAmount = totalTarget - currentSaved;
  const dailySavings = remainingAmount / totalDays;
  
  console.log('\nCalculation Results:');
  console.log(`Total Days: ${totalDays}`);
  console.log(`Daily Savings: $${dailySavings.toFixed(2)}`);
  
  // Initialize variables for calculation
  const monthlyGoals = [];
  let currentDate = new Date(creationDate);
  
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
    }
  }
  
  console.log('\nMonthly Goals:');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  let totalCalculated = 0;
  monthlyGoals.forEach((goal, index) => {
    console.log(`${monthNames[goal.month]} ${goal.year}: ${goal.daysInMonth} days = $${goal.savingsGoal.toFixed(2)}`);
    totalCalculated += goal.savingsGoal;
  });
  
  console.log(`\nTotal Calculated Savings: $${totalCalculated.toFixed(2)}`);
} catch (error) {
  console.error('Error calculating savings schedule:', error.message);
}