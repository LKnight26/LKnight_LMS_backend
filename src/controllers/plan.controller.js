const prisma = require('../config/db');

/**
 * @desc    Get all active plans (for pricing page)
 * @route   GET /api/plans
 * @access  Public
 */
const getAllPlans = async (req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });

    res.status(200).json({
      success: true,
      data: plans,
      count: plans.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all plans (admin - includes inactive and subscription counts)
 * @route   GET /api/plans/admin
 * @access  Admin
 */
const getAllPlansAdmin = async (req, res, next) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    const transformedPlans = plans.map((plan) => ({
      ...plan,
      subscriptionCount: plan._count.subscriptions,
      _count: undefined,
    }));

    res.status(200).json({
      success: true,
      data: transformedPlans,
      count: transformedPlans.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single plan by ID (admin)
 * @route   GET /api/plans/admin/:id
 * @access  Admin
 */
const getPlanById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...plan,
        subscriptionCount: plan._count.subscriptions,
        _count: undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPlans,
  getAllPlansAdmin,
  getPlanById,
};
