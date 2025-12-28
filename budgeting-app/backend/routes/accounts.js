const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all accounts for a user
router.get('/', async (req, res) => {
  try {
    const accountsSnapshot = await req.db.collection('accounts')
      .where('user', '==', req.user.userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const accounts = [];
    accountsSnapshot.forEach(doc => {
      accounts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new account
router.post('/', async (req, res) => {
  try {
    const { name, type, balance, currency } = req.body;
    
    // Validate input
    if (!name || !type) {
      return res.status(400).json({ message: 'Name and type are required' });
    }
    
    // Validate account type
    const validTypes = ['checking', 'savings', 'credit', 'investment', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid account type' });
    }
    
    // Create account
    const newAccount = {
      user: req.user.userId,
      name,
      type,
      balance: parseFloat(balance) || 0,
      currency: currency || 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const accountRef = await req.db.collection('accounts').add(newAccount);
    
    res.status(201).json({
      id: accountRef.id,
      ...newAccount
    });
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an account
router.put('/:id', async (req, res) => {
  try {
    const { name, type, balance, currency } = req.body;
    
    // Validate account type if provided
    if (type) {
      const validTypes = ['checking', 'savings', 'credit', 'investment', 'other'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ message: 'Invalid account type' });
      }
    }
    
    // Check if account belongs to user
    const accountRef = req.db.collection('accounts').doc(req.params.id);
    const accountDoc = await accountRef.get();
    
    if (!accountDoc.exists) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const accountData = accountDoc.data();
    if (accountData.user !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update account
    const updatedAccount = {
      ...(name && { name }),
      ...(type && { type }),
      ...(balance !== undefined && { balance: parseFloat(balance) }),
      ...(currency && { currency }),
      updatedAt: new Date()
    };
    
    await accountRef.update(updatedAccount);
    
    res.json({
      id: req.params.id,
      ...accountData,
      ...updatedAccount
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an account
router.delete('/:id', async (req, res) => {
  try {
    // Check if account belongs to user
    const accountRef = req.db.collection('accounts').doc(req.params.id);
    const accountDoc = await accountRef.get();
    
    if (!accountDoc.exists) {
      return res.status(404).json({ message: 'Account not found' });
    }
    
    const accountData = accountDoc.data();
    if (accountData.user !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Delete account
    await accountRef.delete();
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;