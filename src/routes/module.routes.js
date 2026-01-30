const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getModulesByCourse,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
} = require('../controllers/module.controller');
const { verifyInstructorOrAdmin } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Module:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         summary:
 *           type: string
 *         order:
 *           type: integer
 *         lessonCount:
 *           type: integer
 *         lessons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Lesson'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ModuleInput:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *         summary:
 *           type: string
 */

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   get:
 *     summary: Get all modules for a course
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of modules with lessons
 *       404:
 *         description: Course not found
 */
router.get('/', getModulesByCourse);

/**
 * @swagger
 * /api/courses/{courseId}/modules/reorder:
 *   patch:
 *     summary: Reorder modules within a course
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               modules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Modules reordered successfully
 *       404:
 *         description: Course not found
 */
router.patch('/reorder', verifyInstructorOrAdmin, reorderModules);

/**
 * @swagger
 * /api/courses/{courseId}/modules:
 *   post:
 *     summary: Create a new module
 *     tags: [Modules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ModuleInput'
 *     responses:
 *       201:
 *         description: Module created successfully
 *       404:
 *         description: Course not found
 */
router.post('/', verifyInstructorOrAdmin, createModule);

module.exports = router;

// Standalone module routes (not nested under courses)
const standaloneRouter = express.Router();

/**
 * @swagger
 * /api/modules/{id}:
 *   get:
 *     summary: Get module by ID
 *     tags: [Modules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Module details with lessons
 *       404:
 *         description: Module not found
 */
standaloneRouter.get('/:id', getModuleById);

/**
 * @swagger
 * /api/modules/{id}:
 *   put:
 *     summary: Update a module
 *     tags: [Modules]
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
 *             $ref: '#/components/schemas/ModuleInput'
 *     responses:
 *       200:
 *         description: Module updated successfully
 *       404:
 *         description: Module not found
 */
standaloneRouter.put('/:id', verifyInstructorOrAdmin, updateModule);

/**
 * @swagger
 * /api/modules/{id}:
 *   delete:
 *     summary: Delete a module
 *     tags: [Modules]
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
 *         description: Module deleted successfully
 *       404:
 *         description: Module not found
 */
standaloneRouter.delete('/:id', verifyInstructorOrAdmin, deleteModule);

module.exports.standaloneRouter = standaloneRouter;
