import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Google GenAI client (server-side only)
// Uses the recommended pattern with named parameter and 'aistudio-build' headers for telemetry
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// API Endpoint to get child-friendly hints
app.post("/api/gemini/hint", async (req, res) => {
  const { question, category, grade, language = "en" } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question parameter is required" });
  }

  const prompt = `You are a warm, encouraging, and clever cartoon Math Owl named Owl-bert, teaching elementary school kids (Grade ${grade || 3}-${grade ? grade + 1 : 4}).
Provide a friendly, visual, and supportive math hint for the following math word problem.
Do NOT give away the final mathematical answer or final number. Instead:
1. Explain how to visualize or draw a bar model (Singapore Math style) or a simple diagram for the problem.
2. Ask leading questions that guide the child to think about what is known and what they need to find.
3. Keep the tone enthusiastic, child-friendly, simple, and encouraging (use phrases like "Hoot! Let's think about this...", "We can draw a bar block for...").
4. Respond in ${language === "vi" ? "Vietnamese (Tiếng Việt)" : "English"}.

Problem details:
- Category: ${category || "General Math Word Problem"}
- Problem: "${question}"`;

  try {
    if (!ai) {
      // Fallback in case of missing API key, so the app still functions perfectly
      const fallbackVI = `🦉 Có tiếng gù vang lên! Thầy Cú khuyên bạn: Với dạng toán "${category || "này"}", hãy thử vẽ sơ đồ đoạn thẳng (Singapore model). Vẽ các ô vuông biểu thị phần bằng nhau và tìm xem số phần chênh lệch tương ứng với giá trị nào nhé! Bạn làm được mà!`;
      const fallbackEN = `🦉 Hoot! Here's a tip: For this "${category || "word"}" problem, try drawing a bar model! Draw boxes representing equal parts and check how the difference relates to the values. You can do it!`;
      return res.json({ hint: language === "vi" ? fallbackVI : fallbackEN, isFallback: true });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    res.json({ hint: response.text || "Keep thinking, you are close!" });
  } catch (error: any) {
    console.error("Gemini Hint Error:", error);
    res.status(500).json({ error: "Failed to generate hint", details: error.message });
  }
});

// API Endpoint to get child-friendly step-by-step explanations
app.post("/api/gemini/explain", async (req, res) => {
  const { question, category, grade, correctAnswer, selectedAnswer, isCorrect, language = "en" } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const prompt = `You are an encouraging cartoon Math Owl named Owl-bert, teaching Grade 3-4 students.
The student just answered a word problem.
Status: ${isCorrect ? "Correct! Celebrate their success warmly." : `Incorrect. (They chose "${selectedAnswer}", but the correct answer is "${correctAnswer}"). Encourage them and guide them step-by-step.`}

Please provide a highly clear, beautiful, step-by-step math explanation.
1. Guide them using the Singapore Math Bar Model or Segment Diagram method if applicable. Describe what blocks/segments to draw.
2. Show the calculations clearly with headers (Step 1, Step 2, etc.).
3. Write in simple, fun, clear, child-friendly terms suitable for 8-10 year olds.
4. Keep the tone warm, comforting, and motivating.
5. Respond in ${language === "vi" ? "Vietnamese (Tiếng Việt)" : "English"}.

Problem details:
- Category: ${category || "Word Problem"}
- Problem: "${question}"
- Correct Answer: "${correctAnswer}"`;

  try {
    if (!ai) {
      // Fallback
      const fallbackVI = `🦉 Hợp tác cùng Thầy Cú! Để giải bài toán này:
1. Hãy vẽ sơ đồ tóm tắt bằng các khối màu sắc.
2. Bài toán cho biết đáp số đúng là: ${correctAnswer}.
3. Từng bước tính: Hãy phân tích kỹ đề bài xem số lớn gấp mấy lần số bé, rồi tìm hiệu số phần bằng nhau nhé! Bạn rất thông minh!`;
      const fallbackEN = `🦉 Hoot! Let's solve it together:
1. Draw a visual bar model.
2. The correct answer is: ${correctAnswer}.
3. Step-by-step: Identify how many units represent the quantities, find the difference in parts, and compute. Great effort!`;
      return res.json({ explanation: language === "vi" ? fallbackVI : fallbackEN, isFallback: true });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.6,
      },
    });

    res.json({ explanation: response.text || "Nice attempt! Review your steps and try again." });
  } catch (error: any) {
    console.error("Gemini Explain Error:", error);
    res.status(500).json({ error: "Failed to generate explanation", details: error.message });
  }
});

