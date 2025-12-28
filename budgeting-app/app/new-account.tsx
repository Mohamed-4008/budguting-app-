import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { useBudget } from '@/context/budget-context';

export default function NewAccountScreen() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  
  // State for form fields
  const [accountName, setAccountName] = useState('');
  const [duplicateError, setDuplicateError] = useState('');
  const [accountType, setAccountType] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [bankName, setBankName] = useState('');

  // Account type options
  const accountTypes = ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment', 'Loan', 'Mortgage', 'Other'];

  const handleCancel = () => {
    router.dismiss(); // Close the modal
  };

  // Format the amount as the user types to ensure only numeric input
  const handleInitialBalanceChange = (text: string) => {
    // Remove any non-numeric characters except decimal point
    const numericValue = text.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].substring(0, 2);
      setInitialBalance(parts.join('.'));
      return;
    }
    
    setInitialBalance(numericValue);
  };

  const handleAddAccount = () => {
    // Clear any previous duplicate error
    setDuplicateError('');
    
    // Validate required fields
    if (accountName.trim() && accountType && initialBalance) {
      // Check if an account with the same name already exists
      const trimmedAccountName = accountName.trim();
      const accountExists = state.accounts.some(
        (account: any) => account.name.toLowerCase() === trimmedAccountName.toLowerCase()
      );
      
      // If account already exists, show an error and return
      if (accountExists) {
        setDuplicateError('This account name is already in use. Please choose a different name.');
        return;
      }
      
      // For credit cards, the balance should be negative (debt)
      const balance = parseFloat(initialBalance) || 0;
      const accountBalance = accountType === 'Credit Card' ? -Math.abs(balance) : balance;
      
      // Create a new account object
      const newAccount = {
        id: Date.now().toString(), // Simple ID generation
        name: trimmedAccountName,
        type: accountType,
        balance: accountBalance,
        bankName: bankName.trim() || undefined,
      };

      // Dispatch the new account to the budget context
      dispatch({ type: 'ADD_ACCOUNT', account: newAccount });

      // Show success message
      alert('Account added successfully!');

      // Navigate back to accounts screen
      router.dismiss();
    } else {
      // Show alert if required fields are missing
      alert('Please fill in all required fields: Account Name, Account Type, and Initial Balance');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Fixed Header with Title */}
      <View style={styles.header}>
        <Text style={styles.title}>New Account</Text>
      </View>
      
      {/* Scrollable Content Area with Form */}
      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Account Name Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Account Name</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., my savings"
                placeholderTextColor="#94A3B8"
                value={accountName}
                onChangeText={(text) => {
                  setAccountName(text);
                  // Clear duplicate error when user types
                  if (duplicateError) setDuplicateError('');
                }}
              />
            </View>
            {duplicateError ? <Text style={styles.errorText}>{duplicateError}</Text> : null}
          </View>
          
          {/* Account Type Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.selectionContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {accountTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.selectionItem,
                      accountType === type && styles.selectedSelectionItem
                    ]}
                    onPress={() => setAccountType(type)}
                  >
                    <Text style={[
                      styles.selectionItemText,
                      accountType === type && styles.selectedSelectionItemText
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          {/* Initial Balance Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Initial Balance</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="$0.00"
                placeholderTextColor="#94A3B8"
                value={initialBalance}
                onChangeText={handleInitialBalanceChange}
                keyboardType="numeric"
              />
            </View>
          </View>
          
          {/* Bank Name Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bank Name (Optional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="e.g., Chase Bank"
                placeholderTextColor="#94A3B8"
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Fixed Footer with Buttons */}
      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addAccountButton, 
              !(accountName.trim() && accountType && initialBalance) && styles.disabledAddAccountButton]} 
            onPress={handleAddAccount}
            disabled={!(accountName.trim() && accountType && initialBalance)}
          >
            <Text style={[styles.addAccountButtonText, 
              !(accountName.trim() && accountType && initialBalance) && { color: '#94A3B8' }]}>Add Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2543',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: '#1D2543',
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: 80, // Space for the header
    marginBottom: 80, // Space for the footer
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    backgroundColor: '#1D2543',
    paddingBottom: 20,
    paddingTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  addAccountButton: {
    flex: 1,
    backgroundColor: '#1e6469',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledAddAccountButton: {
    backgroundColor: 'transparent',
    borderColor: '#334155',
  },
  addAccountButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#94A3B8', // Weak white color to match transaction modal
    marginBottom: 5,
  },
  inputContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    padding: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  input: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  selectionContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    minHeight: 50,
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
    backgroundColor: '#cce8e8', // Exact color from transaction modal
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
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});