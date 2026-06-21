/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export type ExpressionState = 'idle' | 'whacked' | 'shocked';

// Import high-quality photos for the Boyfriend (Him)
import bf1 from '../assets/images/sak-1.jpeg';
import bf2 from '../assets/images/sak-2.jpeg';
import bf3 from '../assets/images/sak-3.jpeg';
import bf4 from '../assets/images/sak-4.jpeg';
import bf5 from '../assets/images/sak-5.jpeg';

// Import high-quality photos for the Girlfriend (Her)
import gf1 from '../assets/images/vri-1.jpeg';
import gf2 from '../assets/images/vri-2.jpeg';
import gf3 from '../assets/images/vri-3.jpeg';
import gf4 from '../assets/images/vri-4.jpeg';
import gf5 from '../assets/images/vri-5.jpeg';

const BOYFRIEND_PHOTOS = [bf1, bf2, bf3, bf4, bf5];
const GIRLFRIEND_PHOTOS = [gf1, gf2, gf3, gf4, gf5];

export const BoyfriendAvatar: React.FC<{
  index: number;
  expression: ExpressionState;
  className?: string;
}> = ({ index, expression, className = 'w-full h-full' }) => {
  const photoSrc = BOYFRIEND_PHOTOS[index % BOYFRIEND_PHOTOS.length];

  return (
    <div className={`relative rounded-full overflow-hidden border-[4px] border-white-400 bg-sky-100 shadow-md flex items-center justify-center transition-all duration-300 ${className} ${
      expression === 'whacked'
        ? 'scale-90 rotate-6 brightness-75 saturate-75 border-amber-500 shadow-sm'
        : expression === 'shocked'
        ? 'scale-105 border-rose-500 animate-pulse'
        : 'hover:scale-[1.02]'
    }`}>
      <img
        src={photoSrc}
        alt="Boyfriend"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Playful realistic feedback overlays instead of cartoon faces */}
      {expression === 'whacked' && (
        <div className="absolute inset-0 bg-amber-500/20 flex flex-col items-center justify-center">
          <span className="text-2xl filter drop-shadow-md animate-bounce">😵</span>
          <span className="absolute top-1 right-2 text-xs font-black text-amber-300 animate-ping">💥</span>
        </div>
      )}

      {expression === 'shocked' && (
        <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center">
          <span className="text-2xl filter drop-shadow-md animate-bounce">⚡</span>
          <span className="absolute top-1 right-2 text-xs font-black text-rose-300 animate-pulse">❗</span>
        </div>
      )}
    </div>
  );
};

export const GirlfriendAvatar: React.FC<{
  index: number;
  expression: ExpressionState;
  className?: string;
}> = ({ index, expression, className = 'w-full h-full' }) => {
  const photoSrc = GIRLFRIEND_PHOTOS[index % GIRLFRIEND_PHOTOS.length];

  return (
    <div className={`relative rounded-full overflow-hidden border-[4px] border-white-400 bg-pink-100 shadow-md flex items-center justify-center transition-all duration-300 ${className} ${
      expression === 'whacked'
        ? 'scale-90 -rotate-6 brightness-75 saturate-75 border-amber-500 shadow-sm'
        : expression === 'shocked'
        ? 'scale-105 border-rose-500 animate-pulse'
        : 'hover:scale-[1.02]'
    }`}>
      <img
        src={photoSrc}
        alt="Girlfriend"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Playful realistic feedback overlays instead of cartoon faces */}
      {expression === 'whacked' && (
        <div className="absolute inset-0 bg-amber-500/20 flex flex-col items-center justify-center">
          <span className="text-2xl filter drop-shadow-md animate-bounce">😵</span>
          <span className="absolute top-1 right-2 text-xs font-black text-amber-300 animate-ping">💥</span>
        </div>
      )}

      {expression === 'shocked' && (
        <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center">
          <span className="text-2xl filter drop-shadow-md animate-bounce">⚡</span>
          <span className="absolute top-1 right-2 text-xs font-black text-rose-300 animate-pulse">❗</span>
        </div>
      )}
    </div>
  );
};
