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
  [[1, 1, 1, 1]],
  [[2, 2], [2, 2]],
  [[0, 3, 0], [3, 3, 3]],
  [[4, 0], [4, 0], [4, 4]],
  [[0, 5], [0, 5], [5, 5]],
  [[6, 6, 0], [0, 6, 6]],
  [[0, 7, 7], [7, 7, 0]],
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
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, BLOCK - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x * BLOCK + 1, y * BLOCK + 1, BLOCK - 2, 3);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const g = gameRef.current;
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g.board?.[r]?.[c]) drawBlock(ctx, c, r, COLORS[g.board[r][c]]);
    if (!g.gameOver && g.piece) {
      for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++)
        if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]]);
      let ghostY = g.pieceY;
      while (!collides(g.board, g.piece, g.pieceX, ghostY + 1)) ghostY++;
      if (ghostY !== g.pieceY) {
        for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++)
          if (g.piece[r][c]) { ctx.globalAlpha = 0.2; drawBlock(ctx, g.pieceX + c, ghostY + r, COLORS[g.piece[r][c]]); ctx.globalAlpha = 1; }
      }
    }
  }, []);

  const clearLines2 = useCallback((g: any) => {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (g.board[r].every((v: number) => v)) {
        g.board.splice(r, 1);
        g.board.unshift(Array(COLS).fill(0));
        cleared++; r++;
      }
    }
    if (cleared) {
      const pts = [0, 100, 300, 500, 800];
      g.score += pts[cleared] * g.level;
      g.lines += cleared;
      g.level = Math.floor(g.lines / 10) + 1;
      setScore(g.score);
      setLines(g.lines);
      setLevel(g.level);
      clearInterval(g.loop);
      g.loop = window.setInterval(() => tick(), Math.max(100, 500 - g.level * 40));
    }
  }, []);

  const spawnPiece = useCallback((g: any) => {
    g.piece = randomPiece();
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2);
    g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) {
      g.gameOver = true;
      clearInterval(g.loop);
    }
  }, []);

  const lock = useCallback(() => {
    const g = gameRef.current;
    for (let r = 0; r < g.piece.length; r++)
      for (let c = 0; c < g.piece[r].length; c++)
        if (g.piece[r][c]) g.board[g.pieceY + r][g.pieceX + c] = g.piece[r][c];
    clearLines2(g);
    spawnPiece(g);
  }, [clearLines2, spawnPiece]);

  const tick = useCallback(() => {
    const g = gameRef.current;
    if (g.paused || g.gameOver) return;
    if (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) g.pieceY++;
    else lock();
    draw();
  }, [lock, draw]);

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
              gg.board.splice(r2, 1);
              gg.board.unshift(Array(COLS).fill(0));
              cleared++; r2++;
            }
          }
          if (cleared) {
            const pts2 = [0, 100, 300, 500, 800];
            gg.score += pts2[cleared] * gg.level;
            gg.lines += cleared;
            gg.level = Math.floor(gg.lines / 10) + 1;
            setScore(gg.score); setLines(gg.lines); setLevel(gg.level);
          }
          spawnPiece(gg);
        }
        // draw
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#fafafa'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) ctx.strokeRect(c * BLOCK, r * BLOCK, BLOCK, BLOCK);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (gg.board[r][c]) drawBlock(ctx, c, r, COLORS[gg.board[r][c]]);
        if (!gg.gameOver && gg.piece) {
          for (let r = 0; r < gg.piece.length; r++) for (let c = 0; c < gg.piece[r].length; c++)
            if (gg.piece[r][c]) drawBlock(ctx, gg.pieceX + c, gg.pieceY + r, COLORS[gg.piece[r][c]]);
        }
      }, 500);
      return () => clearInterval(g.loop);
    } else {
      clearInterval(gameRef.current.loop);
    }
  }, [visible, spawnPiece]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!visible) return;
      const g = gameRef.current;
      if (g.paused || g.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': if (!collides(g.board, g.piece, g.pieceX - 1, g.pieceY)) g.pieceX--; e.preventDefault(); break;
        case 'ArrowRight': if (!collides(g.board, g.piece, g.pieceX + 1, g.pieceY)) g.pieceX++; e.preventDefault(); break;
        case 'ArrowDown':
          if (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) g.pieceY++;
          e.preventDefault(); break;
        case 'ArrowUp': {
          const r = rotate(g.piece);
          if (!collides(g.board, r, g.pieceX, g.pieceY)) g.piece = r;
          e.preventDefault(); break;
        }
        case ' ': {
          while (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) g.pieceY++;
          e.preventDefault(); break;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible]);

  const togglePause = () => {
    const g = gameRef.current;
    g.paused = !g.paused;
    setPaused(g.paused);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-foreground/10 backdrop-blur-md z-50 flex items-center justify-center flex-col gap-5">
      <div className="text-center">
        <h2 className="font-heading font-extrabold text-3xl text-primary">🎮 Spil mens du venter!</h2>
        <p className="text-muted-foreground text-sm mt-1">Opkaldet er igang — slap af med Tetris</p>
      </div>
      <div className="card-surface border-primary/30 rounded-xl px-6 py-3 flex items-center gap-4 min-w-[300px]">
        <span className="text-2xl" style={{ animation: 'ring-anim 1s infinite' }}>📞</span>
        <div>
          <div className="font-heading font-bold text-base">{currentLead.company}</div>
          <div className="text-sm text-muted-foreground">{currentLead.phone}</div>
        </div>
        <div className="font-heading font-bold text-base text-primary ml-auto">{formatTime(callSeconds)}</div>
        <button
          onClick={onEndCall}
          className="bg-destructive text-destructive-foreground border-none rounded-lg px-5 py-2.5 font-body font-semibold text-sm cursor-pointer hover:opacity-90 transition-all duration-200"
        >
          📵 Læg på
        </button>
      </div>
      <div className="flex gap-4 items-start">
        <canvas
          ref={canvasRef}
          width={200}
          height={400}
          className="border-2 border-primary/30 rounded-lg shadow-[0_0_40px_rgba(249,115,22,.15)] bg-popover"
        />
        <div className="flex flex-col gap-2 min-w-[120px]">
          {[{ label: 'Score', value: score }, { label: 'Linjer', value: lines }, { label: 'Level', value: level }].map(s => (
            <div key={s.label} className="card-surface rounded-lg px-3.5 py-2.5">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <div className="font-heading font-bold text-xl text-primary">{s.value}</div>
            </div>
          ))}
          <div className="text-[11px] text-muted-foreground px-2 py-2">
            ← → Flyt<br />↑ Rotér<br />↓ Drop<br />Space Hurtig drop
          </div>
          <button
            onClick={togglePause}
            className="bg-transparent border border-border rounded-lg py-2.5 px-3 text-muted-foreground text-sm cursor-pointer transition-all duration-200 hover:border-primary/40 hover:text-primary mt-2"
          >
            {paused ? '▶ Fortsæt' : '⏸ Pause'}
          </button>
        </div>
      </div>
    </div>
  );
};
