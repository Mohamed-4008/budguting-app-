// Test to verify category names in the context
console.log('Testing category names...');

// Sample spending categories structure (from the context)
const spendingCategories = {
  Bills: [
    { id: '1', name: 'Electricity', date: 'Jun 11', spent: 85.50, target: 100.00 },
    { id: '2', name: 'Internet', date: 'Jun 15', spent: 60.00, target: 50.00 }
  ],
  Needs: [
    { id: '3', name: 'Groceries', date: 'Jun 5', spent: 135.00, target: 150.00 }
  ],
  Wants: [
    { id: '4', name: 'Entertainment', date: 'Jun 3', spent: 45.00, target: 60.00 },
    { id: '5', name: 'Dining Out', date: 'Jun 7', spent: 165.30, target: 150.00 }
  ],
  'Non-Monthly': [
    { id: '6', name: 'Vacation', date: 'Jun 1', spent: 1950.00, target: 2000.00 },
    { id: '7', name: 'Shopping', date: 'Jun 10', spent: 320.80, target: 400.00 },
    { id: '8', name: 'Healthcare', date: 'Jun 12', spent: 75.00, target: 100.00 },
    { id: '9', name: 'Utilities', date: 'Jun 14', spent: 210.45, target: 200.00 },
    { id: '10', name: 'Transportation', date: 'Jun 16', spent: 180.25, target: 170.00 }
  ]
};

// List all available category names
console.log('Available category names:');
for (const group in spendingCategories) {
  console.log(`  Group: ${group}`);
  spendingCategories[group].forEach(category => {
    console.log(`    - "${category.name}"`);
  });
}

// Test finding specific categories
const testCategories = ['Groceries', 'Transportation', 'Entertainment', 'Dining Out', 'Utilities', 'Shopping', 'Healthcare'];

console.log('\nTesting category finding:');
testCategories.forEach(categoryName => {
  let found = false;
  for (const group in spendingCategories) {
    const category = spendingCategories[group].find(cat => cat.name === categoryName);
    if (category) {
      console.log(`  Found "${categoryName}" in group "${group}"`);
      found = true;
      break;
    }
  }
  if (!found) {
    console.log(`  Category "${categoryName}" NOT FOUND`);
  }
});

console.log('\nTest completed.');