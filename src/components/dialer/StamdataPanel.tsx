import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lead } from '@/types/leads';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Phone as PhoneIcon, Mail, Globe, User, Gamepad2, Pause, Play, Trophy } from 'lucide-react';

interface StamdataPanelProps {
  lead: Lead | null;
  campaignName: string;
  callActive?: boolean;
  tetrisEnabled?: boolean;
}

// ─── Inline Mini Tetris ─────────────────────────────────────────────
const COLS = 10, ROWS = 20;
const COLORS = ['', '#00d4ff', '#00ff87', '#bf5af2', '#ff9f0a', '#0a84ff', '#ff375f', '#ffd60a'];
const GLOW = ['', 'rgba(0,212,255,0.3)', 'rgba(0,255,135,0.3)', 'rgba(191,90,242,0.3)', 'rgba(255,159,10,0.3)', 'rgba(10,132,255,0.3)', 'rgba(255,55,95,0.3)', 'rgba(255,214,10,0.3)'];
const PIECES = [[[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]], [[4,0],[4,0],[4,4]], [[0,5],[0,5],[5,5]], [[6,6,0],[0,6,6]], [[0,7,7],[7,7,0]]];

const InlineTetris: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>({});
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [blockSize, setBlockSize] = useState(12);
  const animRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);

  // Auto-scale to fit container
  useEffect(() => {
    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const h = container.clientHeight - 40; // leave room for header
      const w = container.clientWidth - 24;
      const bs = Math.floor(Math.min(h / ROWS, w / COLS));
      setBlockSize(Math.max(8, Math.min(bs, 18)));
    };
    resize();
    window.addEventListener('resize', resize);
    const obs = new ResizeObserver(resize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => { window.removeEventListener('resize', resize); obs.disconnect(); };
  }, []);

  const BLOCK = blockSize;

  const randomPiece = () => PIECES[Math.floor(Math.random() * PIECES.length)].map(r => [...r]);

  const collides = (board: number[][], piece: number[][], px: number, py: number) => {
    for (let r = 0; r < piece.length; r++)
      for (let c = 0; c < piece[r].length; c++)
        if (piece[r][c] && (py + r >= ROWS || px + c < 0 || px + c >= COLS || board[py + r]?.[px + c]))
          return true;
    return false;
  };

  const rotate = (p: number[][]) => {
    const rows = p.length, cols = p[0].length;
    const rot = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rot[c][rows - 1 - r] = p[r][c];
    return rot;
  };

  const tryRotate = (board: number[][], piece: number[][], px: number, py: number) => {
    const r = rotate(piece);
    for (const dx of [0, -1, 1, -2, 2]) for (const dy of [0, -1]) if (!collides(board, r, px + dx, py + dy)) return { piece: r, x: px + dx, y: py + dy };
    return null;
  };

  const getGhostY = (board: number[][], piece: number[][], px: number, py: number) => {
    let gy = py; while (!collides(board, piece, px, gy + 1)) gy++; return gy;
  };

  const shadeColor = (color: string, pct: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    return `rgb(${Math.min(255, Math.max(0, (num >> 16) + pct))},${Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + pct))},${Math.min(255, Math.max(0, (num & 0xFF) + pct))})`;
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, bs: number, ghost = false) => {
    const bx = x * bs, by = y * bs;
    if (ghost) {
      ctx.strokeStyle = color; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.15; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 1); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; return;
    }
    ctx.shadowColor = glow; ctx.shadowBlur = 6;
    const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
    grad.addColorStop(0, color); grad.addColorStop(1, shadeColor(color, -30));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(bx + 0.5, by + 0.5, bs - 1, bs - 1, 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.roundRect(bx + 0.5, by + 0.5, bs - 1, bs - 1, 2); ctx.stroke();
  };

  const spawnPiece = useCallback((g: any) => {
    g.piece = g.next || randomPiece(); g.next = randomPiece(); g.canHold = true;
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) { g.gameOver = true; setGameOver(true); }
  }, []);

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false; g.combo = 0;
    setScore(0); setLines(0); setLevel(1); setPaused(false); setGameOver(false);
    spawnPiece(g);
  }, [spawnPiece]);

  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const g = gameRef.current;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#080c18'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(100,140,255,0.03)'; ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(w, r * BLOCK); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, h); ctx.stroke(); }
    if (!g.board) return;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g.board[r][c]) drawBlock(ctx, c, r, COLORS[g.board[r][c]], GLOW[g.board[r][c]], BLOCK);
    if (!g.gameOver && g.piece) {
      const gy = getGhostY(g.board, g.piece, g.pieceX, g.pieceY);
      if (gy !== g.pieceY) for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, gy + r, COLORS[g.piece[r][c]], '', BLOCK, true);
      for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]], GLOW[g.piece[r][c]], BLOCK);
    }
    if (g.gameOver) {
      ctx.fillStyle = 'rgba(5,8,15,0.8)'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff375f'; ctx.font = 'bold 12px "Syne", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 5);
      ctx.font = '9px "DM Sans", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText('Tryk R', w / 2, h / 2 + 10); ctx.textAlign = 'start';
    }
  }, []);

  useEffect(() => {
    initGame(); lastDropRef.current = performance.now();
    const loop = (time: number) => {
      const g = gameRef.current; if (!g.board) return;
      const speed = Math.max(80, 500 - (g.level - 1) * 45);
      if (!g.paused && !g.gameOver && time - lastDropRef.current > speed) {
        lastDropRef.current = time;
        if (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) g.pieceY++;
        else {
          for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) g.board[g.pieceY + r][g.pieceX + c] = g.piece[r][c];
          let cleared = 0;
          for (let r2 = ROWS - 1; r2 >= 0; r2--) { if (g.board[r2].every((v: number) => v)) { g.board.splice(r2, 1); g.board.unshift(Array(COLS).fill(0)); cleared++; r2++; } }
          if (cleared) {
            g.combo++; g.score += [0, 100, 300, 500, 800][cleared] * g.level + (g.combo > 1 ? g.combo * 50 : 0);
            g.lines += cleared; g.level = Math.floor(g.lines / 10) + 1;
            setScore(g.score); setLines(g.lines); setLevel(g.level);
          } else { g.combo = 0; }
          spawnPiece(g);
        }
      }
      render(); animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [initGame, render, spawnPiece]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.key === 'r' || e.key === 'R') { if (g.gameOver) initGame(); e.preventDefault(); return; }
      if (e.key === 'p' || e.key === 'P') { g.paused = !g.paused; setPaused(g.paused); e.preventDefault(); return; }
      if (g.paused || g.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': if (!collides(g.board, g.piece, g.pieceX - 1, g.pieceY)) g.pieceX--; e.preventDefault(); break;
        case 'ArrowRight': if (!collides(g.board, g.piece, g.pieceX + 1, g.pieceY)) g.pieceX++; e.preventDefault(); break;
        case 'ArrowDown': if (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) { g.pieceY++; g.score += 1; setScore(g.score); } e.preventDefault(); break;
        case 'ArrowUp': { const res = tryRotate(g.board, g.piece, g.pieceX, g.pieceY); if (res) { g.piece = res.piece; g.pieceX = res.x; g.pieceY = res.y; } e.preventDefault(); break; }
        case ' ': { while (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) { g.pieceY++; g.score += 2; } setScore(g.score); lastDropRef.current = 0; e.preventDefault(); break; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [initGame]);

  const togglePause = () => { gameRef.current.paused = !gameRef.current.paused; setPaused(gameRef.current.paused); };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center gap-1.5">
          <Gamepad2 size={12} className="text-primary/60" />
          <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">Tetris</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/50">
            <Trophy size={8} className="text-yellow-500/60" />
            <span className="text-[9px] font-bold text-foreground/60 tabular-nums">{score.toLocaleString()}</span>
          </div>
          <div className="px-1.5 py-0.5 rounded bg-muted/50 text-[9px] font-medium text-foreground/50">Lvl {level}</div>
          <button onClick={togglePause} className="p-1 rounded hover:bg-muted/80 transition-colors cursor-pointer text-muted-foreground/50 hover:text-foreground/70">
            {paused ? <Play size={10} /> : <Pause size={10} />}
          </button>
          <button onClick={initGame} className="px-1.5 py-0.5 rounded hover:bg-muted/80 transition-colors cursor-pointer text-[9px] text-muted-foreground/50 hover:text-foreground/70">
            🔄
          </button>
        </div>
      </div>
      <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid hsl(var(--border) / 0.3)' }}>
        <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK} />
        {paused && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: 'rgba(5,8,15,0.8)' }}>
            <div className="text-center">
              <Pause size={12} className="text-cyan-400 mx-auto mb-0.5" />
              <div className="text-[9px] font-bold text-white/60">PAUSE</div>
              <div className="text-[7px] text-white/25 mt-0.5">Tryk P</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── StamdataPanel ─────────────────────────────────────────────────
