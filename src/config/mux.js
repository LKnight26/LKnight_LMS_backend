const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
  console.warn('[MUX] WARNING: MUX_TOKEN_ID or MUX_TOKEN_SECRET is not set. Live streaming features will be disabled.');
}

const muxConfig = {
  tokenId: MUX_TOKEN_ID,
  tokenSecret: MUX_TOKEN_SECRET,
  baseUrl: 'https://api.mux.com',
};

module.exports = muxConfig;
