const AssistantService = require('../services/AssistantService');
const Medium = require('../models/Medium');
const RecordedSession = require('../models/RecordedSession');
const Resource = require('../models/Resource');
const Studio = require('../models/Studio');
const StudioService = require('../services/studio/StudioService');

/**
 * POST /api/assistant/recommend
 * Multi-step AI Art Recommendation endpoint
 */
const recommend = async (req, res, next) => {
  try {
    const answers = req.body.answers || req.body;
    const latitude = req.body.latitude || (req.body.answers && req.body.answers.latitude);
    const longitude = req.body.longitude || (req.body.answers && req.body.answers.longitude);

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return res.status(422).json({
        success: false,
        message: 'A valid answers object is required for art recommendation',
      });
    }

    // 1. Load active mediums from DB
    const mediums = await Medium.find({ isActive: true }).lean();
    if (!mediums || mediums.length === 0) {
      return res.status(503).json({
        success: false,
        message: 'No art mediums currently available in the database',
      });
    }

    // 2. Load learning resources and recorded sessions
    const [allResources, allRecordedSessions] = await Promise.all([
      Resource.find({ isActive: true }).lean(),
      RecordedSession.find({ isPublished: true }).lean(),
    ]);

    // 3. Optionally load nearby studios if lat/lon provided, or fallback to DB studios
    let availableStudios = [];
    if (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
      try {
        availableStudios = await StudioService.search({
          lat: Number(latitude),
          lon: Number(longitude),
          radius: 25000,
        });
      } catch (studioErr) {
        console.warn('[assistantController] StudioService search warning:', studioErr.message);
      }
    }

    if (!availableStudios || availableStudios.length === 0) {
      const dbStudios = await Studio.find({ isActive: true }).limit(10).lean();
      availableStudios = dbStudios.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        address: s.address || '',
        latitude: s.latitude,
        longitude: s.longitude,
        rating: s.rating,
        photos: s.photos || [],
        website: s.website || '',
        phone: s.phone || '',
        supportedMediums: s.supportedMediums || [],
        description: s.description || '',
      }));
    }

    // 4. Send structured context to AssistantService (Anthropic or deterministic fallback)
    const recommendation = await AssistantService.getRecommendation({
      answers,
      mediums,
      resources: allResources,
      recordedSessions: allRecordedSessions,
      studios: availableStudios,
    });

    if (!recommendation || !recommendation.medium) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate an art recommendation at this time.',
      });
    }

    // 5. Match the recommended medium with DB medium document
    const mediumDoc =
      mediums.find(
        (m) => m.name.toLowerCase().trim() === recommendation.medium.toLowerCase().trim()
      ) || mediums[0];

    // 6. Enrich resources (strictly from application DB)
    let enrichedResources = [];
    if (recommendation.resource_ids && recommendation.resource_ids.length > 0) {
      enrichedResources = allResources.filter((r) =>
        recommendation.resource_ids.includes(r._id.toString())
      );
    }
    // If none selected or empty, attach all beginner/active resources for this medium
    if (enrichedResources.length === 0) {
      enrichedResources = allResources
        .filter((r) => r.mediumId && r.mediumId.toString() === mediumDoc._id.toString())
        .slice(0, 6);
    }

    // 7. Enrich recorded workshops / sessions (strictly from application DB)
    let enrichedSessions = [];
    if (recommendation.recorded_session_ids && recommendation.recorded_session_ids.length > 0) {
      enrichedSessions = allRecordedSessions.filter((s) =>
        recommendation.recorded_session_ids.includes(s._id.toString())
      );
    }
    if (enrichedSessions.length === 0) {
      enrichedSessions = allRecordedSessions
        .filter((s) => s.mediumId && s.mediumId.toString() === mediumDoc._id.toString())
        .slice(0, 4);
    }

    // 8. Enrich studios (strictly from DB/provider IDs)
    let enrichedStudios = [];
    if (recommendation.studio_ids && recommendation.studio_ids.length > 0) {
      enrichedStudios = availableStudios.filter((s) =>
        recommendation.studio_ids.includes((s.id || s._id).toString())
      );
    }
    if (enrichedStudios.length === 0) {
      enrichedStudios = availableStudios
        .filter((s) =>
          (s.supportedMediums || []).some(
            (sm) =>
              sm.toLowerCase().includes(mediumDoc.name.toLowerCase()) ||
              mediumDoc.name.toLowerCase().includes(sm.toLowerCase())
          )
        )
        .slice(0, 3);
    }

    // Persist to user record in MongoDB in real time if user is logged in
    if (req.user) {
      try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user._id, {
          $set: {
            'preferences.onboardingQuiz': answers,
            'preferences.recommendedMedium': mediumDoc._id,
          },
        });
      } catch (saveUserErr) {
        console.warn('[assistantController] User preference save warning:', saveUserErr.message);
      }
    }

    // Return the complete structured output
    res.json({
      success: true,
      data: {
        medium: mediumDoc.name,
        mediumId: mediumDoc._id,
        mediumSlug: mediumDoc.slug,
        coverImage: mediumDoc.coverImage || '',
        difficulty: mediumDoc.difficulty || 'Beginner',
        beginnerGuide: mediumDoc.beginnerGuide || '',
        reason: recommendation.reason,
        budget: recommendation.budget || mediumDoc.estimatedBudget || '₹1,500 - ₹3,500',
        supplies: recommendation.supplies || mediumDoc.supplies || [],
        studio_ids: enrichedStudios.map((s) => (s.id || s._id).toString()),
        studios: enrichedStudios,
        resources: enrichedResources,
        recorded_session_ids: enrichedSessions.map((s) => s._id.toString()),
        recordedSessions: enrichedSessions,
      },
    });
  } catch (error) {
    console.error('[assistantController] Error generating recommendation:', error);
    next(error);
  }
};

module.exports = { recommend };
