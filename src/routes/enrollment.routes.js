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
