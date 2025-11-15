# Backend Testing Guide

This guide helps you test the backend API to verify it works according to `setup.md` requirements, specifically **Phase 1: Core Infrastructure**.

## Prerequisites

1. **Backend server running**: `npm run dev`
2. **Database set up**: PostgreSQL running with migrations applied
3. **Database seeded**: `npm run seed` (for test users)
4. **API client**: Use Postman, curl, or any HTTP client

## Test Base URL

```
http://localhost:5000/api
```

---

## Test Suite Overview

### Phase 1 Tests (Core Infrastructure)
- ✅ **1. Authentication System (JWT)**
- ✅ **2. CRUD Operations for Core Entities**
- ✅ **3. Error Handling and Validation**
- ✅ **4. Database Schema & Models**
- ✅ **5. Priority Detection**
- ✅ **6. Query Assignment**

---

## Test 1: Health Check & API Info

### 1.1 Root API Endpoint
```bash
GET http://localhost:5000/api
```

**Expected Response**: API information with available endpoints

### 1.2 Health Check
```bash
GET http://localhost:5000/api/health
```

**Expected Response**: 
```json
{
  "status": "success",
  "message": "API is running",
  "timestamp": "..."
}
```

---

## Test 2: Authentication System

### 2.1 Register New User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "testagent@example.com",
  "password": "test123",
  "firstName": "Test",
  "lastName": "Agent",
  "role": "AGENT",
  "department": "Support"
}
```

**Expected**: 201 Created with user and token

### 2.2 Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Expected**: 200 OK with user and JWT token

**Save the token** for subsequent requests!

### 2.3 Get Current User (Protected)
```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer <YOUR_TOKEN>
```

**Expected**: 200 OK with user details

### 2.4 Login with Invalid Credentials
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "wrongpassword"
}
```

**Expected**: 401 Unauthorized

---

## Test 3: Users Management

### 3.1 Get All Users (Admin/Manager only)
```bash
GET http://localhost:5000/api/users
Authorization: Bearer <ADMIN_TOKEN>
```

**Expected**: 200 OK with list of users

### 3.2 Get User by ID
```bash
GET http://localhost:5000/api/users/<USER_ID>
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with user details

### 3.3 Update User
```bash
PUT http://localhost:5000/api/users/<USER_ID>
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "firstName": "Updated",
  "department": "Sales"
}
```

**Expected**: 200 OK with updated user

---

## Test 4: Channels Management

### 4.1 Get All Channels
```bash
GET http://localhost:5000/api/channels
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with list of channels (Email, Twitter, Facebook, etc.)

### 4.2 Get Channel by ID
```bash
GET http://localhost:5000/api/channels/<CHANNEL_ID>
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with channel details

### 4.3 Create Channel (Admin/Manager only)
```bash
POST http://localhost:5000/api/channels
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "WhatsApp",
  "type": "WHATSAPP",
  "isActive": true
}
```

**Expected**: 201 Created with channel details

### 4.4 Update Channel
```bash
PUT http://localhost:5000/api/channels/<CHANNEL_ID>
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "isActive": false
}
```

**Expected**: 200 OK with updated channel

---

## Test 5: Categories Management

### 5.1 Get All Categories
```bash
GET http://localhost:5000/api/categories
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with list of categories (Question, Complaint, etc.)

### 5.2 Create Category (Admin/Manager only)
```bash
POST http://localhost:5000/api/categories
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "name": "Refund Request",
  "description": "Customer refund inquiries",
  "color": "#FF5733"
}
```

**Expected**: 201 Created with category details

---

## Test 6: Queries Management (Core Feature)

### 6.1 Create Query
First, get a channel ID from Test 4.1, then:

```bash
POST http://localhost:5000/api/queries
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "channelId": "<CHANNEL_ID>",
  "subject": "Product inquiry",
  "content": "I would like to know more about your premium product features",
  "senderName": "John Doe",
  "senderEmail": "john@example.com"
}
```

**Expected**: 201 Created with query details (priority auto-detected)

### 6.2 Create Query with Priority Keywords (Auto-detection)
```bash
POST http://localhost:5000/api/queries
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "channelId": "<CHANNEL_ID>",
  "subject": "URGENT: Service down",
  "content": "Your service is completely broken and critical for our business. This is urgent!",
  "senderName": "Jane Smith",
  "senderEmail": "jane@example.com",
  "isVip": true
}
```

**Expected**: 201 Created with **HIGH** priority (due to keywords + VIP)

