// Test to verify the actual format of categories
console.log("Testing different date formats:");

// Test cases
const testCases = [
  "Weekly on Mon",
  "Monthly on 2",
  "Monthly on 25",
  "Nov 11",
  "Jun 15"
];

const startsWithWeekly = (dateString) => dateString && dateString.startsWith('Weekly on ');
const startsWithMonthly = (dateString) => dateString && dateString.startsWith('Monthly on ');

testCases.forEach(dateString => {
  console.log(`\nTesting: "${dateString}"`);
  console.log(`Starts with "Weekly on ": ${startsWithWeekly(dateString)}`);
  console.log(`Starts with "Monthly on ": ${startsWithMonthly(dateString)}`);
  console.log(`Includes space: ${dateString && dateString.includes(' ')}`);
});