export const StamdataPanel: React.FC<StamdataPanelProps> = ({ lead, campaignName, callActive, tetrisEnabled }) => {
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setCompany(lead.company || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setWebsite(lead.website || '');
      setContact(lead.contact_person || '');
    }
  }, [lead]);

  const saveStamdata = async () => {
    if (!lead) return;
    setSaving(true);
    await supabase.from('leads').update({
      company, phone, email, website, contact_person: contact,
    }).eq('id', lead.id);
    setSaving(false);
  };

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-[13px]">Vælg en kampagne for at starte</div>
      </div>
    );
  }

  const showTetris = callActive && tetrisEnabled;

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in bg-background">
      {/* Top section: Campaign + Stamdata */}
      <div className="p-5 pb-3 shrink-0">
        {/* Campaign badge */}
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-accent text-accent-foreground rounded-md px-2.5 py-1 text-[11px] font-semibold">{campaignName}</span>
          <span className="text-[11px] text-muted-foreground/50 tabular-nums">ID: {lead.id.slice(0, 8)}</span>
          {saving && <span className="text-[11px] text-primary/60 ml-auto">Gemmer...</span>}
        </div>

        <h2 className="font-heading font-bold text-base tracking-tight mb-3">Stamdata</h2>

        {showTetris ? (
          /* Compact horizontal layout during calls */
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label-clean flex items-center gap-1"><Building2 size={10} /> Virksomhed</label>
              <input className="input-clean text-[12px]" value={company} onChange={e => setCompany(e.target.value)} onBlur={saveStamdata} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-clean flex items-center gap-1"><PhoneIcon size={10} /> Telefon</label>
              <input className="input-clean text-[12px]" value={phone} onChange={e => setPhone(e.target.value)} onBlur={saveStamdata} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-clean flex items-center gap-1"><User size={10} /> Kontaktperson</label>
              <input className="input-clean text-[12px]" value={contact} onChange={e => setContact(e.target.value)} onBlur={saveStamdata} placeholder="—" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-clean flex items-center gap-1"><Mail size={10} /> Email</label>
              <input className="input-clean text-[12px]" value={email} onChange={e => setEmail(e.target.value)} onBlur={saveStamdata} placeholder="—" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-clean flex items-center gap-1"><Globe size={10} /> Hjemmeside</label>
              <input className="input-clean text-[12px]" value={website} onChange={e => setWebsite(e.target.value)} onBlur={saveStamdata} />
            </div>
          </div>
        ) : (
          /* Normal spacious layout */
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="label-clean flex items-center gap-1.5"><Building2 size={11} /> Virksomhed</label>
              <input className="input-clean" value={company} onChange={e => setCompany(e.target.value)} onBlur={saveStamdata} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-clean flex items-center gap-1.5"><PhoneIcon size={11} /> Telefon</label>
              <input className="input-clean" value={phone} onChange={e => setPhone(e.target.value)} onBlur={saveStamdata} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-clean flex items-center gap-1.5"><Mail size={11} /> Email</label>
              <input className="input-clean" value={email} onChange={e => setEmail(e.target.value)} onBlur={saveStamdata} placeholder="—" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-clean flex items-center gap-1.5"><Globe size={11} /> Hjemmeside</label>
              <input className="input-clean" value={website} onChange={e => setWebsite(e.target.value)} onBlur={saveStamdata} />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="label-clean flex items-center gap-1.5"><User size={11} /> Kontaktperson</label>
              <input className="input-clean" value={contact} onChange={e => setContact(e.target.value)} onBlur={saveStamdata} placeholder="—" />
            </div>
          </div>
        )}
      </div>

      {/* Tetris area — fills remaining space */}
      {showTetris && (
        <div className="flex-1 min-h-0 mx-5 mb-4 rounded-xl overflow-hidden flex items-center justify-center"
          style={{ background: 'radial-gradient(ellipse at center, #0c1020, #060810)', border: '1px solid hsl(var(--border) / 0.2)' }}>
          <InlineTetris />
        </div>
      )}
    </div>
  );
};
