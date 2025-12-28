import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Alert, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';
import { useBudget } from '@/context/budget-context';
import { useTheme } from '@/context/ThemeContext'; // Import useTheme hook
import { Colors } from '@/constants/theme'; // Import Colors

export default function ContributeToGoalScreen() {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams();
  const { state, dispatch } = useBudget();
  const { theme } = useTheme(); // Use the theme context
  // Use dark theme colors regardless of theme setting
  const colors = Colors.dark; // Always use dark theme
  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [showLimitExceededModal, setShowLimitExceededModal] = useState(false);
  const [limitExceededMessage, setLimitExceededMessage] = useState('');
  const [accountError, setAccountError] = useState('');

  // Debug: Log the state when component mounts
  React.useEffect(() => {
    console.log('=== Component Mounted ===');
    console.log('State savings categories:', state.savingsCategories);
    console.log('All state:', state);
  }, []);

  // Format the amount as the user types
  const handleAmountChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    setContributionAmount(numericValue);
  };

  const handleContribute = () => {
    console.log('=== handleContribute function called ===');
    
    console.log('=== Contribution Debug Info ===');
    console.log('contributionAmount:', contributionAmount);
    console.log('selectedAccount:', selectedAccount);
    console.log('categoryName:', categoryName);
    
    // Validate input
    if (!contributionAmount || !selectedAccount || !categoryName) {
      console.log('Validation failed: missing fields');
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Clear previous error messages
    setAccountError('');

    const amount = parseFloat(contributionAmount);
    console.log('Amount:', amount);
    
    if (isNaN(amount) || amount <= 0) {
      console.log('Validation failed: invalid amount');
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Find the selected account
    const account = state.accounts.find(acc => acc.id === selectedAccount);
    console.log('Account found:', account);
    
    if (!account) {
      console.log('Account not found');
      Alert.alert('Error', 'Account not found');
      return;
    }

    // Check if account has zero balance (for non-credit accounts)
    if (account.type !== 'Credit Card' && account.balance === 0) {
      console.log('Account has zero balance');
      setAccountError('Account has zero balance');
      return;
    }

    // Check if account has sufficient balance (for non-credit accounts)
    if (account.type !== 'Credit Card' && account.balance < amount) {
      console.log('Insufficient funds');
      setAccountError(`Insufficient funds. Balance: $${account.balance.toFixed(2)}`);
      return;
    }

    // Ensure categoryName is a string
    const categoryNameStr = Array.isArray(categoryName) ? categoryName[0] : categoryName;
    console.log('Category name:', categoryNameStr);

    // Find the savings category
    const category = state.savingsCategories['Savings Goals'].find(
      cat => cat.name === categoryNameStr
    );
    
    console.log('Category found:', category);
    
    if (!category) {
      console.log('Savings category not found');
      Alert.alert('Error', 'Savings category not found');
      return;
    }

    // Check if contribution would exceed the savings target
    const currentSaved = category.generalSaved || 0;
    const savingsTarget = category.generalTarget || 0;
    
    console.log('Current saved:', currentSaved);
    console.log('Savings target:', savingsTarget);
    console.log('New amount:', amount);
    console.log('Total if contributed:', currentSaved + amount);
    console.log('Would exceed limit:', currentSaved + amount > savingsTarget);
    
    if (currentSaved + amount > savingsTarget) {
      console.log('ALERT: Contribution exceeds savings target limit');
      // Create detailed message for the modal with Oops! as the title
      const message = `You can't add more than your savings target of $${savingsTarget.toFixed(2)}.\n\n` +
                     `Your current savings: $${currentSaved.toFixed(2)}\n` +
                     `Attempted contribution: $${amount.toFixed(2)}\n` +
                     `The maximum you can add now is $${(savingsTarget - currentSaved).toFixed(2)}.`;
      setLimitExceededMessage(message);
      setShowLimitExceededModal(true);
      return;
    }

    console.log('All checks passed, proceeding with contribution');
    // If we pass all checks, proceed with the contribution
    // Update account balance
    let newAccountBalance;
    if (account.type === 'Credit Card') {
      newAccountBalance = account.balance - amount;
    } else {
      newAccountBalance = account.balance - amount;
    }
    
    dispatch({
      type: 'UPDATE_ACCOUNT',
      accountId: selectedAccount,
      updates: {
        balance: newAccountBalance
      }
    });

    // Update savings category
    dispatch({
      type: 'UPDATE_SAVINGS_CATEGORY',
      id: category.id,
      updates: {
        generalSaved: (category.generalSaved || 0) + amount,
        monthlySaved: (category.monthlySaved || 0) + amount
      }
    });

    // Add transaction record
    const newTransaction = {
      id: Date.now().toString(),
      name: `Contribution to ${category.name}`,
      amount: -amount,
      category: category.name,
      type: 'Expense' as const,
      date: new Date().toISOString().split('T')[0],
      account: account.name,
      day: new Date().getDate().toString(),
      month: new Date().toLocaleString('default', { month: 'short' })
    };

    dispatch({
      type: 'ADD_TRANSACTION',
      transaction: newTransaction
    });

    // Go back to the previous screen
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <View style={[styles.header, styles.fixedHeader]}> 
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Contribute to Goal</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer}>
        {/* Amount Section */}
        <View style={styles.amountSectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Amount</Text>
          <View style={[styles.amountContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <View style={styles.currencyContainer}>
              <Text style={[styles.currencySymbol, { color: colors.addButton }]}>$</Text>
            </View>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.weakText}
              keyboardType="numeric"
              value={contributionAmount}
              onChangeText={handleAmountChange}
              autoFocus={true}
              selectionColor={colors.addButton}
            />
          </View>
        </View>

        {/* Account Selection Section */}
        <Text style={[styles.sectionTitle, styles.fromSectionTitle, { color: colors.text }]}>From</Text>
        <View style={styles.selectionContainer}> 
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {state.accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.selectionItem,
                  selectedAccount === account.id && styles.selectedSelectionItem
                ]}
                onPress={() => {
                  // Check if account has zero balance (for non-credit accounts)
                  if (account.type !== 'Credit Card' && account.balance === 0) {
                    setAccountError('Account has zero balance');
                  } else {
                    setSelectedAccount(account.id);
                    setAccountError(''); // Clear error when selecting a valid account
                  }
                }}
              >
                <Text style={[
                  styles.selectionItemText,
                  selectedAccount === account.id && styles.selectedSelectionItemText
                ]}>
                  {account.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {accountError ? <Text style={styles.errorText}>{accountError}</Text> : null}
      </ScrollView>

      {/* Fixed Buttons at Bottom */}
      <View style={[styles.fixedButtonContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}> 
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.bottomActionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.contributeButton,
              (!contributionAmount || !selectedAccount) && styles.disabledButton,
              styles.bottomActionButton, 
              { borderColor: colors.border }
            ]}
            onPress={handleContribute}
            disabled={!contributionAmount || !selectedAccount}
          >
            <Text style={[styles.actionButtonText, 
              (!contributionAmount || !selectedAccount) && { color: '#94A3B8' }]}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Limit Exceeded Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLimitExceededModal}
        onRequestClose={() => setShowLimitExceededModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Oops!</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}> 
              {limitExceededMessage}
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.addButton }]}
                onPress={() => setShowLimitExceededModal(false)}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 26, // Increase from smaller size to match category details screen
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 48,
  },
  contentContainer: {
    flex: 1,
    marginTop: 80,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  amountSectionContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  fromSectionTitle: {
    marginTop: 12,
    textAlign: 'left',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: '100%',
  },
  currencyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 60,
  },
  currencySymbol: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 36,
    textAlign: 'center',
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'left',
  },
  selectionContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    minHeight: 50,
    marginBottom: 30,
  },
  selectionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSelectionItem: {
    backgroundColor: '#cce8e8',
  },
  selectionItemText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  selectedSelectionItemText: {
    color: '#1D2543',
    fontWeight: '600',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contributeButton: {
    flex: 1,
    backgroundColor: '#1e6469',
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: 'transparent',
    borderColor: '#334155',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contributeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Add the bottomActionButton style to match edit/delete buttons
  bottomActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 24,
    marginHorizontal: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: '80%',
    borderWidth: 1,
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'left',
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 80,
  },
  confirmButton: {
    marginLeft: 10,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});