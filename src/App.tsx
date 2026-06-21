/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GameMode, GameState, MoleState, GameStats, HighScoreRecord } from './types';
import { loadPhotosFromDB, savePhotosToDB, clearPhotosDB } from './utils/db';
import { BoyfriendAvatar, GirlfriendAvatar } from './utils/avatars';
import { 
  playPopSound, 
  playHitSound, 
  playPenaltySound, 
  playFanfareSound, 
  toggleMute 
} from './utils/audio';
import { Confetti } from './components/Confetti';
import { RulesModal } from './components/RulesModal';
import { PhotoUploader } from './components/PhotoUploader';
import { GameGrid } from './components/GameGrid';
import { 
  Heart, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Trophy, 
  Flame, 
  Sparkles, 
  Info,
  Award,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';

// GAME TIME LIMIT CONSTANTS (Easily tweakable)
const GAME_ROUND_DURATION = 35; // Total round duration in seconds
const BASE_SPAWN_INTERVAL = 1100; // Base interval between spawns (ms)
const MIN_SPAWN_INTERVAL = 550; // Maximum speed limit (ms) at the final seconds
const BASE_MOLE_DURATION = 1500; // Time a mole stays up (ms)
const MIN_MOLE_DURATION = 800; // Time a mole stays up during final climax (ms)
const TARGET_ALTERNATE_TIME = 8; // Seconds between swaps in ALTERNATING mode

const INITIAL_STATS: GameStats = {
  score: 0,
  hits: 0,
  misses: 0,
  penalties: 0,
};

export default function App() {
  // Game States
  const [gameState, setGameState] = useState<GameState>('START');
  const [gameMode, setGameMode] = useState<GameMode>('WHACK_HIM');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [timeLeft, setTimeLeft] = useState(GAME_ROUND_DURATION);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Alternating Mode Target Tracking
  const [activeTarget, setActiveTarget] = useState<'HIM' | 'HER'>('HIM');
  const [targetTimeLeft, setTargetTimeLeft] = useState(TARGET_ALTERNATE_TIME);

  // Moles state
  const [moles, setMoles] = useState<MoleState[]>(
    Array.from({ length: 9 }).map((_, i) => ({
      id: i,
      active: false,
      type: 'HIM',
      spawnTime: 0,
      duration: BASE_MOLE_DURATION,
      isWhacked: false,
      photoIndex: 0,
    }))
  );

  // Persistent custom photos
  const [hisPhotos, setHisPhotos] = useState<string[]>([]);
  const [herPhotos, setHerPhotos] = useState<string[]>([]);

  // Persistent High Scores per Mode
  const [highScores, setHighScores] = useState<{ [key in GameMode]: number }>({
    WHACK_HIM: 0,
    WHACK_HER: 0,
    ALTERNATING: 0,
  });
  const [isNewHighScoreAchieved, setIsNewHighScoreAchieved] = useState(false);

  // Timer Ref loops
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const spawnLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Load High Scores and custom pictures on mount
  useEffect(() => {
    // High scores from localStorage
    const savedScores: { [key in GameMode]?: number } = {};
    const modes: GameMode[] = ['WHACK_HIM', 'WHACK_HER', 'ALTERNATING'];
    modes.forEach((m) => {
      const val = localStorage.getItem(`molemadness_highscore_${m}`);
      savedScores[m] = val ? parseInt(val, 10) : 0;
    });
    setHighScores(savedScores as { [key in GameMode]: number });

    // Custom photos from IndexedDB
    const loadSavedPhotos = async () => {
      const his = await loadPhotosFromDB('hisPhotos');
      const her = await loadPhotosFromDB('herPhotos');
      setHisPhotos(his);
      setHerPhotos(her);
    };
    loadSavedPhotos();
  }, []);

  // Update photo hook wrappers
  const updateHisPhotos = async (newPhotos: string[]) => {
    setHisPhotos(newPhotos);
    await savePhotosToDB('hisPhotos', newPhotos);
  };

  const updateHerPhotos = async (newPhotos: string[]) => {
    setHerPhotos(newPhotos);
    await savePhotosToDB('herPhotos', newPhotos);
  };

  const handleClearAllPhotos = async () => {
    if (window.confirm('Do you really want to delete all uploaded photos and revert back to classic avatars?')) {
      setHisPhotos([]);
      setHerPhotos([]);
      await clearPhotosDB();
    }
  };

  // Mute controller
  const handleToggleMute = () => {
    const nextState = !isSoundMuted;
    setIsSoundMuted(nextState);
    toggleMute(nextState);
  };

  // CORE GAME ENGINE LOOP
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    // Decrement main timer every 1s
    gameIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }

        // Handle target alternation countdown
        if (gameMode === 'ALTERNATING') {
          setTargetTimeLeft((tPrev) => {
            if (tPrev <= 1) {
              // Alternate targets!
              setActiveTarget((curr) => {
                const next = curr === 'HIM' ? 'HER' : 'HIM';
                // Play a little cute notify warning
                playPopSound();
                return next;
              });
              return TARGET_ALTERNATE_TIME;
            }
            return tPrev - 1;
          });
        }

        return prev - 1;
      });
    }, 1000);

    // Initial trigger start
    runSpawnLoop();

    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (spawnLoopRef.current) clearTimeout(spawnLoopRef.current);
    };
  }, [gameState, gameMode, timeLeft]);

  // Handle active mole retractions
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      const now = Date.now();
      setMoles((prev) =>
        prev.map((mole) => {
          if (mole.active && !mole.isWhacked && now - mole.spawnTime >= mole.duration) {
            // Missed! Auto-retract
            return { ...mole, active: false };
          }
          return mole;
        })
      );
    }, 150);

    return () => clearInterval(interval);
  }, [gameState]);

  // Run dynamic spawn timer calculation based on timeLeft
  const runSpawnLoop = () => {
    if (gameState !== 'PLAYING') return;

    // Ramping difficulty calculations:
    // Under 25 seconds: normal speed. Under 15s: fast. Under 8s: crazy frenzy speed!
    let difficultyMultiplier = 1.0;
    if (timeLeft < 10) {
      difficultyMultiplier = 0.45; // frenzy!
    } else if (timeLeft < 20) {
      difficultyMultiplier = 0.7; // brisk
    }

    const currentSpawnInterval = Math.max(
      MIN_SPAWN_INTERVAL,
      BASE_SPAWN_INTERVAL * difficultyMultiplier
    );

    // Schedule next spawn check
    spawnLoopRef.current = setTimeout(() => {
      spawnMole();
      runSpawnLoop();
    }, currentSpawnInterval);
  };

  const spawnMole = () => {
    setMoles((currentMoles) => {
      // Find all empty holes
      const emptyHoles = currentMoles
        .map((m, idx) => ({ ...m, idx }))
        .filter((m) => !m.active);

      if (emptyHoles.length === 0) return currentMoles;

      // Spawn 1 mole, or sometimes a double-spawn if in frenzy climax mode (timeLeft < 12 seconds)
      const spawnCount = timeLeft < 12 && Math.random() < 0.4 ? 2 : 1;
      const spawnedIndices: number[] = [];

      for (let i = 0; i < spawnCount && emptyHoles.length > i; i++) {
        // Pick random empty hole
        const randomIndex = Math.floor(Math.random() * emptyHoles.length);
        const selected = emptyHoles.splice(randomIndex, 1)[0];
        if (selected) spawnedIndices.push(selected.idx);
      }

      if (spawnedIndices.length === 0) return currentMoles;

      playPopSound();

      // Update mole duration on spawn based on difficulty ramp
      let durationMultiplier = 1.0;
      if (timeLeft < 10) {
        durationMultiplier = 0.55; // must tap extremely quick!
      } else if (timeLeft < 20) {
        durationMultiplier = 0.8;
      }

      const activeDuration = Math.max(
        MIN_MOLE_DURATION,
        BASE_MOLE_DURATION * durationMultiplier
      );

      return currentMoles.map((mole, idx) => {
        if (spawnedIndices.includes(idx)) {
          // Decides type: alternate 50/50 so it's not sticking, keeping user agile!
          const type = Math.random() < 0.5 ? 'HIM' : 'HER';
          const randomPhotoOffset = Math.floor(Math.random() * 10);

          return {
            ...mole,
            active: true,
            type,
            spawnTime: Date.now(),
            duration: activeDuration,
            isWhacked: false,
            photoIndex: randomPhotoOffset,
          };
        }
        return mole;
      });
    });
  };

  // CLICK WHACK TRIGGERED ON GAME GRID HOLE
  const handleWhack = (index: number, e: React.MouseEvent) => {
    setMoles((currentMoles) =>
      currentMoles.map((mole, idx) => {
        if (idx === index && mole.active && !mole.isWhacked) {
          // Determine point increment or penalty
          const targetIsHim = gameMode === 'WHACK_HIM' || (gameMode === 'ALTERNATING' && activeTarget === 'HIM');
          const targetIsHer = gameMode === 'WHACK_HER' || (gameMode === 'ALTERNATING' && activeTarget === 'HER');

          const isPositiveHit = (mole.type === 'HIM' && targetIsHim) || (mole.type === 'HER' && targetIsHer);

          if (isPositiveHit) {
            playHitSound();
            setStats((prev) => ({
              ...prev,
              score: prev.score + 10,
              hits: prev.hits + 1,
            }));
          } else {
            // Penalty! Decreases score
            playPenaltySound();
            setStats((prev) => ({
              ...prev,
              score: Math.max(0, prev.score - 5), // Prevent score going below zero
              penalties: prev.penalties + 1,
            }));
          }

          // Mark as whacked and set up dynamic retract timer
          setTimeout(() => {
            retractMole(index);
          }, 350);

          return { ...mole, isWhacked: true };
        }
        return mole;
      })
    );
  };

  const retractMole = (index: number) => {
    setMoles((prev) =>
      prev.map((mole, idx) => {
        if (idx === index) {
          return { ...mole, active: false, isWhacked: false };
        }
        return mole;
      })
    );
  };

  // Launch Game Flows
  const startGameFlow = () => {
    setGameState('RULES');
  };

  const startPlaying = () => {
    setStats(INITIAL_STATS);
    setTimeLeft(GAME_ROUND_DURATION);
    setTargetTimeLeft(TARGET_ALTERNATE_TIME);
    setActiveTarget(gameMode === 'WHACK_HER' ? 'HER' : 'HIM');
    setIsNewHighScoreAchieved(false);

    // Reset grid
    setMoles((prev) =>
      prev.map((m) => ({ ...m, active: false, isWhacked: false }))
    );

    setGameState('PLAYING');
  };

  const endGame = () => {
    setGameState('GAMEOVER');

    // Check if a new high score was set
    const currentHighScore = highScores[gameMode];
    if (stats.score > currentHighScore) {
      // New high score! Saving
      localStorage.setItem(`molemadness_highscore_${gameMode}`, stats.score.toString());
      setHighScores((prev) => ({ ...prev, [gameMode]: stats.score }));
      setIsNewHighScoreAchieved(true);
      playFanfareSound();
    } else {
      playPenaltySound();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8E1] py-6 px-4 md:px-8 font-sans relative overflow-x-hidden flex flex-col justify-between">
      {/* Dynamic decoration floating hearts */}
      <div className="absolute top-10 left-5 text-[#F59E0B]/15 -rotate-12 select-none pointer-events-none animate-pulse">
        <Heart size={84} fill="currentColor" />
      </div>
      <div className="absolute bottom-16 right-5 text-indigo-400/10 rotate-45 select-none pointer-events-none animate-pulse">
        <Heart size={100} fill="currentColor" />
      </div>

      <header className="max-w-2xl w-full mx-auto flex items-center justify-between z-10 mb-2">
        {/* Playful App Title Logo banner */}
        <div 
          onClick={() => setGameState('START')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="bg-[#6366F1] p-2 rounded-xl shadow-[3px_3px_0_#4338CA] border-2 border-[#4338CA] transform rotate-6 group-hover:rotate-12 transition-transform">
            <Heart size={18} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl tracking-tight text-[#6366F1]">
              MOLE MADNESS
            </h1>
            <p className="text-[9px] text-[#065F46] font-black uppercase tracking-widest -mt-1">
              ★ Competitive Whack-a-Mole ★
            </p>
          </div>
        </div>

        {/* Global Control Bar */}
        <div className="flex items-center gap-2">
          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            className="p-2 sm:p-2.5 bg-white hover:bg-slate-50 rounded-xl shadow-[3px_3px_0_#cbd5e1] border-2 border-slate-300 text-slate-700 hover:text-indigo-600 active:translate-y-0.5 transition cursor-pointer"
            title={isSoundMuted ? "Unmute" : "Mute Sound"}
          >
            {isSoundMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-4 z-10 max-w-4xl w-full mx-auto">
        
        {/* START SCREEN */}
        {gameState === 'START' && (
          <div className="w-full max-w-lg bg-white border-4 border-[#6366F1] shadow-[8px_8px_0_#4338CA] p-6 md:p-8 rounded-[2rem] text-center animate-pop-up">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 bg-[#F59E0B] border-2 border-[#92400E] rounded-2xl shadow-[3px_3px_0_#92400E] flex items-center justify-center mx-auto rotate-6 animate-bounce">
                <Trophy className="text-white fill-yellow-200" size={32} />
              </div>
              <Sparkles className="absolute -top-1 -right-3 text-[#F59E0B] animate-pulse" size={20} />
            </div>

            <h2 className="font-display font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-none mb-1">
              Select Your Whack Mode
            </h2>
            <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto mb-6 uppercase tracking-wide">
              Tap target photos to secure high score victories!
            </p>

            {/* Custom Photo Uploader embedded neatly on top */}
            <PhotoUploader
              hisPhotos={hisPhotos}
              herPhotos={herPhotos}
              onUpdateHisPhotos={updateHisPhotos}
              onUpdateHerPhotos={updateHerPhotos}
              onClearAll={handleClearAllPhotos}
            />

            {/* Selection modes list */}
            <div className="space-y-3.5 mb-6 text-left">
              
              {/* MODE 1: WHACK HIM */}
              <div
                onClick={() => {
                  setGameMode('WHACK_HIM');
                  startGameFlow();
                }}
                className={`group p-4 bg-white rounded-2xl border-[3px] transition-all duration-200 cursor-pointer relative overflow-hidden flex items-center justify-between ${
                  gameMode === 'WHACK_HIM' 
                    ? 'border-[#6366F1] shadow-[4px_4px_0_#4338CA] bg-indigo-50/10' 
                    : 'border-slate-200 hover:border-[#6366F1] shadow-[2px_2px_0_#e2e8f0] hover:shadow-[4px_4px_0_#4338CA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 bg-blue-50 border-2 border-blue-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    {hisPhotos.length > 0 ? (
                      <img src={hisPhotos[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <BoyfriendAvatar index={0} expression="idle" className="w-9 h-9" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-sm flex items-center gap-1.5 leading-none mb-1">
                      🐶 Whack the Boyfriend!
                    </h3>
                    <p className="text-[10px] text-slate-550 font-bold leading-tight">
                      Hit Boyfriend (+10). Avoid Girlfriend (-5).
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">High Score</p>
                  <p className="font-mono text-xs font-black text-blue-600">{highScores.WHACK_HIM} pts</p>
                </div>
              </div>

              {/* MODE 2: WHACK HER */}
              <div
                onClick={() => {
                  setGameMode('WHACK_HER');
                  startGameFlow();
                }}
                className={`group p-4 bg-white rounded-2xl border-[3px] transition-all duration-200 cursor-pointer relative overflow-hidden flex items-center justify-between ${
                  gameMode === 'WHACK_HER' 
                    ? 'border-[#6366F1] shadow-[4px_4px_0_#4338CA] bg-indigo-50/10' 
                    : 'border-slate-200 hover:border-[#6366F1] shadow-[2px_2px_0_#e2e8f0] hover:shadow-[4px_4px_0_#4338CA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 bg-pink-50 border-2 border-pink-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    {herPhotos.length > 0 ? (
                      <img src={herPhotos[0]} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <GirlfriendAvatar index={0} expression="idle" className="w-9 h-9" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-sm flex items-center gap-1.5 leading-none mb-1">
                      🌸 Whack the Girlfriend!
                    </h3>
                    <p className="text-[10px] text-slate-550 font-bold leading-tight">
                      Hit Girlfriend (+10). Avoid Boyfriend (-5).
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">High Score</p>
                  <p className="font-mono text-xs font-black text-pink-600">{highScores.WHACK_HER} pts</p>
                </div>
              </div>

              {/* MODE 3: ALTERNATING */}
              <div
                onClick={() => {
                  setGameMode('ALTERNATING');
                  startGameFlow();
                }}
                className={`group p-4 bg-white rounded-2xl border-[3px] transition-all duration-200 cursor-pointer relative overflow-hidden flex items-center justify-between ${
                  gameMode === 'ALTERNATING' 
                    ? 'border-[#6366F1] shadow-[4px_4px_0_#4338CA] bg-indigo-50/10' 
                    : 'border-slate-200 hover:border-[#6366F1] shadow-[2px_2px_0_#e2e8f0] hover:shadow-[4px_4px_0_#4338CA]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 shrink-0 bg-purple-50 border-2 border-purple-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-rose-100 animate-pulse opacity-60" />
                    <Flame size={18} className="text-purple-600 animate-bounce relative z-10" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-sm flex items-center gap-1.5 leading-none mb-1">
                      ⚡ Crazy Alternating Mode!
                    </h3>
                    <p className="text-[10px] text-slate-550 font-bold leading-tight">
                      Danger! Positive Whack target swaps every {TARGET_ALTERNATE_TIME}s.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider">High Score</p>
                  <p className="font-mono text-xs font-black text-purple-600">{highScores.ALTERNATING} pts</p>
                </div>
              </div>

            </div>

            <div className="text-center bg-[#FFF8E1] rounded-2xl p-3 border-2 border-[#F59E0B]">
              <span className="text-[10px] text-amber-800 font-extrabold block tracking-wider uppercase">
                ★ Personalized Couple Arcade Gift ★
              </span>
              <p className="text-[9px] text-[#92400E] font-bold leading-tight mt-0.5">
                Upload his/her face photos and challenge your lover anytime! Runs entirely offline.
              </p>
            </div>
          </div>
        )}

        {/* RULES MODAL (PRIOR TO GAME START) */}
        {gameState === 'RULES' && (
          <RulesModal
            mode={gameMode}
            hisPhotosCount={hisPhotos.length}
            herPhotosCount={herPhotos.length}
            onAgree={startPlaying}
            onBack={() => setGameState('START')}
          />
        )}

        {/* PLAYING GRID BOARD SCREEN */}
        {gameState === 'PLAYING' && (
          <div className="w-full max-w-xl mx-auto space-y-4 md:space-y-5">
            
            {/* Top Dashboard Headings Info */}
            <div className="bg-white border-4 border-[#F59E0B] rounded-[2rem] p-4 md:p-5 shadow-[0_4px_0_#D97706] flex items-center justify-between gap-3 relative overflow-hidden animate-pop-up">
              {/* Score display */}
              <div className="text-center px-4 py-2 bg-amber-50/50 rounded-2xl flex-1 hover:scale-105 transition-transform duration-200 border border-amber-200">
                <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">SCORE</span>
                <span className="font-mono text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                  {stats.score}
                </span>
              </div>

              {/* Dynamic Target Announcement for ALTERNATING mode */}
              {gameMode === 'ALTERNATING' ? (
                <div className="flex-[1.5] text-center border-x-2 border-dashed border-amber-200 px-2">
                  <p className="text-[9px] font-black text-[#6366F1] uppercase tracking-widest flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                    TARGET ALERT
                  </p>
                  
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="w-9 h-9 relative">
                      {activeTarget === 'HIM' ? (
                        hisPhotos.length > 0 ? (
                          <img src={hisPhotos[0]} className="w-full h-full object-cover rounded-lg border-2 border-sky-500 shadow-sm" referrerPolicy="no-referrer" />
                        ) : (
                          <BoyfriendAvatar index={0} expression="idle" />
                        )
                      ) : (
                        herPhotos.length > 0 ? (
                          <img src={herPhotos[0]} className="w-full h-full object-cover rounded-lg border-2 border-pink-500 shadow-sm" referrerPolicy="no-referrer" />
                        ) : (
                          <GirlfriendAvatar index={0} expression="idle" />
                        )
                      )}
                    </div>
                    <div>
                      <p className={`font-display font-black text-xs md:text-sm tracking-tight capitalize leading-none ${
                        activeTarget === 'HIM' ? 'text-sky-650' : 'text-pink-650'
                      }`}>
                        Whack {activeTarget === 'HIM' ? 'Boyfriend!' : 'Girlfriend!'}
                      </p>
                      
                      {/* Alternating Timer tracking bar */}
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden border border-slate-200">
                        <div 
                          className="bg-[#6366F1] h-full transition-all duration-1000 ease-linear"
                          style={{ width: `${(targetTimeLeft / TARGET_ALTERNATE_TIME) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Single Mode Targets Information Displays
                <div className="flex-[1.5] text-center border-x-2 border-amber-200 px-2">
                  <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block">TARGETS DECK</span>
                  
                  <div className="flex items-center justify-center gap-3 mt-1.5">
                    {/* Hitting object */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6">
                        {gameMode === 'WHACK_HIM' ? (
                          hisPhotos.length > 0 ? <img src={hisPhotos[0]} className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" /> : <BoyfriendAvatar index={0} expression="idle" />
                        ) : (
                          herPhotos.length > 0 ? <img src={herPhotos[0]} className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" /> : <GirlfriendAvatar index={0} expression="idle" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-emerald-600 font-mono">+10</span>
                    </div>

                    <div className="text-slate-300 font-bold">|</div>

                    {/* Avoiding object */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 opacity-60">
                        {gameMode === 'WHACK_HIM' ? (
                          herPhotos.length > 0 ? <img src={herPhotos[0]} className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" /> : <GirlfriendAvatar index={0} expression="idle" />
                        ) : (
                          hisPhotos.length > 0 ? <img src={hisPhotos[0]} className="w-full h-full object-cover rounded-md" referrerPolicy="no-referrer" /> : <BoyfriendAvatar index={0} expression="idle" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-rose-500 font-mono">-5</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Time display with climax countdown pulse */}
              <div 
                className={`text-center px-4 py-2 rounded-2xl flex-1 hover:scale-105 transition-all duration-200 ${
                  timeLeft <= 10 
                    ? 'bg-rose-600 text-white animate-pulse shadow-md border-2 border-rose-700' 
                    : 'bg-[#FFF8E1] border border-amber-300 text-slate-800'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest block ${
                  timeLeft <= 10 ? 'text-rose-100' : 'text-amber-800'
                }`}>
                  TIME
                </span>
                <span className="font-mono text-3xl md:text-4xl font-black leading-tight">
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Ramping dynamic alert banners */}
            {timeLeft <= 10 && (
              <div className="bg-rose-600 border-2 border-rose-850 text-white py-1.5 px-3 rounded-full text-[10px] uppercase font-black tracking-widest animate-bounce shadow-[3px_3px_0_#9f1239] flex items-center justify-center gap-1.5 max-w-xs mx-auto">
                <Flame size={12} fill="currentColor" /> RUSH HOUR SPEED CLIMAX!
              </div>
            )}

            {/* Grid Box */}
            <GameGrid
              moles={moles}
              activeTarget={activeTarget}
              mode={gameMode}
              hisPhotos={hisPhotos}
              herPhotos={herPhotos}
              onWhack={handleWhack}
            />

            {/* Quit/Abort back trigger */}
            <div className="text-center">
              <button
                onClick={() => {
                  if (window.confirm('Do you really want to quit this round? Progress will be lost.')) {
                    setGameState('START');
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 font-bold uppercase tracking-wider cursor-pointer transition py-1"
              >
                <ArrowLeft size={13} /> Abort Match and Return
              </button>
            </div>
          </div>
        )}

        {/* RESULTS SCREEN (GAME OVER) */}
        {gameState === 'GAMEOVER' && (
          <div className="w-full max-w-md bg-white border-4 border-[#6366F1] p-6 md:p-8 rounded-[2rem] shadow-[8px_8px_0_#4338CA] text-center relative overflow-hidden animate-pop-up">
            
            {/* Confetti drop on beating a new high-score */}
            {isNewHighScoreAchieved && <Confetti />}

            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 bg-[#F59E0B] border-2 border-[#92400E] rounded-3xl flex items-center justify-center mx-auto shadow-[4px_4px_0_#92400E] rotate-12 hover:rotate-0 transition-transform duration-300">
                <Award className="text-white fill-amber-300" size={44} />
              </div>
              {isNewHighScoreAchieved && (
                <span className="absolute -top-2 -right-4 bg-yellow-450 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow border-2 border-slate-900 animate-bounce">
                  NEW RECORD
                </span>
              )}
            </div>

            <h2 className="font-display font-black text-3xl text-slate-800 tracking-tight leading-none mb-1">
              Round Complete!
            </h2>
            <p className="text-xs text-indigo-600 font-extrabold uppercase mt-1 tracking-widest">
              {gameMode === 'WHACK_HIM' && "Whack His Photos!"}
              {gameMode === 'WHACK_HER' && "Whack Her Photos!"}
              {gameMode === 'ALTERNATING' && "Alternating Madness"}
            </p>

            {/* Score Big Display */}
            <div className="my-6 p-5 bg-[#FFF8E1] border-2 border-[#F59E0B] shadow-[4px_4px_0_#D97706] rounded-2xl">
              <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-widest">Your Final Score</p>
              <p className="font-mono text-5xl font-black text-slate-900 tracking-tight drop-shadow-sm mt-1 mb-2">
                {stats.score} <span className="text-xs font-bold text-slate-500">pts</span>
              </p>

              {/* Achievements stats subgrid */}
              <div className="grid grid-cols-3 gap-2 border-t border-amber-200 pt-3 text-center mt-3">
                <div>
                  <span className="text-[9px] font-extrabold text-[#065F46] uppercase block">Hits</span>
                  <span className="font-mono text-sm font-black text-emerald-600">{stats.hits}</span>
                </div>
                <div className="border-x border-amber-200">
                  <span className="text-[9px] font-extrabold text-rose-800 uppercase block">Penalties</span>
                  <span className="font-mono text-sm font-black text-rose-500">{stats.penalties}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-indigo-800 uppercase block">High Score</span>
                  <span className="font-mono text-sm font-black text-indigo-700">
                    {highScores[gameMode]}
                  </span>
                </div>
              </div>
            </div>

            {/* High score encouragement banner */}
            <div className="mb-8">
              {isNewHighScoreAchieved ? (
                <div className="bg-amber-100 text-amber-800 border-2 border-[#F59E0B] rounded-xl p-3 text-xs font-bold leading-normal flex items-center justify-center gap-1.5 shadow-[2px_2px_0_#D97706]">
                  <Sparkles size={16} className="text-amber-500 animate-spin animate-pulse" />
                  Epic! You set a staggering new high score record of {stats.score} points! Can anyone top that? 🎉
                </div>
              ) : (
                <p className="text-xs text-slate-650 font-bold">
                  {highScores[gameMode] - stats.score > 0 
                    ? `Beat your high score of ${highScores[gameMode]} next time! You need only ${highScores[gameMode] - stats.score + 10} more points to top it! 😊`
                    : `Encourage another round to beat your personal high score of ${highScores[gameMode]} next time!`
                  }
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setGameState('START')}
                className="flex-1 max-w-[120px] bg-slate-100 hover:bg-slate-200 active:translate-y-0.5 text-slate-700 font-display font-black py-3 px-4 rounded-xl transition duration-150 text-xs shadow-[2px_2px_0_#94a3b8] border-2 border-slate-300 cursor-pointer"
              >
                Menu
              </button>
              <button
                onClick={startPlaying}
                className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] active:translate-y-0.5 text-slate-900 font-display font-black py-3 px-6 rounded-xl transition duration-150 text-xs shadow-[4px_4px_0_#92400E] border-2 border-[#92400E] flex items-center justify-center gap-1.5 cursor-pointer font-sans"
              >
                <RefreshCw size={14} /> Play Again!
              </button>
            </div>

          </div>
        )}

      </main>

      <footer className="max-w-md w-full mx-auto text-center z-10 py-2 border-t-2 border-indigo-200/40 mt-4">
        <p className="text-[10px] text-slate-600 font-bold tracking-tight">
          Pristinely crafted with love & creative arcade sparks for my Boyfriend ❤️
        </p>
        <p className="text-[9px] text-slate-500 font-mono mt-0.5 font-semibold">
          Pure Client-Side React • Stored Securely in LocalStorage / IndexedDB
        </p>
      </footer>
    </div>
  );
}
