const prisma = require('../config/db');

// ============================================
// GET /api/settings
// Get current settings (public - for navbar hidden pages)
// ============================================
const getSettings = async (req, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.settings.create({
        data: { id: 'default' },
      });
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET /api/settings/public
// Get only public settings (hidden pages for navbar)
// ============================================
const getPublicSettings = async (req, res, next) => {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
      select: { hiddenPages: true, maintenanceMode: true },
    });

    if (!settings) {
      settings = { hiddenPages: [], maintenanceMode: false };
    }

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

// ============================================
// PUT /api/settings
// Update settings (admin only)
// ============================================
const updateSettings = async (req, res, next) => {
  try {
    const {
      siteName,
      contactEmail,
      supportEmail,
      currency,
      defaultCourseStatus,
      enrollmentNotifications,
      marketingEmails,
      maintenanceMode,
      hiddenPages,
    } = req.body;

    const data = {};
    if (siteName !== undefined) data.siteName = siteName;
    if (contactEmail !== undefined) data.contactEmail = contactEmail;
    if (supportEmail !== undefined) data.supportEmail = supportEmail;
    if (currency !== undefined) data.currency = currency;
    if (defaultCourseStatus !== undefined) data.defaultCourseStatus = defaultCourseStatus;
    if (enrollmentNotifications !== undefined) data.enrollmentNotifications = enrollmentNotifications;
    if (marketingEmails !== undefined) data.marketingEmails = marketingEmails;
    if (maintenanceMode !== undefined) data.maintenanceMode = maintenanceMode;
    if (hiddenPages !== undefined) data.hiddenPages = hiddenPages;

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  getPublicSettings,
  updateSettings,
};
