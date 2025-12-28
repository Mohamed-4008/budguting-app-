// Test script to verify category navigation is working
console.log('Testing category navigation...');

// Simulate the category finding logic from spending-category-details.tsx
const mockState = {
  spendingCategories: {
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
  }
};

// Function to find category by name (same logic as in spending-category-details.tsx)
function findCategoryByName(categoryName) {
  let foundCategory = null;
  
  for (const group in mockState.spendingCategories) {
    const categoryInGroup = mockState.spendingCategories[group].find(
      (cat) => cat.name === categoryName
    );
    
    if (categoryInGroup) {
      foundCategory = categoryInGroup;
      break;
    }
  }
  
  return foundCategory;
}

// Test with existing categories
console.log('Finding "Groceries":', findCategoryByName('Groceries'));
console.log('Finding "Electricity":', findCategoryByName('Electricity'));
console.log('Finding "NonExistent":', findCategoryByName('NonExistent'));

console.log('Test completed.');