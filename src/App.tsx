import React, { useState, useEffect } from "react";
import {
  Compass, Map, Trophy, Star, Award, Flame, Zap, Sparkles, Play, ArrowRight,
  RotateCcw, HelpCircle, CheckCircle, XCircle, AlertCircle, Languages, User,
  Volume2, VolumeX, BookOpen, ChevronLeft, ChevronRight,
  GraduationCap, Heart, Check, Trash2, HelpCircle as QuestionIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { questionBank, Question } from "./data/questions";
import Scratchpad from "./components/Scratchpad";
import ReportCard from "./components/ReportCard";
import AIHelper from "./components/AIHelper";
import QuizSandbox from "./components/QuizSandbox";

const AVATARS = [
  { id: "owl", emoji: "🦉", name: "Sherlock Owl" },
  { id: "unicorn", emoji: "🦄", name: "Unicorn Spark" },
  { id: "rabbit", emoji: "🐰", name: "Astro Rabbit" },
  { id: "dragon", emoji: "🐲", name: "Dino Math" },
  { id: "panda", emoji: "🐼", name: "Math Panda" },
];

export default function App() {
  // State variables
  const [profileName, setProfileName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [isProfileCreated, setIsProfileCreated] = useState(false);

  // Game Progress State
  const [score, setScore] = useState(0);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [solvedCount, setSolvedCount] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [categoryStats, setCategoryStats] = useState<Record<string, { total: number; correct: number }>>({});

  // Active Screen / Navigation State
  const [activeTab, setActiveTab] = useState<"map" | "sandbox" | "report">("map");
  const [currentStageId, setCurrentStageId] = useState<number | null>(null);

  // Active Question State
  const [questionLang, setQuestionLang] = useState<"en" | "vi">("en");
  const [aiExplainLang, setAiExplainLang] = useState<"en" | "vi">("en");
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Game UI/UX Setting
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    const save = localStorage.getItem("math_quest_save_v2");
    if (save) {
      try {
        const parsed = JSON.parse(save);
        if (parsed.profileName) setProfileName(parsed.profileName);
        if (parsed.selectedAvatar) {
          const matched = AVATARS.find((a) => a.id === parsed.selectedAvatar.id);
          if (matched) setSelectedAvatar(matched);
        }
        if (parsed.score !== undefined) setScore(parsed.score);
        if (parsed.completedStages) setCompletedStages(parsed.completedStages);
        if (parsed.solvedCount !== undefined) setSolvedCount(parsed.solvedCount);
        if (parsed.correctAnswersCount !== undefined) setCorrectAnswersCount(parsed.correctAnswersCount);
        if (parsed.streak !== undefined) setStreak(parsed.streak);
        if (parsed.maxStreak !== undefined) setMaxStreak(parsed.maxStreak);
        if (parsed.categoryStats) setCategoryStats(parsed.categoryStats);
        setIsProfileCreated(true);
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  // Save state whenever progress changes
  useEffect(() => {
    if (isProfileCreated) {
      const saveData = {
        profileName,
        selectedAvatar,
        score,
        completedStages,
        solvedCount,
        correctAnswersCount,
        streak,
        maxStreak,
        categoryStats,
      };
      localStorage.setItem("math_quest_save_v2", JSON.stringify(saveData));
    }
  }, [
    isProfileCreated,
    profileName,
    selectedAvatar,
    score,
    completedStages,
    solvedCount,
    correctAnswersCount,
    streak,
    maxStreak,
    categoryStats,
  ]);

  // Audio simulator (plays HTML5 synthesized sounds or logs)
  const playSound = (type: "correct" | "incorrect" | "click" | "unlock") => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "correct") {
        // High double-beep for success
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === "incorrect") {
        // Lower sliding sound for failure
        osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.3);
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === "click") {
        // Soft click
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === "unlock") {
        // Rising frequency cascade
        osc.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.frequency.linearRampToValueAtTime(523.25, audioCtx.currentTime + 0.4);
        osc.stop(audioCtx.currentTime + 0.45);
      }
    } catch (e) {
      console.warn("AudioContext not supported by iframe sandbox boundaries", e);
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setIsProfileCreated(true);
    playSound("unlock");
  };

  const resetAllProgress = () => {
    if (confirm("Are you sure you want to reset all game progress? This cannot be undone!")) {
      localStorage.removeItem("math_quest_save_v2");
      setProfileName("");
      setSelectedAvatar(AVATARS[0]);
      setIsProfileCreated(false);
      setScore(0);
      setCompletedStages([]);
      setSolvedCount(0);
      setCorrectAnswersCount(0);
      setStreak(0);
      setMaxStreak(0);
      setCategoryStats({});
      setCurrentStageId(null);
      setActiveTab("map");
    }
  };

  // Stage details mapping
  const activeQuestion = currentStageId ? questionBank.find((q) => q.id === currentStageId) : null;

  // Determine Worlds
  const getWorldByStageId = (id: number) => {
    if (id <= 8) return { name: "Model Meadows", bg: "from-emerald-50 to-teal-100", border: "border-emerald-300", badge: "🟢 Meadows" };
    if (id <= 16) return { name: "Fraction Forest", bg: "from-blue-50 to-indigo-100", border: "border-blue-300", badge: "🔵 Forest" };
    if (id <= 24) return { name: "Logic Lagoon", bg: "from-purple-50 to-fuchsia-100", border: "border-purple-300", badge: "🟣 Lagoon" };
    return { name: "Olympiad Orbit", bg: "from-amber-50 to-orange-100", border: "border-amber-300", badge: "👑 Orbit" };
  };

  // Submit Answer Action
  const submitAnswer = () => {
    if (!activeQuestion) return;

    let ans = "";
    if (activeQuestion.type === "mcq" || activeQuestion.type === "true_false") {
      ans = selectedAnswer;
    } else {
      ans = typedAnswer.trim();
    }

    if (!ans) return;

    const correctAns = activeQuestion.correctAnswer.toLowerCase().trim();
    const userAns = ans.toLowerCase().trim();

    // Check exact or numerical match
    const checkIsCorrect =
      userAns === correctAns ||
      userAns.replace(/[^0-9]/g, "") === correctAns.replace(/[^0-9]/g, "");

    setIsCorrect(checkIsCorrect);
    setSubmitted(true);
    setSolvedCount((p) => p + 1);

    // Update Category Statistics
    const cat = activeQuestion.category;
    setCategoryStats((prev) => {
      const current = prev[cat] || { total: 0, correct: 0 };
      return {
        ...prev,
        [cat]: {
          total: current.total + 1,
          correct: current.correct + (checkIsCorrect ? 1 : 0),
        },
      };
    });

    if (checkIsCorrect) {
      playSound("correct");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      setCorrectAnswersCount((p) => p + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) {
        setMaxStreak(newStreak);
      }

      // Add points
      setScore((p) => p + 10);

      // Complete stage
      if (!completedStages.includes(activeQuestion.id)) {
        setCompletedStages((p) => [...p, activeQuestion.id]);
      }
    } else {
      playSound("incorrect");
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 500);
      setStreak(0);
    }
  };

  const nextStage = () => {
    setSelectedAnswer("");
    setTypedAnswer("");
    setSubmitted(false);
    setIsCorrect(null);
    if (currentStageId && currentStageId < 30) {
      setCurrentStageId(currentStageId + 1);
      playSound("click");
    } else {
      setCurrentStageId(null);
      setActiveTab("map");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-slate-100 font-sans" id="app-root-container">
      {/* Background Floating stars simulation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping" />
        <div className="absolute top-1/4 right-20 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping [animation-delay:1s]" />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-blue-300 rounded-full animate-ping [animation-delay:2s]" />
        <div className="absolute bottom-10 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping [animation-delay:3s]" />
      </div>

      {/* HEADER BAR */}
      <header className="border-b border-indigo-900 bg-indigo-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3 shadow-lg" id="app-header">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentStageId(null); setActiveTab("map"); }}>
            <span className="text-3xl">🦉</span>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent flex items-center gap-1.5">
                <span>MATH QUEST</span>
                <Sparkles className="text-yellow-400" size={16} />
              </h1>
              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-extrabold leading-none">Advanced Grade 3-4</p>
            </div>
          </div>

          {/* User profile & score summary */}
          {isProfileCreated && (
            <div className="flex flex-wrap items-center gap-4 bg-indigo-900/40 px-4 py-2 rounded-2xl border border-indigo-800 shadow-inner" id="profile-status">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedAvatar.emoji}</span>
                <div className="text-xs">
                  <div className="font-bold text-slate-100">{profileName}</div>
                  <div className="text-[10px] text-indigo-300">Level {Math.floor(score / 50) + 1} Explorer</div>
                </div>
              </div>

              {/* Stats values */}
              <div className="flex items-center gap-3 border-l border-indigo-800 pl-3">
                {/* Score */}
                <div className="text-center" title="Your practice points">
                  <div className="text-[9px] text-indigo-300 font-extrabold uppercase">Points</div>
                  <div className="text-sm font-black text-yellow-300 flex items-center justify-center gap-0.5">
                    <Trophy size={12} className="text-yellow-400" />
                    <span>{score}</span>
                  </div>
                </div>

                {/* Streak */}
                <div className="text-center" title="Current streak">
                  <div className="text-[9px] text-indigo-300 font-extrabold uppercase">Streak</div>
                  <div className="text-sm font-black text-orange-400 flex items-center justify-center gap-0.5">
                    <Flame size={12} className="text-orange-500 animate-pulse" />
                    <span>{streak}🔥</span>
                  </div>
                </div>

                {/* Completed */}
                <div className="text-center" title="Completed Stages">
                  <div className="text-[9px] text-indigo-300 font-extrabold uppercase">Progress</div>
                  <div className="text-sm font-black text-sky-400">
                    {completedStages.length}/30
                  </div>
                </div>
              </div>

              {/* Utility buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => setSoundEnabled((s) => !s)}
                  className="p-1 rounded-lg bg-indigo-800/60 hover:bg-indigo-700/80 transition-colors text-indigo-200"
                  title="Toggle sound"
                  id="sound-toggle-btn"
                >
                  {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button
                  onClick={resetAllProgress}
                  className="p-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 transition-colors text-rose-300"
                  title="Reset Game Data"
                  id="reset-data-btn"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* CORE CONTENT ROUTING */}
      <main className="max-w-7xl mx-auto px-4 py-6" id="main-content-layout">
        <AnimatePresence mode="wait">
          {/* PROFILE CREATOR SCREEN */}
          {!isProfileCreated ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-md mx-auto bg-slate-900 border-4 border-indigo-800 p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden"
              id="profile-creator-panel"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />

              <span className="text-5xl block animate-bounce mb-3">🦉</span>
              <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                Create Your Explorer Profile!
              </h2>
              <p className="text-xs text-indigo-200 mt-1.5 mb-6 leading-relaxed">
                Welcome to Math Quest! Ready to solve advanced word problems, draw models, and earn badges on the math island? Create your account first.
              </p>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Enter name */}
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Your Name / Tên của bạn</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="E.g., Tommy, Luna, Bảo..."
                    className="w-full bg-slate-950 border-2 border-indigo-800 focus:border-yellow-400 text-white rounded-xl py-2.5 px-4 outline-none font-bold text-sm"
                    id="profile-name-input"
                  />
                </div>

                {/* Avatar selection */}
                <div className="text-left space-y-2">
                  <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest pl-1">Choose Companion / Chọn bạn đồng hành</label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => { setSelectedAvatar(av); playSound("click"); }}
                        className={`py-2 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer flex flex-col items-center justify-center bg-slate-950 ${
                          selectedAvatar.id === av.id
                            ? "border-yellow-400 bg-indigo-950 scale-105"
                            : "border-indigo-900"
                        }`}
                        id={`avatar-sel-${av.id}`}
                      >
                        <span className="text-2xl">{av.emoji}</span>
                        <span className="text-[8px] font-bold text-indigo-200 mt-1 leading-none text-center">
                          {av.name.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-3 rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer text-sm"
                  id="submit-profile-btn"
                >
                  <span>Start Adventure (Bắt đầu học ngay)</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>
          ) : (
            // MAIN LOGGED-IN WORKSPACE
            <div className="space-y-6" id="game-workspace">
              {/* NAVIGATION TABS (Single Screen view) */}
              {currentStageId === null && (
                <div className="flex justify-center" id="nav-tabs">
                  <div className="inline-flex bg-indigo-950/60 p-1.5 rounded-2xl border border-indigo-900 gap-1.5">
                    <button
                      onClick={() => { setActiveTab("map"); playSound("click"); }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "map"
                          ? "bg-indigo-600 text-white"
                          : "text-indigo-200 hover:text-white hover:bg-indigo-900/40"
                      }`}
                      id="tab-map-btn"
                    >
                      <Map size={14} />
                      <span>Quest Map (Hành Trình)</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("sandbox"); playSound("click"); }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "sandbox"
                          ? "bg-purple-600 text-white"
                          : "text-purple-200 hover:text-white hover:bg-purple-900/40"
                      }`}
                      id="tab-sandbox-btn"
                    >
                      <Sparkles size={14} />
                      <span>AI Infinite Sandbox (Luyện Tập)</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("report"); playSound("click"); }}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        activeTab === "report"
                          ? "bg-emerald-600 text-white"
                          : "text-emerald-200 hover:text-white hover:bg-emerald-900/40"
                      }`}
                      id="tab-report-btn"
                    >
                      <Trophy size={14} />
                      <span>Report Card (Bảng Điểm)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVE TAB VIEWS */}
              {currentStageId === null ? (
                <>
                  {/* TAB 1: ADVENTURE MAP */}
                  {activeTab === "map" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                      id="map-view-panel"
                    >
                      {/* Game Map Title info */}
                      <div className="text-center max-w-xl mx-auto">
                        <h2 className="text-2xl font-black text-slate-100 flex items-center justify-center gap-2">
                          <Compass className="text-yellow-400 animate-spin" size={24} />
                          <span>Math Island: 30 Advanced Challenges</span>
                        </h2>
                        <p className="text-slate-400 text-xs mt-1.5">
                          Explore the four mathematical worlds. Click any unlocked stage to begin drawing models and solving problems!
                        </p>
                      </div>

                      {/* WORLDS GRID SCENE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* World Definition */}
                        {[
                          { title: "World 1: Model Meadows", desc: "Bar methods & comparison tables", stages: [1, 2, 3, 4, 5, 6, 7, 8], bg: "border-emerald-800 bg-emerald-950/20 text-emerald-300" },
                          { title: "World 2: Fraction Forest", desc: "Fractions, intervals & age logic", stages: [9, 10, 11, 12, 13, 14, 15, 16], bg: "border-blue-800 bg-blue-950/20 text-blue-300" },
                          { title: "World 3: Logic Lagoon", desc: "Excess/deficit, work rate & areas", stages: [17, 18, 19, 20, 21, 22, 23, 24], bg: "border-purple-800 bg-purple-950/20 text-purple-300" },
                          { title: "World 4: Olympiad Orbit", desc: "Ultimate logical puzzles & speeds", stages: [25, 26, 27, 28, 29, 30], bg: "border-amber-800 bg-amber-950/20 text-amber-300" },
                        ].map((world, wIdx) => (
                          <div key={world.title} className={`border-2 rounded-2xl p-4 flex flex-col ${world.bg}`} id={`world-card-${wIdx}`}>
                            <div className="mb-3">
                              <h3 className="font-extrabold text-sm leading-tight text-white">{world.title}</h3>
                              <p className="text-[10px] text-slate-400 mt-0.5">{world.desc}</p>
                            </div>

                            {/* Stages layout inside World (Board Game Nodes) */}
                            <div className="grid grid-cols-4 gap-2.5 mt-auto">
                              {world.stages.map((stId) => {
                                const isCompleted = completedStages.includes(stId);
                                const isUnlocked = stId === 1 || completedStages.includes(stId - 1) || isCompleted;
                                const qData = questionBank.find((q) => q.id === stId);

                                return (
                                  <button
                                    key={stId}
                                    onClick={() => {
                                      if (isUnlocked) {
                                        setCurrentStageId(stId);
                                        setSelectedAnswer("");
                                        setTypedAnswer("");
                                        setSubmitted(false);
                                        setIsCorrect(null);
                                        playSound("click");
                                      }
                                    }}
                                    disabled={!isUnlocked}
                                    className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all relative ${
                                      isCompleted
                                        ? "bg-indigo-600 border-indigo-400 text-white shadow-md hover:scale-105 cursor-pointer"
                                        : isUnlocked
                                        ? "bg-slate-800 border-yellow-400 text-yellow-300 shadow hover:bg-slate-700 hover:scale-105 cursor-pointer"
                                        : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                                    }`}
                                    id={`stage-node-btn-${stId}`}
                                    title={qData ? `${qData.category} - Grade ${qData.grade}` : ""}
                                  >
                                    <span className="text-xs font-black leading-none">{stId}</span>
                                    {isCompleted ? (
                                      <span className="text-[8px] font-bold text-yellow-300 absolute bottom-1 leading-none">★ OK</span>
                                    ) : isUnlocked ? (
                                      <span className="text-[8px] font-bold text-indigo-300 absolute bottom-1 leading-none">GO</span>
                                    ) : (
                                      <span className="text-[10px] absolute bottom-1 leading-none">🔒</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Map Guidelines Tip */}
                      <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-900 text-xs text-slate-400 flex items-start gap-2.5 max-w-2xl mx-auto">
                        <QuestionIcon className="shrink-0 text-indigo-400" size={16} />
                        <div>
                          <p className="font-bold text-slate-300 mb-0.5">How to Play:</p>
                          <p>
                            1. Select Stage 1 to start your quest. Solve the word problem correctly to unlock the next stage.
                          </p>
                          <p className="mt-1">
                            2. Use the **Interactive Scratchpad** to draw bar model blocks—the key to advanced Singapore Math!
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: AI INFINITE SANDBOX */}
                  {activeTab === "sandbox" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      id="sandbox-view-panel"
                    >
                      <QuizSandbox score={score} setScore={setScore} />
                    </motion.div>
                  )}

                  {/* TAB 3: REPORT CARD */}
                  {activeTab === "report" && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      id="report-view-panel"
                    >
                      <ReportCard
                        score={score}
                        solvedCount={solvedCount}
                        correctAnswersCount={correctAnswersCount}
                        streak={streak}
                        maxStreak={maxStreak}
                        categoryStats={categoryStats}
                        onBackToMap={() => setActiveTab("map")}
                      />
                    </motion.div>
                  )}
                </>
              ) : (
                // ACTIVE QUEST SOLVING SCREEN
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                  id="active-quest-panel"
                >
                  {/* Left Column: Word Problem & Scratchpad Workspace */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Header bar controls for stage */}
                    <div className="flex items-center justify-between bg-slate-900 border border-indigo-900 p-3.5 rounded-2xl" id="quest-header-controls">
                      <button
                        onClick={() => { setCurrentStageId(null); playSound("click"); }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors py-1.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm border border-slate-700"
                        id="back-to-map-btn"
                      >
                        <ChevronLeft size={14} />
                        <span>Back to Map (Về Bản Đồ)</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-yellow-400">
                          STAGE {activeQuestion?.id} / 30
                        </span>
                        <span className="bg-indigo-900/60 text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-800">
                          {activeQuestion && getWorldByStageId(activeQuestion.id).badge}
                        </span>
                      </div>
                    </div>

                    {/* Problem Description Card */}
                    {activeQuestion && (
                      <div
                        className={`bg-white border-4 p-5 rounded-3xl relative transition-all duration-300 ${
                          getWorldByStageId(activeQuestion.id).border
                        } ${shakeCard ? "animate-shake ring-2 ring-red-500" : "shadow-xl"}`}
                        id="problem-description-card"
                      >
                        {/* Tags and translation */}
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
                              {activeQuestion.category}
                            </span>
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
                              {activeQuestion.difficulty}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold py-1 px-2.5 rounded-full uppercase tracking-wider">
                              Grade {activeQuestion.grade}
                            </span>
                          </div>

                          {/* Bilingual Switcher */}
                          <button
                            onClick={() => setQuestionLang((l) => (l === "en" ? "vi" : "en"))}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors py-1 px-2.5 rounded-full text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer shadow-sm"
                            title="Translate Problem (Dịch Đề Bài)"
                            id="quest-lang-toggle"
                          >
                            <Languages size={11} />
                            <span>{questionLang === "en" ? "Dịch Đề Bài (Vi)" : "Show English (En)"}</span>
                          </button>
                        </div>

                        {/* Question content */}
                        <div className="space-y-4">
                          {questionLang === "en" ? (
                            <h3 className="text-slate-800 font-extrabold text-base leading-relaxed select-text">
                              {activeQuestion.questionEn}
                            </h3>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-[10px] text-indigo-600 font-extrabold uppercase">Đề bài dịch Tiếng Việt:</span>
                              <h3 className="text-indigo-950 font-extrabold text-base leading-relaxed select-text italic">
                                {activeQuestion.questionVi}
                              </h3>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Answering Form / Choice lists */}
                    {activeQuestion && (
                      <div className="bg-slate-900 border border-indigo-900 p-5 rounded-3xl" id="answering-panel">
                        <h4 className="font-extrabold text-slate-300 text-xs uppercase tracking-widest mb-3">Your Answer / Đáp án của bạn</h4>

                        {/* MCQ Type */}
                        {(activeQuestion.type === "mcq" || activeQuestion.type === "true_false") && activeQuestion.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="mcq-options-grid">
                            {activeQuestion.options.map((option) => (
                              <button
                                key={option}
                                disabled={submitted}
                                onClick={() => setSelectedAnswer(option)}
                                className={`py-3.5 px-5 rounded-2xl border-2 text-left font-extrabold text-xs transition-all cursor-pointer flex items-center justify-between ${
                                  selectedAnswer === option
                                    ? "bg-indigo-600/30 border-indigo-400 text-white shadow-md scale-[1.01]"
                                    : "bg-slate-950 border-indigo-950 text-indigo-200 hover:bg-indigo-900/20"
                                }`}
                                id={`mcq-opt-${option}`}
                              >
                                <span>{option}</span>
                                {selectedAnswer === option && <Check size={14} className="text-yellow-400" />}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Short Answer Type & fallback for Fill Blank with missing parts */}
                        {(activeQuestion.type === "short_answer" || (activeQuestion.type === "fill_blank" && !activeQuestion.fillBlankParts)) && (
                          <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md">
                            <input
                              type="text"
                              disabled={submitted}
                              value={typedAnswer}
                              onChange={(e) => setTypedAnswer(e.target.value)}
                              placeholder="Type final number or answer..."
                              className="w-full bg-slate-950 border-2 border-indigo-900 focus:border-indigo-400 text-white rounded-xl py-3 px-4 outline-none font-bold text-sm"
                              id="short-answer-input"
                            />
                          </div>
                        )}

                        {/* Fill Blanket Type with explicit parts */}
                        {activeQuestion.type === "fill_blank" && activeQuestion.fillBlankParts && (
                          <div className="space-y-3">
                            {/* Visual representation of fill in the blank sentence */}
                            <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-950 text-xs font-medium leading-relaxed text-indigo-200 flex flex-wrap items-center gap-2">
                              <span>{activeQuestion.fillBlankParts[0]}</span>
                              <input
                                type="text"
                                disabled={submitted}
                                value={typedAnswer}
                                onChange={(e) => setTypedAnswer(e.target.value)}
                                placeholder="..."
                                className="bg-indigo-950 border-b-2 border-indigo-400 focus:border-yellow-400 outline-none text-white font-black text-center w-24 py-0.5 px-2"
                                id="fill-blank-sentence-input"
                              />
                              <span>{activeQuestion.fillBlankParts[1]}</span>
                            </div>
                          </div>
                        )}

                        {/* Submit Actions */}
                        {!submitted ? (
                          <button
                            onClick={submitAnswer}
                            disabled={
                              activeQuestion.type === "mcq" || activeQuestion.type === "true_false"
                                ? !selectedAnswer
                                : !typedAnswer
                            }
                            className="mt-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black py-2.5 px-8 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer text-xs"
                            id="submit-answer-btn"
                          >
                            <span>Verify Answer</span>
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          // SUBMITTED STATE: REWARDS & EXPLANATIONS
                          <div className="mt-5 space-y-4" id="feedback-panel">
                            {/* Correct message */}
                            {isCorrect ? (
                              <div className="bg-emerald-950/40 border-2 border-emerald-800 p-4 rounded-2xl flex items-start gap-3">
                                <CheckCircle className="text-emerald-500 shrink-0" size={24} />
                                <div>
                                  <h5 className="font-extrabold text-emerald-300 text-sm">Hoot! Brilliant Work!</h5>
                                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                                    You solved the problem flawlessly. Draw models to understand math perfectly! Earned **+10 Points**.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              // Incorrect message
                              <div className="bg-rose-950/40 border-2 border-rose-800 p-4 rounded-2xl flex items-start gap-3 animate-shake">
                                <XCircle className="text-rose-500 shrink-0" size={24} />
                                <div>
                                  <h5 className="font-extrabold text-rose-300 text-sm">Oops! Almost there!</h5>
                                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                                    That wasn't quite correct. Don't worry, math is all about practicing and learning. See the explanation below!
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Standard Local Diagrammatic explanation */}
                            <div className="bg-indigo-950/40 border border-indigo-800 p-5 rounded-2xl">
                              <div className="flex items-center justify-between border-b border-indigo-900 pb-2 mb-3">
                                <h5 className="font-black text-indigo-300 text-xs uppercase tracking-widest flex items-center gap-1.5">
                                  <BookOpen size={14} />
                                  <span>Model Explanation (Sơ đồ lời giải)</span>
                                </h5>
                                <button
                                  onClick={() => setQuestionLang((l) => (l === "en" ? "vi" : "en"))}
                                  className="text-[9px] font-extrabold text-yellow-400 underline cursor-pointer"
                                  id="explain-lang-switcher"
                                >
                                  {questionLang === "en" ? "Xem Tiếng Việt" : "See English"}
                                </button>
                              </div>

                              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed select-text font-medium">
                                {questionLang === "en"
                                  ? activeQuestion.explanationEn
                                  : activeQuestion.explanationVi}
                              </p>
                            </div>

                            {/* Action navigation */}
                            <div className="flex gap-2 pt-2">
                              {/* If incorrect, let them retry */}
                              {!isCorrect && (
                                <button
                                  onClick={() => {
                                    setSubmitted(false);
                                    setIsCorrect(null);
                                    setSelectedAnswer("");
                                    setTypedAnswer("");
                                    playSound("click");
                                  }}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
                                  id="retry-quest-btn"
                                >
                                  Try Again (Thử Lại)
                                </button>
                              )}

                              <button
                                onClick={nextStage}
                                className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all shadow"
                                id="next-quest-btn"
                              >
                                <span>
                                  {activeQuestion.id === 30
                                    ? "Finish Journey (Hoàn thành)"
                                    : "Next Stage (Cửa tiếp theo)"}
                                </span>
                                <ArrowRight size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Scratchpad */}
                    <Scratchpad />
                  </div>

                  {/* Right Column: AI Coach Helper Assistant (Owl-bert) */}
                  <div className="space-y-4">
                    {activeQuestion && (
                      <AIHelper
                        question={activeQuestion.questionEn}
                        category={activeQuestion.category}
                        grade={activeQuestion.grade}
                        correctAnswer={activeQuestion.correctAnswer}
                        selectedAnswer={activeQuestion.type === "mcq" || activeQuestion.type === "true_false" ? selectedAnswer : typedAnswer}
                        isCorrect={isCorrect}
                        language={aiExplainLang}
                        onLanguageToggle={() => setAiExplainLang((l) => (l === "en" ? "vi" : "en"))}
                      />
                    )}

                    {/* Companion info details */}
                    <div className="bg-slate-900 border border-indigo-900 p-4 rounded-2xl">
                      <h4 className="font-bold text-slate-300 text-xs uppercase tracking-widest mb-2">My Companion</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl animate-bounce">{selectedAvatar.emoji}</span>
                        <div>
                          <p className="font-extrabold text-sm text-yellow-400">{selectedAvatar.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Guiding you step-by-step through advanced Olympiad questions. Good luck!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-indigo-900/40 bg-indigo-950/40 py-6 mt-12 text-center text-xs text-indigo-400/80" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Math Quest: Singapore Math Adventure. Handcrafted for Grades 3 & 4.</p>
          <p className="text-[10px] uppercase tracking-widest font-bold">
            Developed in full-compliance with AI Studio specs
          </p>
        </div>
      </footer>
    </div>
  );
}
