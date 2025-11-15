# Query Tracking Application

A comprehensive multi-channel query management and response system with AI-powered classification, sentiment analysis, and priority detection.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Development Work](#development-work)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Query Tracking Application is a full-stack solution for managing customer queries across multiple communication channels including Email, Twitter, Facebook, Instagram, Discord, Slack, and more. The system features:

- **Multi-channel Integration**: Connect and manage queries from various social media and communication platforms
- **AI-Powered Classification**: Automatic categorization using transformer models
- **Sentiment Analysis**: Real-time sentiment detection using VADER and transformer models
- **Priority Detection**: Intelligent priority scoring based on multiple factors
- **Auto-tagging**: Automatic tag generation for better query organization
- **VIP Customer Detection**: Special handling for VIP customers
- **Role-based Access**: Admin, Manager, and Agent roles with different permissions
- **Real-time Updates**: Live query updates and notifications
- **Analytics & Reporting**: Comprehensive metrics and performance tracking

## ✨ Features

### Core Functionality
- ✅ Multi-channel query aggregation
- ✅ AI-powered query classification (9 categories)
- ✅ Sentiment analysis (Positive, Neutral, Negative)
- ✅ Automatic priority detection (Critical, High, Medium, Low)
- ✅ VIP customer identification
- ✅ Auto-tagging system
- ✅ Query assignment and routing
- ✅ Response management
- ✅ Escalation handling
- ✅ SLA tracking
- ✅ Analytics and reporting

### Supported Channels
- 📧 Email (IMAP)
- 🐦 Twitter/X
- 📘 Facebook
- 📷 Instagram
- 💬 Discord
- 💼 Slack
- 🌐 Website Chat
- 📱 WhatsApp (configurable)
- 💼 Microsoft Teams (configurable)
- 💼 LinkedIn (configurable)

## 🏗️ Architecture

The application follows a microservices architecture with three main components:

```
┌─────────────────┐
│   Frontend      │  React + TypeScript + Vite
│   (Port 5173)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │  Node.js + Express + Prisma
│   (Port 5000)   │
└────────┬────────┘
         │
         ├──────────────┐
         ▼              ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  ML Service  │  Python + FastAPI
│   Database   │  │  (Port 8001) │  + Transformers
└──────────────┘  └──────────────┘
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Integration Libraries**:
  - `discord.js` - Discord integration
  - `twitter-api-v2` - Twitter/X integration
  - `@slack/web-api` - Slack integration
  - `imap` + `mailparser` - Email integration

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Routing**: React Router v6

### ML Service
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **ML Libraries**:
  - Transformers (Hugging Face)
  - VADER Sentiment
  - NLTK
  - PyTorch
- **Models**:
  - Facebook BART for zero-shot classification
  - RoBERTa for sentiment analysis

## 📦 Prerequisites

Before setting up the application, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **PostgreSQL** (v13 or higher)
- **npm** or **yarn**
- **pip** or **pipenv**

### Optional (for ML features)
- **Visual C++ Redistributable** (Windows) - Required for PyTorch/Transformers
- **CUDA** (Optional) - For GPU acceleration

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Query Tracking App"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Setup PostgreSQL database
# Create a new database in PostgreSQL
createdb query_tracking_db

# Update DATABASE_URL in .env file
# DATABASE_URL="postgresql://username:password@localhost:5432/query_tracking_db"

# Generate Prisma Client
npm run generate

# Run database migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start backend server
npm run dev
```

The backend API will be available at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (see Environment Variables section)
cp .env.example .env

# Update VITE_API_URL in .env file
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 4. ML Service Setup

```bash
cd ml-service

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download NLTK data (automatic on first run)
python -c "import nltk; nltk.download('punkt'); nltk.download('stopwords')"

# Create .env file (see Environment Variables section)
cp .env.example .env

# Update ML_SERVICE_URL in backend .env file
# ML_SERVICE_URL=http://localhost:8001

# Start ML service
python api.py
# Or with uvicorn:
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

The ML service will be available at `http://localhost:8001`

## 🔐 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/query_tracking_db"

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# ML Service
ML_SERVICE_URL=http://localhost:8001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Channel Integration Credentials (add as needed)
TWITTER_BEARER_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_ACCESS_TOKEN=
TWITTER_ACCESS_TOKEN_SECRET=

DISCORD_BOT_TOKEN=

SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=

FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_ACCESS_TOKEN=

INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_ACCESS_TOKEN=
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

### ML Service (.env)

```env
# Service Configuration
PORT=8001
HOST=0.0.0.0
ENV=development

# ML Model Configuration
USE_TRANSFORMER_SENTIMENT=false
USE_ZERO_SHOT=true

# VIP Configuration
VIP_EMAILS=email1@example.com,email2@example.com
VIP_SENDER_IDS=id1,id2
```

## ▶️ Running the Application

### Development Mode

1. **Start PostgreSQL** (if not running as a service)
   ```bash
   # Windows (if installed as service, it starts automatically)
   # Linux/Mac
   sudo systemctl start postgresql
   ```

2. **Start ML Service**
   ```bash
   cd ml-service
   python api.py
   ```

3. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api
   - ML Service: http://localhost:8001
   - API Docs: http://localhost:8001/docs (FastAPI Swagger)

### Production Mode

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview

# ML Service
cd ml-service
uvicorn api:app --host 0.0.0.0 --port 8001 --workers 4
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Queries
- `GET /api/queries` - Get all queries (with filters)
- `GET /api/queries/:id` - Get query by ID
- `POST /api/queries` - Create new query
- `PUT /api/queries/:id` - Update query
- `DELETE /api/queries/:id` - Delete query
- `POST /api/queries/:id/assign` - Assign query to user

### Channels
- `GET /api/channels` - Get all channels
- `POST /api/channels` - Create channel
- `PUT /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel
- `POST /api/channels/:id/start` - Start channel integration
- `POST /api/channels/:id/stop` - Stop channel integration
- `POST /api/channels/:id/test` - Test channel connection

### ML Service
- `POST /analyze` - Analyze query text
- `POST /analyze/batch` - Batch analyze queries
- `GET /categories` - Get available categories
- `GET /priority-levels` - Get priority levels

## 📁 Project Structure

```
Query Tracking App/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   └── integrations/ # Channel integrations
│   │   └── utils/           # Utility functions
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Database seed
│   ├── server.js            # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # Zustand stores
│   │   └── App.tsx          # Main app component
│   ├── index.html
│   └── package.json
│
├── ml-service/
│   ├── classification/      # Classification models
│   ├── sentiment/          # Sentiment analysis
│   ├── preprocessing/      # Text preprocessing
│   ├── api.py              # FastAPI application
│   └── requirements.txt
│
└── README.md               # This file
```

## 🔨 Development Work

This section documents all the development work performed on this project:

### Code Cleanup & Optimization

1. **Removed All Documentation Files**
   - Deleted all `.md` files throughout the project (11 files total)
   - Removed: `NEXT_STEPS.md`, `setup.md`, `VIP_INTEGRATION_GUIDE.md`
   - Removed: All backend, frontend, and ml-service README files
   - Removed: All implementation guides and testing documentation

2. **Removed All Comments from Code**
   - **JavaScript/TypeScript Files**: Removed all single-line (`//`) and multi-line (`/* */`, `/** */`) comments from 59 files
     - All `.js`, `.ts`, and `.tsx` files cleaned
     - JSDoc comments removed
     - Inline comments removed
     - Code remains fully functional
   - **Python Files**: Removed comments and docstrings from Python files
     - Module-level docstrings removed
     - Function docstrings removed
     - Single-line comments (`#`) removed
     - Code functionality preserved

3. **Code Organization**
   - Maintained clean, production-ready codebase
   - All functionality preserved after cleanup
   - Improved code readability without comments

### Features Implemented

1. **Multi-Channel Integration System**
   - Base integration class for extensibility
   - Discord integration with bot API
   - Twitter/X integration with API v2
   - Email integration with IMAP
   - Facebook integration support
   - Instagram integration support
   - Slack integration support
   - Webhook handlers for real-time events

2. **AI/ML Services**
   - Zero-shot classification using Facebook BART
   - Sentiment analysis using VADER and RoBERTa
   - Priority scoring algorithm
   - Auto-tagging system
   - VIP customer detection
   - Keyword extraction
   - Urgency detection

3. **Backend API**
   - RESTful API with Express.js
   - JWT authentication
   - Role-based access control
   - Query management
   - Channel management
   - Response management
   - Escalation handling
   - Analytics tracking

4. **Frontend Application**
   - React TypeScript application
   - Dashboard with statistics
   - Query list with filtering
   - Query detail view
   - Channel management interface
   - Authentication pages
   - Responsive design with Tailwind CSS

5. **Database Schema**
   - PostgreSQL with Prisma ORM
   - User management with roles
   - Query tracking
   - Channel configuration
   - Category classification
   - Assignment tracking
   - Response history
   - Escalation records
   - Analytics data

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in `.env` file
   - Ensure database exists: `createdb query_tracking_db`

2. **ML Service Not Starting**
   - Check Python version: `python --version` (should be 3.9+)
   - Install dependencies: `pip install -r requirements.txt`
   - For Windows, ensure Visual C++ Redistributable is installed
   - Check port 8001 is available

3. **Frontend Cannot Connect to Backend**
   - Verify `VITE_API_URL` in frontend `.env`
   - Check CORS configuration in backend
   - Ensure backend is running on port 5000

4. **Channel Integration Not Working**
   - Verify API credentials in backend `.env`
   - Check channel configuration in database
   - Review integration logs for errors

5. **Transformers Model Loading Issues**
   - First-time download may take time
   - Check internet connection
   - Verify disk space
   - Consider using `USE_ZERO_SHOT=false` for faster startup

### Port Conflicts

If ports are already in use:

- **Backend (5000)**: Change `PORT` in `backend/.env`
- **Frontend (5173)**: Vite will automatically use next available port
- **ML Service (8001)**: Change `PORT` in `ml-service/.env`


**Note**: This application is production-ready but should be configured with proper security measures, especially for environment variables and API keys in production environments.

