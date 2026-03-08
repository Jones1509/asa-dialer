import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lead } from '@/types/leads';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Phone as PhoneIcon, Mail, Globe, User, Gamepad2, Pause, Play, Trophy, Zap, Star } from 'lucide-react';

interface StamdataPanelProps {
  lead: Lead | null;
  campaignName: string;
  callActive?: boolean;
  tetrisEnabled?: boolean;
}

// ─── Shared constants ──────────────────────────────────────────────
const COLS = 10, ROWS = 20;
const COLORS = ['', '#00d4ff', '#00ff87', '#bf5af2', '#ff9f0a', '#0a84ff', '#ff375f', '#ffd60a'];
const GLOW_COLORS = ['', 'rgba(0,212,255,0.5)', 'rgba(0,255,135,0.5)', 'rgba(191,90,242,0.5)', 'rgba(255,159,10,0.5)', 'rgba(10,132,255,0.5)', 'rgba(255,55,95,0.5)', 'rgba(255,214,10,0.5)'];
const PIECES = [[[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]], [[4,0],[4,0],[4,4]], [[0,5],[0,5],[5,5]], [[6,6,0],[0,6,6]], [[0,7,7],[7,7,0]]];

// ─── Mini Tetris Lounge (identical layout, auto-scaled) ─────────────
const InlineTetris: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<any>({});
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [blockSize, setBlockSize] = useState(14);
  const [nextPiece, setNextPiece] = useState<number[][] | null>(null);
  const [holdPiece, setHoldPiece] = useState<number[][] | null>(null);
  const [combo, setCombo] = useState(0);
  const [lastClear, setLastClear] = useState<string | null>(null);
  const animRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]>([]);
  const starsRef = useRef<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  // Auto-scale
  useEffect(() => {
    const resize = () => {
      const c = containerRef.current; if (!c) return;
      const h = c.clientHeight - 10;
      const sideW = 160; // left + right panels
      const w = c.clientWidth - sideW;
      const bs = Math.floor(Math.min(h / ROWS, w / COLS));
      setBlockSize(Math.max(10, Math.min(bs, 22)));
    };
    resize();
    window.addEventListener('resize', resize);
    const obs = new ResizeObserver(resize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => { window.removeEventListener('resize', resize); obs.disconnect(); };
  }, []);

  // No music in inline tetris

  const BLOCK = blockSize;
  const PREVIEW_BLOCK = Math.max(8, Math.floor(blockSize * 0.55));

  // Stars
  useEffect(() => {
    starsRef.current = Array.from({ length: 30 }, () => ({
      x: Math.random() * COLS * 30, y: Math.random() * ROWS * 30,
      size: Math.random() * 1 + 0.3, speed: Math.random() * 0.15 + 0.05, opacity: Math.random() * 0.25 + 0.08,
    }));
  }, []);

  const spawnParticles = useCallback((row: number) => {
    const colors = ['#00d4ff', '#bf5af2', '#ff375f', '#ffd60a', '#00ff87'];
    for (let i = 0; i < 12; i++) {
      particlesRef.current.push({
        x: Math.random() * COLS * BLOCK, y: row * BLOCK + BLOCK / 2,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4 - 2,
        life: 1, maxLife: 25 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 3 + 1,
      });
    }
  }, [BLOCK]);

  const triggerShake = useCallback((i: number) => { shakeRef.current.intensity = i; }, []);
  const randomPiece = () => PIECES[Math.floor(Math.random() * PIECES.length)].map(r => [...r]);

  const collides = (board: number[][], piece: number[][], px: number, py: number) => {
    for (let r = 0; r < piece.length; r++) for (let c = 0; c < piece[r].length; c++) if (piece[r][c]) if (py + r >= ROWS || px + c < 0 || px + c >= COLS || board[py + r]?.[px + c]) return true;
    return false;
  };
  const rotate = (p: number[][]) => { const rows = p.length, cols = p[0].length; const rot = Array.from({ length: cols }, () => Array(rows).fill(0)); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) rot[c][rows - 1 - r] = p[r][c]; return rot; };
  const tryRotate = (board: number[][], piece: number[][], px: number, py: number) => { const r = rotate(piece); for (const dx of [0, -1, 1, -2, 2]) for (const dy of [0, -1]) if (!collides(board, r, px + dx, py + dy)) return { piece: r, x: px + dx, y: py + dy }; return null; };
  const getGhostY = (board: number[][], piece: number[][], px: number, py: number) => { let gy = py; while (!collides(board, piece, px, gy + 1)) gy++; return gy; };
  const shadeColor = (color: string, pct: number) => { const n = parseInt(color.replace('#', ''), 16); return `rgb(${Math.min(255, Math.max(0, (n >> 16) + pct))},${Math.min(255, Math.max(0, ((n >> 8) & 0xFF) + pct))},${Math.min(255, Math.max(0, (n & 0xFF) + pct))})`; };

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, bs: number, ghost = false) => {
    const bx = x * bs, by = y * bs;
    if (ghost) { ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.4; ctx.setLineDash([3, 2]); ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, bs - 4, bs - 4, 3); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = color; ctx.globalAlpha = 0.08; ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, bs - 4, bs - 4, 3); ctx.fill(); ctx.globalAlpha = 1; return; }
    ctx.shadowColor = glow; ctx.shadowBlur = 14;
    const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs); grad.addColorStop(0, color); grad.addColorStop(1, shadeColor(color, -30));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 4); ctx.fill(); ctx.shadowBlur = 0;
    const shine = ctx.createLinearGradient(bx, by, bx, by + bs * 0.5); shine.addColorStop(0, 'rgba(255,255,255,0.35)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, bs - 4, bs - 4, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(bx + 5, by + 5, 1.5, 0, Math.PI * 2); ctx.fill();
  };

  const spawnPiece = useCallback((g: any) => {
    g.piece = g.next || randomPiece(); g.next = randomPiece(); g.canHold = true;
    setNextPiece(g.next.map((r: number[]) => [...r]));
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) { g.gameOver = true; setGameOver(true); triggerShake(12); }
  }, [triggerShake]);

  const doHold = useCallback((g: any) => {
    if (!g.canHold) return; g.canHold = false;
    const cur = g.piece;
    if (g.hold) { g.piece = g.hold; g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0; } else spawnPiece(g);
    g.hold = cur; setHoldPiece(cur.map((r: number[]) => [...r]));
  }, [spawnPiece]);

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false; g.combo = 0; g.hold = null; g.canHold = true;
    setScore(0); setLines(0); setLevel(1); setPaused(false); setGameOver(false); setCombo(0); setLastClear(null); setHoldPiece(null);
    spawnPiece(g);
  }, [spawnPiece]);

  const render = useCallback((time: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!; const g = gameRef.current;
    const w = canvas.width, h = canvas.height;
    ctx.save();
    if (shakeRef.current.intensity > 0) {
      ctx.translate((Math.random() - 0.5) * shakeRef.current.intensity, (Math.random() - 0.5) * shakeRef.current.intensity);
      shakeRef.current.intensity *= 0.9; if (shakeRef.current.intensity < 0.5) shakeRef.current.intensity = 0;
    }
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
    bg.addColorStop(0, '#1a2035'); bg.addColorStop(0.5, '#141a2a'); bg.addColorStop(1, '#0e1320');
    ctx.fillStyle = bg; ctx.fillRect(-5, -5, w + 10, h + 10);
    // Stars
    starsRef.current.forEach(star => {
      star.y += star.speed; if (star.y > h) { star.y = 0; star.x = Math.random() * w; }
      ctx.fillStyle = `rgba(255,255,255,${star.opacity * (Math.sin(time * 0.003 + star.x) * 0.3 + 0.7)})`;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
    });
    // Grid
    ctx.strokeStyle = 'rgba(100,140,255,0.1)'; ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(w, r * BLOCK); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, h); ctx.stroke(); }
    if (!g.board) { ctx.restore(); return; }
    // Placed blocks
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g.board[r][c]) drawBlock(ctx, c, r, COLORS[g.board[r][c]], GLOW_COLORS[g.board[r][c]], BLOCK);
    if (!g.gameOver && g.piece) {
      const ghostY = getGhostY(g.board, g.piece, g.pieceX, g.pieceY);
      if (ghostY !== g.pieceY) for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, ghostY + r, COLORS[g.piece[r][c]], '', BLOCK, true);
      for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) { ctx.globalAlpha = 0.9 + Math.sin(time * 0.005) * 0.1; drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]], GLOW_COLORS[g.piece[r][c]], BLOCK); ctx.globalAlpha = 1; }
    }
    // Particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
      ctx.globalAlpha = p.life / p.maxLife; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; return p.life > 0;
    });
    if (g.gameOver) {
      ctx.fillStyle = 'rgba(5,8,15,0.85)'; ctx.fillRect(-5, -5, w + 10, h + 10);
      ctx.shadowColor = '#ff375f'; ctx.shadowBlur = 25; ctx.fillStyle = '#ff375f';
      ctx.font = `bold ${Math.max(14, Math.floor(BLOCK * 0.9))}px "Syne", sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 12); ctx.shadowBlur = 0;
      ctx.font = `${Math.max(9, Math.floor(BLOCK * 0.45))}px "DM Sans", sans-serif`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Tryk R for at starte igen', w / 2, h / 2 + 14); ctx.textAlign = 'start';
    }
    ctx.restore();
  }, [BLOCK]);

  useEffect(() => {
    initGame(); lastDropRef.current = performance.now();
    const loop = (time: number) => {
      const gg = gameRef.current; if (!gg.board) return;
      const speed = Math.max(80, 500 - (gg.level - 1) * 45);
      if (!gg.paused && !gg.gameOver && time - lastDropRef.current > speed) {
        lastDropRef.current = time;
        if (!collides(gg.board, gg.piece, gg.pieceX, gg.pieceY + 1)) gg.pieceY++;
        else {
          for (let r = 0; r < gg.piece.length; r++) for (let c = 0; c < gg.piece[r].length; c++) if (gg.piece[r][c]) gg.board[gg.pieceY + r][gg.pieceX + c] = gg.piece[r][c];
          let cleared = 0; const clearedRows: number[] = [];
          for (let r2 = ROWS - 1; r2 >= 0; r2--) { if (gg.board[r2].every((v: number) => v)) { clearedRows.push(r2); gg.board.splice(r2, 1); gg.board.unshift(Array(COLS).fill(0)); cleared++; r2++; } }
          if (cleared) {
            gg.combo++; const names = ['', 'Single ✦', 'Double ✦✦', 'Triple ✦✦✦', '★ TETRIS ★'];
            gg.score += [0, 100, 300, 500, 800][cleared] * gg.level + (gg.combo > 1 ? gg.combo * 50 : 0);
            gg.lines += cleared; gg.level = Math.floor(gg.lines / 10) + 1;
            setScore(gg.score); setLines(gg.lines); setLevel(gg.level); setCombo(gg.combo);
            setLastClear(names[cleared] + (gg.combo > 1 ? ` ×${gg.combo}` : '')); setTimeout(() => setLastClear(null), 2000);
            clearedRows.forEach(row => spawnParticles(row));
            triggerShake(cleared === 4 ? 10 : cleared * 2.5);
          } else { gg.combo = 0; setCombo(0); }
          spawnPiece(gg);
        }
      }
      render(time); animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [initGame, render, spawnParticles, triggerShake, spawnPiece]);

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
        case ' ': { while (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) { g.pieceY++; g.score += 2; } setScore(g.score); lastDropRef.current = 0; triggerShake(3); e.preventDefault(); break; }
        case 'c': case 'C': { doHold(g); e.preventDefault(); break; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [initGame, doHold, triggerShake]);

  const togglePause = () => { gameRef.current.paused = !gameRef.current.paused; setPaused(gameRef.current.paused); };

  const renderPiecePreview = (piece: number[][] | null, label: string) => (
    <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="text-[7px] text-white/25 uppercase tracking-[0.2em] font-medium mb-1">{label}</div>
      <div className="flex items-center justify-center min-h-[28px]">
        {piece ? (
          <canvas ref={(el) => { if (!el) return; const ctx = el.getContext('2d')!; ctx.clearRect(0, 0, el.width, el.height); for (let r = 0; r < piece.length; r++) for (let c = 0; c < piece[r].length; c++) if (piece[r][c]) drawBlock(ctx, c, r, COLORS[piece[r][c]], GLOW_COLORS[piece[r][c]], PREVIEW_BLOCK); }} width={piece[0].length * PREVIEW_BLOCK} height={piece.length * PREVIEW_BLOCK} className="mx-auto" />
        ) : <span className="text-white/10 text-[9px]">—</span>}
      </div>
    </div>
  );

  const btnStyle = "rounded-lg px-2 py-1 text-[8px] flex items-center justify-center gap-1 font-semibold transition-all duration-200 active:scale-95 cursor-pointer border text-white/50 hover:text-white/80";
  const btnBg = { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' };

  return (
    <div ref={containerRef} className="flex w-full h-full items-center justify-center relative">

      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-40 h-40 rounded-full opacity-[0.03] animate-pulse" style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full opacity-[0.03] animate-pulse" style={{ background: 'radial-gradient(circle, #bf5af2, transparent 70%)', animationDelay: '1s' }} />
      </div>

      <div className="flex gap-2 items-start relative z-10">
        {/* Left — Hold + Controls (identical to Lounge) */}
        <div className="flex flex-col gap-1.5" style={{ width: 70 }}>
          {renderPiecePreview(holdPiece, 'Hold (C)')}
          <div className="rounded-lg px-1.5 py-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-[6px] text-white/20 uppercase tracking-[0.15em] font-medium mb-1">Kontroller</div>
            <div className="space-y-0.5 text-[7px] text-white/25">
              {[['←→', 'Flyt'], ['↑', 'Rotér'], ['↓', 'Drop'], ['⎵', 'Hard'], ['C', 'Hold'], ['P', 'Pause']].map(([k, l]) => (
                <div key={k} className="flex items-center gap-1">
                  <kbd className="px-0.5 py-0 rounded text-[5px] bg-white/5 text-white/30 font-mono min-w-[12px] text-center">{k}</kbd>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK} className="rounded-xl"
            style={{ border: '1px solid rgba(100,140,255,0.08)', boxShadow: '0 0 40px rgba(0,212,255,0.03), inset 0 0 20px rgba(0,0,0,0.4)' }} />
          {lastClear && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-scale-in">
              <div className="font-heading font-black text-sm text-white px-3 py-1.5 rounded-xl text-center whitespace-nowrap"
                style={{ background: lastClear.includes('TETRIS') ? 'linear-gradient(135deg, rgba(255,214,10,0.9), rgba(255,159,10,0.9))' : 'linear-gradient(135deg, rgba(0,212,255,0.85), rgba(191,90,242,0.85))', textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                {lastClear}
              </div>
            </div>
          )}
          {paused && !gameOver && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl" style={{ background: 'rgba(5,8,15,0.85)', backdropFilter: 'blur(6px)' }}>
              <div className="text-center">
                <Pause size={16} className="text-cyan-400 mx-auto mb-1" />
                <div className="font-heading font-bold text-xs" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAUSE</div>
                <div className="text-white/25 text-[7px] mt-0.5">Tryk P</div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Stats (identical to Lounge) */}
        <div className="flex flex-col gap-1.5" style={{ width: 80 }}>
          {renderPiecePreview(nextPiece, 'Næste')}
          <div className="rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-1 mb-0.5"><Trophy size={6} className="text-yellow-400/60" /><span className="text-[6px] text-white/25 uppercase tracking-[0.15em]">Score</span></div>
            <div className="font-heading font-black text-xs" style={{ background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score.toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="rounded-lg px-1 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-0.5"><Zap size={5} className="text-cyan-400/50" /><span className="text-[5px] text-white/20 uppercase">Lvl</span></div>
              <div className="font-heading font-bold text-[10px] text-cyan-400">{level}</div>
            </div>
            <div className="rounded-lg px-1 py-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-0.5"><Star size={5} className="text-purple-400/50" /><span className="text-[5px] text-white/20 uppercase">Linjer</span></div>
              <div className="font-heading font-bold text-[10px] text-purple-400">{lines}</div>
            </div>
          </div>
          {combo > 1 && (
            <div className="rounded-lg px-1.5 py-0.5 text-center animate-scale-in relative overflow-hidden" style={{ border: '1px solid rgba(255,159,10,0.25)' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08), rgba(255,55,95,0.08))' }} />
              <div className="relative text-[8px] font-black uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #ff9f0a, #ff375f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔥 ×{combo}</div>
            </div>
          )}
          <button onClick={togglePause} className={btnStyle} style={btnBg}>
            {paused ? <><Play size={8} /> Fortsæt</> : <><Pause size={8} /> Pause</>}
          </button>
          <button onClick={() => initGame()} className={btnStyle} style={btnBg}>
            🔄 Genstart
          </button>
        </div>
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
      {/* Header — matches LeadsPanel and ResultPanel */}
      <div className="h-[48px] px-5 border-b border-border/40 flex items-center justify-between shrink-0">
        <span className="font-heading font-bold text-[13px] tracking-tight">Stamdata</span>
        <div className="flex items-center gap-2">
          <span className="bg-accent text-accent-foreground rounded-md px-2 py-0.5 text-[11px] font-semibold">{campaignName}</span>
          {saving && <span className="text-[11px] text-primary/60">Gemmer...</span>}
        </div>
      </div>

      {/* Fields */}
      <div className="p-5 shrink-0">
        <div className="text-[11px] text-muted-foreground/50 tabular-nums mb-4">ID: {lead.id.slice(0, 8)}</div>

        {showTetris ? (
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
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
            <div className="flex flex-col gap-1.5">
              <label className="label-clean flex items-center gap-1.5"><User size={11} /> Kontaktperson</label>
              <input className="input-clean" value={contact} onChange={e => setContact(e.target.value)} onBlur={saveStamdata} placeholder="—" />
            </div>
          </div>
        )}
      </div>

      {/* Tetris area — exact Lounge layout, auto-scaled */}
      {showTetris && (
        <div className="flex-1 min-h-0 mx-5 mb-4 rounded-2xl overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at center, #0c1020, #060810)', border: '1px solid hsl(var(--border) / 0.2)' }}>
          <InlineTetris />
        </div>
      )}
    </div>
  );
};
