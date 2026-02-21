const prisma = require('../config/db');
const bunnyService = require('../services/bunny.service');

/**
 * @desc    Handle Bunny Stream encoding webhooks
 * @route   POST /api/webhooks/bunny
 * @access  Public (from Bunny servers)
 *
 * Webhook payload: { VideoLibraryId, VideoGuid, Status }
 * Status: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=ResolutionFinished, 5=Failed
 */
const handleBunnyWebhook = async (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString());
    const { VideoGuid, Status } = payload;

    if (!VideoGuid) {
      console.warn('[BUNNY WEBHOOK] Missing VideoGuid in payload');
      return res.status(200).json({ received: true });
    }

    const statusString = bunnyService.mapWebhookStatus(Status);
    console.log(`[BUNNY WEBHOOK] VideoGuid=${VideoGuid}, Status=${Status} (${statusString})`);

    // Find the lesson associated with this video
    const lesson = await prisma.lesson.findFirst({
      where: { bunnyVideoId: VideoGuid },
    });

    if (!lesson) {
      console.warn(`[BUNNY WEBHOOK] No lesson found for VideoGuid=${VideoGuid}`);
      return res.status(200).json({ received: true });
    }

    const updateData = { videoStatus: statusString };

    // When encoding is finished, fetch video info for duration and thumbnail
    if (Status === 3 || Status === 4) {
      try {
        const videoInfo = await bunnyService.getVideo(VideoGuid);
        if (videoInfo.length) {
          updateData.duration = Math.round(videoInfo.length);
        }
        updateData.thumbnailUrl = bunnyService.getThumbnailUrl(VideoGuid);
      } catch (err) {
        console.warn('[BUNNY WEBHOOK] Failed to fetch video info:', err.message);
      }
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: updateData,
    });

    console.log(`[BUNNY WEBHOOK] Updated lesson ${lesson.id}: ${statusString}`);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[BUNNY WEBHOOK] Error processing webhook:', error);
    // Always return 200 to prevent Bunny from retrying indefinitely
    return res.status(200).json({ received: true });
  }
};

module.exports = { handleBunnyWebhook };
