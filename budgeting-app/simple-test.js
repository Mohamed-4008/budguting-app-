// Simple test to check today's date and next occurrence
const today = new Date();
console.log("Today's date:", today.toDateString());
console.log("Today's day of month:", today.getDate());

// Function to get next occurrence of a specific day
const getNextMonthOccurrence = (targetDay) => {
  const today = new Date();
  const todayDate = today.getDate();
  
  console.log(`Target day: ${targetDay}, Today's date: ${todayDate}`);
  
  // If the target day has already passed this month, use next month
  if (targetDay <= todayDate) {
    console.log("Target day has already passed, using next month");
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, targetDay);
    return nextMonth;
  }
  // If the target day is in the future this month, use this month
  else {
    console.log("Target day is in the future, using this month");
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), targetDay);
    return thisMonth;
  }
};

// Test with target day 2 (like "Monthly on 2")
console.log("\n=== Testing target day 2 ===");
const nextDate = getNextMonthOccurrence(2);
console.log("Next occurrence:", nextDate.toDateString());
const monthAbbrev = nextDate.toLocaleString('default', { month: 'short' });
console.log("Display format:", `${monthAbbrev} 2`);

// Test with target day 25 (like "Monthly on 25")
console.log("\n=== Testing target day 25 ===");
const nextDate2 = getNextMonthOccurrence(25);
console.log("Next occurrence:", nextDate2.toDateString());
const monthAbbrev2 = nextDate2.toLocaleString('default', { month: 'short' });
console.log("Display format:", `${monthAbbrev2} 25`);