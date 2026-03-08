import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Lead } from '@/types/leads';

interface TetrisOverlayProps {
  visible: boolean;
  currentLead: Lead;
  callSeconds: number;
  formatTime: (s: number) => string;
  onEndCall: () => void;
}

const COLS = 10, ROWS = 20, BLOCK = 20;
const COLORS = ['', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f59e0b', '#06b6d4'];
const PIECES = [
  [[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]],
  [[4,0],[4,0],[4,4]], [[0,5],[0,5],[5,5]],
  [[6,6,0],[0,6,6]], [[0,7,7],[7,7,0]],
];

export const TetrisOverlay: React.FC<TetrisOverlayProps> = ({
  visible, currentLead, callSeconds, formatTime, onEndCall,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>({});
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);

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

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(x * BLOCK + 2, y * BLOCK + 2, BLOCK - 4, 3);
  };

  const spawnPiece = useCallback((g: any) => {
    g.piece = randomPiece();
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2);
    g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) {
      g.gameOver = true;
      clearInterval(g.loop);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      const g = gameRef.current;
      g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false;
      setScore(0); setLines(0); setLevel(1); setPaused(false);
      spawnPiece(g);
      clearInterval(g.loop);
      g.loop = window.setInterval(() => {
        const gg = gameRef.current;
        if (gg.paused || gg.gameOver) return;
        if (!collides(gg.board, gg.piece, gg.pieceX, gg.pieceY + 1)) gg.pieceY++;
        else {
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
            gg.score += [0,100,300,500,800][cleared] * gg.level;
            gg.lines += cleared;
            gg.level = Math.floor(gg.lines / 10) + 1;
            setScore(gg.score); setLines(gg.lines); setLevel(gg.level);
          }
          spawnPiece(gg);
        }
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#fafbfc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(0,0,0,0.04)';
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (gg.board[r][c]) drawBlock(ctx, c, r, COLORS[gg.board[r][c]]);
        if (!gg.gameOver && gg.piece) {
          for (let r = 0; r < gg.piece.length; r++) for (let c = 0; c < gg.piece[r].length; c++)
            if (gg.piece[r][c]) drawBlock(ctx, gg.pieceX + c, gg.pieceY + r, COLORS[gg.piece[r][c]]);
        }
      }, 500);
      return () => clearInterval(g.loop);
    } else { clearInterval(gameRef.current.loop); }
  }, [visible, spawnPiece]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!visible) return;
      const g = gameRef.current;
      if (g.paused || g.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': if (!collides(g.board, g.piece, g.pieceX - 1, g.pieceY)) g.pieceX--; e.preventDefault(); break;
        case 'ArrowRight': if (!collides(g.board, g.piece, g.pieceX + 1, g.pieceY)) g.pieceX++; e.preventDefault(); break;
        case 'ArrowDown': if (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) g.pieceY++; e.preventDefault(); break;
        case 'ArrowUp': { const r = rotate(g.piece); if (!collides(g.board, r, g.pieceX, g.pieceY)) g.piece = r; e.preventDefault(); break; }
        case ' ': { while (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) g.pieceY++; e.preventDefault(); break; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible]);

  const togglePause = () => { gameRef.current.paused = !gameRef.current.paused; setPaused(gameRef.current.paused); };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-2xl z-50 flex items-center justify-center flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <h2 className="font-heading font-extrabold text-3xl bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
          🎮 Spil mens du venter!
        </h2>
        <p className="text-muted-foreground text-sm mt-2">Opkaldet er igang — slap af med Tetris</p>
      </div>
      <div className="glass-surface border-primary/20 rounded-2xl px-6 py-4 flex items-center gap-5 min-w-[340px]">
        <span className="text-2xl" style={{ animation: 'ring-anim 1s infinite' }}>📞</span>
        <div>
          <div className="font-heading font-bold text-[15px] tracking-tight">{currentLead.company}</div>
          <div className="text-sm text-muted-foreground tabular-nums">{currentLead.phone}</div>
        </div>
        <div className="font-heading font-bold text-base text-primary ml-auto tabular-nums tracking-wider">{formatTime(callSeconds)}</div>
        <button onClick={onEndCall}
          className="bg-destructive text-destructive-foreground border-none rounded-xl px-5 py-2.5 font-body font-semibold text-sm cursor-pointer hover:shadow-[0_4px_16px_hsl(0_72%_51%/0.3)] transition-all duration-300 active:scale-95">
          📵 Læg på
        </button>
      </div>
      <div className="flex gap-5 items-start">
        <canvas ref={canvasRef} width={200} height={400}
          className="border border-border/40 rounded-2xl bg-card"
          style={{ boxShadow: '0 8px 32px rgba(249,115,22,0.08)' }} />
        <div className="flex flex-col gap-3 min-w-[130px]">
          {[{ label: 'Score', value: score }, { label: 'Linjer', value: lines }, { label: 'Level', value: level }].map(s => (
            <div key={s.label} className="card-surface rounded-xl px-4 py-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-medium">{s.label}</div>
              <div className="font-heading font-bold text-xl text-primary mt-0.5">{s.value}</div>
            </div>
          ))}
          <div className="text-[11px] text-muted-foreground/60 px-2 py-2 leading-relaxed">
            ← → Flyt<br/>↑ Rotér<br/>↓ Drop<br/>Space Hurtig drop
          </div>
          <button onClick={togglePause} className="btn-ghost-smooth text-[13px]">
            {paused ? '▶ Fortsæt' : '⏸ Pause'}
          </button>
        </div>
      </div>
    </div>
  );
};
