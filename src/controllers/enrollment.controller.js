const prisma = require('../config/db');

/**
 * Capitalize first letter, lowercase rest (e.g., "PENDING" -> "Pending")
 */
const capitalize = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * @desc    Get all enrollments with pagination and filters
 * @route   GET /api/enrollments
 * @access  Admin
 */
const getAllEnrollments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      courseId,
      userId,
      sortBy = 'enrolledAt',
      order = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};

    if (status) {
      where.status = status.toUpperCase();
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (userId) {
      where.userId = userId;
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
            },
          },
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: enrollments.map((e) => ({
        id: e.id,
        user: {
          id: e.user.id,
          name: `${e.user.firstName} ${e.user.lastName}`,
          email: e.user.email,
          avatar:
            e.user.avatar ||
            `${e.user.firstName?.charAt(0) || ''}${e.user.lastName?.charAt(0) || ''}`,
        },
        course: e.course,
        price: e.price,
        status: capitalize(e.status),
        progress: e.progress,
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
        hasNext: skip + take < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get enrollment by ID
 * @route   GET /api/enrollments/:id
 * @access  Admin
 */
const getEnrollmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
            level: true,
          },
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    res.status(200).json({
      success: true,
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new enrollment
 * @route   POST /api/enrollments
 * @access  Admin/User
 */
const createEnrollment = async (req, res, next) => {
  try {
    const { userId, courseId, price } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Course ID are required',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'User is already enrolled in this course',
      });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        price: price !== undefined ? parseFloat(price) : course.price,
        status: 'PENDING',
        progress: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: enrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update enrollment status
 * @route   PATCH /api/enrollments/:id/status
 * @access  Admin
 */
const updateEnrollmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const validStatuses = ['PENDING', 'COMPLETED', 'REFUNDED'];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING, COMPLETED, or REFUNDED',
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const updateData = {
      status: status.toUpperCase(),
    };

    // Set completedAt if status is COMPLETED
    if (status.toUpperCase() === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.progress = 100;
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `Enrollment ${status.toLowerCase()} successfully`,
      data: updatedEnrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update enrollment progress
 * @route   PATCH /api/enrollments/:id/progress
 * @access  User
 */
const updateEnrollmentProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'Progress must be a number between 0 and 100',
      });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    const updateData = {
      progress: parseInt(progress),
    };

    // Auto-complete if progress is 100
    if (parseInt(progress) === 100 && enrollment.status !== 'COMPLETED') {
      updateData.status = 'COMPLETED';
      updateData.completedAt = new Date();
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Progress updated successfully',
      data: updatedEnrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process refund
 * @route   POST /api/enrollments/:id/refund
 * @access  Admin
 */
const processRefund = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    if (enrollment.status === 'REFUNDED') {
      return res.status(400).json({
        success: false,
        message: 'Enrollment has already been refunded',
      });
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        status: 'REFUNDED',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: updatedEnrollment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete enrollment
 * @route   DELETE /api/enrollments/:id
 * @access  Admin
 */
const deleteEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    await prisma.enrollment.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Enrollment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get enrollment statistics
 * @route   GET /api/enrollments/stats
 * @access  Admin
 */
const getEnrollmentStats = async (req, res, next) => {
  try {
    const [total, pending, completed, refunded, revenue] = await Promise.all([
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { status: 'PENDING' } }),
      prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
      prisma.enrollment.count({ where: { status: 'REFUNDED' } }),
      prisma.enrollment.aggregate({
        where: { status: { not: 'REFUNDED' } },
        _sum: { price: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        pending,
        completed,
        refunded,
        totalRevenue: revenue._sum.price || 0,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollmentStatus,
  updateEnrollmentProgress,
  processRefund,
  deleteEnrollment,
  getEnrollmentStats,
};
