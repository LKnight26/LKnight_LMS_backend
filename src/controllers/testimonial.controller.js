const prisma = require('../config/db');

/**
 * @desc    Get testimonials by page
 * @route   GET /api/testimonials?page=home
 * @access  Public
 */
const getTestimonials = async (req, res, next) => {
  try {
    const { page, all } = req.query;
    const where = {};

    // Admin can see all; public sees only active
    if (!all) {
      where.isActive = true;
    }

    // Filter by page
    if (page === 'home') where.showOnHome = true;
    else if (page === 'about') where.showOnAbout = true;
    else if (page === 'courses') where.showOnCourses = true;
    else if (page === 'dashboard') where.showOnDashboard = true;

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single testimonial by ID
 * @route   GET /api/testimonials/:id
 * @access  Public
 */
const getTestimonialById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testimonial = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
    }

    res.status(200).json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new testimonial
 * @route   POST /api/testimonials
 * @access  Admin
 */
const createTestimonial = async (req, res, next) => {
  try {
    const {
      name, content, rating, image, gender,
      showOnHome, showOnAbout, showOnCourses, showOnDashboard,
      isActive,
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const ratingValue = Math.min(5, Math.max(1, parseInt(rating) || 5));

    // Get max order
    const maxOrderItem = await prisma.testimonial.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = maxOrderItem ? maxOrderItem.order + 1 : 0;

    const testimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        content: content.trim(),
        rating: ratingValue,
        image: image || null,
        gender: gender || 'male',
        showOnHome: showOnHome || false,
        showOnAbout: showOnAbout || false,
        showOnCourses: showOnCourses || false,
        showOnDashboard: showOnDashboard || false,
        isActive: isActive !== undefined ? isActive : true,
        order,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: testimonial,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update testimonial
 * @route   PUT /api/testimonials/:id
 * @access  Admin
 */
const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, content, rating, image, gender,
      showOnHome, showOnAbout, showOnCourses, showOnDashboard,
      isActive,
    } = req.body;

    const existing = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (rating !== undefined) updateData.rating = Math.min(5, Math.max(1, parseInt(rating) || 5));
    if (image !== undefined) updateData.image = image || null;
    if (gender !== undefined) updateData.gender = gender;
    if (showOnHome !== undefined) updateData.showOnHome = showOnHome;
    if (showOnAbout !== undefined) updateData.showOnAbout = showOnAbout;
    if (showOnCourses !== undefined) updateData.showOnCourses = showOnCourses;
    if (showOnDashboard !== undefined) updateData.showOnDashboard = showOnDashboard;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.testimonial.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Testimonial updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete testimonial
 * @route   DELETE /api/testimonials/:id
 * @access  Admin
 */
const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.testimonial.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found',
      });
    }

    await prisma.testimonial.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reorder testimonials
 * @route   PATCH /api/testimonials/reorder
 * @access  Admin
 */
const reorderTestimonials = async (req, res, next) => {
  try {
    const { testimonials } = req.body;

    if (!Array.isArray(testimonials) || testimonials.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Testimonials array is required',
      });
    }

    await prisma.$transaction(
      testimonials.map((item, index) =>
        prisma.testimonial.update({
          where: { id: item.id },
          data: { order: index },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Testimonials reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  reorderTestimonials,
};
