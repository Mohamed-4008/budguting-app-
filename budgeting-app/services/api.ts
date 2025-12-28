// API service for handling HTTP requests
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  // Helper method to handle API responses
  private static async handleResponse(response: Response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }
    return data;
  }

  // Auth endpoints
  static async register(userData: { name: string; email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    return this.handleResponse(response);
  }
  
  static async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    return this.handleResponse(response);
  }
  
  // Transaction endpoints
  static async getTransactions(token: string) {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response);
  }
  
  static async createTransaction(transactionData: any, token: string) {
    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });
    
    return this.handleResponse(response);
  }
  
  static async updateTransaction(id: string, transactionData: any, token: string) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(transactionData),
    });
    
    return this.handleResponse(response);
  }
  
  static async deleteTransaction(id: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response);
  }
  
  // Account endpoints
  static async getAccounts(token: string) {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response);
  }
  
  static async createAccount(accountData: any, token: string) {
    const response = await fetch(`${API_BASE_URL}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(accountData),
    });
    
    return this.handleResponse(response);
  }
  
  static async updateAccount(id: string, accountData: any, token: string) {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(accountData),
    });
    
    return this.handleResponse(response);
  }
  
  static async deleteAccount(id: string, token: string) {
    const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response);
  }
  
  // Report endpoints
  static async getFinancialSummary(token: string) {
    const response = await fetch(`${API_BASE_URL}/reports/summary`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response);
  }
  
  static async getSpendingByCategory(token: string) {
    const response = await fetch(`${API_BASE_URL}/reports/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response);
  }
  
  static async getMonthlyTrends(token: string) {
    const response = await fetch(`${API_BASE_URL}/reports/trends`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return this.handleResponse(response);
  }
}

export default ApiService;