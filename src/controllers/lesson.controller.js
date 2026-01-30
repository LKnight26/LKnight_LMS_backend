const prisma = require('../config/db');

/**
 * @desc    Get all lessons for a module
 * @route   GET /api/modules/:moduleId/lessons
 * @access  Public
 */
const getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    // Check module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true, title: true, courseId: true },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
    });

    // Calculate total duration
    const totalDuration = lessons.reduce(
      (acc, lesson) => acc + (lesson.duration || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: lessons,
      stats: {
        lessonCount: lessons.length,
        totalDuration,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single lesson by ID
 * @route   GET /api/lessons/:id
 * @access  Public
 */
const getLessonById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
            course: {
              select: { id: true, title: true, slug: true },
            },
          },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    res.status(200).json({
      success: true,
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new lesson
 * @route   POST /api/modules/:moduleId/lessons
 * @access  Admin/Instructor
 */
const createLesson = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { title, videoUrl, duration } = req.body;

    // Validation
    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Lesson title is required',
      });
    }

    // Check module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    // Get max order
    const maxOrderLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = maxOrderLesson ? maxOrderLesson.order + 1 : 0;

    const lesson = await prisma.lesson.create({
      data: {
        title: title.trim(),
        videoUrl: videoUrl?.trim() || null,
        duration: parseInt(duration) || 0,
        moduleId,
        order,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update lesson
 * @route   PUT /api/lessons/:id
 * @access  Admin/Instructor
 */
const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, videoUrl, duration } = req.body;

    // Check lesson exists
    const existingLesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!existingLesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    const updateData = {};

    if (title && title.trim() !== '') {
      updateData.title = title.trim();
    }

    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl?.trim() || null;
    }

    if (duration !== undefined) {
      updateData.duration = parseInt(duration) || 0;
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: updatedLesson,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete lesson
 * @route   DELETE /api/lessons/:id
 * @access  Admin/Instructor
 */
const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    // Delete lesson
    await prisma.lesson.delete({
      where: { id },
    });

    // Reorder remaining lessons
    const remainingLessons = await prisma.lesson.findMany({
      where: { moduleId: lesson.moduleId },
      orderBy: { order: 'asc' },
    });

    await prisma.$transaction(
      remainingLessons.map((les, index) =>
        prisma.lesson.update({
          where: { id: les.id },
          data: { order: index },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reorder lessons within a module
 * @route   PATCH /api/modules/:moduleId/lessons/reorder
 * @access  Admin/Instructor
 */
const reorderLessons = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { lessons } = req.body;

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Lessons array is required',
      });
    }

    // Check module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    // Update order for each lesson
    await prisma.$transaction(
      lessons.map((les, index) =>
        prisma.lesson.update({
          where: { id: les.id },
          data: { order: index },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Lessons reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLessonsByModule,
  getLessonById,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
};
