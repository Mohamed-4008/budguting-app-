const admin = require('firebase-admin');

let initialized = false;

// Check if we have Firebase credentials
if (process.env.FIREBASE_PROJECT_ID) {
  // Initialize with service account
  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  initialized = true;
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Initialize with default credentials (e.g., when running on Google Cloud)
  admin.initializeApp();
  initialized = true;
} else {
  // For local development, you might want to use the Firebase Emulator
  console.warn('Firebase not configured. Using default initialization.');
  try {
    admin.initializeApp();
    initialized = true;
  } catch (error) {
    console.warn('Failed to initialize Firebase:', error.message);
    initialized = false;
  }
}

let db = null;
if (initialized) {
  db = admin.firestore();
}

module.exports = { admin, db, initialized };