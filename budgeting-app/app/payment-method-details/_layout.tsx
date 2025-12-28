import { Stack } from 'expo-router';

export default function PaymentMethodDetailsLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Payment Methods'
        }} 
      />
    </Stack>
  );
}