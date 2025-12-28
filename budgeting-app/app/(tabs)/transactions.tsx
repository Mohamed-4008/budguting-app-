import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, TouchableWithoutFeedback, RefreshControl, Animated, Easing, Dimensions, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBudget } from '@/context/budget-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedView } from '@/components/themed-view';
import { useCurrency } from '@/context/currency-context'; // Add this import

export default function TransactionsScreen() {
  const router = useRouter();
  const { state, dispatch } = useBudget();
  const { formatCurrency } = useCurrency(); // Add this line
  
  const [activeFilter, setActiveFilter] = useState<'date' | 'category' | 'type'>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [selectedType, setSelectedType] = useState<'Income' | 'Expense' | ''>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [openTransaction, setOpenTransaction] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const actualCurrentMonth = new Date().getMonth();
  const actualCurrentYear = new Date().getFullYear();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  
  // Initialize with current month's transactions
  useEffect(() => {
    setSelectedDate('');
  }, []);
  const animatedValues = useRef(new Map<string, Animated.Value>()).current;
  
  // Close any open transaction
  const closeOpenTransaction = () => {
    // Don't automatically move transactions back to their original position
    if (openTransaction) {
      setOpenTransaction(null);
    }
  };
  
  // Close any open transaction when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      // Screen gained focus - do nothing
      return () => {
        // Screen lost focus - close any open transaction
        if (openTransaction) {
          const animatedValue = animatedValues.get(openTransaction);
          if (animatedValue) {
            Animated.timing(animatedValue, {
              toValue: 0,
              duration: 300,
              easing: Easing.out(Easing.exp),
              useNativeDriver: true,
            }).start(() => {
              // Only clear the openTransaction state after animation completes
              setOpenTransaction(null);
            });
          } else {
            // Fallback in case animatedValue doesn't exist
            setOpenTransaction(null);
          }
        }
      };
    }, [openTransaction])
  );
  
  // Function to handle creating new transactions
  const handleCreateTransaction = () => {
    // Close any open transaction before navigating
    closeOpenTransaction();
    // Navigate to the new transaction modal screen
    router.push('/transaction-modal');
  };
  
  // Function to confirm and delete a transaction
  const confirmDeleteTransaction = () => {
    if (transactionToDelete) {
      // Close the transaction immediately
      closeOpenTransaction();
      // Dispatch delete action
      dispatch({ type: 'DELETE_TRANSACTION', transactionId: transactionToDelete });
      // Hide the modal
      setShowDeleteModal(false);
      // Clear the transaction to delete
      setTransactionToDelete(null);
    }
  };
  
  // Toggle transaction open/closed state (only one at a time)
  const toggleTransaction = (transactionId: string) => {
    const currentOpen = openTransaction;
    
    // If we're closing the currently open transaction
    if (currentOpen === transactionId) {
      // Animate closing with timing effect
      const animatedValue = animatedValues.get(transactionId);
      if (animatedValue) {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }).start();
      }
      setOpenTransaction(null);
    } 
    // If we're opening a different transaction
    else {
      // If there's a currently open transaction, close it first
      if (currentOpen) {
        const prevAnimatedValue = animatedValues.get(currentOpen);
        if (prevAnimatedValue) {
          Animated.timing(prevAnimatedValue, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.exp),
            useNativeDriver: true,
          }).start();
        }
      }
      
      // Open the new transaction with timing effect
      let animatedValue = animatedValues.get(transactionId);
      if (!animatedValue) {
        animatedValue = new Animated.Value(0);
        animatedValues.set(transactionId, animatedValue);
      }
      Animated.timing(animatedValue, {
        toValue: 0.2 * Dimensions.get('window').width,
        duration: 300,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
      
      setOpenTransaction(transactionId);
    }
  };
  
  // Transform transactions from context to match the format used in the UI
  const transformTransactions = () => {
    return state.transactions.map(transaction => ({
      ...transaction,
      day: new Date(transaction.date).getDate().toString().padStart(2, '0'),
      month: new Date(transaction.date).toLocaleString('default', { month: 'short' }),
      amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount
    }));
  };
  
  // Get only real transactions from context (no mock data)
  const getAllTransactions = () => {
    const contextTransactions = transformTransactions();
    
    // Sort transactions by date in descending order (newest first)
    return contextTransactions.sort((a, b) => {
      // Convert date strings to Date objects for proper comparison
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
  };
  
  const [transactions, setTransactions] = useState<any[]>(getAllTransactions());

  // Reset selected date when month or year changes to show all transactions for the month
  // Also initialize with current month transactions
  useEffect(() => {
    setSelectedDate('');
  }, [currentMonth, currentYear]);

  // Update transactions when context changes
  useEffect(() => {
    setTransactions(getAllTransactions());
  }, [state.transactions, currentMonth, currentYear]);
  
  
  // Refresh transactions
  const onRefresh = () => {
    setRefreshing(true);
    setTransactions(getAllTransactions());
    setRefreshing(false);
  };
  
  // Filter transactions based on all active filters and search query
  const filteredTransactions = transactions.filter(transaction => {
    // Apply month/year filter regardless of which filter tab is active
    // This ensures category and type filters also respect the selected month
    const transactionDate = new Date(transaction.date);
    if (transactionDate.getMonth() !== currentMonth || 
        transactionDate.getFullYear() !== currentYear) {
      return false;
    }
    
    // Check date filter (specific day selection)
    if (selectedDate && transactionDate.getDate().toString() !== selectedDate) {
      return false;
    }
    

    
    // Check category filter
    if (selectedCategory && transaction.category !== selectedCategory) {
      return false;
    }
    
    // Check type filter
    if (selectedType && transaction.type !== selectedType) {
      return false;
    }
    
    // Check search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = transaction.name.toLowerCase().includes(query);
      const matchesCategory = transaction.category.toLowerCase().includes(query);
      if (!matchesName && !matchesCategory) {
        return false;
      }
    }
    
    // Exclude contribution transactions (transactions with categories that match savings category names)
    const savingsCategoryNames = state.savingsCategories['Savings Goals'].map(cat => cat.name);
    if (savingsCategoryNames.includes(transaction.category)) {
      return false;
    }
    
    // Exclude refund transactions
    if (transaction.category === 'Refund') {
      return false;
    }
    
    // Exclude transfer transactions
    if (transaction.category === 'Transfer') {
      return false;
    }
    
    return true; // Show transaction if it passes all active filters
  })
  // Maintain sorting order (newest first) even after filtering
  .sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  

  
  // Get unique types for type filter
  const types = [...new Set(transactions.map(t => t.type))];
  
  return (
    <TouchableWithoutFeedback>
      <ThemedView style={styles.container}>
        {/* Fixed header section */}
        <View style={styles.fixedHeader}>
          {/* Title */}
          <Text style={styles.title}>Transactions</Text>
          
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <IconSymbol name="magnifyingglass" size={20} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search transactions..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  closeOpenTransaction(); // Close any open transaction when interacting with search
                }}
              />
            </View>
          </View>
          
          {/* Filter options */}
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'date' && styles.activeFilter]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent closing when interacting with filters
                closeOpenTransaction(); // Close any open transaction when changing filters
                setActiveFilter('date');
              }}
            >
              <Text style={[styles.filterButtonText, activeFilter !== 'date' && styles.inactiveFilterText]}>
                Date
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'category' && styles.activeFilter]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent closing when interacting with filters
                closeOpenTransaction(); // Close any open transaction when changing filters
                setActiveFilter('category');
              }}
            >
              <Text style={[styles.filterButtonText, activeFilter !== 'category' && styles.inactiveFilterText]}>
                Category
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.filterButton, activeFilter === 'type' && styles.activeFilter]}
              onPress={(e) => {
                e.stopPropagation(); // Prevent closing when interacting with filters
                closeOpenTransaction(); // Close any open transaction when changing filters
                setActiveFilter('type');
              }}
            >
              <Text style={[styles.filterButtonText, activeFilter !== 'type' && styles.inactiveFilterText]}>
                Type
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Filter selection area */}
          <View style={styles.filterSelectionContainer}>
            {activeFilter === 'date' && (
              <View style={styles.filterScrollView}>
                {/* Month selector and date filter options in the same line */}
                <View style={styles.dateFiltersContainer}>
                  {/* Month selector box - smaller format */}
                  <View style={styles.monthSelectorBox}>
                    <TouchableOpacity 
                      style={styles.monthSelectorButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        closeOpenTransaction();
                        // Navigate to previous month, stop at January (month 0)
                        console.log('Previous button pressed, currentMonth:', currentMonth);
                        if (currentMonth > 0) {
                          setCurrentMonth(currentMonth - 1);
                          // Reset selected date to show all transactions for the month
                          setSelectedDate('');
                        }
                      }}
                    >
                      <Text style={styles.monthSelectorButtonText}>‹</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.monthSelectorText}>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][currentMonth]}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.monthSelectorButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        closeOpenTransaction();
                        // Navigate to next month, enable when actual current date is in the next month
                        if (currentYear < actualCurrentYear || 
                            (currentYear === actualCurrentYear && currentMonth < actualCurrentMonth)) {
                          setCurrentMonth(currentMonth + 1);
                          // Reset selected date to show all transactions for the month
                          setSelectedDate('');
                        }
                      }}
                    >
                      <Text style={styles.monthSelectorButtonText}>›</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Date filter options - horizontal scrolling */}
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      closeOpenTransaction(); // Close any open transaction when interacting with filters
                    }}
                  >
                    {/* Show days of the selected month */}
                    {(() => {
                      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                      const days = [];
                      
                      // Add all days of the selected month
                      for (let day = 1; day <= daysInMonth; day++) {
                        days.push(
                          <TouchableOpacity 
                            key={day}
                            style={[styles.dateFilterButton, 
                              selectedDate === day.toString() && styles.selectedDateFilterButton]}
                            onPress={(e) => {
                              e.stopPropagation(); // Prevent closing when interacting with filters
                              closeOpenTransaction(); // Close any open transaction when changing filters
                              setSelectedDate(
                                selectedDate === day.toString() ? '' : day.toString()
                              );
                            }}
                          >
                            <Text style={[styles.dateFilterText, 
                              selectedDate === day.toString() && styles.selectedDateFilterText]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                      
                      return days;
                    })()}
                  </ScrollView>
                </View>
              </View>
            )}
            

            
            {activeFilter === 'category' && (
              <View 
                style={styles.categoryFilterContainer}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  closeOpenTransaction(); // Close any open transaction when interacting with filters
                }}
              >
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    closeOpenTransaction(); // Close any open transaction when interacting with filters
                  }}
                >
                  {(() => {
                    // Get all spending category names from the user's spending categories
                    const spendingCategoryGroups = state.spendingCategories;
                    const allSpendingCategories: string[] = [];
                    
                    // Extract category names from all groups
                    Object.values(spendingCategoryGroups).forEach(group => {
                      group.forEach(category => {
                        allSpendingCategories.push(category.name);
                      });
                    });
                    
                    // Remove duplicates and sort alphabetically
                    const uniqueCategories = [...new Set(allSpendingCategories)].sort();
                    
                    return uniqueCategories.map(category => (
                      <TouchableOpacity 
                        key={category}
                        style={[styles.categoryFilterButton, 
                          selectedCategory === category && styles.selectedCategoryFilterButton]}
                        onPress={(e) => {
                          e.stopPropagation(); // Prevent closing when interacting with filters
                          closeOpenTransaction(); // Close any open transaction when changing filters
                          setSelectedCategory(
                            selectedCategory === category ? '' : category
                          );
                        }}
                      >
                        <Text style={[styles.categoryFilterText, 
                          selectedCategory === category && styles.selectedCategoryFilterText]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ));
                  })()}
                </ScrollView>
              </View>
            )}
            

            
            {activeFilter === 'type' && (
              <View 
                style={styles.typeFilterContainer}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  closeOpenTransaction(); // Close any open transaction when interacting with filters
                }}
              >
                <TouchableOpacity 
                  style={[styles.typeFilterButton, 
                    selectedType === 'Income' && styles.selectedTypeFilterButton]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent closing when interacting with filters
                    closeOpenTransaction();
                    setSelectedType(
                      selectedType === 'Income' ? '' : 'Income'
                    );
                  }}
                >
                  <Text style={[styles.typeFilterText, 
                    selectedType === 'Income' && styles.selectedTypeFilterText]}>
                    Income
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeFilterButton, 
                    selectedType === 'Expense' && styles.selectedTypeFilterButton]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent closing when interacting with filters
                    closeOpenTransaction();
                    setSelectedType(
                      selectedType === 'Expense' ? '' : 'Expense'
                    );
                  }}
                >
                  <Text style={[styles.typeFilterText, 
                    selectedType === 'Expense' && styles.selectedTypeFilterText]}>
                    Expense
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Scrollable content area */}
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onTouchStart={(e) => e.stopPropagation()} // Prevent closing when interacting with scrollview
        >
          {/* Transaction items */}
          {filteredTransactions.map(transaction => {
            const isOpen = openTransaction === transaction.id;
            // Get or create animated value for this transaction
            let animatedValue = animatedValues.get(transaction.id);
            if (!animatedValue) {
              animatedValue = new Animated.Value(0);
              animatedValues.set(transaction.id, animatedValue);
            }
            
            return (
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.transactionItem}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleTransaction(transaction.id);
                }}
                delayPressIn={0}
              >
                <Animated.View 
                  style={[styles.transactionContent, { transform: [{ translateX: animatedValue }] }]}
                >
                  <View style={styles.dateIconContainer}>
                    <Text style={styles.monthText}>{transaction.month}</Text>
                    <Text style={styles.dayText}>{transaction.day}</Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{transaction.name}</Text>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  </View>
                  <Text style={[styles.transactionAmount, 
                    transaction.type === 'Income' ? styles.incomeAmount : styles.expenseAmount]}>
                    {formatCurrency(transaction.amount)}
                  </Text>
                </Animated.View>
                
                {/* Edit and Delete buttons that appear in the space created by transaction movement */}
                <Animated.View 
                  style={[styles.actionButtonsContainer, { 
                    opacity: animatedValue.interpolate({
                      inputRange: [0, 0.2 * Dimensions.get('window').width],
                      outputRange: [0, 1],
                      extrapolate: 'clamp'
                    })
                  }]}
                  pointerEvents={openTransaction === transaction.id ? 'auto' : 'none'}
                >
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      // Close the transaction before navigating to edit screen
                      closeOpenTransaction();
                      // Navigate to edit transaction screen
                      router.push({
                        pathname: '/transaction-modal',
                        params: { transactionId: transaction.id, editMode: 'true' }
                      });
                    }}
                  >
                    <IconSymbol name="pencil" size={20} color="#E2E8F0" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      // Show delete confirmation modal
                      setTransactionToDelete(transaction.id);
                      setShowDeleteModal(true);
                    }}
                  >
                    <IconSymbol name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        
        {/* Delete transaction modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDeleteModal}
          onRequestClose={() => {
            setShowDeleteModal(false);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Delete Transaction</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete this transaction?
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => {
                    setShowDeleteModal(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={confirmDeleteTransaction}
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
        {/* Add transaction button */}
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/transaction-modal')}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </ThemedView>
    {/* Don't call closeOpenTransaction when clicking elsewhere to keep transactions in their current position */}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D2543',
  },
  fixedHeader: {
    backgroundColor: '#1D2543',
    paddingTop: 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    zIndex: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#E2E8F0',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  filterButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 3,
    alignItems: 'center',
    minWidth: 70,
  },
  activeFilter: {
    backgroundColor: '#334155',
    borderColor: '#334155',
    borderRadius: 16,
    paddingVertical: 4,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  inactiveFilterText: {
    color: '#94A3B8',
  },
  filterSelectionContainer: {
    height: 50,
    marginBottom: 5, // Reduce space between filter options and transaction list
  },
  filterScrollView: {
    flex: 1,
  },
  dateFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  monthSelectorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 2,
  },
  monthSelectorButton: {
    paddingHorizontal: 5,
  },
  monthSelectorButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  monthSelectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    minWidth: 40,
    textAlign: 'center',
  },
  dateFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 2,
    minWidth: 30,
    alignItems: 'center',
  },
  selectedDateFilterButton: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  dateFilterText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  selectedDateFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  typeFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  typeFilterButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 1,
    alignItems: 'center',
  },
  selectedTypeFilterButton: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  typeFilterText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  selectedTypeFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  categoryFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  categoryFilterButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginHorizontal: 2,
    minWidth: 30,
    alignItems: 'center',
  },
  selectedCategoryFilterButton: {
    backgroundColor: '#334155',
    borderColor: '#334155',
  },
  categoryFilterText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  selectedCategoryFilterText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    left: 10,
    top: 14,
    zIndex: 2,
  },
  editButton: {
    backgroundColor: '#334155',
    padding: 6,
    borderRadius: 14,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#334155',
    padding: 6,
    borderRadius: 14,
  },
  dateIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#334155',
    borderRadius: 20,
    marginRight: 8,
    marginLeft: 20, // Move transaction icon slightly to the right
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    textAlign: 'center',
  },
  monthText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 4,
    paddingLeft: 5, // Move transaction name slightly to the right
  },
  transactionCategory: {
    fontSize: 12,
    color: '#94A3B8',
    paddingLeft: 5,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    marginRight: 15, // Move transaction amount slightly to the left
  },
  incomeAmount: {
    color: '#4ADE80',
  },
  expenseAmount: {
    color: '#F87171',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1e6469',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});