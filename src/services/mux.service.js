const muxConfig = require('../config/mux');

const authHeader = () => {
  if (!muxConfig.tokenId || !muxConfig.tokenSecret) {
    throw new Error('Mux credentials not configured');
  }
  const encoded = Buffer.from(`${muxConfig.tokenId}:${muxConfig.tokenSecret}`).toString('base64');
  return `Basic ${encoded}`;
};

/**
 * Create a live stream in Mux
 * @param {{ title?: string }} options
 * @returns {Promise<{ id: string, streamKey: string, playbackId: string, status: string }>}
 */
async function createLiveStream(options = {}) {
  const response = await fetch(`${muxConfig.baseUrl}/video/v1/live-streams`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': authHeader(),
    },
    body: JSON.stringify({
      playback_policies: ['public'],
      new_asset_settings: { playback_policies: ['public'] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mux createLiveStream failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const data = json.data;
  if (!data || !data.id) {
    throw new Error('Mux createLiveStream returned invalid response');
  }

  const playbackIds = data.playback_ids || [];
  const playbackId = playbackIds[0]?.id || null;
  if (!playbackId) {
    throw new Error('Mux live stream has no playback ID');
  }

  return {
    id: data.id,
    streamKey: data.stream_key || '',
    playbackId,
    status: data.status || 'idle',
  };
}

/**
 * Get a live stream from Mux
 * @param {string} muxLiveStreamId
 * @returns {Promise<{ id: string, status: string, streamKey?: string, playbackIds?: Array<{ id: string }> }>}
 */
async function getLiveStream(muxLiveStreamId) {
  const response = await fetch(
    `${muxConfig.baseUrl}/video/v1/live-streams/${muxLiveStreamId}`,
    {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader(),
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    const errorText = await response.text();
    throw new Error(`Mux getLiveStream failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.data || null;
}

/**
 * Delete a live stream from Mux
 * @param {string} muxLiveStreamId
 * @returns {Promise<boolean>}
 */
async function deleteLiveStream(muxLiveStreamId) {
  const response = await fetch(
    `${muxConfig.baseUrl}/video/v1/live-streams/${muxLiveStreamId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader(),
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Mux deleteLiveStream failed (${response.status}): ${errorText}`);
  }

  return true;
}

/** RTMP(S) ingest URL for OBS etc. */
const RTMP_INGEST_URL = 'rtmps://global-live.mux.com:443/app';

/**
 * Get HLS playback URL for a playback ID (public policy)
 * @param {string} playbackId
 * @returns {string}
 */
function getPlaybackUrl(playbackId) {
  return `https://stream.mux.com/${playbackId}.m3u8`;
}

module.exports = {
  createLiveStream,
  getLiveStream,
  deleteLiveStream,
  getPlaybackUrl,
  RTMP_INGEST_URL,
};
