# Query Tracking Frontend

React + TypeScript frontend for the Audience Query Management & Response System.

## Features

- 🔐 Authentication (Login/Register)
- 📊 Dashboard with query statistics
- 📋 Query list with filtering and search
- 📝 Query detail view with responses
- 🎨 Modern UI with Tailwind CSS
- 🔄 Real-time state management with Zustand

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for routing
- **Zustand** for state management
- **Axios** for API calls
- **Tailwind CSS** for styling
- **Heroicons** for icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (optional, defaults to `http://localhost:5000/api`):
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── store/          # Zustand state management
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── package.json
```

## API Integration

The frontend communicates with the backend API at `http://localhost:5000/api`. Make sure the backend server is running before starting the frontend.

### API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/queries` - Get all queries
- `GET /api/queries/:id` - Get query by ID
- `PUT /api/queries/:id` - Update query
- `POST /api/queries/:id/assign` - Assign query
- `GET /api/responses?queryId=:id` - Get responses for a query
- `POST /api/responses` - Create a response

## Development

The frontend uses Vite's proxy feature to forward API requests to the backend during development. This is configured in `vite.config.ts`.

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: `http://localhost:5000/api`)

