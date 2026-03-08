import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Lead } from '@/types/leads';
import { Phone, PhoneOff, Gamepad2, Pause, Play, RotateCw, ChevronDown, ChevronLeft, ChevronRight, ChevronsDown } from 'lucide-react';

interface TetrisOverlayProps {
  visible: boolean;
  currentLead: Lead;
  callSeconds: number;
  formatTime: (s: number) => string;
  onEndCall: () => void;
  activeDialNumber?: string | null;
}

const COLS = 10, ROWS = 20, BLOCK = 28;
const PREVIEW_BLOCK = 16;
const COLORS = [
  '',
  '#3b82f6', // I - blue
  '#22c55e', // O - green
  '#8b5cf6', // T - purple
  '#f59e0b', // L - amber
  '#06b6d4', // J - cyan
  '#ec4899', // S - pink
  '#6366f1', // Z - indigo
];
const GLOW_COLORS = [
  '',
  'rgba(59,130,246,0.35)',
  'rgba(34,197,94,0.35)',
  'rgba(139,92,246,0.35)',
  'rgba(245,158,11,0.35)',
  'rgba(6,182,212,0.35)',
  'rgba(236,72,153,0.35)',
  'rgba(99,102,241,0.35)',
];
const PIECES = [
  [[1,1,1,1]],
  [[2,2],[2,2]],
  [[0,3,0],[3,3,3]],
  [[4,0],[4,0],[4,4]],
  [[0,5],[0,5],[5,5]],
  [[6,6,0],[0,6,6]],
  [[0,7,7],[7,7,0]],
];

