# Budgeting App

A comprehensive personal finance management application built with React Native (Expo) and Node.js.

## Features

- User authentication (registration and login)
- Account management (checking, savings, credit, investment)
- Transaction tracking (income and expenses)
- Category-based spending analysis
- Financial reporting and trends
- Responsive design for mobile and web

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- AsyncStorage for local storage

### Backend
- Node.js with Express
- Firebase (Firestore for database, Authentication)
- JWT for authentication
- RESTful API

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase account (see [FIREBASE_SETUP.md](FIREBASE_SETUP.md))
- Expo CLI

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd budgeting-app
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. Install frontend dependencies:
   ```bash
   npm install
   ```

4. Set up Firebase:
   - Follow the instructions in [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
   - Create a `.env` file in the `backend` directory with your Firebase configuration

5. Start the development servers:
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   npm start
   ```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Testing

Run backend tests:
```bash
cd backend
npm test
```

Run frontend tests:
```bash
npm test
```

## Project Structure

```
budgeting-app/
├── backend/           # Node.js backend API
│   ├── models/        # Data models (for consistency)
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   ├── config/        # Configuration files
│   └── services/      # Business logic
├── app/               # React Native frontend
│   ├── (tabs)/        # Tab navigation screens
│   ├── context/       # React context providers
│   ├── components/    # Reusable components
│   └── screens/       # Screen components
├── services/          # Shared services
└── utils/             # Utility functions
```

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Input validation and sanitization
- Rate limiting
- Security headers with Helmet
- MongoDB injection prevention (legacy, kept for compatibility)
- XSS attack prevention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.