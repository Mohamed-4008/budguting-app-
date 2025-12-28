const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get financial summary
router.get('/summary', async (req, res) => {
  try {
    // Get date range from query parameters
    const { startDate, endDate } = req.query;
    
    // Build query for transactions
    let transactionsQuery = req.db.collection('transactions').where('user', '==', req.user.userId);
    
    // Add date filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      transactionsQuery = transactionsQuery
        .where('date', '>=', start)
        .where('date', '<=', end);
    }
    
    // Get all transactions for the user
    const transactionsSnapshot = await transactionsQuery.orderBy('date', 'desc').get();
    
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push(doc.data());
    });
    
    // Calculate total income
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate total expenses
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate balance
    const balance = totalIncome - totalExpenses;
    
    // Calculate savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    res.json({
      totalIncome,
      totalExpenses,
      balance,
      savingsRate
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get spending by category
router.get('/categories', async (req, res) => {
  try {
    // Get date range from query parameters
    const { startDate, endDate } = req.query;
    
    // Build query for transactions
    let transactionsQuery = req.db.collection('transactions')
      .where('user', '==', req.user.userId)
      .where('type', '==', 'expense');
    
    // Add date filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      transactionsQuery = transactionsQuery
        .where('date', '>=', start)
        .where('date', '<=', end);
    }
    
    // Get all expense transactions for the user
    const transactionsSnapshot = await transactionsQuery.orderBy('date', 'desc').get();
    
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push(doc.data());
    });
    
    // Group expenses by category
    const categoryTotals = transactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = 0;
      }
      acc[transaction.category] += transaction.amount;
      return acc;
    }, {});
    
    res.json(categoryTotals);
  } catch (error) {
    console.error('Error fetching spending by category:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get monthly trends
router.get('/trends', async (req, res) => {
  try {
    // Get date range from query parameters
    const { startDate, endDate } = req.query;
    
    // Build query for transactions
    let transactionsQuery = req.db.collection('transactions').where('user', '==', req.user.userId);
    
    // Add date filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      transactionsQuery = transactionsQuery
        .where('date', '>=', start)
        .where('date', '<=', end);
    }
    
    // Get all transactions for the user
    const transactionsSnapshot = await transactionsQuery.orderBy('date', 'desc').get();
    
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push(doc.data());
    });
    
    // Group transactions by month
    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = transaction.date.toDate().toISOString().slice(0, 7); // YYYY-MM format
      
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
      }
      
      return acc;
    }, {});
    
    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get spending by merchant
router.get('/merchants', async (req, res) => {
  try {
    // Get date range from query parameters
    const { startDate, endDate } = req.query;
    
    // Build query for transactions
    let transactionsQuery = req.db.collection('transactions')
      .where('user', '==', req.user.userId)
      .where('type', '==', 'expense');
    
    // Add date filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      transactionsQuery = transactionsQuery
        .where('date', '>=', start)
        .where('date', '<=', end);
    }
    
    // Get all expense transactions for the user
    const transactionsSnapshot = await transactionsQuery.orderBy('date', 'desc').get();
    
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push(doc.data());
    });
    
    // Group expenses by merchant (using description as merchant for now)
    const merchantData = {};
    
    transactions.forEach(transaction => {
      // Use description as merchant name for now
      const merchant = transaction.description || 'Unknown';
      
      if (!merchantData[merchant]) {
        merchantData[merchant] = {
          totalAmount: 0,
          transactionCount: 0
        };
      }
      
      merchantData[merchant].totalAmount += transaction.amount;
      merchantData[merchant].transactionCount += 1;
    });
    
    res.json(merchantData);
  } catch (error) {
    console.error('Error fetching spending by merchant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;