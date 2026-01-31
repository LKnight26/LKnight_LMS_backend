# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LKnight is a Learning Management System (LMS) backend API built with Express.js 5, Prisma ORM, and PostgreSQL. It provides REST APIs for course management, user authentication, enrollments, and admin analytics.

## Commands

```bash
# Development
npm run dev          # Start with nodemon (hot reload)
npm start            # Start production server

# Database
npm run prisma:generate   # Generate Prisma client after schema changes
npm run prisma:migrate    # Run database migrations
npm run prisma:studio     # Open Prisma Studio GUI
```

## Architecture

### Directory Structure
- `server.js` - Express app entry point, route mounting, middleware setup
- `src/config/db.js` - Prisma client singleton with pg adapter
- `src/config/swagger.js` - OpenAPI/Swagger configuration
- `src/controllers/` - Request handlers for each domain
- `src/routes/` - Express routers with Swagger JSDoc annotations
- `src/middleware/` - Auth verification and error handling
- `prisma/schema.prisma` - Database schema and enums
- `docs/API_DOCUMENTATION.md` - Complete API reference

### Key Patterns

**Database Access**: Import Prisma client from `src/config/db.js`:
```javascript
const prisma = require('../config/db');
```

**Authentication Middleware** (in `src/middleware/auth.js`):
- `verifyToken` - Validates JWT and sets `req.userId`, `req.userRole`
- `verifyAdmin` - Checks if token belongs to an Admin record
- `verifyInstructorOrAdmin` - Allows access for instructors or admins

**Response Format**: All endpoints return consistent JSON:
```javascript
{ success: true, data: {...}, message: "..." }
{ success: false, message: "Error description" }
```

**Error Handling**: Controllers use `next(error)` to delegate to `src/middleware/errorHandler.js`, which handles Prisma error codes (P2002 for duplicates, P2025 for not found).

### Nested Routes

Modules and lessons use nested routing under their parent resources:
- `/api/courses/:courseId/modules` - Module CRUD under courses
- `/api/modules/:moduleId/lessons` - Lesson CRUD under modules
- `/api/modules/:id` and `/api/lessons/:id` - Standalone routes for direct access

Routes export both the nested router (default) and `standaloneRouter` for direct ID access.

### Data Models

Core entities: User, Admin, Category, Course, Module, Lesson, Enrollment, Settings

Enums defined in Prisma schema: `UserRole`, `UserStatus`, `CourseLevel`, `CourseStatus`, `EnrollmentStatus`

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `SMTP_*` variables - For email sending (password reset)
- `FRONTEND_URL` - For password reset links

## API Documentation

- Swagger UI available at `/api-docs` when server is running
- Full API reference in `docs/API_DOCUMENTATION.md`

