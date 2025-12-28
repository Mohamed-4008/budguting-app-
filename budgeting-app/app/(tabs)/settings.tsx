import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { useCurrency } from '@/context/currency-context'; // Import currency context
import { useAuth } from '@/context/AuthContext'; // Import AuthContext
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { NotificationService } from '@/services/notification-service'; // Import notification service

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme(); // Get theme context and toggle function
  const { currency, setCurrency } = useCurrency(); // Get currency context
  const { user, logout } = useAuth(); // Get user and logout function from AuthContext
  
  // Debugging: Log the current theme
  React.useEffect(() => {
    console.log('Settings theme:', theme);
  }, [theme]);
  
  // Use dark theme colors regardless of theme setting
  const colors = {
    background: Colors.dark.background,
    cardBackground: Colors.dark.cardBackground,
    text: Colors.dark.text,
    weakText: Colors.dark.weakText,
    border: Colors.dark.border,
    tabBackground: Colors.dark.tabBackground,
    addButton: Colors.dark.addButton,
  };

  // User data is already obtained from auth context above
  
  // State for settings options
  const [userName, setUserName] = useState(user?.name || 'User');
  const [userEmail, setUserEmail] = useState(user?.email || 'user@example.com');
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  
  // Load settings from storage
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedBudgetAlerts = await AsyncStorage.getItem('budgetAlerts');
        const savedTransactionAlerts = await AsyncStorage.getItem('transactionAlerts');
        
        if (savedBudgetAlerts !== null) {
          setBudgetAlerts(JSON.parse(savedBudgetAlerts));
        }
        
        if (savedTransactionAlerts !== null) {
          setTransactionAlerts(JSON.parse(savedTransactionAlerts));
        }
      } catch (error) {
        console.log('Error loading settings:', error);
      }
    };
    
    loadSettings();
  }, []);
  
  // Update user info when user data changes
  React.useEffect(() => {
    if (user) {
      setUserName(user.name || 'User');
      setUserEmail(user.email || 'user@example.com');
    }
  }, [user]);
  
  // Save settings to storage when they change
  React.useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem('budgetAlerts', JSON.stringify(budgetAlerts));
        await AsyncStorage.setItem('transactionAlerts', JSON.stringify(transactionAlerts));
      } catch (error) {
        console.log('Error saving settings:', error);
      }
    };
    
    saveSettings();
  }, [budgetAlerts, transactionAlerts]);
  
  const handleChangeAccount = () => {
    // Navigate to welcome back screen
    router.push('/welcome-back');
  };
  
  const handleDeleteAccount = () => {
    console.log('Delete account button pressed');
    // Show confirmation dialog
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Handle delete account logic
            console.log('Account deleted');
            // In a real app, you would call your API to delete the account
            // and then log the user out
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };
  
  const handleFAQs = () => {
    console.log('FAQs pressed');
  };
  
  const handleContactUs = () => {
    console.log('Contact Us pressed');
  };
  
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  
  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed header with centered title */}
      <View style={[styles.header, { backgroundColor: colors.tabBackground }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>
      
      {/* Scrollable content */}
      <ScrollView style={styles.contentContainer}>
        {/* Personal account symbol */}
        <View style={[styles.iconContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <IconSymbol 
            name="person.fill" 
            size={50} 
            color={colors.weakText} 
          />
        </View>
        
        {/* User name */}
        <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
        
        {/* User email */}
        <Text style={[styles.userEmail, { color: colors.weakText }]}>{userEmail}</Text>
        
        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.changeAccountButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={handleChangeAccount}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Change Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteAccountButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.buttonText, styles.deleteButtonText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        {/* Individual Settings Items */}
        {/* Currency Selection */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Currency</Text>
          <View style={styles.optionsContainer}>
            {['USD', 'EUR'].map((currencyOption) => (
              <TouchableOpacity 
                key={currencyOption}
                style={[styles.optionButton, currency === currencyOption && styles.selectedOption, { backgroundColor: currency === currencyOption ? colors.addButton : colors.border }]}
                onPress={() => setCurrency(currencyOption as 'USD' | 'EUR')}
              >
                <Text style={[styles.optionText, currency === currencyOption && styles.selectedOptionText, { color: currency === currencyOption ? '#FFFFFF' : colors.weakText }]}>
                  {currencyOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Budget Alerts */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Budget Alerts</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.addButton }}
            thumbColor={budgetAlerts ? colors.addButton : colors.weakText}
            onValueChange={(value) => {
              setBudgetAlerts(value);
              // Save to AsyncStorage when toggled
              AsyncStorage.setItem('budgetAlerts', JSON.stringify(value)).catch(console.error);
            }}
            value={budgetAlerts}
          />
        </View>
        
        {/* Transaction Alerts */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Transaction Alerts</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.addButton }}
            thumbColor={transactionAlerts ? colors.addButton : colors.weakText}
            onValueChange={(value) => {
              setTransactionAlerts(value);
              // Save to AsyncStorage when toggled
              AsyncStorage.setItem('transactionAlerts', JSON.stringify(value)).catch(console.error);
            }}
            value={transactionAlerts}
          />
        </View>
        
        {/* FAQs */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>FAQs</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.weakText} />
        </View>
        
        {/* Logout */}
        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Text style={[styles.settingLabel, { color: colors.text }]}>Logout</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.weakText} />
        </TouchableOpacity>
        
        {/* Contact Us */}
        <View style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>Contact Us</Text>
          <IconSymbol name="chevron.right" size={16} color={colors.weakText} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconContainer: {
    marginVertical: 30,
    alignItems: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
  },
  changeAccountButton: {
    borderWidth: 1,
  },
  deleteAccountButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#F87171',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    marginBottom: 4,
  },
  selectedOption: {
  },
  optionText: {
    fontSize: 14,
  },
  selectedOptionText: {
    fontWeight: '600',
  },
});