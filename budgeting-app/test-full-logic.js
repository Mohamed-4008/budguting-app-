// Test the complete date formatting logic
const getNextMonthOccurrence = (day) => {
  const today = new Date();
  const todayDate = today.getDate();
  
  console.log(`Today is ${today.toDateString()}, target day is ${day}`);
  console.log(`Today's date: ${todayDate}, target day: ${day}`);
  
  // If the target day has already passed this month, use next month
  if (day <= todayDate) {
    console.log("Target day has already passed, using next month");
    // Create date for the same day next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, day);
    console.log(`Next occurrence: ${nextMonth.toDateString()}`);
    return nextMonth;
  }
  // If the target day is in the future this month, use this month
  else {
    console.log("Target day is in the future, using this month");
    // Create date for the target day this month
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
    console.log(`Next occurrence: ${thisMonth.toDateString()}`);
    return thisMonth;
  }
};

const formatCategoryDate = (dateString) => {
  console.log(`Formatting date string: "${dateString}"`);
  
  if (dateString && dateString.startsWith('Weekly on ')) {
    console.log("Processing weekly category");
    // Extract just the day part (e.g., "Mon" from "Weekly on Mon")
    const day = dateString.replace('Weekly on ', '');
    console.log(`Weekly day: ${day}`);
    
    // For testing, we'll just return the day
    return day;
  } else if (dateString && dateString.startsWith('Monthly on ')) {
    console.log("Processing monthly category");
    // Extract the day part (e.g., "7" from "Monthly on 7")
    const day = parseInt(dateString.replace('Monthly on ', ''), 10);
    console.log(`Monthly day: ${day}`);
    
    // Get the next occurrence of this day
    const nextDate = getNextMonthOccurrence(day);
    
    // Get the month abbreviation
    const monthAbbrev = nextDate.toLocaleString('default', { month: 'short' });
    console.log(`Month abbreviation: ${monthAbbrev}`);
    
    // Format as "Nov 7" (month abbreviation and day)
    const result = `${monthAbbrev} ${day}`;
    console.log(`Formatted result: ${result}`);
    return result;
  }
  // For all other date formats, return as is
  console.log("Returning date string as is");
  return dateString;
};

// Test with different scenarios
console.log("=== Test 1: Monthly on 2 (should show Dec 2) ===");
console.log(formatCategoryDate("Monthly on 2"));

console.log("\n=== Test 2: Monthly on 25 (should show Nov 25) ===");
console.log(formatCategoryDate("Monthly on 25"));

console.log("\n=== Test 3: Weekly on Mon (should show Mon) ===");
console.log(formatCategoryDate("Weekly on Mon"));

console.log("\n=== Test 4: Nov 11 (should show as is) ===");
console.log(formatCategoryDate("Nov 11"));