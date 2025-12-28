# Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed locally (for development)
- MongoDB database (local or cloud)

## Local Development Setup

1. Clone the repository:
   ```
   git clone <repository-url>
   cd budgeting-app
   ```

2. Install dependencies for backend:
   ```
   cd backend
   npm install
   cd ..
   ```

3. Install dependencies for frontend:
   ```
   npm install
   ```

4. Create a `.env` file in the `backend` directory with your configuration:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

5. Start the development servers:
   ```
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   npm start
   ```

## Docker Deployment

1. Make sure Docker and Docker Compose are installed

2. Update the `docker-compose.yml` file with your production configuration:
   - Replace `your_jwt_secret_here` with a strong secret
   - Update MongoDB credentials if needed

3. Build and start the containers:
   ```
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Production Deployment

### Using Docker Compose

1. Update the `docker-compose.yml` file for production:
   - Change exposed ports if needed
   - Update environment variables
   - Configure volume mappings for persistent data

2. Run the production deployment:
   ```
   docker-compose -f docker-compose.yml up --build -d
   ```

### Manual Deployment

#### Backend

1. Install Node.js 18+ on your server

2. Copy the backend directory to your server

3. Install dependencies:
   ```
   npm ci --only=production
   ```

4. Create a `.env.production` file with your production configuration

5. Start the server:
   ```
   NODE_ENV=production npm start
   ```

#### Frontend

1. Install Node.js 18+ on your server

2. Copy the frontend directory to your server

3. Install dependencies:
   ```
   npm ci
   ```

4. Build the application:
   ```
   npm run build
   ```

5. Serve the application:
   ```
   npx serve -s dist
   ```

## Environment Variables

### Backend
- `PORT`: Port for the server to listen on (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Environment (development/production)

## Monitoring and Logging

- Check container logs: `docker-compose logs -f`
- Monitor system resources
- Set up application monitoring (e.g., PM2 for Node.js)

## Backup and Recovery

- Regular MongoDB backups
- Backup environment files
- Version control for source code

## Scaling

- Use a reverse proxy (nginx) for load balancing
- Scale backend containers: `docker-compose up --scale backend=3`
- Use a managed MongoDB service for production