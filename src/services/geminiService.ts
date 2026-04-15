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
    { text: `Evaluate the following IELTS Speaking performance.
    
Transcripts provided:
${transcriptText || "No transcripts provided. Please use the attached audio files to transcribe and evaluate the candidate's speech."}

If audio files are provided, prioritize the audio for evaluating Pronunciation (P) and Fluency (FC). If transcripts are missing or incomplete, transcribe the audio yourself before evaluating.

Please analyze the language used, the coherence, and the grammatical accuracy based on IELTS standards.` }
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
        required: ["scores", "overall", "feedback"]
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
