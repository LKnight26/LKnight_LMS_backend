const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { userHasActiveSubscription } = require('../controllers/subscription.controller');
const {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  deleteDiscussion,
  toggleDiscussionLike,
  getComments,
  getReplies,
  createComment,
  toggleCommentLike,
  deleteComment,
  getStats,
  pollDiscussions,
} = require('../controllers/vault.controller');

// All vault routes require authentication
router.use(verifyToken);

// Vault is only for paid or trial plan members
const requirePaidOrTrial = async (req, res, next) => {
  try {
    const hasAccess = await userHasActiveSubscription(req.userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'The Vault is available only for paid or trial plan members. Please upgrade to access.',
        code: 'VAULT_REQUIRES_SUBSCRIPTION',
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};
router.use(requirePaidOrTrial);

// Stats
router.get('/stats', getStats);

// Discussions
router.get('/discussions/poll', pollDiscussions);
router.get('/discussions', getDiscussions);
router.get('/discussions/:id', getDiscussionById);
router.post('/discussions', createDiscussion);
router.delete('/discussions/:id', deleteDiscussion);

// Discussion likes
router.post('/discussions/:id/like', toggleDiscussionLike);

// Comments on a discussion
router.get('/discussions/:id/comments', getComments);
router.post('/discussions/:id/comments', createComment);

// Comment replies
router.get('/comments/:commentId/replies', getReplies);

// Comment likes & delete
router.post('/comments/:commentId/like', toggleCommentLike);
router.delete('/comments/:commentId', deleteComment);

module.exports = router;
