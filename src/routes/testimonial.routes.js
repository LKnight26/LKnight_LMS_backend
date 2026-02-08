const express = require('express');
const router = express.Router();
const {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
} = require('../controllers/testimonial.controller');
const { verifyAdmin } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Testimonial:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         content:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         image:
 *           type: string
 *         gender:
 *           type: string
 *           enum: [male, female]
 *         showOnHome:
 *           type: boolean
 *         showOnAbout:
 *           type: boolean
 *         showOnCourses:
 *           type: boolean
 *         showOnDashboard:
 *           type: boolean
 *         isActive:
 *           type: boolean
 *         order:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get testimonials (filter by page)
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           enum: [home, about, courses, dashboard]
 *         description: Filter by page
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Include inactive (admin use)
 *     responses:
 *       200:
 *         description: List of testimonials
 */
router.get('/', getTestimonials);

/**
 * @swagger
 * /api/testimonials/reorder:
 *   patch:
 *     summary: Reorder testimonials
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Testimonials reordered successfully
 */
router.patch('/reorder', verifyAdmin, reorderTestimonials);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   get:
 *     summary: Get testimonial by ID
 *     tags: [Testimonials]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Testimonial details
 *       404:
 *         description: Testimonial not found
 */
router.get('/:id', getTestimonialById);

/**
 * @swagger
 * /api/testimonials:
 *   post:
 *     summary: Create a new testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Testimonial created successfully
 */
router.post('/', verifyAdmin, createTestimonial);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   put:
 *     summary: Update a testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Testimonial updated successfully
 */
router.put('/:id', verifyAdmin, updateTestimonial);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Testimonial deleted successfully
 */
router.delete('/:id', verifyAdmin, deleteTestimonial);

module.exports = router;
