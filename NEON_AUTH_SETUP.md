# Neon Auth Setup Guide

## 🚀 Complete Cross-Project Authentication System

Your hotel management system now has a comprehensive authentication system that works with Neon PostgreSQL and supports cross-project access.

## 📋 Setup Steps

### 1. Create Neon Database
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create project: `hotel-management-system`
3. Copy the PostgreSQL connection string

### 2. Configure Environment
Copy the connection string to your `.env` file:
```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-super-secret-jwt-key-here"
PROJECT_ID="hotel-management-system"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
```

### 3. Run Database Migration
```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
```

## 🔐 Authentication Features

### Cross-Project Access
- **Global User ID**: Users get a unique ID that works across all your projects
- **Project Permissions**: Users can be granted access to multiple projects
- **API Keys**: Generate keys for programmatic access across projects

### Authentication Methods
1. **JWT Tokens**: Standard web authentication
2. **API Keys**: For server-to-server communication
3. **Session Management**: Secure session tracking

## 🛠 API Endpoints

### Authentication
- `POST /api/neon-auth/register` - Register new user
- `POST /api/neon-auth/login` - User login
- `POST /api/neon-auth/logout` - User logout
- `GET /api/neon-auth/profile` - Get user profile

### Cross-Project Management
- `POST /api/neon-auth/api-keys` - Create API key
- `POST /api/neon-auth/grant-access` - Grant project access (Admin)
- `POST /api/neon-auth/revoke-access` - Revoke project access (Admin)
- `POST /api/neon-auth/verify` - Verify token from other projects

## 🔧 Usage Examples

### Register User
```javascript
const response = await fetch('/api/neon-auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securepassword',
    role: 'GUEST'
  })
});
```

### Login
```javascript
const response = await fetch('/api/neon-auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'securepassword'
  })
});

const { token, user, projects } = await response.json();
```

### Use Token in Requests
```javascript
const response = await fetch('/api/guest/bookings', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Create API Key
```javascript
const response = await fetch('/api/neon-auth/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My API Key',
    projects: ['hotel-management-system', 'other-project']
  })
});
```

### Use API Key
```javascript
const response = await fetch('/api/guest/profile', {
  headers: {
    'X-API-Key': 'neon_your_api_key_here',
    'Content-Type': 'application/json'
  }
});
```

## 🌐 Cross-Project Integration

### From Another Project
```javascript
// Verify token from hotel management system
const verifyResponse = await fetch('http://hotel-api/api/neon-auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: userToken })
});

const { valid, user, projects } = await verifyResponse.json();

if (valid && projects.includes('my-other-project')) {
  // User has access to this project
  console.log('User authenticated:', user);
}
```

## 🔒 Security Features

- **JWT Tokens**: 7-day expiration with secure signing
- **Session Tracking**: Database-stored sessions with expiration
- **Project Isolation**: Users only access authorized projects
- **API Key Management**: Revocable keys with project-specific access
- **Password Hashing**: bcrypt with salt rounds
- **CORS Protection**: Configurable origin restrictions

## 📊 Database Schema

### Enhanced User Model
- `globalUserId`: Unique identifier across projects
- `projects[]`: Array of accessible project IDs
- `emailVerified`: Email verification status
- `isActive`: Account status
- `lastLogin`: Last login timestamp

### Session Management
- `UserSession`: Active user sessions
- `ApiKey`: API keys for programmatic access

## 🚀 Next Steps

1. **Set up your .env file** with Neon connection string
2. **Run the migration** to create tables
3. **Test the authentication** endpoints
4. **Integrate with your frontend** components
5. **Create API keys** for cross-project access

Your authentication system is now ready for production use across all your projects!
