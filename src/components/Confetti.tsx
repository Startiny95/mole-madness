/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  x: number; // percentage width
  delay: number; // seconds
  duration: number; // seconds
  size: number; // px
  color: string;
  shape: 'circle' | 'square' | 'triangle';
  spin: number;
}

const CONFETTI_COLORS = [
  '#F43F5E', // Rose
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#06B6D4', // Teal
];

export const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const arrayCount = 80;
    const generated: ConfettiPiece[] = Array.from({ length: arrayCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 3.5,
      duration: 3 + Math.random() * 4,
      size: 6 + Math.random() * 10,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as any,
      spin: Math.random() * 360,
    }));
    setPieces(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map((p) => {
        const shapeClass =
          p.shape === 'circle'
            ? 'rounded-full'
            : p.shape === 'triangle'
            ? 'clip-path-triangle'
            : '';

        return (
          <div
            key={p.id}
            className={`absolute top-0 animate-bounce ${shapeClass}`}
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: 0.85,
              transform: `rotate(${p.spin}deg)`,
              animation: `confetti-fall ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
              clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : undefined,
            }}
          />
        );
      })}
    </div>
  );
};
