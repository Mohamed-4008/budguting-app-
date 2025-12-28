declare module '@/backend/services/api' {
  interface Transaction {
    id: string;
    user: string;
    amount: number;
    description: string;
    category: string;
    date: string;
    type: 'income' | 'expense';
    account: string;
    createdAt: string;
    updatedAt: string;
  }

  interface Account {
    id: string;
    user: string;
    name: string;
    type: string;
    balance: number;
    createdAt: string;
    updatedAt: string;
  }

  class ApiService {
    static async getTransactions(): Promise<Transaction[]>;
    static async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction>;
    static async updateTransaction(id: string, transactionData: Partial<Transaction>): Promise<Transaction>;
    static async deleteTransaction(id: string): Promise<void>;
    
    static async getAccounts(): Promise<Account[]>;
    static async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account>;
    static async updateAccount(id: string, accountData: Partial<Account>): Promise<Account>;
    static async deleteAccount(id: string): Promise<void>;
    
    static async getFinancialSummary(): Promise<any>;
    static async getSpendingByCategory(): Promise<any>;
    static async getMonthlyTrends(): Promise<any>;
  }

  export default ApiService;
}