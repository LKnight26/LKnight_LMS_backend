require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');

// Route imports
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const adminRoutes = require('./src/routes/admin.routes');
const categoryRoutes = require('./src/routes/category.routes');
const courseRoutes = require('./src/routes/course.routes');
const moduleRoutes = require('./src/routes/module.routes');
const { standaloneRouter: moduleStandaloneRoutes } = require('./src/routes/module.routes');
const lessonRoutes = require('./src/routes/lesson.routes');
const { standaloneRouter: lessonStandaloneRoutes } = require('./src/routes/lesson.routes');
const dashboardRoutes = require('./src/routes/dashboard.routes');
const enrollmentRoutes = require('./src/routes/enrollment.routes');

const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'LKnight API is running',
    status: 'healthy',
    version: '1.0.0',
    docs: '/api-docs',
  });
});

// ============================================
// AUTH & USER ROUTES
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admins', adminRoutes);

// ============================================
// COURSE MANAGEMENT ROUTES
// ============================================
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);

// Nested routes for modules under courses
app.use('/api/courses/:courseId/modules', moduleRoutes);

// Standalone module routes
app.use('/api/modules', moduleStandaloneRoutes);

// Nested routes for lessons under modules
app.use('/api/modules/:moduleId/lessons', lessonRoutes);

// Standalone lesson routes
app.use('/api/lessons', lessonStandaloneRoutes);

// ============================================
// ENROLLMENT ROUTES
// ============================================
app.use('/api/enrollments', enrollmentRoutes);

// ============================================
// ADMIN DASHBOARD & ANALYTICS ROUTES
// ============================================
app.use('/api/admin/dashboard', dashboardRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
