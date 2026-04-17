import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert IELTS Speaking Examiner. Your task is to evaluate a candidate's speaking performance based on the official IELTS Speaking Band Descriptors.

CRITICAL RULES FOR SCORING:
1. You must provide scores for 4 criteria: FC, LR, GRA, P.
2. COMPONENT SCORES MUST BE INTEGERS. ROUND DOWN if between bands.
3. OVERALL SCORE is the average of the 4 component scores. Only .0 or .5 allowed.
4. FEEDBACK LANGUAGE: You MUST provide all feedback in Vietnamese (Tiếng Việt). However, when referencing specific English vocabulary or phrases used by the candidate, keep the English term and put it in quotes.
5. BE CONCISE: Provide direct, actionable feedback to ensure fast response times.

RESPONSE FORMAT:
Return a JSON object:
{
  "scores": { "fc": number, "lr": number, "gra": number, "p": number },
  "pronunciationAccuracy": number,
  "overall": number,
  "feedback": {
    "fc": "string (markdown in Vietnamese)",
    "lr": "string (markdown in Vietnamese)",
    "gra": "string (markdown in Vietnamese)",
    "p": "string (markdown in Vietnamese)",
    "general": "string (markdown in Vietnamese)"
  }
}
`;

export async function evaluateSpeaking(
  transcripts: { [id: string]: string },
  audioData?: { [id: string]: { data: string, mimeType: string } }, // base64 audio
  userApiKey?: string
): Promise<EvaluationResult> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please provide one in settings.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const transcriptText = Object.entries(transcripts)
    .map(([id, text]) => `Question ${id}: ${text}`)
    .join('\n\n');

  const parts: any[] = [
    { text: `Evaluate the following IELTS Speaking performance. Focus specifically on pronunciation accuracy, stress, intonation, and emotional expression.
    
Transcripts provided:
${transcriptText || "No transcripts provided. Please use the attached audio files to transcribe and evaluate the candidate's speech."}

If audio files are provided, prioritize the audio for evaluating Pronunciation (P), Fluency (FC), and emotional delivery. 
Provide a "pronunciationAccuracy" score from 0-100, where 100 is native-like and 80+ is required to "pass" this level.

Please analyze the language used, the coherence, and the grammatical accuracy based on IELTS standards (Targeting Band 6.5).` }
  ];

  if (audioData) {
    Object.entries(audioData).forEach(([id, audio]) => {
      parts.push({
        inlineData: {
          data: audio.data,
          mimeType: audio.mimeType
        }
      });
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.OBJECT,
            properties: {
              fc: { type: Type.INTEGER },
              lr: { type: Type.INTEGER },
              gra: { type: Type.INTEGER },
              p: { type: Type.INTEGER }
            },
            required: ["fc", "lr", "gra", "p"]
          },
          pronunciationAccuracy: { type: Type.INTEGER },
          overall: { type: Type.NUMBER },
          feedback: {
            type: Type.OBJECT,
            properties: {
              fc: { type: Type.STRING },
              lr: { type: Type.STRING },
              gra: { type: Type.STRING },
              p: { type: Type.STRING },
              general: { type: Type.STRING }
            },
            required: ["fc", "lr", "gra", "p", "general"]
          }
        },
        required: ["scores", "pronunciationAccuracy", "overall", "feedback"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    return JSON.parse(text) as EvaluationResult;
  } catch (e) {
    console.error("Failed to parse evaluation result", e);
    throw new Error("Evaluation failed. Please try again.");
  }
}

export async function generateSpeakingContent(
  part: 1 | 2 | 3,
  input: string, // topic or question
  userApiKey?: string
): Promise<{ sampleAnswer: string; framework?: string; tips?: string }> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const instruction = `
  You are an expert IELTS Speaking coach specializing in natural communication.
  Your goal is to generate sample answers for IELTS Speaking Part ${part}.
  
  STRICT STYLE RULES:
  1. VOCABULARY: Use clear, effective, and common words. Avoid overly "academic" or obscure words.
  2. COLLOCATIONS: Prioritize thematic collocations (e.g., instead of "good coffee", use "a rich aroma" or "a strong caffeine kick").
  3. IDIOMS: Use 1-2 natural idioms per answer (e.g., "to be honest", "once in a blue moon", "up in the air"). Avoid cliches or outdated idioms.
  4. TONE: Warm, natural, and conversational. Like a native speaker chatting with a friend.
  5. FILLERS: Use natural fillers occasionally to create thinking time and natural flow. Examples: "Well, let me think...", "That’s an interesting question", "Honestly, I’ve never thought about that before, but...", "Let me see...", "I mean...", "What I'm trying to say is...", "You know...", "Actually...", "Basically...".
  6. CONTRACTIONS: ALWAYS use contractions (e.g., "I'm", "I'll", "I'd like", "don't", "can't") as this is a speaking test and should sound natural.
  7. LENGTH: 
     - Part 1: 3-4 sentences.
     - Part 2: Approximately 200-250 words.
     - Part 3: 4-6 sentences with structured reasoning.
  8. FRAMEWORK (PART 2 ONLY): Provide a phác thảo (framework) with 4 key bullet points. Each point MUST be on a new line. Use this exact structure:
     - Intro: (Direct answer)
     - Context/Background: (Where, When, Who, Why - include a short description of personality/appearance)
     - Main Story: (Past start -> Past climax -> Result then -> Current situation)
     - Conclusion: (Future wishes or final feeling)
  9. HIGHLIGHTING: Wrap all high-quality collocations and natural idioms in the sampleAnswer with double square brackets like this: [[phrase]].
  10. TIPS: Use Vietnamese (tiếng Việt) to explain tại sao dùng cụm từ đó. Use English ONLY when stating the key phrases themselves.
  11. NO RAW ESCAPED CHARACTERS: Do not include literal "\\n" or stringified newline characters in the JSON values. Use actual line breaks.
  
  RESPONSE FORMAT:
  Return a JSON object:
  {
    "sampleAnswer": "string (markdown)",
    "framework": "string (markdown, optional)",
    "tips": "string (markdown, optional - short tip on a specific collocation or idiom used)"
  }
  `;

  const prompt = `Generate a sample answer for this IELTS Speaking Part ${part} content: "${input}"`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: prompt }] },
    config: {
      systemInstruction: instruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sampleAnswer: { type: Type.STRING },
          framework: { type: Type.STRING },
          tips: { type: Type.STRING }
        },
        required: ["sampleAnswer"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

export async function generatePronunciationSentence(
  vocab: string,
  userApiKey?: string
): Promise<string> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const instruction = `
  You are an expert IELTS Speaking coach.
  Generate ONE natural, conversational sentence using the vocabulary/idiom provided: "${vocab}".
  The sentence should sound like it belongs in an IELTS Speaking interview.
  Crucially, ensure each time you are asked for the same vocab, you provide a DIFFERENT sentence.
  Return ONLY the sentence text, no explanations.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Generate a sentence for: ${vocab}` }] },
    config: {
      systemInstruction: instruction
    }
  });

  return response.text.trim();
}
