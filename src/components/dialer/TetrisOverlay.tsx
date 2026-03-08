import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Lead } from '@/types/leads';
import { Phone, PhoneOff, Gamepad2, Pause, Play } from 'lucide-react';

interface TetrisOverlayProps {
  visible: boolean;
  currentLead: Lead;
  callSeconds: number;
  formatTime: (s: number) => string;
  onEndCall: () => void;
  activeDialNumber?: string | null;
}

const COLS = 10, ROWS = 20, BLOCK = 20;
const COLORS = ['', '#3b82f6', '#22c55e', '#06b6d4', '#a855f7', '#ec4899', '#f59e0b', '#6366f1'];
const PIECES = [
  [[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]],
  [[4,0],[4,0],[4,4]], [[0,5],[0,5],[5,5]],
  [[6,6,0],[0,6,6]], [[0,7,7],[7,7,0]],
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
        ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-2xl z-50 flex items-center justify-center flex-col gap-5 animate-fade-in">
      <div className="text-center flex flex-col items-center gap-2">
        <Gamepad2 size={28} className="text-primary" strokeWidth={1.5} />
        <h2 className="font-heading font-bold text-xl text-foreground tracking-tight">
          Spil mens du venter
        </h2>
        <p className="text-muted-foreground/60 text-[13px]">Opkaldet er i gang</p>
      </div>
      <div className="glass-surface border-primary/15 rounded-xl px-5 py-3 flex items-center gap-4 min-w-[320px]">
        <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
          <Phone size={15} className="text-success" strokeWidth={2} />
        </div>
        <div>
          <div className="font-heading font-bold text-[14px] tracking-tight">
            {activeDialNumber && activeDialNumber !== currentLead.phone ? 'Manuel opkald' : currentLead.company}
          </div>
          <div className="text-[12px] text-muted-foreground/50 tabular-nums">
            {activeDialNumber || currentLead.phone}
          </div>
        </div>
        <div className="font-heading font-bold text-[14px] text-primary ml-auto tabular-nums tracking-wider">{formatTime(callSeconds)}</div>
        <button onClick={onEndCall}
          className="bg-destructive text-destructive-foreground border-none rounded-lg px-4 py-2 font-body font-semibold text-[12px] cursor-pointer hover:shadow-[0_3px_12px_hsl(0_72%_51%/0.25)] transition-all duration-200 active:scale-95 flex items-center gap-1.5">
          <PhoneOff size={14} strokeWidth={2} />
          Læg på
        </button>
      </div>
      <div className="flex gap-4 items-start">
        <canvas ref={canvasRef} width={200} height={400}
          className="border border-border/30 rounded-xl bg-card"
          style={{ boxShadow: '0 6px 24px hsl(217 91% 60% / 0.06)' }} />
        <div className="flex flex-col gap-2.5 min-w-[120px]">
          {[{ label: 'Score', value: score }, { label: 'Linjer', value: lines }, { label: 'Level', value: level }].map(s => (
            <div key={s.label} className="card-surface rounded-lg px-3.5 py-2.5">
              <div className="text-[9px] text-muted-foreground/50 uppercase tracking-widest font-medium">{s.label}</div>
              <div className="font-heading font-bold text-lg text-primary mt-0.5">{s.value}</div>
            </div>
          ))}
          <div className="text-[10px] text-muted-foreground/40 px-2 py-1.5 leading-relaxed">
            ← → Flyt<br/>↑ Rotér<br/>↓ Drop<br/>Space Hurtig
          </div>
          <button onClick={togglePause} className="btn-ghost-smooth text-[12px] flex items-center justify-center gap-1.5">
            {paused ? <><Play size={13} /> Fortsæt</> : <><Pause size={13} /> Pause</>}
          </button>
        </div>
      </div>
    </div>
  );
};
