import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { EvaluationResult, DifficultyLevel } from "../types";

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
6. DETAILED & PERSONALIZED FEEDBACK: For each criterion (FC, LR, GRA, P), provide a thorough analysis of the candidate's performance.
   - PHÂN TÍCH LỖI SAI: Chỉ ra các ví dụ cụ thể về lỗi sai (từ vựng, ngữ pháp, phát âm) mà thí sinh đã mắc phải trong bài nói.
   - GỢI Ý SỬA LỖI: Cung cấp cách sửa chính xác cho từng lỗi sai được chỉ ra.
   - NÂNG CẤP BAND ĐIỂM: Đề xuất 2-3 từ vựng ít phổ biến (less common vocabulary) hoặc cấu trúc ngữ pháp nâng cao (complex structures) phù hợp để giúp thí sinh nâng điểm lên band tiếp theo.
   - Tất cả phản hồi phải được viết bằng tiếng Việt (trừ các thuật ngữ và ví dụ tiếng Anh cần giữ nguyên).

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
    { text: `Đánh giá bài thi IELTS Speaking sau đây. Hãy cung cấp phản hồi chi tiết cho từng tiêu chí:
1. Fluency and Coherence (FC): Độ trôi chảy và mạch lạc.
2. Lexical Resource (LR): Vốn từ vựng.
3. Grammatical Range and Accuracy (GRA): Ngữ pháp.
4. Pronunciation (P): Phát âm.

Đối với mỗi tiêu chí, hãy:
- Liệt kê các lỗi cụ thể từ transcript hoặc audio.
- Giải thích tại sao đó là lỗi và gợi ý cách sửa.
- Đề xuất các từ vựng hoặc cấu trúc "ăn điểm" (Band 7.0+) liên quan đến chủ đề để thí sinh cải thiện.

Transcripts provided:
${transcriptText || "No transcripts provided. Please use the attached audio files to transcribe and evaluate the candidate's speech."}

Nếu có file âm thanh, hãy ưu tiên âm thanh để đánh giá Phát âm (P) và sự tự nhiên. Cung cấp điểm "pronunciationAccuracy" từ 0-100.` }
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
  userApiKey?: string,
  difficulty: DifficultyLevel = DifficultyLevel.INTERMEDIATE
): Promise<{ sampleAnswer: string; framework?: string; tips?: string }> {
  const apiKey = userApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const instruction = `
  You are an expert IELTS Speaking coach specializing in natural communication for candidates aiming for ${difficulty}.
  Your goal is to generate sample answers for IELTS Speaking Part ${part}.
  
  STRICT STYLE RULES:
  1. VOCABULARY: Use words and phrases appropriate for a ${difficulty} level.
     - For BEGINNER (4.5-5.5): Focus on simple, clear, and accurate language. Avoid over-complicating ideas.
     - For INTERMEDIATE (6.0-6.5): Use some less common vocabulary, more idiomatic language, and varied sentence structures.
     - For ADVANCED (7.0+): Use sophisticated vocabulary, precise phrasing, and complex grammatical structures naturally.
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
  You are an expert IELTS Speaking coach specializing in helping students reach Band 6.0.
  Generate ONE natural, conversational sentence using the vocabulary/idiom provided: "${vocab}".
  
  STRICT RULES:
  1. LEVEL: Band 6.0 maximum. Use clear and common vocabulary.
  2. GRAMMAR PREFERENCE: Try to use relative clauses (who, which, that), passive voice, or basic tenses.
  3. TONE: Natural and conversational, as if spoken in an IELTS interview.
  4. VARIETY: Ensure each time you are asked for the same vocab, you provide a DIFFERENT sentence.
  5. FORMAT: Return ONLY the sentence text, no explanations, no quotes.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [{ text: `Generate a sentence for: ${vocab}` }] },
    config: {
      systemInstruction: instruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
    }
  });

  return response.text.trim();
}
