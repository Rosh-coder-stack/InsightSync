import fs from 'node:fs';
import Groq from 'groq-sdk';

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured in environment variables.');
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

/**
 * Transcribe an audio file using Groq Whisper (whisper-large-v3).
 * @param {string} filePath - Path to the temporary audio file on disk.
 * @returns {Promise<{ transcript: string, durationSeconds: number }>}
 */
export async function transcribeAudio(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Audio file not found at path: ${filePath}`);
  }

  try {
    const groq = getGroqClient();
    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      temperature: 0,
    });

    const transcript = response?.text?.trim();
    if (!transcript) {
      throw new Error('Groq Whisper returned an empty transcript.');
    }

    return {
      transcript,
      durationSeconds: Math.round(response.duration || 0),
    };
  } catch (error) {
    throw new Error(`Audio transcription failed: ${error.message}`);
  }
}

export default { transcribeAudio };
