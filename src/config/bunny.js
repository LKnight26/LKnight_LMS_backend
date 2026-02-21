const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;
const BUNNY_TOKEN_SECURITY_KEY = process.env.BUNNY_TOKEN_SECURITY_KEY;

if (!BUNNY_API_KEY) {
  console.warn('[BUNNY] WARNING: BUNNY_API_KEY is not set. Video upload features will be disabled.');
}

const bunnyConfig = {
  apiKey: BUNNY_API_KEY,
  libraryId: BUNNY_LIBRARY_ID,
  cdnHostname: BUNNY_CDN_HOSTNAME,
  tokenSecurityKey: BUNNY_TOKEN_SECURITY_KEY,
  baseUrl: 'https://video.bunnycdn.com/library',
};

module.exports = bunnyConfig;