### 6.3 Get All Queries
```bash
GET http://localhost:5000/api/queries
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with paginated list of queries

### 6.4 Get Queries with Filters
```bash
GET http://localhost:5000/api/queries?status=NEW&priority=HIGH&page=1&limit=10
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with filtered queries

### 6.5 Get Query by ID
```bash
GET http://localhost:5000/api/queries/<QUERY_ID>
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with full query details including channel, category, assignments, responses

### 6.6 Update Query Status
```bash
PUT http://localhost:5000/api/queries/<QUERY_ID>
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "categoryId": "<CATEGORY_ID>"
}
```

**Expected**: 200 OK with updated query

### 6.7 Update Query Priority
```bash
PUT http://localhost:5000/api/queries/<QUERY_ID>
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "priority": "CRITICAL"
}
```

**Expected**: 200 OK with updated query (SLA due date recalculated)

---

## Test 7: Query Assignment (Core Feature)

### 7.1 Assign Query to User
Get a query ID from Test 6.3 and a user ID from Test 3.1:

```bash
POST http://localhost:5000/api/queries/<QUERY_ID>/assign
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{
  "userId": "<USER_ID>",
  "notes": "Assigned to experienced agent"
}
```

**Expected**: 200 OK with assignment details. Query status changes to "ASSIGNED"

### 7.2 Verify Assignment
```bash
GET http://localhost:5000/api/queries/<QUERY_ID>
Authorization: Bearer <TOKEN>
```

**Expected**: Query shows assignment with user details, status = "ASSIGNED"

---

## Test 8: Responses Management

### 8.1 Create Response
```bash
POST http://localhost:5000/api/responses
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "queryId": "<QUERY_ID>",
  "content": "Thank you for reaching out. We'll get back to you shortly.",
  "isInternal": false
}
```

**Expected**: 201 Created with response. Query status changes to "IN_PROGRESS"

### 8.2 Get All Responses for Query
```bash
GET http://localhost:5000/api/responses/query/<QUERY_ID>
Authorization: Bearer <TOKEN>
```

**Expected**: 200 OK with list of responses (conversation thread)

### 8.3 Create Internal Note
```bash
POST http://localhost:5000/api/responses
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "queryId": "<QUERY_ID>",
  "content": "Customer has been contacted. Waiting for their reply.",
  "isInternal": true
}
```

**Expected**: 201 Created with internal response

---

## Test 9: Priority Detection & SLA

### 9.1 Test Priority Auto-Detection
Create multiple queries with different content:

**Low Priority** (normal inquiry):
```json
{
  "channelId": "<CHANNEL_ID>",
  "content": "Hello, I have a general question about your service"
}
```

**High Priority** (urgent keywords):
```json
{
  "channelId": "<CHANNEL_ID>",
  "content": "URGENT! The system is broken and critical for our business!"
}
```

**VIP Customer**:
```json
{
  "channelId": "<CHANNEL_ID>",
  "content": "Regular question",
  "isVip": true
}
```

**Expected**: 
- First query: MEDIUM priority
- Second query: HIGH priority (keyword detection)
- Third query: HIGH priority (VIP status)

### 9.2 Verify SLA Calculation
Check that queries have `slaDueAt` field calculated based on priority:
- CRITICAL: 1 hour
- HIGH: 4 hours
- MEDIUM: 24 hours
- LOW: 72 hours

---

## Test 10: Error Handling & Validation

### 10.1 Invalid Email Format
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "invalid-email",
  "password": "test123"
}
```

**Expected**: 400 Bad Request with validation error

### 10.2 Missing Required Fields
```bash
POST http://localhost:5000/api/queries
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "channelId": "<CHANNEL_ID>"
  // Missing "content"
}
```

**Expected**: 400 Bad Request with validation error

### 10.3 Invalid UUID
```bash
GET http://localhost:5000/api/queries/invalid-uuid
Authorization: Bearer <TOKEN>
```

**Expected**: 400 Bad Request with validation error

### 10.4 Unauthorized Access (No Token)
```bash
GET http://localhost:5000/api/queries
```

**Expected**: 401 Unauthorized

### 10.5 Forbidden Access (Agent trying admin action)
```bash
DELETE http://localhost:5000/api/queries/<QUERY_ID>
Authorization: Bearer <AGENT_TOKEN>
```

**Expected**: 403 Forbidden

### 10.6 Resource Not Found
```bash
GET http://localhost:5000/api/queries/00000000-0000-0000-0000-000000000000
Authorization: Bearer <TOKEN>
```

**Expected**: 404 Not Found

---

## Test 11: Database Schema Verification

### 11.1 Verify All Tables Exist
Use Prisma Studio to verify:
```bash
npm run studio
```

