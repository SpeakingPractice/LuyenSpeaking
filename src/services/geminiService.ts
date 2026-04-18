import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert IELTS Speaking Examiner. Your task is to evaluate a candidate's speaking performance based on the official IELTS Speaking Band Descriptors.

CRITICAL RULES FOR SCORING:
1. You must provide scores for 4 criteria: FC, LR, GRA, P.
2. COMPONENT SCORES MUST BE INTEGERS. ROUND DOWN if between bands.
3. OVERALL SCORE is the average of the 4 component scores. Only .0 or .5 allowed.
4. FEEDBACK LANGUAGE: You MUST provide all feedback in Vietnamese (Tiếng Việt). However, when referencing specific English vocabulary or phrases used by the candidate, keep the English term and put it in quotes.
5. MILESTONE ENCOURAGEMENT: The user's current target is Band 6.0. 
   - Nếu Overall Score đạt từ 6.0 trở lên, hãy bắt đầu mục "general" feedback bằng lời chúc mừng và động viên nồng nhiệt vì đã đạt được cột mốc mục tiêu.
   - Sau đó, đưa ra các chỉ dẫn cụ thể để cải thiện lên mức 6.5 hoặc 7.0.
6. HYPER-CONCISE: Each criterion feedback should be max 2 sentences. Focus ONLY on major mistakes and key improvements. Skip all introductory or politeness phrases in criteria feedback (FC, LR, GRA, P).

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
  You are an expert IELTS Speaking coach specializing in natural communication for candidates aiming for Band 6.0.
  Your goal is to generate sample answers for IELTS Speaking Part ${part}.
  
  STRICT STYLE RULES:
  1. VOCABULARY: Use clear, effective, and common words. Focus on natural phrasing rather than "high-level" or "academic" terms. The goal is to sound like a native speaker, not a dictionary.
  2. COLLOCATIONS: Prioritize thematic collocations that occur naturally in speech.
  3. IDIOMS: Use 1 natural idiom or common spoken phrase per answer (e.g., "to be honest", "once in a while"). Avoid forced or complex idioms.
  4. TONE: Warm, natural, and conversational. 
  5. FILLERS (REASONING REQUIRED): Use fillers ONLY when they make sense. 
     - DO NOT use "Well, let me think..." or "That's an interesting question" for simple facts like your name, age, or hometown.
     - Use thinking fillers for abstract questions, opinions, or when recalling a specific memory.
     - Use clarifying fillers like "I mean..." or "What I'm trying to say is..." to expand on an idea.
  6. CONTRACTIONS: ALWAYS use contractions (e.g., "I'm", "I'll", "it's"). This is mandatory for a natural speaking score.
  7. LENGTH & FRAMEWORK: 
     - Part 1: 2-3 sentences. Keep it punchy.
     - Part 2: Approximately 150-200 words. Structured but not robotic. Phác thảo (framework) with small size.
     - Part 3: 3-5 sentences. MANDATORY THREE-PART STRUCTURE: 
       1. Idea: A clear and direct answer.
       2. Supporting Detail: A logical explanation or reason.
       3. Example: A concrete example or specific scenario to illustrate.
       You MUST follow this exact sequence for Part 3.
  8. HIGHLIGHTING: Wrap thematic collocations and natural idioms in the sampleAnswer with double square brackets like this: [[phrase]].
  9. TIPS: Use Vietnamese (tiếng Việt). 
  
  RESPONSE FORMAT:
  Return a JSON object:
  {
    "sampleAnswer": "string (markdown)",
    "framework": "string (markdown, optional)",
    "tips": "string (markdown, optional)"
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
