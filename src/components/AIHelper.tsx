import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, AlertCircle, RefreshCw, Languages, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AIHelperProps {
  question: string;
  category: string;
  grade: number;
  correctAnswer: string;
  selectedAnswer: string;
  isCorrect: boolean | null;
  language: "en" | "vi";
  onLanguageToggle: () => void;
}

export default function AIHelper({
  question,
  category,
  grade,
  correctAnswer,
  selectedAnswer,
  isCorrect,
  language,
  onLanguageToggle,
}: AIHelperProps) {
  const [hint, setHint] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owlEmotion, setOwlEmotion] = useState<"neutral" | "happy" | "thinking" | "sad">("neutral");

  // Reset hints and explanations when the question changes
  useEffect(() => {
    setHint(null);
    setExplanation(null);
    setError(null);
    setOwlEmotion(isCorrect === true ? "happy" : isCorrect === false ? "sad" : "neutral");
  }, [question, isCorrect]);

  const requestHint = async () => {
    setLoading(true);
    setError(null);
    setOwlEmotion("thinking");
    try {
      const response = await fetch("/api/gemini/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, category, grade, language }),
      });
      if (!response.ok) {
        throw new Error("Failed to reach AI server");
      }
      const data = await response.json();
      setHint(data.hint);
      setOwlEmotion("happy");
    } catch (err: any) {
      console.error(err);
      setError(language === "vi" ? "Ôi hỏng! Thầy Cú chưa kết nối được với rừng tri thức. Thử lại sau nhé!" : "Hoot! I couldn't reach the magical library. Please try again!");
      setOwlEmotion("neutral");
    } finally {
      setLoading(false);
    }
  };

  const requestExplanation = async () => {
    setLoading(true);
    setError(null);
    setOwlEmotion("thinking");
    try {
      const response = await fetch("/api/gemini/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          category,
          grade,
          correctAnswer,
          selectedAnswer,
          isCorrect: isCorrect || false,
          language,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to reach AI server");
      }
      const data = await response.json();
      setExplanation(data.explanation);
      setOwlEmotion("happy");
    } catch (err: any) {
      console.error(err);
      setError(language === "vi" ? "Không thể tải hướng dẫn giải lúc này. Thử lại nhé!" : "Could not load the step-by-step solving steps. Please try again!");
      setOwlEmotion("neutral");
    } finally {
      setLoading(false);
    }
  };

  // Get Owl emoticon/avatar depending on state
  const getOwlAvatar = () => {
    switch (owlEmotion) {
      case "happy":
        return "🦉✨";
      case "thinking":
        return "🦉🧠";
      case "sad":
        return "🦉💡";
      default:
        return "🦉🎓";
    }
  };

  const formatText = (text: string) => {
    return text.split("\n").map((line, index) => (
      <p key={index} className="mb-1.5 leading-relaxed text-slate-700">
        {line}
      </p>
    ));
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-4 shadow-md" id="ai-helper-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-pulse">{getOwlAvatar()}</span>
          <div>
            <h4 className="font-extrabold text-indigo-900 text-sm flex items-center gap-1">
              <span>Owl-bert AI Coach</span>
              <Sparkles className="text-yellow-500 fill-yellow-400" size={13} />
            </h4>
            <p className="text-[10px] text-indigo-700/80 font-medium">Your Singapore Math Mentor</p>
          </div>
        </div>

        {/* Translation Option */}
        <button
          onClick={onLanguageToggle}
          className="bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 transition-colors py-1 px-2.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm"
          title="Toggle Language (Đổi Ngôn Ngữ Giải Thích)"
          id="ai-lang-toggle"
        >
          <Languages size={12} />
          <span>{language === "en" ? "Tiếng Việt" : "English"}</span>
        </button>
      </div>

      {/* Bubble Chat Owl-bert */}
      <div className="relative bg-white border border-indigo-100 rounded-2xl p-3.5 mb-4 shadow-sm">
        <div className="absolute top-3 -left-2 w-3 h-3 bg-white border-l border-b border-indigo-100 transform rotate-45" />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <RefreshCw className="animate-spin text-indigo-500 mb-2" size={24} />
            <p className="text-xs font-semibold text-indigo-700 animate-pulse">
              {language === "vi" ? "Thầy Cú đang giải toán..." : "Owl-bert is thinking hard..."}
            </p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-xs">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : explanation ? (
          <div className="text-xs">
            <div className="font-bold text-indigo-900 mb-2 flex items-center gap-1.5 border-b border-indigo-50 pb-1">
              <MessageSquare size={13} />
              <span>{language === "vi" ? "Lời giải Chi Tiết:" : "Step-by-step Guide:"}</span>
            </div>
            <div className="max-h-60 overflow-y-auto pr-1 select-text scrollbar-thin">
              {formatText(explanation)}
            </div>
          </div>
        ) : hint ? (
          <div className="text-xs">
            <div className="font-bold text-amber-800 mb-1.5 flex items-center gap-1.5">
              <HelpCircle size={13} className="text-amber-600" />
              <span>{language === "vi" ? "Gợi ý của Thầy Cú:" : "Owl-bert's Clue:"}</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-slate-700 leading-relaxed select-text">
              {formatText(hint)}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-600 leading-relaxed">
            {language === "vi" 
              ? "Chào bạn nhỏ! Mình là Thầy Cú Owl-bert. Nếu gặp bài toán khó chưa rõ cách vẽ sơ đồ thanh (bar model), hãy bấm nút dưới để nhận gợi ý hoặc xem lời giải nha! 🦉✨" 
              : "Hoot! Hello friend! I'm Owl-bert. Stuck on this question or need help drawing a bar model diagram? Ask me below for a magical hint! 🦉✨"}
          </p>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex gap-2">
        <button
          onClick={requestHint}
          disabled={loading}
          className="flex-1 bg-white hover:bg-amber-50 active:bg-amber-100 text-amber-800 border-2 border-amber-300 disabled:opacity-50 transition-colors py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          id="btn-ai-hint"
        >
          <HelpCircle size={13} />
          <span>{language === "vi" ? "Xin Gợi Ý AI" : "Get AI Hint"}</span>
        </button>

        <button
          onClick={requestExplanation}
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white disabled:opacity-50 transition-colors py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer shadow-md hover:shadow-lg"
          id="btn-ai-explain"
        >
          <Sparkles size={13} />
          <span>{language === "vi" ? "Xem Lời Giải AI" : "Explain Step-by-step"}</span>
        </button>
      </div>
    </div>
  );
}
