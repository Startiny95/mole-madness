/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameMode, MoleState } from '../types';
import { BoyfriendAvatar, GirlfriendAvatar } from '../utils/avatars';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface GameGridProps {
  moles: MoleState[];
  activeTarget: 'HIM' | 'HER';
  mode: GameMode;
  hisPhotos: string[];
  herPhotos: string[];
  onWhack: (holeIndex: number, e: React.MouseEvent) => void;
}

interface FlyingScore {
  id: number;
  text: string;
  x: number;
  y: number;
  isNegative: boolean;
}

export const GameGrid: React.FC<GameGridProps> = ({
  moles,
  activeTarget,
  mode,
  hisPhotos,
  herPhotos,
  onWhack,
}) => {
  const [flyingScores, setFlyingScores] = useState<FlyingScore[]>([]);
  const [activeHoleEffects, setActiveHoleEffects] = useState<{ [key: number]: 'hit' | 'penalty' | null }>({});

  // Clean elements over time
  useEffect(() => {
    if (flyingScores.length === 0) return;
    const timer = setTimeout(() => {
      setFlyingScores((prev) => prev.slice(1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [flyingScores]);

  const handleHoleClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const mole = moles[index];
    if (!mole || !mole.active || mole.isWhacked) return;

    // Determine gain or penalty based on current targets
    let isHit = false;
    let pointText = '';

    if (mode === 'WHACK_HIM') {
      isHit = mole.type === 'HIM';
    } else if (mode === 'WHACK_HER') {
      isHit = mole.type === 'HER';
    } else {
      // Alternating mode
      isHit = mole.type === activeTarget;
    }

    if (isHit) {
      pointText = '+10';
      setActiveHoleEffects((prev) => ({ ...prev, [index]: 'hit' }));
    } else {
      pointText = '-5';
      setActiveHoleEffects((prev) => ({ ...prev, [index]: 'penalty' }));
    }

    // Cleanup effects
    setTimeout(() => {
      setActiveHoleEffects((prev) => ({ ...prev, [index]: null }));
    }, 500);

    // Get click coordinates relative to the grid container to trigger flying score text
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    const x = e.clientX - (parentRect?.left || 0);
    const y = e.clientY - (parentRect?.top || 0) - 20;

    const newScore: FlyingScore = {
      id: Date.now() + Math.random(),
      text: pointText,
      x,
      y,
      isNegative: !isHit,
    };

    setFlyingScores((prev) => [...prev, newScore]);

    // Pass up the chain
    onWhack(index, e);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-emerald-400 rounded-[3rem] border-8 border-emerald-500 shadow-[inset_0_4px_10px_rgba(0,0,0,0.35)] overflow-hidden p-6 select-none touch-none">
      {/* Dynamic graphic lawn layout radial dots */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none z-0" 
        style={{ 
          backgroundImage: 'radial-gradient(#065F46 2px, transparent 2px)', 
          backgroundSize: '24px 24px' 
        }} 
      />

      {/* 3x3 Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-x-4 gap-y-7 md:gap-x-6 md:gap-y-10 py-2">
        {moles.map((mole, idx) => {
          const effect = activeHoleEffects[idx];
          const hasCustomPhoto = mole.type === 'HIM' ? hisPhotos.length > 0 : herPhotos.length > 0;
          const customPhotoSrc = mole.type === 'HIM' 
            ? hisPhotos[mole.photoIndex % hisPhotos.length] 
            : herPhotos[mole.photoIndex % herPhotos.length];

          // Determine if this popped mole is a target or trap
          const isCurrentPositiveTarget =
            mode === 'WHACK_HIM'
              ? mole.type === 'HIM'
              : mode === 'WHACK_HER'
              ? mole.type === 'HER'
              : mole.type === activeTarget;

          return (
            <div
              key={idx}
              id={`hole-${idx}`}
              onClick={(e) => handleHoleClick(idx, e)}
              className="relative aspect-square rounded-full bg-[#4E342E] shadow-[inset_0_8px_16px_rgba(0,0,0,0.45)] border-4 border-[#3a2521] flex items-center justify-center overflow-hidden group cursor-pointer"
            >
              {/* Mole Wrapper popping out of the pocket hole */}
              <div className="absolute inset-x-0 bottom-0 top-[12%] flex items-end justify-center overflow-hidden pointer-events-none pb-[5%] z-10">
                {mole.active && (
                  <div
                    className={`w-[85%] h-[85%] transition-transform duration-100 transform origin-bottom pointer-events-auto select-none ${
                      mole.isWhacked 
                        ? 'translate-y-1/2 scale-y-75 cursor-default' 
                        : 'translate-y-0 scale-y-100 hover:scale-105 active:scale-95 animate-pop-up'
                    }`}
                  >
                    {/* Render Image or Avatar */}
                    {hasCustomPhoto ? (
                      <div className={`relative w-full h-full rounded-full overflow-hidden border-[5px] border-white shadow-md flex items-center justify-center ${
                        mole.type === 'HIM' 
                          ? 'bg-[#0284C7] shadow-[0_4px_0_#075985]' 
                          : 'bg-[#DB2777] shadow-[0_4px_0_#9D174D]'
                      }`}>
                        <img
                          src={customPhotoSrc}
                          alt={mole.type}
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover select-none pointer-events-none ${
                            mole.isWhacked ? 'brightness-75 saturate-50' : ''
                          }`}
                        />
                        {/* Status overlays in place of cartoon expressions */}
                        {mole.isWhacked && (
                          <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center backdrop-blur-[1px]">
                            {isCurrentPositiveTarget ? (
                              <Sparkles className="text-amber-100 animate-spin" size={24} />
                            ) : (
                              <AlertTriangle className="text-rose-100 animate-bounce" size={24} />
                            )}
                          </div>
                        )}
                        
                        {/* Subtle target identifier corner tags */}
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] font-extrabold text-white uppercase shadow-sm ${
                          isCurrentPositiveTarget ? 'bg-sky-500' : 'bg-rose-500'
                        }`}>
                          {isCurrentPositiveTarget ? "HIT" : "TRAP"}
                        </div>
                      </div>
                    ) : (
                      // Render gorgeous SVG animated avatars
                      mole.type === 'HIM' ? (
                        <BoyfriendAvatar
                          index={mole.photoIndex}
                          expression={mole.isWhacked ? (isCurrentPositiveTarget ? 'whacked' : 'shocked') : 'idle'}
                        />
                      ) : (
                        <GirlfriendAvatar
                          index={mole.photoIndex}
                          expression={mole.isWhacked ? (isCurrentPositiveTarget ? 'whacked' : 'shocked') : 'idle'}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
              
              {/* Tap feedback flashes around the hole rim */}
              {effect === 'hit' && (
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-md animate-ping pointer-events-none z-30" />
              )}
              {effect === 'penalty' && (
                <div className="absolute inset-0 bg-rose-500/40 rounded-full blur-md animate-ping pointer-events-none z-30" />
              )}
            </div>
          );
        })}

        {/* Floating Flying Score texts inside the matrix container */}
        {flyingScores.map((score) => (
          <div
            key={score.id}
            className={`absolute font-display font-black text-3xl pointer-events-none z-40 transition-all duration-700 select-none animate-bounce ${
              score.isNegative
                ? 'text-rose-600 drop-shadow-[0_2px_4px_rgba(244,63,94,0.4)]'
                : 'text-emerald-500 drop-shadow-[0_2px_4px_rgba(16,185,129,0.4)]'
            }`}
            style={{
              left: score.x,
              top: score.y,
              transform: 'translate(-50%, -100%)',
              animation: 'pop-up 0.4s ease-out forwards',
            }}
          >
            {score.text}
          </div>
        ))}
      </div>
    </div>
  );
};
