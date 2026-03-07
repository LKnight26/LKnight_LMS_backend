const prisma = require('../config/db');
const muxService = require('../services/mux.service');
const { userHasActiveSubscription } = require('./subscription.controller');

function getLiveStreamModel() {
  const model = prisma.liveStream;
  if (!model) {
    console.error('[LiveStream] Prisma client missing liveStream model. Run in backend: npx prisma generate');
    return null;
  }
  return model;
}

/**
 * @desc    Create a new live stream (admin)
 * @route   POST /api/live-streams
 * @access  Admin
 */
const createStream = async (req, res, next) => {
  try {
    if (!muxService.createLiveStream) {
      return res.status(503).json({
        success: false,
        message: 'Live streaming is not configured. Set MUX_TOKEN_ID and MUX_TOKEN_SECRET.',
      });
    }

    const userId = req.userId;
    const { title } = req.body || {};

    const muxResult = await muxService.createLiveStream({ title });

    const liveStreamModel = getLiveStreamModel();
    if (!liveStreamModel) {
      return res.status(503).json({
        success: false,
        message: 'Live stream not configured. Run in backend: npx prisma generate',
      });
    }
    const stream = await liveStreamModel.create({
      data: {
        muxLiveStreamId: muxResult.id,
        playbackId: muxResult.playbackId,
        streamKey: muxResult.streamKey,
        status: muxResult.status,
        title: title || null,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: stream.id,
        muxLiveStreamId: stream.muxLiveStreamId,
        playbackId: stream.playbackId,
        streamKey: stream.streamKey,
        rtmpIngestUrl: muxService.RTMP_INGEST_URL,
        status: stream.status,
        title: stream.title,
        createdAt: stream.createdAt,
        createdBy: stream.createdBy,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List all live streams (admin)
 * @route   GET /api/live-streams
 * @access  Admin
 */
const listStreams = async (req, res, next) => {
  try {
    const liveStreamModel = getLiveStreamModel();
    if (!liveStreamModel) {
      return res.status(503).json({ success: false, message: 'Live stream not configured. Run: npx prisma generate' });
    }
    const streams = await liveStreamModel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: streams.map((s) => ({
        id: s.id,
        muxLiveStreamId: s.muxLiveStreamId,
        playbackId: s.playbackId,
        status: s.status,
        title: s.title,
        createdAt: s.createdAt,
        createdBy: s.createdBy,
        hasStreamKey: !!s.streamKey,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single live stream by id (admin)
 * @route   GET /api/live-streams/:id
 * @access  Admin
 */
const getStreamById = async (req, res, next) => {
  try {
    const liveStreamModel = getLiveStreamModel();
    if (!liveStreamModel) {
      return res.status(503).json({ success: false, message: 'Live stream not configured. Run: npx prisma generate' });
    }
    const { id } = req.params;
    const stream = await liveStreamModel.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...stream,
        rtmpIngestUrl: muxService.RTMP_INGEST_URL,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update live stream (title, status) (admin)
 * @route   PATCH /api/live-streams/:id
 * @access  Admin
 */
const updateStream = async (req, res, next) => {
  try {
    const liveStreamModel = getLiveStreamModel();
    if (!liveStreamModel) {
      return res.status(503).json({ success: false, message: 'Live stream not configured. Run: npx prisma generate' });
    }
    const { id } = req.params;
    const { title, status } = req.body || {};

    const stream = await liveStreamModel.findUnique({ where: { id } });
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined && ['idle', 'active', 'disabled'].includes(status)) {
      updateData.status = status;
    }

    const updated = await liveStreamModel.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a live stream (admin)
 * @route   DELETE /api/live-streams/:id
 * @access  Admin
 */
const deleteStream = async (req, res, next) => {
  try {
    const liveStreamModel = getLiveStreamModel();
    if (!liveStreamModel) {
      return res.status(503).json({ success: false, message: 'Live stream not configured. Run: npx prisma generate' });
    }
    const { id } = req.params;
    const stream = await liveStreamModel.findUnique({ where: { id } });
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    try {
      await muxService.deleteLiveStream(stream.muxLiveStreamId);
    } catch (muxErr) {
      console.warn('[LIVESTREAM] Mux delete failed, still removing from DB:', muxErr.message);
    }

    await liveStreamModel.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Live stream deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active stream info for viewer (paid only)
 * @route   GET /api/live-streams/playback/active
 * @access  Authenticated + paid/trial
 */
const getActiveStream = async (req, res, next) => {
  try {
    const hasAccess = await userHasActiveSubscription(req.userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Live stream is available only for paid or trial plan members. Please upgrade to access.',
        code: 'LIVE_REQUIRES_SUBSCRIPTION',
      });
    }

    const liveStreamModel = getLiveStreamModel();
    if (!liveStreamModel) {
      return res.status(503).json({ success: false, message: 'Live stream not configured. Run: npx prisma generate' });
    }
    const stream = await liveStreamModel.findFirst({
      where: { status: { in: ['active', 'idle'] } },
      orderBy: { updatedAt: 'desc' },
    });

    if (!stream) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No live stream is currently available.',
      });
    }

    const playbackUrl = muxService.getPlaybackUrl(stream.playbackId);

    res.status(200).json({
      success: true,
      data: {
        id: stream.id,
        playbackId: stream.playbackId,
        playbackUrl,
        status: stream.status,
        title: stream.title,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get playback URL for a specific stream (paid only)
 * @route   GET /api/live-streams/playback/:id
 * @access  Authenticated + paid/trial
 */
const getPlaybackById = async (req, res, next) => {
  try {
    const hasAccess = await userHasActiveSubscription(req.userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Live stream is available only for paid or trial plan members. Please upgrade to access.',
        code: 'LIVE_REQUIRES_SUBSCRIPTION',
      });
    }

    const liveStreamModel = getLiveStreamModel();
    if (!liveStreamModel) {
      return res.status(503).json({ success: false, message: 'Live stream not configured. Run: npx prisma generate' });
    }
    const { id } = req.params;
    const stream = await liveStreamModel.findUnique({
      where: { id },
    });

    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Live stream not found',
      });
    }

    if (stream.status === 'disabled') {
      return res.status(403).json({
        success: false,
        message: 'This stream is currently disabled.',
      });
    }

    const playbackUrl = muxService.getPlaybackUrl(stream.playbackId);

    res.status(200).json({
      success: true,
      data: {
        id: stream.id,
        playbackId: stream.playbackId,
        playbackUrl,
        status: stream.status,
        title: stream.title,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStream,
  listStreams,
  getStreamById,
  updateStream,
  deleteStream,
  getActiveStream,
  getPlaybackById,
};
