// Debug script to test category finding logic
console.log('Debugging category finding logic...');

// Sample spending categories structure
const spendingCategories = {
  Bills: [
    { id: '1', name: 'Electricity', date: 'Jun 11', spent: 85.50, target: 100.00 },
    { id: '2', name: 'Internet', date: 'Jun 15', spent: 60.00, target: 50.00 }
  ],
  Needs: [
    { id: '3', name: 'Groceries', date: 'Jun 5', spent: 135.00, target: 150.00 }
  ],
  Wants: [
    { id: '4', name: 'Entertainment', date: 'Jun 3', spent: 45.00, target: 60.00 }
  ],
  'Non-Monthly': [
    { id: '5', name: 'Vacation', date: 'Jun 1', spent: 1950.00, target: 2000.00 }
  ]
};

// Function to find category by name (same logic as in spending-category-details.tsx)
function findCategoryByName(categoryName) {
  console.log(`Searching for category: "${categoryName}"`);
  let foundCategory = null;
  
  for (const group in spendingCategories) {
    console.log(`Checking group: ${group}`);
    const categoryInGroup = spendingCategories[group].find(
      (cat) => {
        const match = cat.name === categoryName;
        console.log(`  Comparing "${cat.name}" with "${categoryName}" - Match: ${match}`);
        return match;
      }
    );
    
    if (categoryInGroup) {
      foundCategory = categoryInGroup;
      console.log(`Found category in group ${group}:`, foundCategory);
      break;
    }
  }
  
  return foundCategory;
}

// Test with various category names
console.log('=== Test 1: Existing category ===');
console.log('Result:', findCategoryByName('Groceries'));

console.log('\n=== Test 2: Non-existent category ===');
console.log('Result:', findCategoryByName('NonExistent'));

console.log('\n=== Test 3: Case sensitivity test ===');
console.log('Result:', findCategoryByName('groceries'));

console.log('\n=== Test 4: Whitespace test ===');
console.log('Result:', findCategoryByName(' Groceries '));

console.log('\nDebug completed.');