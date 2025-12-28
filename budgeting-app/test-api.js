// Simple test script to verify API integration
const ApiService = require('./backend/services/api');

async function testApi() {
  try {
    console.log('Testing API service...');
    
    // Test registration
    console.log('Testing registration...');
    const registerResponse = await ApiService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Registration response:', registerResponse);
    
    // Test login
    console.log('Testing login...');
    const loginResponse = await ApiService.login({
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Login response:', loginResponse);
    
    console.log('API tests completed successfully!');
  } catch (error) {
    console.error('API test failed:', error);
  }
}

testApi();