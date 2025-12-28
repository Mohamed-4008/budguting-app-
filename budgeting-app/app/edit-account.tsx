import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { Colors } from '@/constants/theme'; // Import Colors

export default function EditAccountScreen() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const { accountId } = useLocalSearchParams();
  const colors = Colors.dark;
  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState('');
  const [initialBalance, setInitialBalance] = useState('');

  // Find the account by ID
  const account = state.accounts.find(acc => acc.id === accountId) || state.accounts[0];

  // Set initial values when component mounts
  useEffect(() => {
    if (account) {
      setAccountName(account.name || '');
      setAccountType(account.type || '');
      setInitialBalance(account.balance?.toString() || '');
    }
  }, [account]);

  // Handle saving changes
  const handleSaveChanges = () => {
    if (!accountName.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    if (!accountType.trim()) {
      Alert.alert('Error', 'Please select an account type');
      return;
    }

    // Validate initial balance
    const balance = initialBalance.trim() === '' ? 0 : parseFloat(initialBalance);
    if (isNaN(balance)) {
      Alert.alert('Error', 'Please enter a valid balance');
      return;
    }

    // For credit cards, the balance should be negative (debt)
    const accountBalance = accountType === 'Credit Card' ? -Math.abs(balance) : balance;

    // Dispatch action to update the account
    dispatch({
      type: 'UPDATE_ACCOUNT',
      accountId: accountId as string,
      updates: {
        name: accountName.trim(),
        type: accountType,
        balance: accountBalance
      }
    });

    // Navigate back to account details screen immediately after saving
    router.push(`/account-details?accountId=${accountId}`);
  };

  // Account type options
  const accountTypes = ['Checking', 'Savings', 'Credit Card', 'Cash'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Account</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>Account Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g., my savings"
                placeholderTextColor={colors.weakText}
                value={accountName}
                onChangeText={setAccountName}
              />
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>Account Type</Text>
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
          
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.weakText }]}>Initial Balance</Text>
            <View style={[styles.amountInputContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="$0.00"
                placeholderTextColor={colors.weakText}
                keyboardType="numeric"
                value={initialBalance}
                onChangeText={setInitialBalance}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.addButton, borderColor: colors.border }]}
          onPress={handleSaveChanges}
        >
          <Text style={[styles.saveButtonText, { color: '#FFFFFF' }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingVertical: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  form: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 5,
    fontSize: 12,
  },
  inputContainer: {
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
  },
  input: {
    padding: 10,
    fontSize: 14,
  },
  amountInputContainer: {
    borderRadius: 6,
    borderWidth: 1,
    minHeight: 40,
  },
  amountInput: {
    padding: 10,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    paddingTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});