// API Endpoint to generate a brand new math word problem dynamically
app.post("/api/gemini/generate-problem", async (req, res) => {
  const { topic, grade = 3, difficulty = "Hard" } = req.body;

  const prompt = `Generate a high-quality, advanced math word problem for Grade ${grade} or ${grade + 1} students (Singapore Math / Olympiad preparation level).
The topic should be related to: "${topic || "Fractions and Models"}".
The problem must be in English. Provide a JSON response that conforms to the specified schema.

Ensure the problem is exciting, featuring kid-friendly themes (dragons, candies, school clubs, spaceship, magical creatures).
Make sure it has a structured solution.

Provide:
1. "questionEn": The problem text in English.
2. "questionVi": A high-quality translation of the problem into Vietnamese (for learning support).
3. "type": One of "mcq" (multiple choice), "short_answer" (requires a number), "true_false", or "fill_blank".
4. "options": If "mcq", an array of 4 choices. If "true_false", exactly ["True", "False"]. For other types, leave empty or null.
5. "correctAnswer": The correct option string (e.g., "150 stickers") or exact numeric value (e.g. "25") or "True"/"False" as string.
6. "category": Topic category.
7. "difficulty": "Olympiad" or "Hard".
8. "grade": The grade (3 or 4).
9. "hintEn": Simple hint in English (Singapore model block representation).
10. "hintVi": Simple hint in Vietnamese.
11. "explanationEn": Step-by-step Singapore model block explanation in English.
12. "explanationVi": Step-by-step Singapore model block explanation in Vietnamese.
13. "fillBlankParts": Only if "fill_blank", an array of 2-3 parts of a sentence split by the blank, e.g. ["The magical tree has ", " golden apples left."]. The correct answer should fit in between.

Return strictly a single JSON object.`;

  try {
    if (!ai) {
      // Return a nice pre-baked dynamic problem in case API key is missing
      const prebakedProblems = [
        {
          id: 101,
          type: "mcq",
          category: "Model Method",
          difficulty: "Olympiad",
          grade: 4,
          questionEn: "Sherlock Owl and Watson Cat have 160 magic acorns. If Watson Cat gives 20 acorns to Sherlock Owl, Sherlock Owl will have 3 times as many acorns as Watson Cat. How many acorns did Watson Cat have at first?",
          questionVi: "Thầy Cú Sherlock và Mèo Watson có tổng cộng 160 quả sồi ma thuật. Nếu Mèo Watson cho Thầy Cú Sherlock 20 quả sồi, Thầy Cú Sherlock sẽ có số quả sồi gấp 3 lần Mèo Watson. Hỏi lúc đầu Mèo Watson có bao nhiêu quả sồi?",
          options: ["40 acorns", "60 acorns", "80 acorns", "100 acorns"],
          correctAnswer: "60 acorns",
          hintEn: "Draw a bar model. After the transfer, the total acorns is still 160. Watson has 1 unit, and Sherlock has 3 units. Total is 4 units.",
          hintVi: "Vẽ sơ đồ đoạn thẳng. Sau khi cho, tổng số quả sồi vẫn là 160. Mèo Watson có 1 phần, Thầy Cú Sherlock có 3 phần. Tổng cộng là 4 phần.",
          explanationEn: "1. Total units = 1 + 3 = 4 units.\n2. Value of 1 unit = 160 / 4 = 40 acorns.\n3. After giving, Watson Cat has 40 acorns.\n4. Originally, Watson Cat had = 40 + 20 = 60 acorns.",
          explanationVi: "1. Tổng số phần bằng nhau = 1 + 3 = 4 phần.\n2. Giá trị của 1 phần = 160 / 4 = 40 quả sồi.\n3. Sau khi cho, Mèo Watson còn lại 40 quả sồi.\n4. Lúc đầu Mèo Watson có: 40 + 20 = 60 quả sồi."
        },
        {
          id: 102,
          type: "short_answer",
          category: "Fractions",
          difficulty: "Hard",
          grade: 3,
          questionEn: "A magical unicorn ate 2/5 of a batch of cookies. Then, she ate 6 more cookies. If she has 9 cookies left, how many cookies were in the batch originally?",
          questionVi: "Một chú kỳ lân ma thuật đã ăn 2/5 khay bánh quy. Sau đó, chú ăn thêm 6 cái bánh nữa. Nếu chú còn lại 9 cái bánh, hỏi lúc đầu có bao nhiêu cái bánh quy trong khay?",
          options: [],
          correctAnswer: "25",
          hintEn: "Think backward! The cookies left (9) plus the 6 cookies represents the remaining 3/5 of the cookies.",
          hintVi: "Hãy tính ngược từ dưới lên! Số bánh còn lại (9) cộng với 6 cái bánh đã ăn thêm chính là giá trị của 3/5 số bánh còn lại sau lần đầu.",
          explanationEn: "1. 3/5 of the batch equals 9 + 6 = 15 cookies.\n2. 1/5 of the batch is 15 / 3 = 5 cookies.\n3. The original batch size (5/5) is 5 * 5 = 25 cookies.",
          explanationVi: "1. 3/5 khay bánh tương ứng với: 9 + 6 = 15 cái bánh.\n2. 1/5 khay bánh tương ứng với: 15 / 3 = 5 cái bánh.\n3. Số bánh ban đầu (5/5) là: 5 * 5 = 25 cái bánh."
        }
      ];
      const randomPrebaked = prebakedProblems[Math.floor(Math.random() * prebakedProblems.length)];
      return res.json(randomPrebaked);
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questionEn: { type: Type.STRING },
            questionVi: { type: Type.STRING },
            type: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            grade: { type: Type.INTEGER },
            hintEn: { type: Type.STRING },
            hintVi: { type: Type.STRING },
            explanationEn: { type: Type.STRING },
            explanationVi: { type: Type.STRING },
            fillBlankParts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "questionEn",
            "questionVi",
            "type",
            "correctAnswer",
            "category",
            "difficulty",
            "grade",
            "hintEn",
            "hintVi",
            "explanationEn",
            "explanationVi",
          ],
        },
        temperature: 0.8,
      },
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Gemini Generate Error:", error);
    res.status(500).json({ error: "Failed to generate problem", details: error.message });
  }
});

// Configure Vite middleware or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Run in development mode with Vite HMR
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as middleware.");
  } else {
    // Run in production serving dist/ folder
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static server configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server listening on http://localhost:${PORT}`);
  });
}

startServer();
