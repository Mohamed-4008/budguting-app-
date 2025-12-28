import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';
import { AuthProvider } from '@/context/AuthContext';
import { BudgetProvider } from '@/context/budget-context';
import { ThemeProvider as CustomThemeProvider, useTheme } from '@/context/ThemeContext';
import { CurrencyProvider } from '@/context/currency-context'; // Import CurrencyProvider
import { NotificationService } from '@/services/notification-service';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Create a component that uses our custom theme to set the navigation theme
function ThemedNavigationProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  // Debugging: Log the current theme
  React.useEffect(() => {
    console.log('Root layout theme:', theme);
  }, [theme]);
  
  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;
  
  return (
    <ThemeProvider value={navigationTheme}>
      {children}
      <ThemedStatusBar />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions when app starts
    NotificationService.requestPermissions();
    
    // Set up notification listeners
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response received:', response);
    });

    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Cleanup listeners on unmount
    return () => {
      responseListener.remove();
      receivedListener.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <BudgetProvider>
        <CurrencyProvider> {/* Wrap with CurrencyProvider */}
          <CustomThemeProvider>
            <ThemedNavigationProvider>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="register" options={{ headerShown: false }} />
                <Stack.Screen name="welcome-back" options={{ headerShown: false }} />
                <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="savings-modal" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="transaction-modal" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="new-account" options={{ presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="account-details" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="edit-account" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="income-expense-details" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="category-details" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="category-transactions" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="monthly-budget-comparison" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="payment-method-details" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="savings-category-details" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="spending-category-details" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="edit-spending-category" options={{ presentation: 'card', headerShown: false, title: 'Edit Category' }} />
                <Stack.Screen name="contribute-to-goal" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="edit-goal" options={{ presentation: 'card', headerShown: false }} />
                <Stack.Screen name="transfer-funds" options={{ presentation: 'card', headerShown: false }} />
              </Stack>
            </ThemedNavigationProvider>
          </CustomThemeProvider>
        </CurrencyProvider>
      </BudgetProvider>
    </AuthProvider>
  );
}

function ThemedStatusBar() {
  const { theme } = useTheme();
  
  // Debugging: Log the current theme for StatusBar
  console.log('StatusBar theme:', theme);
  
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}