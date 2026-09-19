/**
 * Abstract VideoService — implements Mux by default with Cloudflare Stream and HLS/MP4 compatibility.
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
    try {
      muxClient = new Mux({
        tokenId: process.env.MUX_TOKEN_ID,
        tokenSecret: process.env.MUX_TOKEN_SECRET,
      });
    } catch (err) {
      console.warn('[VideoService] Mux client initialization warning:', err.message);
    }
  }
  return muxClient;
};

/**
 * Generate a signed playback URL for a Mux or Stream asset.
 * Falls back to direct/secure URL if Mux is not configured or if URL is direct.
 *
 * @param {string} playbackIdOrUrl
 * @returns {Promise<string>}
 */
const getSignedUrl = async (playbackIdOrUrl) => {
  if (!playbackIdOrUrl) {
    throw new Error('No playback ID or URL provided');
  }

  const client = getMuxClient();

  // If it is a Mux playback ID (alphanumeric, not starting with http)
  if (client && !playbackIdOrUrl.startsWith('http')) {
    try {
      if (client.jwt && typeof client.jwt.signPlaybackId === 'function') {
        const token = await client.jwt.signPlaybackId(playbackIdOrUrl, {
          type: 'video',
          expiration: '2h',
        });
        return `https://stream.mux.com/${playbackIdOrUrl}.m3u8?token=${token}`;
      }
      return `https://stream.mux.com/${playbackIdOrUrl}.m3u8`;
    } catch (err) {
      console.warn('[VideoService] Mux signing failed, falling back:', err.message);
      return `https://stream.mux.com/${playbackIdOrUrl}.m3u8`;
    }
  }

  // If already full Mux or HLS or MP4 URL
  return playbackIdOrUrl;
};

/**
 * Get thumbnail URL for a Mux asset
 *
 * @param {string} playbackId
 * @returns {string}
 */
const getThumbnailUrl = (playbackId) => {
  if (!playbackId) return '';
  if (playbackId.startsWith('http')) return playbackId;
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?width=640&height=360&fit_mode=smartcrop&time=5`;
};

module.exports = { getSignedUrl, getThumbnailUrl };
