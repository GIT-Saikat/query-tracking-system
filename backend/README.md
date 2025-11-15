# Query Tracking Backend API

Backend API for the Audience Query Management & Response System built with Node.js, Express, and PostgreSQL.

## Features

- 🔐 JWT-based authentication and authorization
- 📊 Multi-channel query management (Email, Social Media, Chat platforms)
- 🏷️ Auto-tagging and classification system
- 📈 Priority detection and SLA management
- 👥 User management with role-based access control (Admin, Manager, Agent)
- 📝 Response management and conversation threading
- 🎯 Query assignment and routing
- 📊 Analytics and reporting support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend root directory:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=5000

   # Database Configuration
   DATABASE_URL="postgresql://user:password@localhost:5432/query_tracking?schema=public"

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000

   # Logging
   LOG_LEVEL=info

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma Client
   npm run generate

   # Run database migrations
   npm run migrate

   # Seed initial data (optional)
   npm run seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

The API will be available at `http://localhost:5000/api`

## Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE query_tracking;
   ```

2. **Update DATABASE_URL in .env file** with your database credentials

3. **Run migrations**
   ```bash
   npm run migrate
   ```

4. **Seed initial data** (creates admin, manager, agents, categories, and channels)
   ```bash
   npm run seed
   ```

## Default Users (from seed)

- **Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **Agent 1**: agent1@example.com / agent123
- **Agent 2**: agent2@example.com / agent123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)

### Users
- `GET /api/users` - Get all users (Admin/Manager only)
- `GET /api/users/:id` - Get user by ID (Protected)
- `PUT /api/users/:id` - Update user (Protected)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Queries
- `GET /api/queries` - Get all queries with filters (Protected)
- `GET /api/queries/:id` - Get query by ID (Protected)
- `POST /api/queries` - Create a new query (Protected)
- `PUT /api/queries/:id` - Update query (Protected)
- `DELETE /api/queries/:id` - Delete query (Admin/Manager only)
- `POST /api/queries/:id/assign` - Assign query to user (Admin/Manager only)

### Channels
- `GET /api/channels` - Get all channels (Protected)
- `GET /api/channels/:id` - Get channel by ID (Protected)
- `POST /api/channels` - Create channel (Admin/Manager only)
- `PUT /api/channels/:id` - Update channel (Admin/Manager only)
- `DELETE /api/channels/:id` - Delete channel (Admin only)

### Categories
- `GET /api/categories` - Get all categories (Protected)
- `GET /api/categories/:id` - Get category by ID (Protected)
- `POST /api/categories` - Create category (Admin/Manager only)
- `PUT /api/categories/:id` - Update category (Admin/Manager only)
- `DELETE /api/categories/:id` - Delete category (Admin/Manager only)

### Responses
- `GET /api/responses/query/:queryId` - Get all responses for a query (Protected)
- `POST /api/responses` - Create a new response (Protected)
- `PUT /api/responses/:id` - Update response (Protected)
- `DELETE /api/responses/:id` - Delete response (Protected)

### Health Check
- `GET /api/health` - Health check endpoint

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Request/Response Examples

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response:
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Create Query
```bash
POST /api/queries
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "...",
  "subject": "Product inquiry",
  "content": "I would like to know more about your product",
  "senderName": "John Doe",
  "senderEmail": "john@example.com"
}
```

### Get Queries with Filters
```bash
GET /api/queries?status=NEW&priority=HIGH&page=1&limit=20
Authorization: Bearer <token>
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── config.js    # App configuration
│   │   └── database.js  # Prisma client
│   ├── controllers/     # Route controllers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── queryController.js
│   │   ├── channelController.js
│   │   ├── categoryController.js
│   │   └── responseController.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # Authentication middleware
│   │   ├── validation.js
│   │   └── errorHandler.js
│   ├── routes/          # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── queryRoutes.js
│   │   ├── channelRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── responseRoutes.js
│   │   └── index.js
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── queryService.js
│   │   ├── channelService.js
│   │   ├── categoryService.js
│   │   └── responseService.js
│   └── utils/           # Utility functions
│       ├── errors.js    # Custom error classes
│       └── logger.js    # Winston logger
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.js          # Database seed file
├── logs/                # Application logs
├── .env                 # Environment variables (create this)
├── .gitignore
├── package.json
├── server.js            # Entry point
└── README.md
```

## Database Models

- **User** - Agents, managers, and admins
- **Query** - Incoming messages/queries
- **Channel** - Platform configurations (Email, Twitter, etc.)
- **Category** - Classification types
- **Assignment** - Query-agent mapping
- **Response** - Outgoing messages
- **Escalation** - Priority events
- **Analytics** - Metrics and reports

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run generate` - Generate Prisma Client
- `npm run seed` - Seed database with initial data
- `npm run studio` - Open Prisma Studio (database GUI)

## Error Handling

The API uses a centralized error handling system:

- **400 Bad Request** - Validation errors
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server errors

Error response format:
```json
{
  "status": "error",
  "message": "Error message"
}
```

## Security Features

- ✅ JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Rate limiting
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ SQL injection protection (via Prisma)

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output with colors

## Development

1. Install dependencies: `npm install`
2. Set up environment: Copy `.env.example` to `.env` and configure
3. Set up database: Create PostgreSQL database and run migrations
4. Seed database: `npm run seed`
5. Start development server: `npm run dev`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper `CORS_ORIGIN`
4. Set up PostgreSQL database (managed service recommended)
5. Use process manager like PM2
6. Set up reverse proxy (Nginx)
7. Configure SSL/TLS certificates
8. Set up monitoring and logging

## Next Steps

- Implement ML/NLP service integration for auto-tagging
- Add WebSocket support for real-time updates
- Implement analytics and reporting endpoints
- Add file upload support for attachments
- Implement channel integrations (Email, Social Media APIs)
- Add comprehensive testing (Unit, Integration, E2E)
- Set up API documentation with Swagger/OpenAPI

## License

ISC

