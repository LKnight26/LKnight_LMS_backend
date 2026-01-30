# LKnight Admin Panel - API Documentation

**Base URL:** `http://localhost:3000`
**API Prefix:** `/api`
**Authentication:** JWT Bearer Token

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Users](#2-users)
3. [Categories](#3-categories)
4. [Courses](#4-courses)
5. [Modules](#5-modules)
6. [Lessons](#6-lessons)
7. [Enrollments](#7-enrollments)
8. [Dashboard](#8-dashboard)
9. [Response Formats](#response-formats)
10. [Error Handling](#error-handling)

---

## 1. Authentication

### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "Admin"
    },
    "token": "jwt_token_here"
  }
}
```

### Register
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123"
}
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

---

## 2. Users

### Get All Users
```
GET /api/users
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| search | string | - | Search by name or email |
| role | string | - | Filter by role: `Student`, `Instructor`, `Admin` |
| status | string | - | Filter by status: `Active`, `Inactive` |
| sortBy | string | createdAt | Sort field: `firstName`, `lastName`, `email`, `createdAt`, `role`, `status` |
| order | string | desc | Sort order: `asc`, `desc` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "avatar": "JD",
      "role": "Student",
      "status": "Active",
      "enrolledCourses": 5,
      "joinedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Get User by ID
```
GET /api/users/:id
Authorization: Bearer <token>
```

### Create User
```
POST /api/users
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "password": "password123",
  "role": "Student",
  "status": "Active",
  "avatar": null
}
```

### Update User
```
PUT /api/users/:id
Authorization: Bearer <token>
```

**Request Body:** (all fields optional)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "role": "Instructor",
  "status": "Active",
  "password": "newpassword"
}
```

### Delete User
```
DELETE /api/users/:id
Authorization: Bearer <token>
```

### Toggle User Status
```
PATCH /api/users/:id/status
Authorization: Bearer <token>
```

**Request Body:** (optional - toggles if not provided)
```json
{
  "status": "Active"
}
```

### Change User Role
```
PATCH /api/users/:id/role
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "role": "Instructor"
}
```

**Valid Roles:** `Student`, `Instructor`, `Admin`

### Get User Statistics
```
GET /api/users/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "students": 120,
    "instructors": 25,
    "admins": 5,
    "activeUsers": 140,
    "inactiveUsers": 10
  }
}
```

---

## 3. Categories

### Get All Categories
```
GET /api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Web Development",
      "slug": "web-development",
      "description": "Learn web technologies",
      "icon": "code",
      "iconBgColor": "bg-blue-500",
      "order": 0,
      "courseCount": 12,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 8
}
```

### Get Category by ID
```
GET /api/categories/:id
```

### Create Category
```
POST /api/categories
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Mobile Development",
  "description": "Build mobile apps",
  "icon": "smartphone",
  "iconBgColor": "bg-green-500"
}
```

**Available Icons:** `code`, `smartphone`, `chart`, `palette`, `server`, `cloud`, `book`, `video`

**Available Colors:** `bg-blue-500`, `bg-green-500`, `bg-purple-500`, `bg-orange-500`, `bg-red-500`, `bg-yellow-500`, `bg-indigo-500`, `bg-pink-500`

### Update Category
```
PUT /api/categories/:id
Authorization: Bearer <token>
```

### Delete Category
```
DELETE /api/categories/:id
Authorization: Bearer <token>
```

> **Note:** Cannot delete categories with associated courses.

### Reorder Categories
```
PATCH /api/categories/reorder
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "categories": [
    { "id": "uuid1", "order": 0 },
    { "id": "uuid2", "order": 1 }
  ]
}
```

### Get Category Statistics
```
GET /api/categories/stats
Authorization: Bearer <token>
```

---

## 4. Courses

### Get All Courses
```
GET /api/courses
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| search | string | - | Search by title or summary |
| category | string | - | Filter by category ID |
| level | string | - | Filter by level: `Beginner`, `Intermediate`, `Advanced` |
| status | string | - | Filter by status: `Published`, `Draft` |
| sortBy | string | createdAt | Sort field: `title`, `price`, `createdAt` |
| order | string | desc | Sort order: `asc`, `desc` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "React Fundamentals",
      "slug": "react-fundamentals",
      "summary": "Learn React from scratch",
      "thumbnail": "https://example.com/image.jpg",
      "price": 99.99,
      "level": "Beginner",
      "status": "Published",
      "category": {
        "id": "cat_uuid",
        "name": "Web Development",
        "slug": "web-development"
      },
      "instructor": {
        "id": "user_uuid",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": null
      },
      "enrollments": 45,
      "moduleCount": 8,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Course by ID
