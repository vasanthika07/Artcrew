const { GoogleGenerativeAI } = require('@google/generative-ai');
let Anthropic;
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (e) {
  Anthropic = null;
}

/**
 * Build system prompt incorporating ONLY valid database IDs and entities
 */
const buildSystemPrompt = ({ mediums, resources, recordedSessions, studios }) => {
  const mediumList = mediums
    .map(
      (m) =>
        `- ID: "${m._id}" | Name: "${m.name}" | Difficulty: ${m.difficulty} | Budget: "${m.estimatedBudget || 'Varies'}" | Description: "${m.description}" | Supplies: ${(m.supplies || []).join(', ')} | Tags: ${(m.tags || []).join(', ')}`
    )
    .join('\n');

  const studioList =
    studios.length > 0
      ? studios
          .slice(0, 12)
          .map(
            (s) =>
              `- ID: "${s.id || s._id}" | Name: "${s.name}" | Address: "${s.address || 'Local'}" | Mediums: ${(s.supportedMediums || []).join(', ')}`
          )
          .join('\n')
      : 'None available nearby';

  const resourceList =
    resources.length > 0
      ? resources
          .slice(0, 20)
          .map(
            (r) =>
              `- ID: "${r._id}" | MediumId: "${r.mediumId}" | Title: "${r.title}" | Provider: "${r.provider}" | Type: "${r.resourceType}" | Level: "${r.level}"`
          )
          .join('\n')
      : 'None available';

  const sessionList =
    recordedSessions.length > 0
      ? recordedSessions
          .slice(0, 10)
          .map(
            (s) =>
              `- ID: "${s._id}" | MediumId: "${s.mediumId}" | Title: "${s.title}" | Tier: "${s.requiredTier}" | Instructor: "${s.instructor}"`
          )
          .join('\n')
      : 'None available';

  return `You are ArtCrew's AI Art Recommendation Assistant, an empathetic and highly experienced art advisor.
Your goal is to evaluate the user's answers to the onboarding questionnaire and recommend the SINGLE best primary art medium for them from the provided database mediums.

CRITICAL CONSTRAINTS (VIOLATING THESE WILL BREAK THE APPLICATION):
1. "medium": MUST match the exact name of one of the available mediums listed below.
2. "studio_ids": You MUST ONLY select studio IDs from the AVAILABLE STUDIOS list below. NEVER invent or fabricate studio IDs. If none fit or none are listed, return [].
3. "resource_ids": You MUST ONLY select resource IDs from the AVAILABLE LEARNING RESOURCES list below. NEVER invent URLs or resource IDs. If none fit, return [].
4. "recorded_session_ids": You MUST ONLY select session IDs from the AVAILABLE RECORDED SESSIONS list below. NEVER invent session IDs. If none fit, return [].
5. "supplies": Return a curated list of 3-6 beginner-friendly essential supplies for this medium.
6. "budget": Provide an estimated starting budget string (e.g. "₹1,500 - ₹3,000").
7. "reason": Write an encouraging, warm, 2-3 sentence personalized explanation explaining WHY this medium suits their experience, budget, messiness tolerance, and goals.

AVAILABLE DATABASE MEDIUMS:
${mediumList}

AVAILABLE STUDIOS:
${studioList}

AVAILABLE LEARNING RESOURCES:
${resourceList}

AVAILABLE RECORDED SESSIONS:
${sessionList}

YOU MUST RESPOND ONLY WITH A VALID JSON OBJECT MATCHING THIS EXACT SCHEMA (no markdown wrapping, no extra words):
{
  "medium": "Exact Medium Name",
  "reason": "Personalized explanation directly addressing user choices",
  "budget": "Estimated budget (e.g. ₹1,500 - ₹3,000)",
  "supplies": ["Supply 1", "Supply 2", "Supply 3"],
  "studio_ids": ["valid_id_1"],
  "resource_ids": ["valid_id_1", "valid_id_2"],
  "recorded_session_ids": ["valid_id_1"]
}`;
};

/**
 * Format user answers for prompt
 */
const formatAnswers = (answers) => {
  const labels = {
    experienceLevel: 'Experience Level',
    budget: 'Starting Budget',
    environment: 'Preferred Environment',
    messiness: 'Clean vs Messy Preference',
    challengeLevel: 'Relaxing vs Challenging',
    learningStyle: 'Solo vs Class Learning Preference',
    traditionalDigital: 'Traditional vs Digital Preference',
    artInterests: 'Art Interests & Subjects',
    timeAvailable: 'Available Learning Time',
  };

  return Object.entries(answers)
    .map(([key, val]) => `${labels[key] || key}: ${Array.isArray(val) ? val.join(', ') : val}`)
    .join('\n');
};

/**
 * Deterministic local recommendation logic (100% Free, Zero Billing, Instant)
 */
