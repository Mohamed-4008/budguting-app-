// API service for handling HTTP requests
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  // Auth endpoints
  static async register(userData) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    return response.json();
  }
  
  static async login(credentials) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    return response.json();
  }
  
  // Transaction endpoints
  static async getTransactions() {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  }
  
  static async createTransaction(transactionData) {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    
    return response.json();
  }
  
  static async updateTransaction(id, transactionData) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });
    
    return response.json();
  }
  
  static async deleteTransaction(id) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  }
  
  // Account endpoints
  static async getAccounts() {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  }
  
  static async createAccount(accountData) {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    
    return response.json();
  }
  
  static async updateAccount(id, accountData) {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData),
    });
    
    return response.json();
  }
  
  static async deleteAccount(id) {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  }
  
  // Report endpoints
  static async getFinancialSummary() {
    const response = await fetch(`${API_BASE_URL}/reports/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  }
  
  static async getSpendingByCategory() {
    const response = await fetch(`${API_BASE_URL}/reports/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  }
  
  static async getMonthlyTrends() {
    const response = await fetch(`${API_BASE_URL}/reports/trends`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response.json();
  }
}

module.exports = ApiService;