```
GET /api/courses/:id
```

**Response includes:**
- Full course details
- All modules with lessons
- Total duration (seconds)
- Total lessons count
- Revenue

### Create Course
```
POST /api/courses
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Advanced JavaScript",
  "summary": "Master JavaScript",
  "description": "Full course description...",
  "thumbnail": "https://example.com/image.jpg",
  "categoryId": "category_uuid",
  "level": "Intermediate",
  "price": 149.99,
  "status": "Draft"
}
```

**Notes:**
- `categoryId` is required (can also send `category` as category name)
- `instructorId` is optional (auto-assigned from auth context)
- `level` values: `Beginner`, `Intermediate`, `Advanced`
- `status` values: `Draft`, `Published`

### Update Course
```
PUT /api/courses/:id
Authorization: Bearer <token>
```

### Delete Course
```
DELETE /api/courses/:id
Authorization: Bearer <token>
```

> **Note:** Cannot delete courses with enrollments.

### Toggle Course Status
```
PATCH /api/courses/:id/status
Authorization: Bearer <token>
```

**Request Body:** (optional - toggles if not provided)
```json
{
  "status": "Published"
}
```

### Get Course Statistics
```
GET /api/courses/stats
Authorization: Bearer <token>
```

---

## 5. Modules

### Get Modules for a Course
```
GET /api/courses/:courseId/modules
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Getting Started",
      "summary": "Introduction to the course",
      "order": 0,
      "lessonCount": 5,
      "lessons": [
        {
          "id": "lesson_uuid",
          "title": "Welcome",
          "duration": 180,
          "order": 0
        }
      ]
    }
  ],
  "stats": {
    "moduleCount": 5,
    "totalLessons": 25,
    "totalDuration": 7200
  }
}
```

### Get Module by ID
```
GET /api/modules/:id
Authorization: Bearer <token>
```

### Create Module
```
POST /api/courses/:courseId/modules
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Module Title",
  "summary": "Module description"
}
```

### Update Module
```
PUT /api/modules/:id
Authorization: Bearer <token>
```

### Delete Module
```
DELETE /api/modules/:id
Authorization: Bearer <token>
```

### Reorder Modules
```
PATCH /api/courses/:courseId/modules/reorder
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "modules": [
    { "id": "mod1", "order": 0 },
    { "id": "mod2", "order": 1 }
  ]
}
```

---

## 6. Lessons

### Get Lessons for a Module
```
GET /api/modules/:moduleId/lessons
Authorization: Bearer <token>
```

### Get Lesson by ID
```
GET /api/lessons/:id
Authorization: Bearer <token>
```

### Create Lesson
```
POST /api/modules/:moduleId/lessons
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Lesson Title",
  "videoUrl": "https://youtube.com/watch?v=xxx",
  "duration": 600
}
```

**Notes:**
- `duration` is in seconds
- `videoUrl` supports YouTube, Vimeo, or direct video URLs

### Update Lesson
```
PUT /api/lessons/:id
Authorization: Bearer <token>
```

### Delete Lesson
```
DELETE /api/lessons/:id
Authorization: Bearer <token>
```

### Reorder Lessons
```
PATCH /api/modules/:moduleId/lessons/reorder
Authorization: Bearer <token>
```

---

## 7. Enrollments