const getFallbackRecommendation = (answers, { mediums, resources, recordedSessions, studios }) => {
  if (!mediums || mediums.length === 0) {
    return {
      medium: 'Paintings',
      reason: 'Painting is a versatile and expressive art medium ideal for creative exploration at your own pace.',
      budget: '₹1,500 - ₹3,500',
      supplies: ['Acrylic starter paints', 'Brushes set', 'Canvas board', 'Palette'],
      studio_ids: [],
      resource_ids: [],
      recorded_session_ids: [],
    };
  }

  const ansStr = Object.values(answers || {})
    .flat()
    .join(' ')
    .toLowerCase();

  const scores = {};
  mediums.forEach((m) => {
    scores[m._id.toString()] = 0;
  });

  mediums.forEach((m) => {
    const name = (m.name || '').toLowerCase();
    const tags = (m.tags || []).map((t) => t.toLowerCase());
    const id = m._id.toString();

    // Subject interest matching
    if (ansStr.includes('potter') || ansStr.includes('clay') || ansStr.includes('3d') || ansStr.includes('craft') || ansStr.includes('ceramic')) {
      if (name.includes('potter') || tags.includes('tactile')) scores[id] += 15;
    }
    if (ansStr.includes('portrait') || ansStr.includes('face') || ansStr.includes('people') || ansStr.includes('figure') || ansStr.includes('human')) {
      if (name.includes('portrait')) scores[id] += 15;
    }
    if (ansStr.includes('landscape') || ansStr.includes('nature') || ansStr.includes('outdoor') || ansStr.includes('plein') || ansStr.includes('sunset')) {
      if (name.includes('landscape') || tags.includes('outdoor')) scores[id] += 15;
    }
    if (ansStr.includes('charcoal') || ansStr.includes('sketch') || ansStr.includes('drawing') || ansStr.includes('black & white') || ansStr.includes('contrast')) {
      if (name.includes('charcoal') || name.includes('draw')) scores[id] += 15;
    }
    if (ansStr.includes('paint') || ansStr.includes('color') || ansStr.includes('vibrant') || ansStr.includes('acrylic') || ansStr.includes('oil') || ansStr.includes('abstract')) {
      if (name.includes('paint') || tags.includes('colorful')) scores[id] += 15;
    }

    // Mess preference
    if (ansStr.includes('embrace') || ansStr.includes('messy') || ansStr.includes('tactile')) {
      if (tags.includes('messy') || name.includes('potter') || name.includes('charcoal')) scores[id] += 6;
    }
    if (ansStr.includes('clean') || ansStr.includes('tidy') || ansStr.includes('minimal')) {
      if (!tags.includes('messy')) scores[id] += 6;
    }

    // Relaxation vs Challenge
    if (ansStr.includes('relax') || ansStr.includes('calm') || ansStr.includes('meditat') || ansStr.includes('flow')) {
      if (tags.includes('relaxing') || m.difficulty === 'Beginner') scores[id] += 5;
    }
    if (ansStr.includes('challeng') || ansStr.includes('precision') || ansStr.includes('technic')) {
      if (m.difficulty === 'Intermediate' || m.difficulty === 'Advanced' || name.includes('portrait')) scores[id] += 5;
    }

    // Class vs Solo
    if (ansStr.includes('class') || ansStr.includes('workshop')) {
      if (tags.includes('class-recommended') || name.includes('potter')) scores[id] += 4;
    }
  });

  // Find best scoring medium
  let bestMedium = mediums[0];
  let highestScore = -1;
  mediums.forEach((m) => {
    const s = scores[m._id.toString()] || 0;
    if (s > highestScore) {
      highestScore = s;
      bestMedium = m;
    }
  });

  // Craft dynamic reason
  let reason = `Based on your creative interests, budget, and learning preferences, ${bestMedium.name} is the ideal art form for you. It provides an engaging and highly rewarding creative journey with ample room to grow.`;
  if (ansStr.includes('relax') || ansStr.includes('meditat')) {
    reason = `Because you are looking for a calming and mindful creative experience, ${bestMedium.name} offers the perfect flow state to unwind and express yourself freely.`;
  } else if (ansStr.includes('challeng') || ansStr.includes('precision')) {
    reason = `Your desire for technical mastery and rewarding skill-building makes ${bestMedium.name} a great fit, offering rich nuance in form, light, and depth.`;
  } else if (ansStr.includes('potter') || ansStr.includes('clay') || ansStr.includes('mess')) {
    reason = `Your enthusiasm for hands-on, tactile creation makes ${bestMedium.name} a wonderful match, giving you the joy of shaping physical art from scratch.`;
  } else if (ansStr.includes('outdoor') || ansStr.includes('nature')) {
    reason = `Your love for nature and outdoor inspiration aligns seamlessly with ${bestMedium.name}, letting you capture landscapes and natural light with expressive energy.`;
  }

  // Filter DB resources and sessions
  const matchedResources = (resources || []).filter(
    (r) => r.mediumId && r.mediumId.toString() === bestMedium._id.toString()
  );
  const matchedSessions = (recordedSessions || []).filter(
    (s) => s.mediumId && s.mediumId.toString() === bestMedium._id.toString()
  );
  const matchedStudios = (studios || []).filter((s) =>
    (s.supportedMediums || []).some(
      (sm) =>
        sm.toLowerCase().includes(bestMedium.name.toLowerCase()) ||
        bestMedium.name.toLowerCase().includes(sm.toLowerCase())
    )
  );

  return {
    medium: bestMedium.name,
    reason,
    budget: bestMedium.estimatedBudget || '₹1,500 - ₹3,500',
    supplies: bestMedium.supplies?.length
      ? bestMedium.supplies
      : ['Starter brush/pencil set', 'Quality art paper or canvas', 'Palette & containers'],
    studio_ids: matchedStudios.slice(0, 3).map((s) => s.id || s._id.toString()),
    resource_ids: matchedResources.slice(0, 4).map((r) => r._id.toString()),
    recorded_session_ids: matchedSessions.slice(0, 3).map((s) => s._id.toString()),
  };
};

