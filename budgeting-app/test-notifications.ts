import { NotificationService } from './services/notification-service';

// Test function to verify notifications are working
export async function testNotifications() {
  console.log('Testing notifications...');
  
  // Request permissions
  const hasPermission = await NotificationService.requestPermissions();
  console.log('Notification permission:', hasPermission);
  
  if (hasPermission) {
    // Schedule a test notification
    const notificationId = await NotificationService.showImmediateNotification(
      'Test Notification',
      'This is a test notification from the budgeting app!'
    );
    
    console.log('Test notification sent with ID:', notificationId);
    
    // Schedule a future notification
    const futureDate = new Date();
    futureDate.setSeconds(futureDate.getSeconds() + 10);
    
    const futureNotificationId = await NotificationService.scheduleNotification(
      'Future Notification',
      'This notification was scheduled for 10 seconds from now!',
      futureDate
    );
    
    console.log('Future notification scheduled with ID:', futureNotificationId);
    
    return { immediate: notificationId, future: futureNotificationId };
  } else {
    console.log('Notification permissions not granted');
    return null;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testNotifications().catch(console.error);
}