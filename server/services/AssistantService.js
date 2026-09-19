const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Build the system prompt for the art recommendation assistant
 */
const buildSystemPrompt = (mediums) => {
  const mediumList = mediums.map((m) => `- ${m.name}: ${m.description} (${m.difficulty}, Budget: ${m.estimatedBudget})`).join('\n');

  return `You are an expert art advisor helping beginners discover the perfect art medium.
Based on user preferences, recommend ONE primary art medium and provide structured guidance.

Available mediums in our platform:
${mediumList}

IMPORTANT: You MUST respond with ONLY valid JSON matching this exact structure:
{
  "medium": "Medium Name",
  "reason": "Personalized explanation of why this medium suits them",
  "budget": "Estimated starting budget in INR (e.g., ₹1500-₹3000)",
  "supplies": ["supply 1", "supply 2", "supply 3"],
  "beginner_tips": ["tip 1", "tip 2", "tip 3"],
  "recommended_communities": [
    { "name": "Community Name", "url": "https://...", "platform": "Reddit/Discord/etc" }
  ],
  "alternative_mediums": ["Alternative 1", "Alternative 2"],
  "time_to_learn_basics": "Estimated time (e.g., 2-4 weeks)",
  "indoor_outdoor": "Indoor/Outdoor/Both",
  "mess_level": "Low/Medium/High"
}

Do not include any text outside the JSON object.`;
};

/**
 * Format user answers into a clear question-answer string
 */
const formatAnswers = (answers) => {
  const questionMap = {
    experienceLevel: 'Experience level',
    budget: 'Monthly budget',
    indoorOutdoor: 'Indoor or outdoor preference',
    messiness: 'Preference for clean or messy mediums',
    challengeLevel: 'Relaxing vs technically challenging',
    learningStyle: 'Learning alone or in a class',
    artInterest: 'Type of art interested in',
    timeAvailable: 'Time available per week',
    traditionalDigital: 'Traditional or digital art preference',
  };

  return Object.entries(answers)
    .map(([key, value]) => `${questionMap[key] || key}: ${value}`)
    .join('\n');
};

const getRecommendation = async (answers, mediums) => {
  const systemPrompt = buildSystemPrompt(mediums);
  const userMessage = `Based on my preferences:\n${formatAnswers(answers)}\n\nPlease recommend the best art medium for me.`;

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const content = message.content[0]?.text || '';

  // Parse and validate JSON response
  try {
    // Extract JSON even if there's surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI returned invalid JSON response');
  }
};

module.exports = { getRecommendation };
