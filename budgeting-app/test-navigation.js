// Test navigation functionality
console.log('Testing navigation...');

// Simulate router.push functionality
function simulateRouterPush(path) {
  console.log('Router would navigate to:', path);
  
  // Extract parameters from path
  if (path.includes('?')) {
    const [basePath, queryParams] = path.split('?');
    console.log('Base path:', basePath);
    console.log('Query params:', queryParams);
    
    // Parse query parameters
    const params = {};
    queryParams.split('&').forEach(param => {
      const [key, value] = param.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    
    console.log('Parsed parameters:', params);
    return params;
  }
  
  return {};
}

// Test cases
console.log('=== Test 1: Simple category ===');
simulateRouterPush('/spending-category-details?categoryName=Groceries');

console.log('\n=== Test 2: Category with space ===');
simulateRouterPush('/spending-category-details?categoryName=Dining%20Out');

console.log('\n=== Test 3: Category with special characters ===');
simulateRouterPush('/spending-category-details?categoryName=Utilities%20%26%20Internet');

console.log('\nTest completed.');