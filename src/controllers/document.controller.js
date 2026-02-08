const prisma = require('../config/db');

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
];

// Fields to select when listing documents (excludes content for performance)
const listSelect = {
  id: true,
  title: true,
  fileName: true,
  fileSize: true,
  fileType: true,
  order: true,
  courseId: true,
  moduleId: true,
  lessonId: true,
  createdAt: true,
};

/**
 * @desc    Upload document to a course
 * @route   POST /api/courses/:courseId/documents
 * @access  Admin/Instructor
 */
const uploadCourseDocument = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, fileName, fileSize, fileType, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    if (fileType && !ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type',
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    const maxOrder = await prisma.document.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        fileName: fileName || 'document',
        fileSize: fileSize || 0,
        fileType: fileType || 'application/octet-stream',
        content,
        courseId,
        order: maxOrder ? maxOrder.order + 1 : 0,
      },
      select: listSelect,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload document to a module
 * @route   POST /api/modules/:moduleId/documents
 * @access  Admin/Instructor
 */
const uploadModuleDocument = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { title, fileName, fileSize, fileType, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    if (fileType && !ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type',
      });
    }

    const mod = await prisma.module.findUnique({
      where: { id: moduleId },
      select: { id: true },
    });

    if (!mod) {
      return res.status(404).json({
        success: false,
        message: 'Module not found',
      });
    }

    const maxOrder = await prisma.document.findFirst({
      where: { moduleId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        fileName: fileName || 'document',
        fileSize: fileSize || 0,
        fileType: fileType || 'application/octet-stream',
        content,
        moduleId,
        order: maxOrder ? maxOrder.order + 1 : 0,
      },
      select: listSelect,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload document to a lesson
 * @route   POST /api/lessons/:lessonId/documents
 * @access  Admin/Instructor
 */
const uploadLessonDocument = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { title, fileName, fileSize, fileType, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    if (fileType && !ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type',
      });
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true },
    });

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found',
      });
    }

    const maxOrder = await prisma.document.findFirst({
      where: { lessonId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        fileName: fileName || 'document',
        fileSize: fileSize || 0,
        fileType: fileType || 'application/octet-stream',
        content,
        lessonId,
        order: maxOrder ? maxOrder.order + 1 : 0,
      },
      select: listSelect,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all documents for a course
 * @route   GET /api/courses/:courseId/documents
 * @access  Public
 */
const getCourseDocuments = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const documents = await prisma.document.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: listSelect,
    });

    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all documents for a module
 * @route   GET /api/modules/:moduleId/documents
 * @access  Public
 */
const getModuleDocuments = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const documents = await prisma.document.findMany({
      where: { moduleId },
      orderBy: { order: 'asc' },
      select: listSelect,
    });

    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all documents for a lesson
 * @route   GET /api/lessons/:lessonId/documents
 * @access  Public
 */
const getLessonDocuments = async (req, res, next) => {
  try {
    const { lessonId } = req.params;

    const documents = await prisma.document.findMany({
      where: { lessonId },
      orderBy: { order: 'asc' },
      select: listSelect,
    });

    res.status(200).json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single document by ID (includes content for download)
 * @route   GET /api/documents/:id
 * @access  Public
 */
const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update document
 * @route   PUT /api/documents/:id
 * @access  Admin/Instructor
 */
const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, fileName, fileSize, fileType, content } = req.body;

    const existing = await prisma.document.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title.trim();
    if (fileName !== undefined) updateData.fileName = fileName;
    if (fileSize !== undefined) updateData.fileSize = fileSize;
    if (fileType !== undefined) {
      if (!ALLOWED_DOCUMENT_TYPES.includes(fileType)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type',
        });
      }
      updateData.fileType = fileType;
    }
    if (content !== undefined) updateData.content = content;

    const document = await prisma.document.update({
      where: { id },
      data: updateData,
      select: listSelect,
    });

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete document
 * @route   DELETE /api/documents/:id
 * @access  Admin/Instructor
 */
const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    await prisma.document.delete({
      where: { id },
    });

    // Determine the parent and reorder remaining documents
    const parentFilter = document.courseId
      ? { courseId: document.courseId }
      : document.moduleId
        ? { moduleId: document.moduleId }
        : { lessonId: document.lessonId };

    const remaining = await prisma.document.findMany({
      where: parentFilter,
      orderBy: { order: 'asc' },
    });

    if (remaining.length > 0) {
      await prisma.$transaction(
        remaining.map((doc, index) =>
          prisma.document.update({
            where: { id: doc.id },
            data: { order: index },
          })
        )
      );
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadCourseDocument,
  uploadModuleDocument,
  uploadLessonDocument,
  getCourseDocuments,
  getModuleDocuments,
  getLessonDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
};
