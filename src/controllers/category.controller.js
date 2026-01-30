const prisma = require('../config/db');

/**
 * Generate slug from name
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    // Transform to include courseCount
    const transformedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      iconBgColor: cat.iconBgColor,
      order: cat.order,
      courseCount: cat._count.courses,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: transformedCategories,
      count: transformedCategories.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true },
        },
        courses: {
          where: { status: 'PUBLISHED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            price: true,
            level: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...category,
        courseCount: category._count.courses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Admin
 */
const createCategory = async (req, res, next) => {
  try {
    const { name, description, icon, iconBgColor } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Generate slug
    const slug = generateSlug(name);

    // Check if slug exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists',
      });
    }

    // Get max order
    const maxOrderCategory = await prisma.category.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const order = maxOrderCategory ? maxOrderCategory.order + 1 : 0;

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        icon: icon || 'book',
        iconBgColor: iconBgColor || 'bg-blue-500',
        order,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { ...category, courseCount: 0 },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Admin
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, icon, iconBgColor } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const updateData = {};

    if (name && name.trim() !== '') {
      updateData.name = name.trim();
      updateData.slug = generateSlug(name);

      // Check if new slug conflicts with another category
      const slugConflict = await prisma.category.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: id },
        },
      });

      if (slugConflict) {
        return res.status(409).json({
          success: false,
          message: 'A category with this name already exists',
        });
      }
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (icon) {
      updateData.icon = icon;
    }

    if (iconBgColor) {
      updateData.iconBgColor = iconBgColor;
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        ...updatedCategory,
        courseCount: updatedCategory._count.courses,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Admin
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { courses: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if category has courses
    if (category._count.courses > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${category._count.courses} course(s) associated with it.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reorder categories
 * @route   PATCH /api/categories/reorder
 * @access  Admin
 */
const reorderCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Categories array is required',
      });
    }

    // Update order for each category
    await prisma.$transaction(
      categories.map((cat, index) =>
        prisma.category.update({
          where: { id: cat.id },
          data: { order: index },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: 'Categories reordered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get category statistics
 * @route   GET /api/categories/stats
 * @access  Admin
 */
const getCategoryStats = async (req, res, next) => {
  try {
    const [totalCategories, totalCourses, categoriesWithCounts] =
      await Promise.all([
        prisma.category.count(),
        prisma.course.count(),
        prisma.category.findMany({
          include: {
            _count: {
              select: { courses: true },
            },
          },
        }),
      ]);

    const avgCoursesPerCategory =
      totalCategories > 0
        ? Math.round((totalCourses / totalCategories) * 10) / 10
        : 0;

    res.status(200).json({
      success: true,
      data: {
        totalCategories,
        totalCourses,
        avgCoursesPerCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  getCategoryStats,
};
