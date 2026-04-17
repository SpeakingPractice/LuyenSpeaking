import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert IELTS Speaking Examiner. Your task is to evaluate a candidate's speaking performance based on the official IELTS Speaking Band Descriptors.

CRITICAL RULES FOR SCORING:
1. You must provide scores for 4 criteria:
   - Fluency and Coherence (FC)
   - Lexical Resource (LR)
   - Grammatical Range and Accuracy (GRA)
   - Pronunciation (P)
2. COMPONENT SCORES (FC, LR, GRA, P) MUST BE INTEGERS. If a candidate is between bands, you MUST ROUND DOWN. For example, if they are a 6.5, you must give a 6.
3. OVERALL SCORE is the average of the 4 component scores. This is the ONLY score that can have a .5 (e.g., 6.0, 6.5, 7.0).
4. Provide specific feedback for each criterion, highlighting errors and suggesting how to reach the next band.
5. Use the provided transcripts and audio context to make your judgment.

BAND DESCRIPTOR SUMMARY (Simplified):
- Band 9: Expert. Fluent, precise, accurate, full range of features.
- Band 8: Very Good. Occasional repetition, wide resource, majority error-free, easily understood.
- Band 7: Good. Long turns, some hesitation, flexible resource, complex structures used effectively.
- Band 6: Competent. Willing to produce long turns, some loss of coherence, sufficient vocabulary, mix of simple/complex forms.
- Band 5: Modest. Relies on repetition, limited flexibility, basic sentence forms controlled.
- Band 4: Limited. Frequent pauses, simple sentences, basic meaning only.

RESPONSE FORMAT:
You must return a JSON object matching this structure:
{
  "scores": { "fc": number, "lr": number, "gra": number, "p": number },
  "pronunciationAccuracy": number, (0-100 integer representing clarity and accent accuracy)
  "overall": number,
  "feedback": {
    "fc": "string (markdown)",
    "lr": "string (markdown)",
    "gra": "string (markdown)",
    "p": "string (markdown)",
    "general": "string (markdown)"
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
Provide a "pronunciationAccuracy" score from 0-100, where 100 is native-like and 85+ is required to "pass" this level.

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
  5. LENGTH: 
     - Part 1: 3-4 sentences.
     - Part 2: Approximately 200-250 words.
     - Part 3: 4-6 sentences with structured reasoning.
  6. FRAMEWORK (PART 2 ONLY): Provide a phác thảo (framework) with 4 key bullet points. Each point MUST be on a new line. Use this exact structure:
     - Intro: (Direct answer)
     - Context/Background: (Where, When, Who, Why - include a short description of personality/appearance)
     - Main Story: (Past start -> Past climax -> Result then -> Current situation)
     - Conclusion: (Future wishes or final feeling)
  7. TIPS: Use Vietnamese (tiếng Việt) to explain why the collocation or idiom is used. Use English ONLY when stating the key phrases themselves.
  8. NO RAW ESCAPED CHARACTERS: Do not include literal "\\n" or stringified newline characters in the JSON values. Use actual line breaks.
  
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
