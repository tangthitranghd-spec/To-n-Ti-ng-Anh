import React from "react";
import { Trophy, Star, Award, Target, Flame, Zap, CheckCircle2, ChevronRight, GraduationCap } from "lucide-react";

interface ReportCardProps {
  score: number;
  solvedCount: number;
  correctAnswersCount: number;
  streak: number;
  maxStreak: number;
  categoryStats: Record<string, { total: number; correct: number }>;
  onBackToMap: () => void;
}

export default function ReportCard({
  score,
  solvedCount,
  correctAnswersCount,
  streak,
  maxStreak,
  categoryStats,
  onBackToMap,
}: ReportCardProps) {
  const accuracy = solvedCount > 0 ? Math.round((correctAnswersCount / solvedCount) * 100) : 0;

  // Custom visual badges that kids can unlock
  const badgesList = [
    {
      id: "first_step",
      name: "First Steps",
      desc: "Solved your first math problem!",
      unlocked: solvedCount >= 1,
      icon: Star,
      color: "bg-green-100 text-green-700 border-green-300",
    },
    {
      id: "streak_3",
      name: "Streak Master",
      desc: "Got 3 correct answers in a row!",
      unlocked: maxStreak >= 3,
      icon: Flame,
      color: "bg-orange-100 text-orange-700 border-orange-300",
    },
    {
      id: "olympiad_hero",
      name: "Olympiad Hero",
      desc: "Solved an Olympiad-level challenge!",
      unlocked: score >= 50, // unlocked when they score high or complete several questions
      icon: Award,
      color: "bg-purple-100 text-purple-700 border-purple-300",
    },
    {
      id: "model_wizard",
      name: "Bar Model Wizard",
      desc: "Mastered comparison bar models!",
      unlocked: (categoryStats["Model Method"]?.correct || 0) >= 2,
      icon: GraduationCap,
      color: "bg-blue-100 text-blue-700 border-blue-300",
    },
    {
      id: "fraction_pro",
      name: "Fraction Conqueror",
      desc: "Mastered fraction division word problems!",
      unlocked: (categoryStats["Fractions & Ratios"]?.correct || 0) >= 1,
      icon: Zap,
      color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    },
    {
      id: "grandmaster",
      name: "Grand Explorer",
      desc: "Finished all 30 stages on Math Island!",
      unlocked: solvedCount >= 30,
      icon: Trophy,
      color: "bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse",
    },
  ];

  const categories = Object.keys(categoryStats);

  return (
    <div className="bg-white rounded-3xl border-4 border-indigo-100 p-6 shadow-xl max-w-4xl mx-auto" id="report-card-container">
      {/* Title */}
      <div className="text-center mb-8">
        <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
          Learning Report Card (Bảng Thành Tích Học Tập)
        </span>
        <h2 className="text-3xl font-black text-indigo-900 mt-2 flex items-center justify-center gap-2">
          <GraduationCap className="text-indigo-600 animate-bounce" size={32} />
          <span>My Math Journey Stats</span>
        </h2>
        <p className="text-slate-500 text-sm mt-1">Excellent job! Here is a summary of your advanced math practice.</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {/* Total Points */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-center shadow-sm hover:scale-105 transition-transform">
          <div className="bg-yellow-100 text-yellow-800 p-2 rounded-xl inline-block mb-2">
            <Trophy size={20} />
          </div>
          <div className="text-xs text-yellow-800 font-bold uppercase tracking-wider">Total Score</div>
          <div className="text-2xl font-black text-yellow-900 mt-1">{score} pts</div>
          <div className="text-[10px] text-yellow-700/80 mt-1">10 pts per correct</div>
        </div>

        {/* Solved Count */}
        <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 text-center shadow-sm hover:scale-105 transition-transform">
          <div className="bg-sky-100 text-sky-800 p-2 rounded-xl inline-block mb-2">
            <CheckCircle2 size={20} />
          </div>
          <div className="text-xs text-sky-800 font-bold uppercase tracking-wider">Progress</div>
          <div className="text-2xl font-black text-sky-900 mt-1">{solvedCount} / 30</div>
          <div className="text-[10px] text-sky-700/80 mt-1">Stages Completed</div>
        </div>

        {/* Accuracy Rate */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 text-center shadow-sm hover:scale-105 transition-transform">
          <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl inline-block mb-2">
            <Target size={20} />
          </div>
          <div className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Accuracy</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{accuracy}%</div>
          <div className="text-[10px] text-emerald-700/80 mt-1">{correctAnswersCount} correct tries</div>
        </div>

        {/* Current Streak */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center shadow-sm hover:scale-105 transition-transform">
          <div className="bg-orange-100 text-orange-800 p-2 rounded-xl inline-block mb-2">
            <Flame size={20} className="animate-pulse" />
          </div>
          <div className="text-xs text-orange-800 font-bold uppercase tracking-wider">Max Streak</div>
          <div className="text-2xl font-black text-orange-900 mt-1">{maxStreak}🔥</div>
          <div className="text-[10px] text-orange-700/80 mt-1">Current: {streak} in a row</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Category breakdown */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Target size={16} className="text-slate-600" />
            <span>Category Mastery (Phân Tích Kỹ Năng)</span>
          </h3>
          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Solve a question on the map to unlock skill mastery charts!
              </div>
            ) : (
              categories.map((cat) => {
                const stats = categoryStats[cat] || { total: 0, correct: 0 };
                const percent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{cat}</span>
                      <span className="text-slate-500">
                        {stats.correct}/{stats.total} correct ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Badges and Trophies */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Award size={16} className="text-slate-600" />
            <span>Unlocked Badges (Huy Chương Đạt Được)</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {badgesList.map((badge) => {
              const IconComp = badge.icon;
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    badge.unlocked
                      ? `${badge.color} shadow-sm transform scale-100`
                      : "bg-slate-100 text-slate-400 border-slate-200 opacity-60"
                  }`}
                  id={`badge-card-${badge.id}`}
                >
                  <div className={`p-2 rounded-full mb-1 bg-white border ${badge.unlocked ? "border-current" : ""}`}>
                    <IconComp size={18} />
                  </div>
                  <div className="text-xs font-bold leading-tight">{badge.name}</div>
                  <div className="text-[9px] mt-0.5 leading-tight text-slate-500">{badge.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          onClick={onBackToMap}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          id="back-to-adventure-btn"
        >
          <span>Continue Adventure (Tiếp tục hành trình)</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