export const TetrisOverlay: React.FC<TetrisOverlayProps> = ({
  visible, currentLead, callSeconds, formatTime, onEndCall, activeDialNumber,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>({});
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [nextPiece, setNextPiece] = useState<number[][] | null>(null);
  const [combo, setCombo] = useState(0);
  const [lastClear, setLastClear] = useState<string | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);

  const randomPiece = () => {
    const p = PIECES[Math.floor(Math.random() * PIECES.length)];
    return p.map(r => [...r]);
  };

  const collides = (board: number[][], piece: number[][], px: number, py: number) => {
    for (let r = 0; r < piece.length; r++)
      for (let c = 0; c < piece[r].length; c++)
        if (piece[r][c])
          if (py + r >= ROWS || px + c < 0 || px + c >= COLS || board[py + r]?.[px + c])
            return true;
    return false;
  };

  const rotate = (p: number[][]) => {
    const rows = p.length, cols = p[0].length;
    const rot = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rot[c][rows - 1 - r] = p[r][c];
    return rot;
  };

  const getGhostY = (board: number[][], piece: number[][], px: number, py: number) => {
    let gy = py;
    while (!collides(board, piece, px, gy + 1)) gy++;
    return gy;
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, blockSize: number, ghost = false) => {
    const bx = x * blockSize, by = y * blockSize;
    if (ghost) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.roundRect(bx + 2, by + 2, blockSize - 4, blockSize - 4, 4);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }
    // Glow
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(bx + 1, by + 1, blockSize - 2, blockSize - 2, 5);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Inner highlight
    const grad = ctx.createLinearGradient(bx, by, bx, by + blockSize);
    grad.addColorStop(0, 'rgba(255,255,255,0.35)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx + 2, by + 2, blockSize - 4, blockSize - 4, 4);
    ctx.fill();
    // Shine dot
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(bx + 6, by + 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const spawnPiece = useCallback((g: any) => {
    g.piece = g.next || randomPiece();
    g.next = randomPiece();
    setNextPiece(g.next.map((r: number[]) => [...r]));
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2);
    g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) {
      g.gameOver = true;
      setGameOver(true);
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const g = gameRef.current;
    const w = canvas.width, h = canvas.height;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(1, '#1e293b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(148,163,184,0.06)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(w, r * BLOCK); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, h); ctx.stroke();
    }

    if (!g.board) return;

    // Placed blocks
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (g.board[r][c])
          drawBlock(ctx, c, r, COLORS[g.board[r][c]], GLOW_COLORS[g.board[r][c]], BLOCK);

    if (!g.gameOver && g.piece) {
      // Ghost piece
      const ghostY = getGhostY(g.board, g.piece, g.pieceX, g.pieceY);
      if (ghostY !== g.pieceY) {
        for (let r = 0; r < g.piece.length; r++)
          for (let c = 0; c < g.piece[r].length; c++)
            if (g.piece[r][c])
              drawBlock(ctx, g.pieceX + c, ghostY + r, COLORS[g.piece[r][c]], '', BLOCK, true);
      }
      // Active piece
      for (let r = 0; r < g.piece.length; r++)
        for (let c = 0; c < g.piece[r].length; c++)
          if (g.piece[r][c])
            drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]], GLOW_COLORS[g.piece[r][c]], BLOCK);
    }

    // Game over overlay
    if (g.gameOver) {
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 22px "Syne", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 10);
      ctx.font = '13px "DM Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Tryk R for at starte igen', w / 2, h / 2 + 16);
      ctx.textAlign = 'start';
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      cancelAnimationFrame(animFrameRef.current);
      return;
    }
    const g = gameRef.current;
    g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false; g.combo = 0;
    setScore(0); setLines(0); setLevel(1); setPaused(false); setGameOver(false); setCombo(0); setLastClear(null);
    spawnPiece(g);
    lastDropRef.current = performance.now();

    const loop = (time: number) => {
      const gg = gameRef.current;
      if (!gg.board) return;

      const speed = Math.max(100, 500 - (gg.level - 1) * 40);

      if (!gg.paused && !gg.gameOver && time - lastDropRef.current > speed) {
        lastDropRef.current = time;
        if (!collides(gg.board, gg.piece, gg.pieceX, gg.pieceY + 1)) {
          gg.pieceY++;
        } else {
          // Lock piece
          for (let r = 0; r < gg.piece.length; r++)
            for (let c = 0; c < gg.piece[r].length; c++)
              if (gg.piece[r][c]) gg.board[gg.pieceY + r][gg.pieceX + c] = gg.piece[r][c];
          let cleared = 0;
          for (let r2 = ROWS - 1; r2 >= 0; r2--) {
            if (gg.board[r2].every((v: number) => v)) {
              gg.board.splice(r2, 1); gg.board.unshift(Array(COLS).fill(0));
              cleared++; r2++;
            }
          }
          if (cleared) {
            gg.combo++;
            const names = ['', 'Single', 'Double', 'Triple', 'Tetris!'];
            const points = [0, 100, 300, 500, 800];
            const comboBonus = gg.combo > 1 ? gg.combo * 50 : 0;
            gg.score += points[cleared] * gg.level + comboBonus;
            gg.lines += cleared;
            gg.level = Math.floor(gg.lines / 10) + 1;
            setScore(gg.score); setLines(gg.lines); setLevel(gg.level); setCombo(gg.combo);
            setLastClear(names[cleared] + (gg.combo > 1 ? ` x${gg.combo}` : ''));
            setTimeout(() => setLastClear(null), 1500);
          } else {
            gg.combo = 0;
            setCombo(0);
          }
          spawnPiece(gg);
        }
      }

      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [visible, spawnPiece, render]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!visible) return;
      const g = gameRef.current;

      if (e.key === 'r' || e.key === 'R') {
        if (g.gameOver) {
          g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
          g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false; g.combo = 0;
          setScore(0); setLines(0); setLevel(1); setPaused(false); setGameOver(false); setCombo(0);
          spawnPiece(g);
        }
        e.preventDefault();
        return;
      }

      if (e.key === 'p' || e.key === 'P') {
        g.paused = !g.paused;
        setPaused(g.paused);
        e.preventDefault();
        return;
      }

      if (g.paused || g.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': if (!collides(g.board, g.piece, g.pieceX - 1, g.pieceY)) g.pieceX--; e.preventDefault(); break;
        case 'ArrowRight': if (!collides(g.board, g.piece, g.pieceX + 1, g.pieceY)) g.pieceX++; e.preventDefault(); break;
        case 'ArrowDown': if (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) { g.pieceY++; g.score += 1; setScore(g.score); } e.preventDefault(); break;
        case 'ArrowUp': { const r = rotate(g.piece); if (!collides(g.board, r, g.pieceX, g.pieceY)) g.piece = r; e.preventDefault(); break; }
        case ' ': {
          while (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) { g.pieceY++; g.score += 2; }
          setScore(g.score);
          lastDropRef.current = 0; // Force immediate lock
          e.preventDefault();
          break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, spawnPiece]);

  const togglePause = () => { gameRef.current.paused = !gameRef.current.paused; setPaused(gameRef.current.paused); };

  if (!visible) return null;

  // Render next piece preview
  const renderNextPiece = () => {
    if (!nextPiece) return null;
    const rows = nextPiece.length;
    const cols = nextPiece[0].length;
    const pw = cols * PREVIEW_BLOCK;
    const ph = rows * PREVIEW_BLOCK;
    return (
      <canvas
        ref={(el) => {
          if (!el) return;
          const ctx = el.getContext('2d')!;
          ctx.clearRect(0, 0, el.width, el.height);
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
              if (nextPiece[r][c])
                drawBlock(ctx, c, r, COLORS[nextPiece[r][c]], GLOW_COLORS[nextPiece[r][c]], PREVIEW_BLOCK);
        }}
        width={pw}
        height={ph}
        className="mx-auto"
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center flex-col gap-5 animate-fade-in"
      style={{ background: 'linear-gradient(135deg, hsl(222 47% 8%), hsl(217 33% 12%), hsl(222 47% 8%))' }}>

      {/* Header */}
      <div className="text-center flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(263 70% 50%))' }}>
          <Gamepad2 size={20} className="text-white" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading font-bold text-lg text-white/90 tracking-tight">
          Tetris Lounge
        </h2>
      </div>

      {/* Call info bar */}
      <div className="rounded-2xl px-5 py-3 flex items-center gap-4 min-w-[340px]"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
          <Phone size={16} className="text-green-400" strokeWidth={2} />
        </div>
        <div>
          <div className="font-heading font-bold text-[14px] text-white/90 tracking-tight">
            {activeDialNumber && activeDialNumber !== currentLead.phone ? 'Manuel opkald' : currentLead.company}
          </div>
          <div className="text-[12px] text-white/40 tabular-nums">
            {activeDialNumber || currentLead.phone}
          </div>
        </div>
        <div className="font-heading font-bold text-[15px] ml-auto tabular-nums tracking-wider"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {formatTime(callSeconds)}
        </div>
        <button onClick={onEndCall}
          className="rounded-xl px-4 py-2.5 font-body font-semibold text-[12px] cursor-pointer transition-all duration-200 active:scale-95 flex items-center gap-1.5 border-none text-white"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.3)' }}>
          <PhoneOff size={14} strokeWidth={2} />
          Læg på
        </button>
      </div>

      {/* Game area */}
      <div className="flex gap-5 items-start">
        {/* Canvas with border glow */}
        <div className="relative">
          <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK}
            className="rounded-2xl relative z-10"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 60px rgba(99,102,241,0.08), inset 0 0 30px rgba(0,0,0,0.3)',
            }} />
          {/* Line clear notification */}
          {lastClear && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-fade-in">
              <div className="font-heading font-bold text-2xl text-white px-5 py-2 rounded-xl"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.8), rgba(139,92,246,0.8))', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                {lastClear}
              </div>
            </div>
          )}
          {/* Pause overlay */}
          {paused && !gameOver && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
              style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)' }}>
              <div className="text-center">
                <Pause size={32} className="text-white/60 mx-auto mb-2" />
                <div className="font-heading font-bold text-lg text-white/80">Pause</div>
                <div className="text-white/40 text-xs mt-1">Tryk P for at fortsætte</div>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-3 min-w-[130px]">
          {/* Next piece */}
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-medium mb-2">Næste</div>
            <div className="flex items-center justify-center min-h-[48px]">
              {renderNextPiece()}
            </div>
          </div>

          {/* Stats */}
          {[
            { label: 'Score', value: score.toLocaleString(), gradient: true },
            { label: 'Linjer', value: lines },
            { label: 'Level', value: level },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-medium">{s.label}</div>
              {s.gradient ? (
                <div className="font-heading font-bold text-lg mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {s.value}
                </div>
              ) : (
                <div className="font-heading font-bold text-lg text-white/80 mt-0.5">{s.value}</div>
              )}
            </div>
          ))}

          {/* Combo indicator */}
          {combo > 1 && (
            <div className="rounded-xl px-3 py-2 text-center animate-fade-in"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(236,72,153,0.15))', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">🔥 Combo x{combo}</div>
            </div>
          )}

          {/* Controls */}
          <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-medium mb-2">Kontroller</div>
            <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
              <div />
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <RotateCw size={11} className="text-white/50" />
              </div>
              <div />
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <ChevronLeft size={11} className="text-white/50" />
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <ChevronDown size={11} className="text-white/50" />
              </div>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <ChevronRight size={11} className="text-white/50" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 justify-center">
              <div className="h-5 rounded px-2 flex items-center justify-center text-[9px] text-white/40 font-medium" style={{ background: 'rgba(255,255,255,0.06)' }}>
                Space
              </div>
              <span className="text-[9px] text-white/25">= Hard drop</span>
            </div>
          </div>

          {/* Pause button */}
          <button onClick={togglePause}
            className="rounded-xl px-3 py-2.5 text-[12px] flex items-center justify-center gap-1.5 font-medium transition-all duration-200 active:scale-95 cursor-pointer border-none text-white/70 hover:text-white/90"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            {paused ? <><Play size={13} /> Fortsæt</> : <><Pause size={13} /> Pause (P)</>}
          </button>
        </div>
      </div>
    </div>
  );
};
