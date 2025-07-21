# AccReader Backend

A clean architecture Node.js backend for AccReader with MailWizz integration and PMTA import server.

## Features

- **Clean Architecture**: Separation of concerns with controllers, services, models, and middleware
- **Authentication**: JWT-based authentication with role-based access control
- **MailWizz Integration**: Complete API integration for campaign management
- **PMTA Import Server**: File processing and analytics for PMTA logs
- **Database Support**: SQLite for development, MySQL for production
- **API Documentation**: Swagger/OpenAPI 3.0 documentation
- **Security**: Helmet, CORS, rate limiting, input validation
- **Logging**: Winston-based logging with file and console output
- **File Upload**: Multer-based file upload with validation

## Project Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # Route definitions
├── services/       # Business logic services
├── utils/          # Utility functions
└── validators/     # Input validation
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository and navigate to the server directory:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration:
   - Update JWT secret
   - Configure MailWizz API credentials
   - Set database connection details

5. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:4000`

### API Documentation

Once the server is running, visit `http://localhost:4000/api-docs` for interactive API documentation.

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/updatePassword` - Update password

### User Management

- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### MailWizz Integration

- `GET /api/mailwizz/campaigns` - Get all campaigns
- `GET /api/mailwizz/campaigns/:id` - Get campaign details
- `POST /api/mailwizz/campaigns` - Create campaign
- `GET /api/mailwizz/campaigns/:id/stats` - Get campaign statistics
- `GET /api/mailwizz/lists` - Get all lists
- `GET /api/mailwizz/lists/:id` - Get list details
- `GET /api/mailwizz/lists/:id/subscribers` - Get list subscribers
- `GET /api/mailwizz/templates` - Get all templates

### PMTA Import Server

- `GET /api/pmta/health` - Health check
- `POST /api/pmta/upload/log` - Upload PMTA log file
- `POST /api/pmta/upload/accounting` - Upload accounting file
- `POST /api/pmta/upload/bounces` - Upload bounce file
- `POST /api/pmta/analyze` - Analyze uploaded data

### File Upload

- `POST /api/upload/file` - General file upload

## User Roles

- **admin**: Full access to all endpoints and user management
- **client**: Access to MailWizz integration and own user data
- **pmta_user**: Access to PMTA import functionality and own user data

## Environment Variables

See `.env.example` for all available configuration options.

## Security Features

- JWT authentication with secure HTTP-only cookies
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- CORS protection
- Helmet for security headers
- Input validation and sanitization
- File upload restrictions

## Database Models

### User

- Basic user information
- Role-based access control
- MailWizz API key storage
- PMTA access permissions

## Error Handling

The application uses centralized error handling with:

- Custom AppError class
- Global error middleware
- Structured error responses
- Comprehensive logging

## Logging

Winston-based logging with:

- Console output in development
- File logging in production
- Different log levels (error, warn, info, debug)
- Request/response logging with Morgan

## Testing

The project includes Jest setup for:

- Unit tests
- Integration tests
- API endpoint testing

Run tests with:

```bash
npm test
```

## Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure proper CORS origins
5. Set up SSL/HTTPS
6. Configure process manager (PM2)

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Run linting before committing

## License

MIT
