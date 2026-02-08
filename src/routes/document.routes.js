const express = require('express');
const {
  uploadCourseDocument,
  uploadModuleDocument,
  uploadLessonDocument,
  getCourseDocuments,
  getModuleDocuments,
  getLessonDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} = require('../controllers/document.controller');
const { verifyInstructorOrAdmin } = require('../middleware/auth');

// ============================================
// NESTED: Course Documents
// ============================================
const courseDocumentRouter = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/courses/{courseId}/documents:
 *   get:
 *     summary: Get all documents for a course
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of course documents
 */
courseDocumentRouter.get('/', getCourseDocuments);

/**
 * @swagger
 * /api/courses/{courseId}/documents:
 *   post:
 *     summary: Upload a document to a course
 *     tags: [Documents]
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
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               fileType:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       404:
 *         description: Course not found
 */
courseDocumentRouter.post('/', verifyInstructorOrAdmin, uploadCourseDocument);

// ============================================
// NESTED: Module Documents
// ============================================
const moduleDocumentRouter = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/modules/{moduleId}/documents:
 *   get:
 *     summary: Get all documents for a module
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: moduleId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of module documents
 */
moduleDocumentRouter.get('/', getModuleDocuments);

/**
 * @swagger
 * /api/modules/{moduleId}/documents:
 *   post:
 *     summary: Upload a document to a module
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: moduleId
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               fileType:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       404:
 *         description: Module not found
 */
moduleDocumentRouter.post('/', verifyInstructorOrAdmin, uploadModuleDocument);

// ============================================
// NESTED: Lesson Documents
// ============================================
const lessonDocumentRouter = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/lessons/{lessonId}/documents:
 *   get:
 *     summary: Get all documents for a lesson
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of lesson documents
 */
lessonDocumentRouter.get('/', getLessonDocuments);

/**
 * @swagger
 * /api/lessons/{lessonId}/documents:
 *   post:
 *     summary: Upload a document to a lesson
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
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
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               fileType:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       404:
 *         description: Lesson not found
 */
lessonDocumentRouter.post('/', verifyInstructorOrAdmin, uploadLessonDocument);

// ============================================
// STANDALONE: Document by ID
// ============================================
const standaloneRouter = express.Router();

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID (includes content for download)
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document with content
 *       404:
 *         description: Document not found
 */
standaloneRouter.get('/:id', getDocumentById);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update a document
 *     tags: [Documents]
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
 *             properties:
 *               title:
 *                 type: string
 *               fileName:
 *                 type: string
 *               fileSize:
 *                 type: integer
 *               fileType:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully
 *       404:
 *         description: Document not found
 */
standaloneRouter.put('/:id', verifyInstructorOrAdmin, updateDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
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
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 */
standaloneRouter.delete('/:id', verifyInstructorOrAdmin, deleteDocument);

module.exports = {
  courseDocumentRouter,
  moduleDocumentRouter,
  lessonDocumentRouter,
  standaloneRouter,
};
