// Test the calculateSavingsSchedule function with the given parameters
import { calculateSavingsSchedule } from './context/budget-context';

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
  // Calculate the savings schedule
  const result = calculateSavingsSchedule(creationDate, targetDate, totalTarget, currentSaved);
  
  console.log('\nCalculation Results:');
  console.log(`Total Days: ${result.totalDays}`);
  console.log(`Daily Savings: $${result.dailySavings.toFixed(2)}`);
  console.log(`Total Calculated Savings: $${result.totalCalculatedSavings.toFixed(2)}`);
  
  console.log('\nMonthly Goals:');
  result.monthlyGoals.forEach((goal, index) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    console.log(`${monthNames[goal.month]} ${goal.year}: ${goal.daysInMonth} days = $${goal.savingsGoal.toFixed(2)}`);
  });
} catch (error: any) {
  console.error('Error calculating savings schedule:', error.message);
}