### Get All Enrollments
```
GET /api/enrollments
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |
| status | string | - | Filter by status: `Pending`, `Completed`, `Refunded` |
| courseId | string | - | Filter by course |
| userId | string | - | Filter by user |
| sortBy | string | enrolledAt | Sort field |
| order | string | desc | Sort order |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user": {
        "id": "user_uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "JD"
      },
      "course": {
        "id": "course_uuid",
        "title": "React Fundamentals",
        "thumbnail": "https://...",
        "price": 99.99
      },
      "price": 99.99,
      "status": "Completed",
      "progress": 100,
      "enrolledAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-02-20T15:45:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Enrollment by ID
```
GET /api/enrollments/:id
Authorization: Bearer <token>
```

### Create Enrollment
```
POST /api/enrollments
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userId": "user_uuid",
  "courseId": "course_uuid",
  "price": 99.99
}
```

**Notes:**
- `price` is optional (defaults to course price)
- Returns 409 if user is already enrolled

### Update Enrollment Status
```
PATCH /api/enrollments/:id/status
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "Completed"
}
```

**Valid Statuses:** `Pending`, `Completed`, `Refunded`

### Update Enrollment Progress
```
PATCH /api/enrollments/:id/progress
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "progress": 75
}
```

**Notes:**
- Progress: 0-100
- Auto-completes enrollment when progress reaches 100

### Process Refund
```
POST /api/enrollments/:id/refund
Authorization: Bearer <token>
```

### Delete Enrollment
```
DELETE /api/enrollments/:id
Authorization: Bearer <token>
```

### Get Enrollment Statistics
```
GET /api/enrollments/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 500,
    "pending": 50,
    "completed": 400,
    "refunded": 50,
    "totalRevenue": 45000,
    "completionRate": 80
  }
}
```

---

## 8. Dashboard

### Get Dashboard Stats
```
GET /api/admin/dashboard/stats
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| period | string | monthly | `daily`, `weekly`, `monthly`, `yearly` |

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "value": 124500,
      "periodValue": 12500,
      "change": 12.5
    },
    "users": {
      "value": 2847,
      "periodValue": 150,
      "change": 8.2
    },
    "courses": {
      "value": 48,
      "periodValue": 5,
      "change": 4.1
    },
    "enrollments": {
      "value": 1249,
      "periodValue": 120,
      "change": 15.3
    }
  },
  "period": "monthly"
}
```

### Get Revenue Chart
```
GET /api/admin/dashboard/revenue-chart
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| months | number | 12 |

**Response:**
```json
{
  "success": true,
  "data": [
    { "label": "Jan", "value": 8500 },
    { "label": "Feb", "value": 9200 },
    ...
  ]
}
```

### Get User Growth Chart
```
GET /api/admin/dashboard/user-growth
Authorization: Bearer <token>
```

### Get Recent Enrollments
```
GET /api/admin/dashboard/recent-enrollments
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| limit | number | 5 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user": "John Doe",
      "avatar": null,
      "course": "React Fundamentals",
      "price": 99.99,
      "date": "2024-01-15T10:30:00.000Z",
      "status": "Completed"
    }
  ]
}
```

### Get Top Courses
```
GET /api/admin/dashboard/top-courses
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default |
|-----------|------|---------|
| limit | number | 5 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "React Fundamentals",
      "thumbnail": "https://...",
      "enrollments": 150,
      "students": 150,
      "revenue": 14850,
      "rating": 4.8,
      "trend": 12.5
    }
  ]
}
```

### Get Analytics Overview
```
GET /api/admin/dashboard/analytics/overview
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Default | Options |
|-----------|------|---------|---------|
| period | string | 30d | `7d`, `30d`, `90d`, `12m`, `all` |

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": [ ... ]
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid/missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

### Common Error Responses

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Email, first name, last name, and password are required"
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**Not Found (404):**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Conflict (409):**
```json
{
  "success": false,
  "message": "User is already enrolled in this course"
}
```

---

## Data Types Reference

### User Roles
- `Student`
- `Instructor`
- `Admin`

### User Status
- `Active`
- `Inactive`

### Course Levels
- `Beginner`
- `Intermediate`
- `Advanced`

### Course Status
- `Draft`
- `Published`

### Enrollment Status
- `Pending`
- `Completed`
- `Refunded`

---

## Authentication Header

All protected endpoints require the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Swagger Documentation

Interactive API documentation is available at:
```
http://localhost:3000/api-docs
```

---

## Quick Start Example

```javascript
// 1. Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'password123'
  })
});
const { data: { token } } = await response.json();

// 2. Get Users
const users = await fetch('http://localhost:3000/api/users?page=1&limit=10', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Create Course
const course = await fetch('http://localhost:3000/api/courses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'New Course',
    summary: 'Course summary',
    categoryId: 'category_uuid',
    price: 99.99,
    level: 'Beginner',
    status: 'Draft'
  })
});
```

---

## Contact

For API issues or questions, please contact the backend team.

**Last Updated:** January 2026
