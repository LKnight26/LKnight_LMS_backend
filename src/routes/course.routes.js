const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getCourseStats,
} = require('../controllers/course.controller');
const { verifyAdmin, verifyInstructorOrAdmin } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *         summary:
 *           type: string
 *         description:
 *           type: string
 *         thumbnail:
 *           type: string
 *         price:
 *           type: number
 *         level:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED]
 *         category:
 *           type: object
 *         instructor:
 *           type: object
 *         enrollments:
 *           type: integer
 *         moduleCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CourseInput:
 *       type: object
 *       required:
 *         - title
 *         - categoryId
 *         - instructorId
 *       properties:
 *         title:
 *           type: string
 *         summary:
 *           type: string
 *           maxLength: 200
 *         description:
 *           type: string
 *         thumbnail:
 *           type: string
 *         categoryId:
 *           type: string
 *         instructorId:
 *           type: string
 *         level:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *         price:
 *           type: number
 *         status:
 *           type: string
 *           enum: [DRAFT, PUBLISHED]
 */

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses with filters and pagination
 *     tags: [Courses]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [BEGINNER, INTERMEDIATE, ADVANCED]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, price, createdAt, updatedAt]
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: List of courses with pagination
 */
router.get('/', getAllCourses);

/**
 * @swagger
 * /api/courses/stats:
 *   get:
 *     summary: Get course statistics
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Course statistics
 */
router.get('/stats', verifyAdmin, getCourseStats);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID with full details
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details with modules and lessons
 *       404:
 *         description: Course not found
 */
router.get('/:id', getCourseById);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', verifyInstructorOrAdmin, createCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Courses]
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
 *             $ref: '#/components/schemas/CourseInput'
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       404:
 *         description: Course not found
 */
router.put('/:id', verifyInstructorOrAdmin, updateCourse);

/**
 * @swagger
 * /api/courses/{id}/status:
 *   patch:
 *     summary: Toggle course status (Draft/Published)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED]
 *     responses:
 *       200:
 *         description: Course status updated
 *       404:
 *         description: Course not found
 */
router.patch('/:id/status', verifyInstructorOrAdmin, toggleCourseStatus);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
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
 *         description: Course deleted successfully
 *       400:
 *         description: Cannot delete - has enrollments
 *       404:
 *         description: Course not found
 */
router.delete('/:id', verifyAdmin, deleteCourse);

module.exports = router;
