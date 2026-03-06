const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getAllPlansAdmin,
  getPlanById,
} = require('../controllers/plan.controller');
const { verifyAdmin } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @swagger
 * /api/plans:
 *   get:
 *     summary: Get all active plans (for pricing page)
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of active plans
 */
router.get('/', getAllPlans);

// ============================================
// ADMIN ROUTES (read-only)
// ============================================

/**
 * @swagger
 * /api/plans/admin:
 *   get:
 *     summary: Get all plans (admin - includes inactive)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all plans with subscription counts
 */
router.get('/admin', verifyAdmin, getAllPlansAdmin);

/**
 * @swagger
 * /api/plans/admin/{id}:
 *   get:
 *     summary: Get plan by ID (admin)
 *     tags: [Plans]
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
 *         description: Plan details
 *       404:
 *         description: Plan not found
 */
router.get('/admin/:id', verifyAdmin, getPlanById);

module.exports = router;
