const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactionsSnapshot = await req.db.collection('transactions')
      .where('user', '==', req.user.userId)
      .orderBy('date', 'desc')
      .get();
    
    const transactions = [];
    transactionsSnapshot.forEach(doc => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new transaction
router.post('/', async (req, res) => {
  try {
    const { amount, description, category, date, type, account } = req.body;
    
    // Validate input
    if (!amount || !description || !category || !date || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either income or expense' });
    }
    
    // Create transaction
    const newTransaction = {
      user: req.user.userId,
      amount: parseFloat(amount),
      description,
      category,
      date: new Date(date),
      type,
      account,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const transactionRef = await req.db.collection('transactions').add(newTransaction);
    
    res.status(201).json({
      id: transactionRef.id,
      ...newTransaction
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ message: 'Error creating transaction', error: error.message });
  }
});

// Update a transaction
router.put('/:id', async (req, res) => {
  try {
    const { amount, description, category, date, type, account } = req.body;
    
    // Validate input
    if (!amount || !description || !category || !date || !type) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either income or expense' });
    }
    
    // Check if transaction belongs to user
    const transactionRef = req.db.collection('transactions').doc(req.params.id);
    const transactionDoc = await transactionRef.get();
    
    if (!transactionDoc.exists) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transactionDoc.data();
    if (transactionData.user !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update transaction
    const updatedTransaction = {
      amount: parseFloat(amount),
      description,
      category,
      date: new Date(date),
      type,
      account,
      updatedAt: new Date()
    };
    
    await transactionRef.update(updatedTransaction);
    
    res.json({
      id: req.params.id,
      ...updatedTransaction
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(400).json({ message: 'Error updating transaction', error: error.message });
  }
});

// Delete a transaction
router.delete('/:id', async (req, res) => {
  try {
    // Check if transaction belongs to user
    const transactionRef = req.db.collection('transactions').doc(req.params.id);
    const transactionDoc = await transactionRef.get();
    
    if (!transactionDoc.exists) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const transactionData = transactionDoc.data();
    if (transactionData.user !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete transaction
    await transactionRef.delete();
    
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Error deleting transaction', error: error.message });
  }
});

module.exports = router;