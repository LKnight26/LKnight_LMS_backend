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
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Swagger Documentation
const swaggerOptions = {
  swaggerOptions: {
    tryItOutEnabled: true,           // Auto-enable "Try it out" for all endpoints
    persistAuthorization: true,      // Keep bearer token after page refresh
  },
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

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

// Start server - bind to 0.0.0.0 for Docker/Railway
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Swagger docs available at http://${HOST}:${PORT}/api-docs`);
});
