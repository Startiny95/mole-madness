/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameMode } from '../types';
import { BoyfriendAvatar, GirlfriendAvatar } from '../utils/avatars';
import { Zap, Heart, ShieldAlert, Clock, Play } from 'lucide-react';

interface RulesModalProps {
  mode: GameMode;
  hisPhotosCount: number;
  herPhotosCount: number;
  onAgree: () => void;
  onBack: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({
  mode,
  hisPhotosCount,
  herPhotosCount,
  onAgree,
  onBack,
}) => {
  return (
    <div className="bg-white border-4 border-[#6366F1] rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-[8px_8px_0_#4338CA] text-slate-800 relative overflow-hidden animate-pop-up mx-auto">
      {/* Decorative Hearts background */}
      <div className="absolute top-0 right-0 p-4 text-purple-100 -rotate-12 pointer-events-none">
        <Heart size={120} fill="currentColor" />
      </div>

      <div className="relative z-10">
        <div className="text-center mb-6">
          <span className="text-[#6366F1] font-display text-4xl font-black tracking-tight block">
            HOW TO PLAY
          </span>
          <p className="text-pink-600 font-extrabold text-xs tracking-wider uppercase mt-1">
            🌸 Mode Rules & Guide 🌸
          </p>
        </div>

        {/* Dynamic Mode specific card */}
        <div className="bg-amber-50/40 border-2 border-[#F59E0B] rounded-2xl p-5 mb-6 shadow-[4px_4px_0_#D97706]">
          <h3 className="font-display font-black text-lg text-slate-900 flex items-center gap-2 mb-4">
            <Heart className="text-pink-500 fill-pink-500 shrink-0" size={20} />
            {mode === 'WHACK_HIM' && "Whack His Photos!"}
            {mode === 'WHACK_HER' && "Whack Her Photos!"}
            {mode === 'ALTERNATING' && "Crazy Alternating Madness!"}
          </h3>

          <div className="grid grid-cols-2 gap-4 items-center mb-4">
            {/* Left side target */}
            <div className="bg-white p-3 rounded-xl border-2 border-emerald-400 hover:scale-105 transition-transform text-center flex flex-col items-center shadow-[2px_2px_0_#10B981]">
              <div className="w-16 h-16 mb-2 relative">
                {mode === 'WHACK_HIM' ? (
                  <BoyfriendAvatar index={0} expression="idle" />
                ) : mode === 'WHACK_HER' ? (
                  <GirlfriendAvatar index={0} expression="idle" />
                ) : (
                  // Alternating shows both
                  <div className="flex gap-1">
                    <div className="w-8 h-8"><BoyfriendAvatar index={0} expression="idle" /></div>
                    <div className="w-8 h-8"><GirlfriendAvatar index={0} expression="idle" /></div>
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 text-[9px] font-bold px-1.5 shadow">
                  +10
                </span>
              </div>
              <p className="font-display font-extrabold text-sm text-emerald-600">
                {mode === 'WHACK_HIM' ? "Boyfriend" : mode === 'WHACK_HER' ? "Girlfriend" : "Active Target"}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Whack to gain score!
              </p>
            </div>

            {/* Right side avoid */}
            <div className="bg-white p-3 rounded-xl border-2 border-rose-450 hover:scale-105 transition-transform text-center flex flex-col items-center shadow-[2px_2px_0_#F43F5E]">
              <div className="w-16 h-16 mb-2 relative">
                {mode === 'WHACK_HIM' ? (
                  <GirlfriendAvatar index={0} expression="idle" />
                ) : mode === 'WHACK_HER' ? (
                  <BoyfriendAvatar index={0} expression="idle" />
                ) : (
                  <div className="flex gap-1 justify-center opacity-70">
                    <div className="w-8 h-8"><GirlfriendAvatar index={0} expression="shocked" /></div>
                    <div className="w-8 h-8"><BoyfriendAvatar index={0} expression="shocked" /></div>
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 text-[9px] font-bold px-1.5 shadow">
                  -5
                </span>
              </div>
              <p className="font-display font-extrabold text-sm text-rose-600">
                {mode === 'WHACK_HIM' ? "Girlfriend" : mode === 'WHACK_HER' ? "Boyfriend" : "Trap Target"}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Avoid! Score penalty!
              </p>
            </div>
          </div>

          <p className="text-slate-700 text-xs text-center font-semibold mt-2 leading-relaxed px-2">
            {mode === 'WHACK_HIM' && "Your boyfriend is the Mole! Hit him as fast as possible to boost counts, but don't hit her or points drop!"}
            {mode === 'WHACK_HER' && "You're whacking her! Tap her immediately whenever she pops up, but avoid whacking your boyfriend's picture!"}
            {mode === 'ALTERNATING' && "🔥 Warning! Every 8 seconds, the Target swaps between Him & Her! Follow the flashing banner at the top of the grid or risk massive penalty points!"}
          </p>
        </div>

        {/* Key mechanics rows */}
        <div className="space-y-3.5 mb-8">
          <div className="flex items-start gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 shrink-0 mt-0.5 border border-indigo-200">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">30-Second Match Duration</p>
              <p className="text-[11px] text-slate-500">Fast-paced retro round. Whack before the timer ticks to zero!</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-xl text-purple-600 shrink-0 mt-0.5 border border-purple-200">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Ramping Climax Difficulty</p>
              <p className="text-[11px] text-slate-500 font-medium">As time runs low (under 12s), moles will pop up more frequently and stay up for much shorter windows!</p>
            </div>
          </div>
        </div>

        {/* Buttons line */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onBack}
            className="flex-1 max-w-[124px] bg-slate-100 hover:bg-slate-200 active:translate-y-0.5 text-slate-750 font-display font-black py-3 px-4 rounded-xl transition duration-150 text-xs shadow-[2px_2px_0_#94a3b8] cursor-pointer border-2 border-slate-300"
          >
            Back
          </button>
          <button
            onClick={onAgree}
            className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] active:translate-y-0.5 text-slate-900 font-display font-black py-3 px-6 rounded-xl transition duration-150 text-xs shadow-[4px_4px_0_#92400E] border-2 border-[#92400E] flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            <Play size={14} fill="currentColor" /> Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
