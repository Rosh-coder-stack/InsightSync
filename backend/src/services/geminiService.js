import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

let genAIClient = null;

function getGeminiClient() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables.');
    }
    genAIClient = new GoogleGenerativeAI(apiKey);
  }
  return genAIClient;
}

const MEETING_INTELLIGENCE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    title: {
      type: SchemaType.STRING,
      description: 'Concise, professional 3 to 7 word meeting title inferred from the transcript.',
    },
    executiveOverview: {
      type: SchemaType.STRING,
      description: 'Clear, formal 2 to 4 sentence executive summary of the meeting.',
    },
    keyDecisions: {
      type: SchemaType.ARRAY,
      description: 'Concrete decisions agreed upon during the meeting.',
      items: {
        type: SchemaType.STRING,
      },
    },
    actionItems: {
      type: SchemaType.ARRAY,
      description: 'Actionable tasks assigned during the meeting.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          task: {
            type: SchemaType.STRING,
            description: 'Specific, actionable task description.',
          },
          assignee: {
            type: SchemaType.STRING,
            description: 'Person or team assigned to the task, or "Unassigned" if not stated.',
          },
          priority: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: ['High', 'Medium', 'Low'],
            description: 'Priority level inferred from urgency and impact.',
          },
        },
        required: ['task', 'assignee', 'priority'],
      },
    },
  },
  required: ['title', 'executiveOverview', 'keyDecisions', 'actionItems'],
};

const VALID_PRIORITIES = new Set(['High', 'Medium', 'Low']);

/**
 * Extract structured meeting intelligence from a transcript using Gemini 2.5 Flash.
 * @param {string} transcript - Full verbatim meeting transcript.
 * @param {string} [fallbackTitle='Untitled Meeting'] - Fallback title if none can be inferred.
 * @returns {Promise<{
 *   title: string,
 *   executiveOverview: string,
 *   keyDecisions: string[],
 *   actionItems: Array<{ task: string, assignee: string, priority: 'High' | 'Medium' | 'Low' }>
 * }>}
 */
export async function extractMeetingIntelligence(transcript, fallbackTitle = 'Untitled Meeting') {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    throw new Error('Cannot extract meeting intelligence from an empty transcript.');
  }

  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: MEETING_INTELLIGENCE_SCHEMA,
      },
    });

    const prompt = [
      'You are an enterprise meeting intelligence analyst.',
      'Analyze the following meeting transcript and extract accurate, strictly factual insights based ONLY on what was explicitly stated in the transcript.',
      'Do not fabricate, speculate, or hallucinate decisions, tasks, or assignees.',
      'Rules:',
      '- title: A concise, professional 3 to 7 word title summarizing the meeting topic.',
      '- executiveOverview: A clear, formal 2 to 4 sentence executive summary covering purpose, key discussion points, and outcomes.',
      '- keyDecisions: Concrete decisions explicitly agreed upon (empty array if none were made).',
      '- actionItems: Specific next steps/tasks. Use "Unassigned" when no owner is named. Assign priority as "High", "Medium", or "Low".',
      '',
      'Transcript:',
      transcript.trim(),
    ].join('\n');

    const result = await model.generateContent(prompt);
    const rawResponse = result?.response?.text();

    if (!rawResponse) {
      throw new Error('Gemini returned an empty response.');
    }

    const parsed = JSON.parse(rawResponse);

    const title = typeof parsed.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : fallbackTitle;

    const executiveOverview =
      typeof parsed.executiveOverview === 'string' && parsed.executiveOverview.trim()
        ? parsed.executiveOverview.trim()
        : 'No executive overview was generated for this meeting.';

    const keyDecisions = Array.isArray(parsed.keyDecisions)
      ? parsed.keyDecisions.map((item) => String(item).trim()).filter(Boolean)
      : [];

    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems
          .filter((item) => item && typeof item.task === 'string' && item.task.trim())
          .map((item) => ({
            task: item.task.trim(),
            assignee:
              typeof item.assignee === 'string' && item.assignee.trim()
                ? item.assignee.trim()
                : 'Unassigned',
            priority: VALID_PRIORITIES.has(item.priority) ? item.priority : 'Medium',
          }))
      : [];

    return {
      title,
      executiveOverview,
      keyDecisions,
      actionItems,
    };
  } catch (error) {
    throw new Error(`Meeting intelligence extraction failed: ${error.message}`);
  }
}

export default { extractMeetingIntelligence };
