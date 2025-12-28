// Debug the exact issue with date formatting
const testDate = new Date(2025, 10, 22); // November 22, 2025 (month is 0-indexed)
console.log("Current date:", testDate.toDateString());
console.log("Current month:", testDate.getMonth()); // 10 for November
console.log("Current date:", testDate.getDate()); // 22

// Test the logic for "Monthly on 2"
const targetDay = 2;
console.log("Target day:", targetDay);

if (targetDay <= testDate.getDate()) {
  console.log("Target day has already passed");
  const nextMonth = new Date(testDate.getFullYear(), testDate.getMonth() + 1, targetDay);
  console.log("Next occurrence:", nextMonth.toDateString());
  const monthAbbrev = nextMonth.toLocaleString('default', { month: 'short' });
  console.log("Month abbreviation:", monthAbbrev);
  console.log("Final result:", `${monthAbbrev} ${targetDay}`);
} else {
  console.log("Target day is in the future");
  const thisMonth = new Date(testDate.getFullYear(), testDate.getMonth(), targetDay);
  console.log("Next occurrence:", thisMonth.toDateString());
  const monthAbbrev = thisMonth.toLocaleString('default', { month: 'short' });
  console.log("Month abbreviation:", monthAbbrev);
  console.log("Final result:", `${monthAbbrev} ${targetDay}`);
}