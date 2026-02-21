const crypto = require('crypto');
const bunnyConfig = require('../config/bunny');

/**
 * Create a video entry in Bunny Stream
 * @param {string} title - Video title
 * @returns {Promise<{guid: string, videoLibraryId: number, ...}>}
 */
async function createVideo(title) {
  const response = await fetch(
    `${bunnyConfig.baseUrl}/${bunnyConfig.libraryId}/videos`,
    {
      method: 'POST',
      headers: {
        'AccessKey': bunnyConfig.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny createVideo failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Upload video binary data to Bunny Stream
 * @param {string} videoId - Bunny video GUID
 * @param {Buffer} fileBuffer - Video file buffer
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function uploadVideo(videoId, fileBuffer) {
  const response = await fetch(
    `${bunnyConfig.baseUrl}/${bunnyConfig.libraryId}/videos/${videoId}`,
    {
      method: 'PUT',
      headers: {
        'AccessKey': bunnyConfig.apiKey,
        'Accept': 'application/json',
      },
      body: fileBuffer,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny uploadVideo failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Delete a video from Bunny Stream
 * @param {string} videoId - Bunny video GUID
 * @returns {Promise<boolean>}
 */
async function deleteVideo(videoId) {
  const response = await fetch(
    `${bunnyConfig.baseUrl}/${bunnyConfig.libraryId}/videos/${videoId}`,
    {
      method: 'DELETE',
      headers: {
        'AccessKey': bunnyConfig.apiKey,
      },
    }
  );

  // 404 is fine — video already deleted
  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Bunny deleteVideo failed (${response.status}): ${errorText}`);
  }

  return true;
}

/**
 * Get video details from Bunny Stream
 * @param {string} videoId - Bunny video GUID
 * @returns {Promise<{status: number, length: number, encodeProgress: number, ...}>}
 */
async function getVideo(videoId) {
  const response = await fetch(
    `${bunnyConfig.baseUrl}/${bunnyConfig.libraryId}/videos/${videoId}`,
    {
      method: 'GET',
      headers: {
        'AccessKey': bunnyConfig.apiKey,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Bunny getVideo failed (${response.status})`);
  }

  return response.json();
}

/**
 * Generate a signed embed URL with token authentication
 * Token = SHA256(securityKey + videoId + expiresTimestamp)
 * @param {string} videoId - Bunny video GUID
 * @param {number} expiresInSeconds - URL validity duration (default: 1 hour)
 * @returns {{url: string, expires: number}}
 */
function generateSignedEmbedUrl(videoId, expiresInSeconds = 3600) {
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // If token security key is configured, generate signed URL
  if (bunnyConfig.tokenSecurityKey) {
    const token = crypto
      .createHash('sha256')
      .update(bunnyConfig.tokenSecurityKey + videoId + expires)
      .digest('hex');

    return {
      url: `https://iframe.mediadelivery.net/embed/${bunnyConfig.libraryId}/${videoId}?token=${token}&expires=${expires}`,
      expires,
    };
  }

  // Unsigned URL (for development / when token auth is not enabled)
  return {
    url: `https://iframe.mediadelivery.net/embed/${bunnyConfig.libraryId}/${videoId}`,
    expires: 0,
  };
}

/**
 * Generate thumbnail URL for a video
 * @param {string} videoId - Bunny video GUID
 * @returns {string}
 */
function getThumbnailUrl(videoId) {
  return `https://${bunnyConfig.cdnHostname}/${videoId}/thumbnail.jpg`;
}

/**
 * Map Bunny webhook status code to human-readable string
 * Webhook Status: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=ResolutionFinished, 5=Failed
 * @param {number} statusCode
 * @returns {string}
 */
function mapWebhookStatus(statusCode) {
  const statusMap = {
    0: 'queued',
    1: 'processing',
    2: 'encoding',
    3: 'finished',
    4: 'finished', // Resolution finished = playable
    5: 'failed',
  };
  return statusMap[statusCode] || 'unknown';
}

module.exports = {
  createVideo,
  uploadVideo,
  deleteVideo,
  getVideo,
  generateSignedEmbedUrl,
  getThumbnailUrl,
  mapWebhookStatus,
};
