const prisma = require('../config/db');

/**
 * @desc    Get all modules for a course
 * @route   GET /api/courses/:courseId/modules
 * @access  Public
 */
const getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    // Check course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const modules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
            content: true,
            contentType: true,
            duration: true,
            order: true,
          },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    // Calculate stats
    let totalLessons = 0;
    let totalDuration = 0;
    modules.forEach((mod) => {
      totalLessons += mod._count.lessons;
      mod.lessons.forEach((lesson) => {
        totalDuration += lesson.duration || 0;
      });
    });

    res.status(200).json({
      success: true,
      data: modules.map((mod) => ({
        ...mod,
        lessonCount: mod._count.lessons,
      })),
      stats: {
        moduleCount: modules.length,
        totalLessons,
        totalDuration,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single module by ID
 * @route   GET /api/modules/:id
 * @access  Public
 */
const getModuleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, slug: true },
        },
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    // Calculate total duration
    const totalDuration = module.lessons.reduce(
      (acc, lesson) => acc + (lesson.duration || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        ...module,
        lessonCount: module._count.lessons,
        totalDuration,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new module
 * @route   POST /api/courses/:courseId/modules
 * @access  Admin/Instructor
 */
const createModule = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, summary, description, content, contentType } = req.body;

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Module title is required',
      });
    }

    // Check course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Get max order
    const maxOrderModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = maxOrderModule ? maxOrderModule.order + 1 : 0;

    const module = await prisma.module.create({
      data: {
        title: title.trim(),
        summary: summary?.trim() || null,
        description: description?.trim() || null,
        content: content || null,
        contentType: contentType || null,
        courseId,
        order,
      },
      include: {
        lessons: true,
        _count: {
          select: { lessons: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Module created successfully',
      data: {
        ...module,
        lessonCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update module
 * @route   PUT /api/modules/:id
 * @access  Admin/Instructor
 */
const updateModule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, summary, description, content, contentType } = req.body;

    // Check module exists
    const existingModule = await prisma.module.findUnique({
      where: { id },
    });

    if (!existingModule) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    const updateData = {};

    if (title && title.trim() !== '') {
      updateData.title = title.trim();
    }

    if (summary !== undefined) {
      updateData.summary = summary?.trim() || null;
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (content !== undefined) {
      updateData.content = content || null;
    }

    if (contentType !== undefined) {
      updateData.contentType = contentType || null;
    }

    const updatedModule = await prisma.module.update({
      where: { id },
      data: updateData,
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { lessons: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Module updated successfully',
      data: {
        ...updatedModule,
        lessonCount: updatedModule._count.lessons,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete module
 * @route   DELETE /api/modules/:id
 * @access  Admin/Instructor
 */
const deleteModule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const module = await prisma.module.findUnique({
      where: { id },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    // Delete module (lessons will be cascade deleted)
    await prisma.module.delete({
      where: { id },
    });

    // Reorder remaining modules
    const remainingModules = await prisma.module.findMany({
      where: { courseId: module.courseId },
      orderBy: { order: 'asc' },
    });

    await prisma.$transaction(
      remainingModules.map((mod, index) =>
        prisma.module.update({
          where: { id: mod.id },
          data: { order: index },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Module deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reorder modules within a course
 * @route   PATCH /api/courses/:courseId/modules/reorder
 * @access  Admin/Instructor
 */
const reorderModules = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { modules } = req.body;

    if (!Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Modules array is required',
      });
    }

    // Check course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Update order for each module
    await prisma.$transaction(
      modules.map((mod, index) =>
        prisma.module.update({
          where: { id: mod.id },
          data: { order: index },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Modules reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getModulesByCourse,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
};
