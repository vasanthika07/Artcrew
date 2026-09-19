/**
 * Abstract VideoService — implements Mux by default.
 * To switch to Cloudflare Stream, replace the implementation below
 * while keeping the same interface.
 */

let Mux;
try {
  Mux = require('@mux/mux-node');
} catch (e) {
  Mux = null;
}

let muxClient = null;

const getMuxClient = () => {
  if (!muxClient && Mux && process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET) {
    muxClient = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });
  }
  return muxClient;
};

/**
 * Generate a signed playback URL for a Mux asset.
 * Falls back to the direct URL if Mux is not configured.
 *
 * @param {string} playbackIdOrUrl
 * @returns {Promise<string>}
 */
const getSignedUrl = async (playbackIdOrUrl) => {
  if (!playbackIdOrUrl) {
    throw new Error('No playback ID or URL provided');
  }

  const client = getMuxClient();

  // If it looks like a Mux playback ID (not a full URL), generate a signed URL
  if (client && !playbackIdOrUrl.startsWith('http')) {
    try {
      const token = await client.jwt.signPlaybackId(playbackIdOrUrl, { type: 'video', expiration: '1h' });
      return `https://stream.mux.com/${playbackIdOrUrl}.m3u8?token=${token}`;
    } catch (err) {
      console.error('Mux signing error:', err.message);
      // Fall through to direct URL
    }
  }

  // If Mux not configured or it's already a full URL, return as-is
  // (still time-limited by the access token requirement on the API route)
  return playbackIdOrUrl;
};

/**
 * Get thumbnail URL for a Mux asset
 *
 * @param {string} playbackId
 * @returns {string}
 */
const getThumbnailUrl = (playbackId) => {
  if (!playbackId || playbackId.startsWith('http')) return playbackId || '';
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop&time=5`;
};

module.exports = { getSignedUrl, getThumbnailUrl };
