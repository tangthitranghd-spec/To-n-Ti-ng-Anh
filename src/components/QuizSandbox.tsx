import React, { useState } from "react";
import { Sparkles, Play, CheckCircle, XCircle, AlertCircle, RefreshCw, Layers, ArrowRight, HelpCircle, FileText, Languages } from "lucide-react";
import Scratchpad from "./Scratchpad";
import AIHelper from "./AIHelper";

interface GeneratedQuestion {
  questionEn: string;
  questionVi: string;
  type: "mcq" | "short_answer" | "true_false" | "fill_blank";
  options?: string[];
  correctAnswer: string;
  category: string;
  difficulty: "Hard" | "Olympiad";
  grade: number;
  hintEn: string;
  hintVi: string;
  explanationEn: string;
  explanationVi: string;
  fillBlankParts?: string[];
}

interface QuizSandboxProps {
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
}

export default function QuizSandbox({ score, setScore }: QuizSandboxProps) {
  const [topic, setTopic] = useState("Model Method");
  const [grade, setGrade] = useState(3);
  const [difficulty, setDifficulty] = useState<"Hard" | "Olympiad">("Hard");
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<GeneratedQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [aiExplainLang, setAiExplainLang] = useState<"en" | "vi">("en");

  const topics = [
    "Model Method",
    "Fractions & Ratios",
    "Intervals & Spacing",
    "Age Problems",
    "Excess & Deficit",
    "Money & Cost",
    "Time & Calendar",
    "Logic & Brain Teasers",
    "Area & Perimeter",
    "Speed & Work",
    "Combinatorics",
  ];

  const generateProblem = async () => {
    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelectedAnswer("");
    setTypedAnswer("");
    setSubmitted(false);
    setIsCorrect(null);
    try {
      const res = await fetch("/api/gemini/generate-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, grade, difficulty }),
      });
      if (!res.ok) {
        throw new Error("Failed to generate problem from AI");
      }
      const data = await res.json();
      if (!data.questionEn) {
        throw new Error("Invalid response schema from AI");
      }
      setQuestion(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate custom problem. Please check your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (!question) return;

    let ans = "";
    if (question.type === "mcq" || question.type === "true_false") {
      ans = selectedAnswer;
    } else {
      ans = typedAnswer.trim();
    }

    if (!ans) return;

    // Perform check
    const correctAns = question.correctAnswer.toLowerCase().trim();
    const userAns = ans.toLowerCase().trim();

    // Check if correct (with basic fuzzy tolerance for strings/units)
    const checkIsCorrect = userAns === correctAns || 
      userAns.replace(/[^0-9]/g, "") === correctAns.replace(/[^0-9]/g, "") ||
      (correctAns.includes(userAns) && userAns.length > 2);

    setIsCorrect(checkIsCorrect);
    setSubmitted(true);
    if (checkIsCorrect) {
      setScore((prev) => prev + 15); // Reward higher points for custom generated problems!
    }
  };

  return (
    <div className="bg-white rounded-3xl border-4 border-purple-100 p-6 shadow-xl max-w-4xl mx-auto" id="sandbox-panel">
      {/* Title */}
      <div className="text-center mb-6">
        <span className="bg-purple-100 text-purple-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
          AI Problem Sandbox (Khu Luyện Tập Vô Hạn)
        </span>
        <h2 className="text-3xl font-black text-purple-900 mt-2 flex items-center justify-center gap-2">
          <Sparkles className="text-purple-600 fill-purple-300 animate-spin" size={28} />
          <span>Infinite Custom Math Challenges</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Pick a topic and let Owl-bert generate a brand new advanced word problem just for you!
        </p>
      </div>

      {/* Sandbox Configurator */}
      <div className="bg-purple-50/50 rounded-2xl border border-purple-100 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Topic dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-purple-800 uppercase tracking-wider">Select Topic</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full bg-white border border-purple-200 text-slate-700 text-xs rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-purple-400 font-medium"
            id="sandbox-topic-select"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Grade Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-purple-800 uppercase tracking-wider">Grade Level</label>
          <div className="grid grid-cols-2 gap-1 bg-white border border-purple-200 rounded-xl p-1">
            <button
              onClick={() => setGrade(3)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                grade === 3 ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              id="sandbox-grade-3-btn"
            >
              Grade 3
            </button>
            <button
              onClick={() => setGrade(4)}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                grade === 4 ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              id="sandbox-grade-4-btn"
            >
              Grade 4
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-purple-800 uppercase tracking-wider">Difficulty</label>
          <div className="grid grid-cols-2 gap-1 bg-white border border-purple-200 rounded-xl p-1">
            <button
              onClick={() => setDifficulty("Hard")}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                difficulty === "Hard" ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              id="sandbox-difficulty-hard"
            >
              Hard
            </button>
            <button
              onClick={() => setDifficulty("Olympiad")}
              className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                difficulty === "Olympiad" ? "bg-purple-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
              id="sandbox-difficulty-olympiad"
            >
              Olympiad
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={generateProblem}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white disabled:opacity-50 transition-colors py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg"
            id="sandbox-generate-btn"
          >
            {loading ? <RefreshCw className="animate-spin" size={14} /> : <Play size={14} />}
            <span>{loading ? "Generating..." : "Generate Challenge"}</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Workspace */}
      {error && (
        <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100 text-sm mb-6">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative mb-4">
            <Sparkles className="animate-spin text-purple-500 absolute -top-4 -right-4" size={24} />
            <div className="text-6xl animate-bounce">🦉✍️</div>
          </div>
          <h3 className="text-lg font-bold text-purple-900">Owl-bert is composing a custom math quest...</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-sm">
            Drawing bar blocks, writing word problems, and translating calculations to make learning beautiful!
          </p>
        </div>
      )}

      {!loading && !question && !error && (
        <div className="border-2 border-dashed border-purple-200 rounded-2xl py-12 px-6 text-center bg-purple-50/20">
          <Layers className="text-purple-300 mx-auto mb-3" size={48} />
          <h3 className="font-bold text-purple-900 text-base">Select your topic above and hit "Generate Challenge"</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
            You will receive a custom Grade 3 or 4 English word problem designed to improve logical model drawing and advanced deduction skills.
          </p>
        </div>
      )}

      {question && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Solving Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Question Card */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 relative">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wide">
                    {question.category}
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wide">
                    {question.difficulty}
                  </span>
                </div>
                
                {/* Language switch */}
                <button
                  onClick={() => setLang((l) => (l === "en" ? "vi" : "en"))}
                  className="bg-white hover:bg-slate-100 border border-slate-300 transition-colors py-1 px-2 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-sm"
                  title="Translate Question"
                  id="sandbox-question-lang-toggle"
                >
                  <Languages size={10} />
                  <span>{lang === "en" ? "Translate to Vi" : "Xem Tiếng Anh"}</span>
                </button>
              </div>

              <div className="space-y-3">
                {lang === "en" ? (
                  <h3 className="text-slate-800 font-extrabold text-sm leading-relaxed select-text">
                    {question.questionEn}
                  </h3>
                ) : (
                  <h3 className="text-indigo-900 font-extrabold text-sm leading-relaxed select-text italic">
                    {question.questionVi}
                  </h3>
                )}
              </div>
            </div>

            {/* Answer Controls */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
              <h4 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-wider">Your Answer</h4>
              
              {/* MCQ format */}
              {(question.type === "mcq" || question.type === "true_false") && question.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      disabled={submitted}
                      onClick={() => setSelectedAnswer(option)}
                      className={`py-3 px-4 rounded-xl border-2 text-left font-bold text-xs transition-all cursor-pointer flex items-center justify-between ${
                        selectedAnswer === option
                          ? "bg-purple-100 border-purple-500 text-purple-900"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                      id={`sandbox-opt-${option}`}
                    >
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Short Answer / Fill Blank format */}
              {(question.type === "short_answer" || question.type === "fill_blank") && (
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    disabled={submitted}
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                    placeholder={
                      question.type === "fill_blank"
                        ? "Type missing word/number..."
                        : "Type exact final number..."
                    }
                    className="w-full bg-white border-2 border-slate-200 focus:border-purple-500 rounded-xl px-4 py-2 text-sm outline-none font-bold text-slate-800"
                    id="sandbox-answer-input"
                  />
                </div>
              )}

              {/* Submit Controls */}
              {!submitted ? (
                <button
                  onClick={handleAnswerSubmit}
                  disabled={
                    (question.type === "mcq" || question.type === "true_false" ? !selectedAnswer : !typedAnswer)
                  }
                  className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow-md"
                  id="sandbox-submit-btn"
                >
                  <span>Submit Answer</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  {isCorrect ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold">
                      <CheckCircle className="text-emerald-600 shrink-0" size={18} />
                      <div>
                        <span>Correct! Hoot! You've earned 15 custom points!</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold">
                      <XCircle className="text-rose-600 shrink-0" size={18} />
                      <div>
                        <span>Incorrect. The correct answer was "{question.correctAnswer}". No worries, try reviewing with Owl-bert!</span>
                      </div>
                    </div>
                  )}

                  {/* Built-in local explanation */}
                  <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-200">
                      <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                        <FileText size={12} className="text-purple-600" />
                        <span>Explanation Guide</span>
                      </h5>
                      <button
                        onClick={() => setLang((l) => (l === "en" ? "vi" : "en"))}
                        className="text-[9px] font-bold text-purple-700 underline cursor-pointer"
                        id="explanation-toggle-lang"
                      >
                        {lang === "en" ? "Xem Tiếng Việt" : "See English"}
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed select-text">
                      {lang === "en" ? question.explanationEn : question.explanationVi}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Local Scratchpad integration for drawing */}
            <Scratchpad />
          </div>

          {/* AI Helper Column */}
          <div>
            <AIHelper
              question={question.questionEn}
              category={question.category}
              grade={question.grade}
              correctAnswer={question.correctAnswer}
              selectedAnswer={question.type === "mcq" || question.type === "true_false" ? selectedAnswer : typedAnswer}
              isCorrect={isCorrect}
              language={aiExplainLang}
              onLanguageToggle={() => setAiExplainLang((l) => (l === "en" ? "vi" : "en"))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
