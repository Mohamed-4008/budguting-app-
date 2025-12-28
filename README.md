# Budgeting App

A mobile budgeting application built with React Native (Expo) for the frontend and Node.js/Express for the backend.

## Features

- Dashboard with financial overview
- Transaction tracking
- Account management
- Financial reports with data visualization
- User authentication
- Settings and preferences

## Tech Stack

### Frontend
- React Native with Expo
- TypeScript
- React Navigation
- react-native-chart-kit for data visualization

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT for authentication

## Project Structure

```
budgeting-app/
├── app/                 # Frontend screens and navigation
│   ├── (tabs)/          # Tab navigation screens
│   │   ├── index.tsx      # Dashboard
│   │   ├── transactions.tsx
│   │   ├── accounts.tsx
│   │   ├── reports.tsx
│   │   └── settings.tsx
│   └── _layout.tsx      # Root layout with AuthProvider
├── context/             # React Context for state management
├── screens/             # Additional screens
├── components/          # Reusable UI components
├── services/            # API service layer
├── backend/             # Backend API
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Backend services
│   └── server.js        # Entry point
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- MongoDB Atlas account (for production) or MongoDB locally

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd budgeting-app
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

### Running the App

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the frontend:
   ```bash
   cd budgeting-app
   npm start
   ```
3. Use Expo Go app on your phone to scan the QR code, or press 'w' to open in web browser

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create a new account
- `PUT /api/accounts/:id` - Update an account
- `DELETE /api/accounts/:id` - Delete an account

### Reports
- `GET /api/reports/summary` - Get financial summary
- `GET /api/reports/categories` - Get spending by category
- `GET /api/reports/trends` - Get monthly trends

## Future Improvements

- Implement real MongoDB connection
- Add data persistence for all features
- Implement proper user authentication flow
- Add unit tests
- Implement offline support
- Add push notifications
- Enhance data visualization
- Add budgeting goals and alerts

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License.