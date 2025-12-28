import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useCurrency } from '@/context/currency-context'; // Add this import

export default function AccountDetailsScreen() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const { formatCurrency } = useCurrency(); // Add this line
  const { accountId } = useLocalSearchParams();
  
  const colors = Colors.dark; // Always use dark theme
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Find the account by ID
  const account = state.accounts.find(acc => acc.id === accountId) || state.accounts[0];

  // Filter and sort transactions for this account (newest first)
  const accountTransactions = state.transactions
    .filter(transaction => transaction.account === account.name)
    .map(transaction => ({
      ...transaction,
      day: new Date(transaction.date).getDate().toString().padStart(2, '0'),
      month: new Date(transaction.date).toLocaleString('default', { month: 'short' }),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Format currency to show decimals only when needed
  // const formatCurrency = (amount: number) => {
  //   const absAmount = Math.abs(amount);
  //   // If it's a whole number, don't show decimals
  //   if (absAmount % 1 === 0) {
  //     return absAmount.toString();
  //   }
  //   // Otherwise, show two decimal places
  //   return absAmount.toFixed(2);
  // };

  // Refresh transactions
  const onRefresh = () => {
    setRefreshing(true);
    // In a real app, you might fetch new data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle delete account confirmation
  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  // Confirm account deletion
  const confirmDeleteAccount = () => {
    // Dispatch action to delete the account
    dispatch({ type: 'DELETE_ACCOUNT', accountId: accountId as string });
    
    // Close the modal and navigate back
    setShowDeleteModal(false);
    router.back();
  };

  // Handle edit account
  const handleEditAccount = () => {
    // Navigate to edit account screen
    router.push(`/edit-account?accountId=${accountId}`);
  };

  // Render a transaction item (same as in transactions screen)
  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.dateIconContainer, { backgroundColor: colors.border, borderColor: colors.border }]}>
        <Text style={[styles.monthText, { color: colors.weakText }]}>{item.month}</Text>
        <Text style={[styles.dayText, { color: colors.text }]}>{item.day}</Text>
      </View>
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.transactionCategory, { color: colors.weakText }]}>{item.category}</Text>
      </View>
      <Text style={[styles.transactionAmount, 
        item.amount >= 0 ? styles.incomeAmount : styles.expenseAmount,
        { color: item.amount >= 0 ? '#4ADE80' : '#F87171' }]}>
        {formatCurrency(item.amount)}
      </Text>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Account Details</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Account Info Box */}
      <View style={[styles.accountInfoBox, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        <Text style={[styles.accountName, { color: colors.text }]}>{account.name}</Text>
        <Text style={[styles.accountBalance, { color: account.type === 'Credit Card' ? '#F87171' : colors.text }]}>
          {account.type === 'Credit Card' ? formatCurrency(Math.abs(account.balance || 0)) : formatCurrency(account.balance || 0)}
        </Text>
        <Text style={[styles.currentBalanceLabel, { color: colors.weakText }]}>Current Balance</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={handleEditAccount}>
          <IconSymbol name="pencil" size={16} color={colors.text} style={styles.buttonIcon} />
          <Text style={[styles.editButtonText, { color: colors.text }]}>Edit Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} onPress={handleDeleteAccount}>
          <IconSymbol name="trash" size={16} color="#F87171" style={styles.buttonIcon} />
          <Text style={[styles.deleteButtonText, styles.deleteButtonTextRed]}>Delete Account</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions Section */}
      <View style={[styles.transactionsSection, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        <FlatList
          data={accountTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.addButton} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.transactionsList}
        />
      </View>
      
      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Account</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>Are you sure you want to delete this account?</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]} 
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmDeleteAccount}
              >
                <Text style={styles.confirmButtonText}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
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
  accountInfoBox: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 20,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  accountBalance: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  currentBalanceLabel: {
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonTextRed: {
    color: '#F87171',
  },
  buttonIcon: {
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  incomeAmount: {
    color: '#4ADE80',
  },
  expenseAmount: {
    color: '#F87171',
  },
  dateIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthText: {
    fontSize: 10,
    textAlign: 'center',
  },
  transactionLeft: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  day: {
    fontSize: 12,
    fontWeight: '600',
  },
  month: {
    fontSize: 10,
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
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 10,
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#F87171',
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});