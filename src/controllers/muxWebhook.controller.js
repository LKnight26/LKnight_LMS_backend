const prisma = require('../config/db');

/**
 * @desc    Handle Mux live stream webhooks (active / idle)
 * @route   POST /api/webhooks/mux
 * @access  Public (from Mux servers)
 *
 * Event types: video.live_stream.active, video.live_stream.idle
 */
const handleMuxWebhook = async (req, res) => {
  try {
    const raw = req.body && Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const type = payload.type;
    const data = payload.data || {};
    const objectId = data.id || payload.data?.id;

    if (!type || !objectId) {
      console.warn('[MUX WEBHOOK] Missing type or data.id');
      return res.status(200).json({ received: true });
    }

    if (type === 'video.live_stream.active' || type === 'video.live_stream.idle') {
      const status = type === 'video.live_stream.active' ? 'active' : 'idle';
      const stream = await prisma.liveStream.findFirst({
        where: { muxLiveStreamId: objectId },
      });
      if (stream) {
        await prisma.liveStream.update({
          where: { id: stream.id },
          data: { status },
        });
        console.log(`[MUX WEBHOOK] Updated live stream ${stream.id} status to ${status}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[MUX WEBHOOK] Error:', error);
    return res.status(200).json({ received: true });
  }
};

module.exports = { handleMuxWebhook };
