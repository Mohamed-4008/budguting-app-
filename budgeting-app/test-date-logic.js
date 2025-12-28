// Test the date logic
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

// Test with November 22nd as today and target day 2
console.log("=== Test 1: Target day 2 ===");
getNextMonthOccurrence(2);

console.log("\n=== Test 2: Target day 25 ===");
getNextMonthOccurrence(25);