Check these tables exist:
- ✅ users
- ✅ queries
- ✅ channels
- ✅ categories
- ✅ assignments
- ✅ responses
- ✅ escalations
- ✅ analytics

### 11.2 Verify Relationships
- Queries belong to Channel and Category
- Assignments link Queries and Users
- Responses belong to Queries and Users
- Queries can have multiple Assignments
- Queries can have multiple Responses

---

## Test 12: Query Lifecycle

Test the complete query lifecycle:

1. **Create Query** → Status: NEW
2. **Assign Query** → Status: ASSIGNED
3. **Create Response** → Status: IN_PROGRESS
4. **Update Status to RESOLVED** → Status: RESOLVED
5. **Update Status to CLOSED** → Status: CLOSED

```bash
# 1. Create
POST /api/queries → status: NEW

# 2. Assign
POST /api/queries/{id}/assign → status: ASSIGNED

# 3. Respond
POST /api/responses → status: IN_PROGRESS

# 4. Resolve
PUT /api/queries/{id} → {"status": "RESOLVED"}

# 5. Close
PUT /api/queries/{id} → {"status": "CLOSED"}
```

---

## Test Checklist

Use this checklist to verify Phase 1 completion:

### Core Infrastructure ✅
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] Health check endpoint works
- [ ] API info endpoint works

### Authentication System ✅
- [ ] User registration works
- [ ] User login returns JWT token
- [ ] Protected routes require authentication
- [ ] Token validation works
- [ ] Password hashing works (bcrypt)

### Database Models ✅
- [ ] All tables created (users, queries, channels, categories, assignments, responses, escalations, analytics)
- [ ] Foreign key relationships work
- [ ] Seed data loads correctly

### CRUD Operations ✅
- [ ] Users CRUD
- [ ] Channels CRUD
- [ ] Categories CRUD
- [ ] Queries CRUD
- [ ] Responses CRUD

### Priority Detection ✅
- [ ] Auto-priority detection based on keywords
- [ ] VIP customer priority escalation
- [ ] SLA calculation based on priority
- [ ] Priority can be manually updated

### Query Assignment ✅
- [ ] Query can be assigned to user
- [ ] Assignment updates query status
- [ ] Assignment history is tracked
- [ ] Multiple assignments possible

### Status Tracking ✅
- [ ] Query lifecycle: NEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
- [ ] Status updates work correctly
- [ ] Timestamps tracked (assignedAt, resolvedAt, etc.)

### Error Handling ✅
- [ ] Validation errors return 400
- [ ] Authentication errors return 401
- [ ] Authorization errors return 403
- [ ] Not found errors return 404
- [ ] Server errors return 500
- [ ] Error messages are clear and helpful

### Security ✅
- [ ] JWT authentication works
- [ ] Role-based authorization (Admin, Manager, Agent)
- [ ] Password hashing (bcrypt)
- [ ] Rate limiting works
- [ ] CORS configured
- [ ] Helmet security headers

---

## Quick Test Script (Using curl)

Save this as `test-api.sh` (for bash) or use PowerShell equivalent:

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api"

# 1. Health Check
echo "1. Health Check..."
curl -s "$BASE_URL/health" | jq

# 2. Login
echo "\n2. Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')
echo $LOGIN_RESPONSE | jq

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

# 3. Get Current User
echo "\n3. Get Current User..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/auth/me" | jq

# 4. Get Channels
echo "\n4. Get Channels..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/channels" | jq
```

---

## Performance Testing (Optional)

According to setup.md, target response time is < 200ms.

Use tools like:
- Apache Bench: `ab -n 100 -c 10 http://localhost:5000/api/health`
- wrk: `wrk -t4 -c100 -d30s http://localhost:5000/api/health`
- Postman: Run collection with timing enabled

---

## Next Steps

After completing Phase 1 tests, you'll be ready for:
- **Phase 2**: Channel integrations (Email, Social Media APIs)
- **Phase 3**: ML/NLP service integration
- **Phase 4**: Advanced assignment algorithms
- **Phase 5**: Analytics and reporting

---

## Troubleshooting

### Server not starting
- Check if port 5000 is available
- Verify DATABASE_URL in .env
- Check database connection

### Database errors
- Run `npm run migrate` to create tables
- Run `npm run seed` to populate initial data
- Verify PostgreSQL is running

### Authentication errors
- Check JWT_SECRET in .env
- Verify token format: `Bearer <token>`
- Check token expiration

### 404 errors
- Verify route paths match exactly
- Check server logs for errors
- Ensure routes are registered

---

**Happy Testing! 🚀**

