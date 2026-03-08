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
  const [blockSize, setBlockSize] = useState(14);
  const [nextPiece, setNextPiece] = useState<number[][] | null>(null);
  const [holdPiece, setHoldPiece] = useState<number[][] | null>(null);
  const [combo, setCombo] = useState(0);
  const [lastClear, setLastClear] = useState<string | null>(null);
  const animRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number }[]>([]);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  useEffect(() => {
    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      const h = container.clientHeight - 44;
      const w = container.clientWidth - 160; // room for side panels
      const bs = Math.floor(Math.min(h / ROWS, w / COLS));
      setBlockSize(Math.max(10, Math.min(bs, 20)));
    };
    resize();
    window.addEventListener('resize', resize);
    const obs = new ResizeObserver(resize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => { window.removeEventListener('resize', resize); obs.disconnect(); };
  }, []);

  const BLOCK = blockSize;
  const PREVIEW_BLOCK = Math.max(8, Math.floor(blockSize * 0.55));

  const randomPiece = () => PIECES[Math.floor(Math.random() * PIECES.length)].map(r => [...r]);
  const triggerShake = useCallback((intensity: number) => { shakeRef.current.intensity = intensity; }, []);

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
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.25; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; return;
    }
    ctx.shadowColor = glow; ctx.shadowBlur = 12;
    const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
    grad.addColorStop(0, color); grad.addColorStop(1, shadeColor(color, -30));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 3); ctx.fill();
    ctx.shadowBlur = 0;
    // Inner shine
    const shine = ctx.createLinearGradient(bx, by, bx, by + bs * 0.5);
    shine.addColorStop(0, 'rgba(255,255,255,0.3)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, bs - 4, bs - 4, 2); ctx.fill();
    // Shine dot
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(bx + 5, by + 5, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 3); ctx.stroke();
  };

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

  const spawnPiece = useCallback((g: any) => {
    g.piece = g.next || randomPiece(); g.next = randomPiece(); g.canHold = true;
    setNextPiece(g.next.map((r: number[]) => [...r]));
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) { g.gameOver = true; setGameOver(true); triggerShake(10); }
  }, [triggerShake]);

  const doHold = useCallback((g: any) => {
    if (!g.canHold) return; g.canHold = false;
    const current = g.piece;
    if (g.hold) { g.piece = g.hold; g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0; }
    else spawnPiece(g);
    g.hold = current; setHoldPiece(current.map((r: number[]) => [...r]));
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
    const ctx = canvas.getContext('2d')!;
    const g = gameRef.current;
    const w = canvas.width, h = canvas.height;

    ctx.save();
    if (shakeRef.current.intensity > 0) {
      ctx.translate((Math.random() - 0.5) * shakeRef.current.intensity, (Math.random() - 0.5) * shakeRef.current.intensity);
      shakeRef.current.intensity *= 0.9; if (shakeRef.current.intensity < 0.5) shakeRef.current.intensity = 0;
    }

    // Background with subtle radial gradient
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
    bg.addColorStop(0, '#0c1020'); bg.addColorStop(1, '#060810');
    ctx.fillStyle = bg; ctx.fillRect(-5, -5, w + 10, h + 10);

    // Brighter grid
    ctx.strokeStyle = 'rgba(100,140,255,0.06)'; ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(w, r * BLOCK); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, h); ctx.stroke(); }

    // Bottom glow line
    const bottomGlow = ctx.createLinearGradient(0, h - 3, 0, h);
    bottomGlow.addColorStop(0, 'rgba(0,212,255,0)'); bottomGlow.addColorStop(1, 'rgba(0,212,255,0.12)');
    ctx.fillStyle = bottomGlow; ctx.fillRect(0, h - 3, w, 3);

    if (!g.board) { ctx.restore(); return; }

    // Placed blocks
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g.board[r][c]) drawBlock(ctx, c, r, COLORS[g.board[r][c]], GLOW[g.board[r][c]], BLOCK);

    if (!g.gameOver && g.piece) {
      // Ghost piece — more visible
      const gy = getGhostY(g.board, g.piece, g.pieceX, g.pieceY);
      if (gy !== g.pieceY) for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, gy + r, COLORS[g.piece[r][c]], '', BLOCK, true);
      // Active piece with pulse
      const pulse = Math.sin(time * 0.005) * 0.1 + 1;
      for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) {
        ctx.globalAlpha = 0.9 + pulse * 0.1;
        drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]], GLOW[g.piece[r][c]], BLOCK);
        ctx.globalAlpha = 1;
      }
    }

    // Particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life--;
      const alpha = p.life / p.maxLife; ctx.globalAlpha = alpha; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      return p.life > 0;
    });

    // Game over
    if (g.gameOver) {
      ctx.fillStyle = 'rgba(5,8,15,0.85)'; ctx.fillRect(-5, -5, w + 10, h + 10);
      ctx.shadowColor = '#ff375f'; ctx.shadowBlur = 20;
      ctx.fillStyle = '#ff375f'; ctx.font = `bold ${Math.max(14, BLOCK)}px "Syne", sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 8); ctx.shadowBlur = 0;
      ctx.font = `${Math.max(9, BLOCK * 0.65)}px "DM Sans", sans-serif`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Tryk R for genstart', w / 2, h / 2 + 14); ctx.textAlign = 'start';
    }
    ctx.restore();
  }, [BLOCK]);

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
          let cleared = 0; const clearedRows: number[] = [];
          for (let r2 = ROWS - 1; r2 >= 0; r2--) { if (g.board[r2].every((v: number) => v)) { clearedRows.push(r2); g.board.splice(r2, 1); g.board.unshift(Array(COLS).fill(0)); cleared++; r2++; } }
          if (cleared) {
            g.combo++; g.score += [0, 100, 300, 500, 800][cleared] * g.level + (g.combo > 1 ? g.combo * 50 : 0);
            g.lines += cleared; g.level = Math.floor(g.lines / 10) + 1;
            setScore(g.score); setLines(g.lines); setLevel(g.level); setCombo(g.combo);
            const names = ['', 'Single ✦', 'Double ✦✦', 'Triple ✦✦✦', '★ TETRIS ★'];
            setLastClear(names[cleared] + (g.combo > 1 ? ` ×${g.combo}` : '')); setTimeout(() => setLastClear(null), 2000);
            clearedRows.forEach(row => spawnParticles(row)); triggerShake(cleared === 4 ? 8 : cleared * 2);
          } else { g.combo = 0; setCombo(0); }
          spawnPiece(g);
        }
      }
      render(time); animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [initGame, render, spawnPiece, spawnParticles, triggerShake]);

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

  const renderPreview = (piece: number[][] | null, label: string) => (
    <div className="rounded-md p-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="text-[7px] text-white/20 uppercase tracking-[0.15em] font-medium mb-1">{label}</div>
      <div className="flex items-center justify-center min-h-[28px]">
        {piece ? (
          <canvas ref={(el) => { if (!el) return; const ctx = el.getContext('2d')!; ctx.clearRect(0, 0, el.width, el.height);
            for (let r = 0; r < piece.length; r++) for (let c = 0; c < piece[r].length; c++) if (piece[r][c]) drawBlock(ctx, c, r, COLORS[piece[r][c]], GLOW[piece[r][c]], PREVIEW_BLOCK);
          }} width={piece[0].length * PREVIEW_BLOCK} height={piece.length * PREVIEW_BLOCK} />
        ) : <span className="text-white/10 text-[8px]">—</span>}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full p-2">
      {/* Header bar */}
      <div className="flex items-center gap-2 w-full mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <Gamepad2 size={11} className="text-cyan-400/60" />
          <span className="text-[9px] font-semibold text-white/40 uppercase tracking-wider">Tetris</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <Trophy size={7} className="text-yellow-400/60" />
            <span className="text-[8px] font-bold text-white/50 tabular-nums">{score.toLocaleString()}</span>
          </div>
          <div className="px-1.5 py-0.5 rounded text-[8px] font-medium text-cyan-400/50" style={{ background: 'rgba(255,255,255,0.03)' }}>Lvl {level}</div>
          <div className="px-1.5 py-0.5 rounded text-[8px] font-medium text-purple-400/50" style={{ background: 'rgba(255,255,255,0.03)' }}>{lines} lin</div>
          <button onClick={togglePause} className="p-0.5 rounded transition-colors cursor-pointer text-white/25 hover:text-white/60" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {paused ? <Play size={9} /> : <Pause size={9} />}
          </button>
          <button onClick={initGame} className="px-1 py-0.5 rounded transition-colors cursor-pointer text-[8px] text-white/25 hover:text-white/60" style={{ background: 'rgba(255,255,255,0.03)' }}>
            🔄
          </button>
        </div>
      </div>

      {/* Game area with side panels */}
      <div className="flex-1 flex items-center justify-center gap-2 min-h-0">
        {/* Left: Hold */}
        <div className="flex flex-col gap-1.5" style={{ width: 60 }}>
          {renderPreview(holdPiece, 'Hold (C)')}
          <div className="rounded-md px-1.5 py-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="text-[6px] text-white/15 uppercase tracking-wider mb-0.5">Keys</div>
            <div className="space-y-0 text-[7px] text-white/20">
              <div>←→ Flyt</div>
              <div>↑ Rotér</div>
              <div>↓ Drop</div>
              <div>⎵ Hard</div>
              <div>C Hold</div>
              <div>P Pause</div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative rounded-lg overflow-hidden" style={{ border: '1px solid rgba(100,140,255,0.08)', boxShadow: '0 0 30px rgba(0,212,255,0.03), inset 0 0 15px rgba(0,0,0,0.3)' }}>
          <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK} />
          {lastClear && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-scale-in">
              <div className="font-heading font-black text-sm text-white px-3 py-1.5 rounded-lg text-center whitespace-nowrap"
                style={{ background: lastClear.includes('TETRIS') ? 'linear-gradient(135deg, rgba(255,214,10,0.9), rgba(255,159,10,0.9))' : 'linear-gradient(135deg, rgba(0,212,255,0.85), rgba(191,90,242,0.85))', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {lastClear}
              </div>
            </div>
          )}
          {paused && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg" style={{ background: 'rgba(5,8,15,0.85)', backdropFilter: 'blur(4px)' }}>
              <div className="text-center">
                <Pause size={14} className="text-cyan-400 mx-auto mb-1" />
                <div className="font-heading font-bold text-xs" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAUSE</div>
                <div className="text-white/25 text-[7px] mt-0.5">Tryk P</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Next + Combo */}
        <div className="flex flex-col gap-1.5" style={{ width: 60 }}>
          {renderPreview(nextPiece, 'Næste')}
          {combo > 1 && (
            <div className="rounded-md px-1 py-1 text-center animate-scale-in" style={{ border: '1px solid rgba(255,159,10,0.25)', background: 'linear-gradient(135deg, rgba(255,159,10,0.08), rgba(255,55,95,0.08))' }}>
              <div className="text-[8px] font-black" style={{ background: 'linear-gradient(135deg, #ff9f0a, #ff375f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔥 ×{combo}</div>
            </div>
          )}
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
