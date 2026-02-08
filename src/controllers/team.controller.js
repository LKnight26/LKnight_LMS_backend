const prisma = require('../config/db');

/**
 * @desc    Get all active team members (public)
 * @route   GET /api/team
 * @access  Public
 */
const getAllTeamMembers = async (req, res, next) => {
  try {
    const where = {};

    // Public requests only see active members; admin can see all
    if (!req.query.all) {
      where.isActive = true;
    }

    const members = await prisma.teamMember.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: members,
      count: members.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single team member by ID
 * @route   GET /api/team/:id
 * @access  Public
 */
const getTeamMemberById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new team member
 * @route   POST /api/team
 * @access  Admin
 */
const createTeamMember = async (req, res, next) => {
  try {
    const { name, role, description, image, email, facebook, linkedin, isActive } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!role || role.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
      });
    }

    // Get max order
    const maxOrderMember = await prisma.teamMember.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = maxOrderMember ? maxOrderMember.order + 1 : 0;

    const member = await prisma.teamMember.create({
      data: {
        name: name.trim(),
        role: role.trim(),
        description: description?.trim() || null,
        image: image || null,
        email: email?.trim() || null,
        facebook: facebook?.trim() || null,
        linkedin: linkedin?.trim() || null,
        isActive: isActive !== undefined ? isActive : true,
        order,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Team member created successfully',
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update team member
 * @route   PUT /api/team/:id
 * @access  Admin
 */
const updateTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, description, image, email, facebook, linkedin, isActive } = req.body;

    const existing = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (role !== undefined) updateData.role = role.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (image !== undefined) updateData.image = image || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (facebook !== undefined) updateData.facebook = facebook?.trim() || null;
    if (linkedin !== undefined) updateData.linkedin = linkedin?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.teamMember.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Team member updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete team member
 * @route   DELETE /api/team/:id
 * @access  Admin
 */
const deleteTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.teamMember.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found',
      });
    }

    await prisma.teamMember.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Team member deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reorder team members
 * @route   PATCH /api/team/reorder
 * @access  Admin
 */
const reorderTeamMembers = async (req, res, next) => {
  try {
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Members array is required',
      });
    }

    await prisma.$transaction(
      members.map((member, index) =>
        prisma.teamMember.update({
          where: { id: member.id },
          data: { order: index },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Team members reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  reorderTeamMembers,
};
