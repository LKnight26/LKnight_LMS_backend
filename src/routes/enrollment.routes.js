const express = require('express');
const router = express.Router();
const {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollmentStatus,
  updateEnrollmentProgress,
  processRefund,
  deleteEnrollment,
  getEnrollmentStats,
  getMyEnrollments,
  getUserDashboardStats,
  getAllCoursesWithStatus,
  purchaseCourse,
  getCheckoutDetails,
  enrollInAllCourses,
  createCheckoutSession,
  getEnrollmentBySessionId,
} = require('../controllers/enrollment.controller');
const { verifyAdmin, verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user:
 *           type: object
 *         course:
 *           type: object
 *         price:
 *           type: number
 *         status:
 *           type: string
 *           enum: [PENDING, COMPLETED, REFUNDED]
 *         progress:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *     EnrollmentInput:
 *       type: object
 *       required:
 *         - userId
 *         - courseId
 *       properties:
 *         userId:
 *           type: string
 *         courseId:
 *           type: string
 *         price:
 *           type: number
 */

/**
 * @swagger
 * /api/enrollments/my-courses:
 *   get:
 *     summary: Get current user's enrolled courses
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's enrolled courses
 */
router.get('/my-courses', verifyToken, getMyEnrollments);

/**
 * @swagger
 * /api/enrollments/my-stats:
 *   get:
 *     summary: Get current user's dashboard statistics
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard statistics
 */
router.get('/my-stats', verifyToken, getUserDashboardStats);

/**
 * @swagger
 * /api/enrollments/all-courses:
 *   get:
 *     summary: Get all published courses with user's enrollment status
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all courses with enrollment status
 */
router.get('/all-courses', verifyToken, getAllCoursesWithStatus);

/**
 * @swagger
 * /api/enrollments/checkout/{courseId}:
 *   get:
 *     summary: Get course details for checkout page
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course checkout details
 *       404:
 *         description: Course not found
 */
router.get('/checkout/:courseId', verifyToken, getCheckoutDetails);

/**
 * @swagger
 * /api/enrollments/create-checkout-session:
 *   post:
 *     summary: Create Stripe Checkout Session for course purchase (or enroll for free courses)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checkout session created - returns sessionUrl for redirect to Stripe
 *       201:
 *         description: Free course - enrolled directly without payment
 *       404:
 *         description: Course not found
 *       409:
 *         description: Already enrolled in this course
 *       503:
 *         description: Payment service not configured
 */
router.post('/create-checkout-session', verifyToken, createCheckoutSession);

/**
 * @swagger
 * /api/enrollments/session/{sessionId}:
 *   get:
 *     summary: Get enrollment by Stripe session ID (for post-payment verification)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment found
 *       404:
 *         description: Enrollment not yet created (webhook may still be processing)
 *       403:
 *         description: Access denied - enrollment belongs to different user
 */
router.get('/session/:sessionId', verifyToken, getEnrollmentBySessionId);

/**
 * @swagger
 * /api/enrollments/purchase/{courseId}:
 *   post:
 *     summary: Purchase/enroll in a single course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Successfully enrolled in course
 *       404:
 *         description: Course not found
 *       409:
 *         description: Already enrolled
 */
router.post('/purchase/:courseId', verifyToken, purchaseCourse);

/**
 * @swagger
 * /api/enrollments/enroll-all:
 *   post:
 *     summary: Enroll current user in all available courses (free access)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Successfully enrolled in courses
 */
router.post('/enroll-all', verifyToken, enrollInAllCourses);

/**
 * @swagger
 * /api/enrollments:
 *   get:
 *     summary: Get all enrollments with pagination and filters
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, COMPLETED, REFUNDED]
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of enrollments with pagination
 */
router.get('/', verifyAdmin, getAllEnrollments);

/**
 * @swagger
 * /api/enrollments/stats:
 *   get:
 *     summary: Get enrollment statistics
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment statistics
 */
router.get('/stats', verifyAdmin, getEnrollmentStats);

/**
 * @swagger
 * /api/enrollments/{id}:
 *   get:
 *     summary: Get enrollment by ID
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment details
 *       404:
 *         description: Enrollment not found
 */
router.get('/:id', verifyAdmin, getEnrollmentById);

/**
 * @swagger
 * /api/enrollments:
 *   post:
 *     summary: Create a new enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrollmentInput'
 *     responses:
 *       201:
 *         description: Enrollment created successfully
 *       409:
 *         description: User already enrolled
 */
router.post('/', verifyToken, createEnrollment);

/**
 * @swagger
 * /api/enrollments/{id}/status:
 *   patch:
 *     summary: Update enrollment status
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, COMPLETED, REFUNDED]
 *     responses:
 *       200:
 *         description: Enrollment status updated
 *       404:
 *         description: Enrollment not found
 */
router.patch('/:id/status', verifyAdmin, updateEnrollmentStatus);

/**
 * @swagger
 * /api/enrollments/{id}/progress:
 *   patch:
 *     summary: Update enrollment progress
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progress
 *             properties:
 *               progress:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated successfully
 *       404:
 *         description: Enrollment not found
 */
router.patch('/:id/progress', verifyToken, updateEnrollmentProgress);

/**
 * @swagger
 * /api/enrollments/{id}/refund:
 *   post:
 *     summary: Process refund for enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Already refunded
 *       404:
 *         description: Enrollment not found
 */
router.post('/:id/refund', verifyAdmin, processRefund);

/**
 * @swagger
 * /api/enrollments/{id}:
 *   delete:
 *     summary: Delete enrollment
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment deleted successfully
 *       404:
 *         description: Enrollment not found
 */
router.delete('/:id', verifyAdmin, deleteEnrollment);

module.exports = router;
