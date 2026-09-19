const AssistantService = require('../services/AssistantService');
const Medium = require('../models/Medium');
const RecordedSession = require('../models/RecordedSession');
const Resource = require('../models/Resource');

// POST /api/assistant/recommend
const recommend = async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(422).json({ success: false, message: 'answers object is required' });
    }

    // Get all mediums to provide context to the AI
    const mediums = await Medium.find({ isActive: true }).select('name slug description difficulty estimatedBudget supplies');

    const recommendation = await AssistantService.getRecommendation(answers, mediums);

    // Validate the AI response structure
    if (!recommendation || !recommendation.medium) {
      return res.status(500).json({ success: false, message: 'AI returned an invalid recommendation' });
    }

    // Enrich recommendation with real DB content
    const medium = await Medium.findOne({
      name: { $regex: new RegExp(recommendation.medium, 'i') },
    });

    let enriched = { ...recommendation };

    if (medium) {
      const [resources, recordings] = await Promise.all([
        Resource.find({ mediumId: medium._id, isActive: true, level: 'beginner' }).limit(5),
        RecordedSession.find({ mediumId: medium._id, isPublished: true }).limit(3).select('title thumbnailUrl durationSeconds requiredTier'),
      ]);
      enriched.resources = resources;
      enriched.recordedSessions = recordings;
      enriched.mediumId = medium._id;
      enriched.mediumSlug = medium.slug;
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

module.exports = { recommend };
