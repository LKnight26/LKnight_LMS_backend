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

/**
 * @desc    Get current user's enrolled courses (for user dashboard)
 * @route   GET /api/enrollments/my-courses
 * @access  User
 */
const getMyEnrollments = async (req, res, next) => {
  try {
    const userId = req.userId;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
            instructor: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: {
              select: { modules: true, enrollments: true },
            },
            modules: {
              select: {
                _count: { select: { lessons: true } },
              },
            },
          },
        },
      },
    });

    // Transform the data for frontend
    const courses = enrollments.map((e) => {
      const totalLessons = e.course.modules.reduce(
        (sum, m) => sum + m._count.lessons,
        0
      );
      return {
        enrollmentId: e.id,
        progress: e.progress,
        status: capitalize(e.status),
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        course: {
          id: e.course.id,
          title: e.course.title,
          slug: e.course.slug,
          summary: e.course.summary,
          thumbnail: e.course.thumbnail,
          level: e.course.level,
          price: e.course.price,
          category: e.course.category,
          instructor: e.course.instructor
            ? `${e.course.instructor.firstName} ${e.course.instructor.lastName}`
            : null,
          moduleCount: e.course._count.modules,
          lessonCount: totalLessons,
          enrollments: e.course._count.enrollments,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: courses,
      count: courses.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user dashboard stats
 * @route   GET /api/enrollments/my-stats
 * @access  User
 */
const getUserDashboardStats = async (req, res, next) => {
  try {
    const userId = req.userId;

    const [
      totalEnrolled,
      inProgress,
      completed,
      totalLessonsCompleted,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { userId } }),
      prisma.enrollment.count({
        where: { userId, status: 'PENDING', progress: { gt: 0 } },
      }),
      prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } }),
      // For now, estimate lessons completed based on progress
      prisma.enrollment.aggregate({
        where: { userId },
        _avg: { progress: true },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEnrolled,
        inProgress,
        completed,
        avgProgress: Math.round(totalLessonsCompleted._avg.progress || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all published courses with user's enrollment status
 * @route   GET /api/enrollments/all-courses
 * @access  User
 */
const getAllCoursesWithStatus = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get user info including accessAll
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accessAll: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get all published courses
    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        instructor: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { modules: true, enrollments: true },
        },
        modules: {
          select: {
            _count: { select: { lessons: true } },
          },
        },
      },
    });

    // Get user's enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true, id: true, progress: true, status: true, enrolledAt: true },
    });

    const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]));

    // Transform courses with enrollment info
    const coursesWithStatus = courses.map((course) => {
      const enrollment = enrollmentMap.get(course.id);
      const totalLessons = course.modules.reduce(
        (sum, m) => sum + m._count.lessons,
        0
      );

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        summary: course.summary,
        thumbnail: course.thumbnail,
        level: course.level,
        price: course.price,
        status: course.status,
        category: course.category,
        instructor: course.instructor
          ? `${course.instructor.firstName} ${course.instructor.lastName}`
          : null,
        moduleCount: course._count.modules,
        lessonCount: totalLessons,
        enrollments: course._count.enrollments,
        // Access status
        isEnrolled: !!enrollment,
        hasAccess: user.accessAll || !!enrollment,
        enrollmentId: enrollment?.id || null,
        progress: enrollment?.progress || 0,
        enrolledAt: enrollment?.enrolledAt || null,
      };
    });

    res.status(200).json({
      success: true,
      data: coursesWithStatus,
      count: coursesWithStatus.length,
      accessAll: user.accessAll,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Purchase/enroll in a single course (simulates payment)
 * @route   POST /api/enrollments/purchase/:courseId
 * @access  User
 */
const purchaseCourse = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: { select: { name: true } },
        instructor: { select: { firstName: true, lastName: true } },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    if (course.status !== 'PUBLISHED') {
      return res.status(400).json({
        success: false,
        message: 'This course is not available for enrollment',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'You are already enrolled in this course',
      });
    }

    // Create enrollment (simulate successful payment)
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        price: course.price,
        status: 'PENDING',
        progress: 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in the course',
      data: {
        enrollmentId: enrollment.id,
        course: {
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          price: course.price,
          instructor: course.instructor
            ? `${course.instructor.firstName} ${course.instructor.lastName}`
            : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get course details for subscription/checkout page
 * @route   GET /api/enrollments/checkout/:courseId
 * @access  User
 */
const getCheckoutDetails = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    // Get course with full details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        instructor: { select: { id: true, firstName: true, lastName: true } },
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            _count: { select: { lessons: true } },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if user already has access
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accessAll: true },
    });

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    const totalLessons = course.modules.reduce(
      (sum, m) => sum + m._count.lessons,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        id: course.id,
        title: course.title,
        slug: course.slug,
        summary: course.summary,
        description: course.description,
        thumbnail: course.thumbnail,
        level: course.level,
        price: course.price,
        category: course.category,
        instructor: course.instructor
          ? `${course.instructor.firstName} ${course.instructor.lastName}`
          : null,
        moduleCount: course.modules.length,
        lessonCount: totalLessons,
        enrollments: course._count.enrollments,
        modules: course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          lessonCount: m._count.lessons,
        })),
        // User's access status
        hasAccess: user.accessAll || !!enrollment,
        isEnrolled: !!enrollment,
        enrollmentId: enrollment?.id || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Enroll current user in all published courses (temporary for free access)
 * @route   POST /api/enrollments/enroll-all
 * @access  User
 */
const enrollInAllCourses = async (req, res, next) => {
  try {
    const userId = req.userId;

    // Get all published courses
    const publishedCourses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, price: true },
    });

    // Get user's existing enrollments
    const existingEnrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });

    const enrolledCourseIds = new Set(existingEnrollments.map((e) => e.courseId));

    // Filter courses not yet enrolled
    const coursesToEnroll = publishedCourses.filter(
      (c) => !enrolledCourseIds.has(c.id)
    );

    if (coursesToEnroll.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Already enrolled in all available courses',
        data: { enrolled: 0 },
      });
    }

    // Create enrollments for all new courses
    const enrollments = await prisma.enrollment.createMany({
      data: coursesToEnroll.map((course) => ({
        userId,
        courseId: course.id,
        price: 0, // Free enrollment for now
        status: 'PENDING',
        progress: 0,
      })),
    });

    res.status(201).json({
      success: true,
      message: `Successfully enrolled in ${enrollments.count} courses`,
      data: { enrolled: enrollments.count },
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
  getMyEnrollments,
  getUserDashboardStats,
  getAllCoursesWithStatus,
  purchaseCourse,
  getCheckoutDetails,
  enrollInAllCourses,
};