/**
 * Try generating with Google Gemini (Free Tier at aistudio.google.com)
 */
const generateWithGemini = async (systemPrompt, userMessage, apiKey) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  
  const prompt = `${systemPrompt}\n\nUser quiz answers:\n${userMessage}\n\nPlease recommend the most fitting art medium in JSON format:`;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (err) {
      // try next model
    }
  }
  throw new Error('Could not generate recommendation with available Gemini models');
};

/**
 * Try generating with Anthropic Claude
 */
const generateWithAnthropic = async (systemPrompt, userMessage, apiKey) => {
  if (!Anthropic) throw new Error('Anthropic SDK not installed');
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1200,
    system: systemPrompt,
    messages: [{ role: 'user', content: `User quiz answers:\n${userMessage}\n\nPlease recommend the most fitting art medium according to the schema.` }],
  });
  return message.content[0]?.text || '';
};

/**
 * Main recommendation function: calls Gemini -> Anthropic -> Local Smart Engine
 */
const getRecommendation = async ({ answers, mediums, resources = [], recordedSessions = [], studios = [] }) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const systemPrompt = buildSystemPrompt({ mediums, resources, recordedSessions, studios });
  const userMessage = formatAnswers(answers);

  let rawJson = null;

  // 1. Try Gemini Free API first if GEMINI_API_KEY is set
  if (geminiKey) {
    try {
      rawJson = await generateWithGemini(systemPrompt, userMessage, geminiKey);
      console.log('[AssistantService] Recommendation generated via Google Gemini AI');
    } catch (err) {
      console.warn('[AssistantService] Gemini AI failed, trying next provider:', err.message);
    }
  }

  // 2. Try Anthropic if configured and not already resolved
  if (!rawJson && anthropicKey && anthropicKey.startsWith('sk-ant-') && !anthropicKey.includes('...')) {
    try {
      rawJson = await generateWithAnthropic(systemPrompt, userMessage, anthropicKey);
      console.log('[AssistantService] Recommendation generated via Anthropic Claude');
    } catch (err) {
      console.warn('[AssistantService] Anthropic Claude failed (credit/quota):', err.message);
    }
  }

  // Parse JSON if an AI model responded
  if (rawJson) {
    try {
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (parsed && parsed.medium && parsed.reason) {
        const matchingMedium = mediums.find(
          (m) => m.name.toLowerCase().trim() === parsed.medium.toLowerCase().trim()
        );

        if (matchingMedium) {
          const validStudioIdSet = new Set(studios.map((s) => (s.id || s._id).toString()));
          const sanitizedStudioIds = Array.isArray(parsed.studio_ids)
            ? parsed.studio_ids.filter((id) => validStudioIdSet.has(id.toString()))
            : [];

          const validResourceIdSet = new Set(resources.map((r) => r._id.toString()));
          const sanitizedResourceIds = Array.isArray(parsed.resource_ids)
            ? parsed.resource_ids.filter((id) => validResourceIdSet.has(id.toString()))
            : [];

          const validSessionIdSet = new Set(recordedSessions.map((s) => s._id.toString()));
          const sanitizedSessionIds = Array.isArray(parsed.recorded_session_ids)
            ? parsed.recorded_session_ids.filter((id) => validSessionIdSet.has(id.toString()))
            : [];

          return {
            medium: matchingMedium.name,
            reason: parsed.reason,
            budget: parsed.budget || matchingMedium.estimatedBudget || '₹1,500 - ₹3,500',
            supplies:
              Array.isArray(parsed.supplies) && parsed.supplies.length > 0
                ? parsed.supplies
                : matchingMedium.supplies || [],
            studio_ids: sanitizedStudioIds,
            resource_ids: sanitizedResourceIds,
            recorded_session_ids: sanitizedSessionIds,
          };
        }
      }
    } catch (parseErr) {
      console.warn('[AssistantService] Failed to parse AI response, using smart local engine');
    }
  }

  // 3. Built-in Local Smart Recommendation Engine (Zero Cost, 0 Billing)
  console.log('[AssistantService] Using Built-in Smart Recommendation Engine (Zero Billing / Instant)');
  return getFallbackRecommendation(answers, { mediums, resources, recordedSessions, studios });
};

module.exports = {
  getRecommendation,
  getFallbackRecommendation,
};
