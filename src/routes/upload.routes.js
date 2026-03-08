const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/upload.controller');
const { uploadImage: uploadImageMulter } = require('../middleware/upload');
const { verifyAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload image to Bunny Storage (returns CDN URL)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *           enum: [team, testimonials, courses, uploads]
 *         description: Optional folder path (default uploads)
 *     responses:
 *       200:
 *         description: Returns CDN URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object, properties: { url: { type: string } } }
 *       400:
 *         description: No file or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/image',
  verifyAdmin,
  uploadImageMulter.single('file'),
  uploadImage
);

module.exports = router;
