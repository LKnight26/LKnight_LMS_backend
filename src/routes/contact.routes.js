const express = require('express');
const router = express.Router();
const {
  submitContact,
  getAllMessages,
  getMessageStats,
  getMessageById,
  updateMessageStatus,
  addAdminNote,
  deleteMessage,
} = require('../controllers/contact.controller');
const { verifyAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Contact
 *     description: Public contact form
 *   - name: Contact Admin
 *     description: Admin contact message management
 */

// ============================================
// PUBLIC ROUTE
// ============================================

/**
 * @swagger
 * /api/contact:
 *   post:
 *     summary: Submit contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - email
 *               - message
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               subject:
 *                 type: string
 *                 enum: [general, support, sales, other]
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Missing required fields
 */
router.post('/', submitContact);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @swagger
 * /api/contact/admin/stats:
 *   get:
 *     summary: Get contact message statistics
 *     tags: [Contact Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Message stats by status
 */
router.get('/admin/stats', verifyAdmin, getMessageStats);

/**
 * @swagger
 * /api/contact/admin/messages:
 *   get:
 *     summary: Get all contact messages with pagination
 *     tags: [Contact Admin]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [NEW, READ, REPLIED, ARCHIVED]
 *     responses:
 *       200:
 *         description: List of contact messages with pagination
 */
router.get('/admin/messages', verifyAdmin, getAllMessages);

/**
 * @swagger
 * /api/contact/admin/{id}:
 *   get:
 *     summary: Get single contact message (auto-marks as READ)
 *     tags: [Contact Admin]
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
 *         description: Message details
 *       404:
 *         description: Message not found
 */
router.get('/admin/:id', verifyAdmin, getMessageById);

/**
 * @swagger
 * /api/contact/admin/{id}/status:
 *   patch:
 *     summary: Update message status
 *     tags: [Contact Admin]
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
 *                 enum: [NEW, READ, REPLIED, ARCHIVED]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/admin/:id/status', verifyAdmin, updateMessageStatus);

/**
 * @swagger
 * /api/contact/admin/{id}/note:
 *   patch:
 *     summary: Add/update admin note on message
 *     tags: [Contact Admin]
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
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note updated
 */
router.patch('/admin/:id/note', verifyAdmin, addAdminNote);

/**
 * @swagger
 * /api/contact/admin/{id}:
 *   delete:
 *     summary: Delete a contact message
 *     tags: [Contact Admin]
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
 *         description: Message deleted
 *       404:
 *         description: Message not found
 */
router.delete('/admin/:id', verifyAdmin, deleteMessage);

module.exports = router;
