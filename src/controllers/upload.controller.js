const bunnyStorage = require('../services/bunnyStorage.service');
const path = require('path');
const crypto = require('crypto');

/**
 * @desc    Upload image to Bunny Storage and return CDN URL
 * @route   POST /api/upload/image
 * @access  Admin (caller should protect with verifyAdmin)
 * @body    multipart: file (image), optional query: path=team|testimonials|courses (default: uploads)
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Send multipart form with field "file".',
      });
    }

    const pathType = (req.query.path || 'uploads').toLowerCase();
    const allowedPaths = ['team', 'testimonials', 'courses', 'uploads'];
    const pathSegment = allowedPaths.includes(pathType) ? pathType : 'uploads';

    const ext = path.extname(req.file.originalname) || getExtensionFromMime(req.file.mimetype);
    const filename = `${crypto.randomUUID()}${ext}`;

    const url = await bunnyStorage.uploadImage(
      req.file.buffer,
      pathSegment,
      filename,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      data: { url },
    });
  } catch (error) {
    next(error);
  }
};

function getExtensionFromMime(mimetype) {
  const map = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };
  return map[mimetype] || '.jpg';
}

module.exports = { uploadImage };
