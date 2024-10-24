# Employee Management System

## Description 
Employee attendance management system built with NestJS. Track attendance, generate reports, and manage users efficiently.

## Features
- Employee attendance tracking
- JWT authentication
- Email notifications
- Excel & PDF export
- OpenAI integration
- Redis queue system
- Paginating  and filtering

## Installation & Setup

**Prerequisites**
- Node.js v14+
- PostgreSQL
- Redis
- npm

**Steps**

1. Clone the repository
   ```
   git clone https://github.com/emilenfc/employee-management-software.git
   cd employee-management-software
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment
   ```
   cp .env.example .env
   ```

4. Update `.env` with your credentials:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=1234
   DB_NAME=your_database_name
   JWT_SECRET=your_secret_key
   
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USER=your_email
   MAIL_PASSWORD=your_password
   
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   OPENAI_API_KEY=your_openai_api_key
   ```

## Usage

**Development**
```
npm run build
npm run start
```
**Runing tests**
```
npm run test
```
## Available Commands
- `npm run build` - Build app
- `npm run start` - Start app
- `npm run start:dev` - Development mode
- `npm run start:prod` - Production mode
- `npm run test` - Run tests
- `npm run test:cov` - Test coverage

## Project Structure
```
src/
├── controllers/    # Route controllers
├── services/      # Business logic
├── entities/      # Database entities
├── dto/           # Data Transfer Objects
├── guards/        # Authentication guards
└── main.ts        # Entry point
```

## API Documentation
Access Swagger docs at:
```
http://localhost:5000/api/docs
```

## Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## Author
IYADUKUNZE Emile
- GitHub: [@emilenfc](https://github.com/emilenfc)

## License
UNLICENSED