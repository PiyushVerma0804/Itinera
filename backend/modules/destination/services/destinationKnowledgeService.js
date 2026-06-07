/**
 * Service for generating destination-specific travel knowledge using Groq LLM
 */

const MODEL_NAME = 'llama-3.3-70b-versatile';
const REQUEST_TIMEOUT_MS = 15000;

/**
 * Validates the destination input parameters.
 *
 * @param {string} destination - Destination name to validate
 * @throws {Error} If destination is invalid
 */
const validateDestination = (destination) => {
  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    throw new Error('Destination is required');
  }
};

/**
 * Sanitizes an array of string values by removing nulls/empty strings,
 * trimming whitespace, and removing duplicates.
 *
 * @param {Array} values - Array of raw values to sanitize
 * @returns {Array<string>} Sanitized array of unique strings
 */
const sanitizeStringArray = (values) => {
  if (!Array.isArray(values)) return [];
  const sanitized = values
    .filter((val) => val !== null && val !== undefined)
    .map((val) => (typeof val === 'string' ? val.trim() : String(val).trim()))
    .filter((val) => val !== '');
  return [...new Set(sanitized)];
};

/**
 * Normalizes destination knowledge to ensure it conforms to the target schema.
 *
 * @param {Object} parsed - Parsed knowledge object
 * @returns {Object} Schema-compliant normalized knowledge object
 */
const normalizeKnowledge = (parsed) => {
  const data = parsed || {};
  return {
    famousFoods: sanitizeStringArray(data.famousFoods || []),
    localExperiences: sanitizeStringArray(data.localExperiences || []),
    travelTips: sanitizeStringArray(data.travelTips || []),
    seasonalAdvice: sanitizeStringArray(data.seasonalAdvice || [])
  };
};

/**
 * Builds the prompt query to instruct the LLM on generating the travel knowledge.
 *
 * @param {string} destination - The target destination
 * @returns {string} The formatted prompt string
 */
const buildKnowledgePrompt = (destination) => {
  return `You are a travel intelligence system. Provide contextual travel knowledge for the destination: "${destination}".
You must return a JSON object with the following exact keys and structure:
{
  "famousFoods": ["Food 1", "Food 2", ...],
  "localExperiences": ["Experience 1", "Experience 2", ...],
  "travelTips": ["Tip 1", "Tip 2", ...],
  "seasonalAdvice": ["Advice 1", "Advice 2", ...]
}

Constraints:
1. Return ONLY the raw JSON object.
2. Do NOT wrap the response in markdown code blocks (e.g. do not use \`\`\`json).
3. Do NOT include any explanations, introductory text, or trailing text.
4. Provide high-quality, specific, and actionable travel details for ${destination}.`;
};

/**
 * Safely parses the JSON output from the LLM response, applying fallbacks if it is invalid.
 *
 * @param {string} content - Raw response content from LLM
 * @returns {Object} Normalized knowledge object
 */
const parseKnowledgeResponse = (content) => {
  try {
    if (!content || typeof content !== 'string') {
      return normalizeKnowledge({});
    }

    let cleanContent = content.trim();
    // Strip markdown code blocks if the LLM wrapped it anyway
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsed = JSON.parse(cleanContent);
    return normalizeKnowledge(parsed);
  } catch (error) {
    // Graceful fallback to avoid application crash
    return normalizeKnowledge({});
  }
};

/**
 * Fetches and structures contextual travel knowledge for a given destination.
 *
 * @param {string} destination - The target destination
 * @returns {Promise<Object>} Normalized knowledge object
 */
export const getDestinationKnowledge = async (destination) => {
  validateDestination(destination);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in the environment variables.');
  }

  const prompt = buildKnowledgePrompt(destination);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'system',
            content: 'You are a precise travel intelligence service that outputs exclusively valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    return parseKnowledgeResponse(content);
  } catch (error) {
    if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new Error('Destination knowledge request timed out');
    }
    throw new Error(`Failed to generate destination knowledge for ${destination}. ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
  }
};
