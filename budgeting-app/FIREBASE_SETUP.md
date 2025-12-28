# Firebase Setup Guide

This guide will help you set up Firebase for the Budgeting App.

## Prerequisites

1. A Google account
2. Node.js 18+ installed locally

## Setting up Firebase

### 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter a project name (e.g., "budgeting-app")
4. Accept the terms and conditions
5. Enable Google Analytics if desired (optional)
6. Click "Create project"

### 2. Register your app

1. In the Firebase Console, click "Project settings" (gear icon)
2. Under "Your apps", click the web icon (</> )
3. Enter an app nickname (e.g., "budgeting-app")
4. Click "Register app"
5. Save the Firebase configuration for later use

### 3. Set up Firestore Database

1. In the Firebase Console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose a location near you
5. Click "Enable"

### 4. Set up Authentication

1. In the Firebase Console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password" sign-in provider
5. Click "Save"

### 5. Generate Service Account Key

1. In the Firebase Console, click "Project settings" (gear icon)
2. Click the "Service accounts" tab
3. Click "Generate new private key"
4. Click "Generate key"
5. Save the downloaded JSON file securely

## Environment Configuration

### For Development

Create a `.env` file in the `backend` directory with the following content:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here

# Firebase configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_client_x509_cert_url
```

Replace the placeholder values with your actual Firebase configuration.

### For Production

When deploying to production, set the environment variables in your deployment platform instead of using a `.env` file.

## Testing the Connection

To test if Firebase is properly configured:

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Visit http://localhost:5000
3. You should see a response indicating that the API is running and whether Firebase is initialized

## Security Rules

For production, update your Firestore security rules in the Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Transactions can only be read/written by their owner
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        resource.data.user == request.auth.uid;
    }
    
    // Accounts can only be read/written by their owner
    match /accounts/{accountId} {
      allow read, write: if request.auth != null && 
        resource.data.user == request.auth.uid;
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Firebase not initializing**: Make sure all environment variables are correctly set
2. **Permission denied**: Check your Firestore security rules
3. **Invalid private key**: Ensure the private key is properly formatted with `\n` characters

### Getting Help

If you encounter issues:
1. Check the server logs for error messages
2. Verify your Firebase configuration
3. Ensure your service account has the necessary permissions