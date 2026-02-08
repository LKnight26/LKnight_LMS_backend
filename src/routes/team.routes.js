const express = require('express');
const router = express.Router();
const {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
} = require('../controllers/team.controller');
const { verifyAdmin } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     TeamMember:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         role:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         email:
 *           type: string
 *         facebook:
 *           type: string
 *         linkedin:
 *           type: string
 *         order:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TeamMemberInput:
 *       type: object
 *       required:
 *         - name
 *         - role
 *       properties:
 *         name:
 *           type: string
 *         role:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *           description: Base64 encoded image
 *         email:
 *           type: string
 *         facebook:
 *           type: string
 *         linkedin:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /api/team:
 *   get:
 *     summary: Get all team members
 *     tags: [Team]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Include inactive members (admin use)
 *     responses:
 *       200:
 *         description: List of team members
 */
router.get('/', getAllTeamMembers);

/**
 * @swagger
 * /api/team/reorder:
 *   patch:
 *     summary: Reorder team members
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Team members reordered successfully
 */
router.patch('/reorder', verifyAdmin, reorderTeamMembers);

/**
 * @swagger
 * /api/team/{id}:
 *   get:
 *     summary: Get team member by ID
 *     tags: [Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team member details
 *       404:
 *         description: Team member not found
 */
router.get('/:id', getTeamMemberById);

/**
 * @swagger
 * /api/team:
 *   post:
 *     summary: Create a new team member
 *     tags: [Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TeamMemberInput'
 *     responses:
 *       201:
 *         description: Team member created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', verifyAdmin, createTeamMember);

/**
 * @swagger
 * /api/team/{id}:
 *   put:
 *     summary: Update a team member
 *     tags: [Team]
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
 *             $ref: '#/components/schemas/TeamMemberInput'
 *     responses:
 *       200:
 *         description: Team member updated successfully
 *       404:
 *         description: Team member not found
 */
router.put('/:id', verifyAdmin, updateTeamMember);

/**
 * @swagger
 * /api/team/{id}:
 *   delete:
 *     summary: Delete a team member
 *     tags: [Team]
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
 *         description: Team member deleted successfully
 *       404:
 *         description: Team member not found
 */
router.delete('/:id', verifyAdmin, deleteTeamMember);

module.exports = router;
