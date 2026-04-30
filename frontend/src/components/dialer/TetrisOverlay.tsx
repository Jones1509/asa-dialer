import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Lead } from '@/types/leads';
import { Phone, PhoneOff, Gamepad2, Pause, Play, X, Minimize2, Maximize2, Trophy, Zap, Star } from 'lucide-react';

interface TetrisOverlayProps {
  visible: boolean;
  currentLead: Lead;
  callSeconds: number;
  formatTime: (s: number) => string;
  onEndCall: () => void;
  activeDialNumber?: string | null;
}

const COLS = 10, ROWS = 20;
const MINI_BLOCK = 14;
const MINI_PREVIEW = 10;

const COLORS = ['', '#00d4ff', '#00ff87', '#bf5af2', '#ff9f0a', '#0a84ff', '#ff375f', '#ffd60a'];
const GLOW_COLORS = ['', 'rgba(0,212,255,0.4)', 'rgba(0,255,135,0.4)', 'rgba(191,90,242,0.4)', 'rgba(255,159,10,0.4)', 'rgba(10,132,255,0.4)', 'rgba(255,55,95,0.4)', 'rgba(255,214,10,0.4)'];
const PIECES = [[[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]], [[4,0],[4,0],[4,4]], [[0,5],[0,5],[5,5]], [[6,6,0],[0,6,6]], [[0,7,7],[7,7,0]]];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }

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
  const [holdPiece, setHoldPiece] = useState<number[][] | null>(null);
  const [combo, setCombo] = useState(0);
  const [lastClear, setLastClear] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const animFrameRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  const BLOCK = MINI_BLOCK;

  const spawnParticles = useCallback((row: number) => {
    const colors = ['#00d4ff', '#bf5af2', '#ff375f', '#ffd60a', '#00ff87'];
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x: Math.random() * COLS * BLOCK, y: row * BLOCK + BLOCK / 2,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 4 - 1,
        life: 1, maxLife: 20 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)], size: Math.random() * 3 + 1,
      });
    }
  }, [BLOCK]);

  const triggerShake = useCallback((intensity: number) => { shakeRef.current.intensity = intensity; }, []);
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

  const shadeColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    return `rgb(${Math.min(255, Math.max(0, (num >> 16) + percent))},${Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + percent))},${Math.min(255, Math.max(0, (num & 0xFF) + percent))})`;
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, bs: number, ghost = false) => {
    const bx = x * bs, by = y * bs;
    if (ghost) {
      ctx.strokeStyle = color; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.2; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 2); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; return;
    }
    ctx.shadowColor = glow; ctx.shadowBlur = 8;
    const grad = ctx.createLinearGradient(bx, by, bx + bs, by + bs);
    grad.addColorStop(0, color); grad.addColorStop(1, shadeColor(color, -30));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 3); ctx.fill();
    ctx.shadowBlur = 0;
    const shine = ctx.createLinearGradient(bx, by, bx, by + bs * 0.5);
    shine.addColorStop(0, 'rgba(255,255,255,0.3)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, bs - 4, bs - 4, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.roundRect(bx + 1, by + 1, bs - 2, bs - 2, 3); ctx.stroke();
  };

  const spawnPiece = useCallback((g: any) => {
    g.piece = g.next || randomPiece(); g.next = randomPiece(); g.canHold = true;
    setNextPiece(g.next.map((r: number[]) => [...r]));
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) { g.gameOver = true; setGameOver(true); triggerShake(8); }
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
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
    bg.addColorStop(0, '#0a0e1a'); bg.addColorStop(1, '#050810');
    ctx.fillStyle = bg; ctx.fillRect(-5, -5, w + 10, h + 10);
    ctx.strokeStyle = 'rgba(100,140,255,0.03)'; ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(w, r * BLOCK); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, h); ctx.stroke(); }
    if (!g.board) { ctx.restore(); return; }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g.board[r][c]) drawBlock(ctx, c, r, COLORS[g.board[r][c]], GLOW_COLORS[g.board[r][c]], BLOCK);
    if (!g.gameOver && g.piece) {
      const ghostY = getGhostY(g.board, g.piece, g.pieceX, g.pieceY);
      if (ghostY !== g.pieceY) for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, ghostY + r, COLORS[g.piece[r][c]], '', BLOCK, true);
      for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]], GLOW_COLORS[g.piece[r][c]], BLOCK);
    }
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life--;
      const alpha = p.life / p.maxLife; ctx.globalAlpha = alpha; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      return p.life > 0;
    });
    if (g.gameOver) {
      ctx.fillStyle = 'rgba(5,8,15,0.85)'; ctx.fillRect(-5, -5, w + 10, h + 10);
      ctx.fillStyle = '#ff375f'; ctx.font = 'bold 16px "Syne", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 8);
      ctx.font = '10px "DM Sans", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Tryk R for genstart', w / 2, h / 2 + 12); ctx.textAlign = 'start';
    }
    ctx.restore();
  }, [BLOCK]);

  useEffect(() => {
    if (!visible) { cancelAnimationFrame(animFrameRef.current); return; }
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
            gg.combo++; gg.score += [0, 100, 300, 500, 800][cleared] * gg.level + (gg.combo > 1 ? gg.combo * 50 : 0);
            gg.lines += cleared; gg.level = Math.floor(gg.lines / 10) + 1;
            setScore(gg.score); setLines(gg.lines); setLevel(gg.level); setCombo(gg.combo);
            const names = ['', 'Single ✦', 'Double ✦✦', 'Triple ✦✦✦', '★ TETRIS ★'];
            setLastClear(names[cleared] + (gg.combo > 1 ? ` ×${gg.combo}` : '')); setTimeout(() => setLastClear(null), 2000);
            clearedRows.forEach(row => spawnParticles(row)); triggerShake(cleared === 4 ? 8 : cleared * 2);
          } else { gg.combo = 0; setCombo(0); }
          spawnPiece(gg);
        }
      }
      render(time); animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [visible, initGame, render, spawnParticles, triggerShake, spawnPiece]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!visible) return;
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
  }, [visible, initGame, doHold, triggerShake]);

  const togglePause = () => { gameRef.current.paused = !gameRef.current.paused; setPaused(gameRef.current.paused); };

  if (!visible) return null;

  const renderMiniPreview = (piece: number[][] | null, label: string) => (
    <div className="rounded-md p-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="text-[6px] text-white/20 uppercase tracking-[0.15em] font-medium mb-1">{label}</div>
      <div className="flex items-center justify-center min-h-[24px]">
        {piece ? (
          <canvas ref={(el) => { if (!el) return; const ctx = el.getContext('2d')!; ctx.clearRect(0, 0, el.width, el.height);
            for (let r = 0; r < piece.length; r++) for (let c = 0; c < piece[r].length; c++) if (piece[r][c]) drawBlock(ctx, c, r, COLORS[piece[r][c]], GLOW_COLORS[piece[r][c]], MINI_PREVIEW);
          }} width={piece[0].length * MINI_PREVIEW} height={piece.length * MINI_PREVIEW} />
        ) : <span className="text-white/10 text-[8px]">—</span>}
      </div>
    </div>
  );

  // Minimized: just a small call bar
  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in cursor-pointer"
        style={{ background: 'rgba(10,14,30,0.95)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
        onClick={() => setMinimized(false)}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,135,0.1)' }}>
          <Phone size={12} className="text-green-400" />
        </div>
        <div>
          <div className="text-[11px] font-semibold text-white/80">{activeDialNumber && activeDialNumber !== currentLead.phone ? 'Manuel opkald' : currentLead.company}</div>
          <div className="text-[10px] text-white/30 tabular-nums">{formatTime(callSeconds)}</div>
        </div>
        <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'rgba(0,212,255,0.1)' }}>
          <Gamepad2 size={11} className="text-cyan-400" />
        </div>
        <Maximize2 size={12} className="text-white/30" />
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: 'rgba(10,14,30,0.97)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
      
      {/* Compact header with call info */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,135,0.1)' }}>
          <Phone size={11} className="text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold text-white/80 truncate">
            {activeDialNumber && activeDialNumber !== currentLead.phone ? 'Manuel opkald' : currentLead.company}
          </div>
          <div className="text-[9px] text-white/30 tabular-nums">{activeDialNumber || currentLead.phone}</div>
        </div>
        <div className="font-heading font-bold text-[11px] tabular-nums"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {formatTime(callSeconds)}
        </div>
        <button onClick={onEndCall}
          className="rounded-lg px-2.5 py-1.5 text-[9px] font-semibold cursor-pointer flex items-center gap-1 border-none text-white transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ff375f, #dc2626)' }}>
          <PhoneOff size={10} /> Læg på
        </button>
        <button onClick={() => setMinimized(true)} className="text-white/30 hover:text-white/60 transition-colors cursor-pointer bg-transparent border-none p-1">
          <Minimize2 size={12} />
        </button>
      </div>

      {/* Game area */}
      <div className="flex gap-1.5 p-2">
        {/* Left: Hold */}
        <div className="flex flex-col gap-1" style={{ width: 55 }}>
          {renderMiniPreview(holdPiece, 'Hold')}
          <div className="rounded-md px-1.5 py-1" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-0.5"><Trophy size={7} className="text-yellow-400/50" /><span className="text-[6px] text-white/20 uppercase">Score</span></div>
            <div className="font-heading font-bold text-[10px]" style={{ background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score.toLocaleString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-0.5">
            <div className="rounded-md px-1 py-0.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[5px] text-white/15 uppercase">Lvl</div>
              <div className="font-bold text-[9px] text-cyan-400">{level}</div>
            </div>
            <div className="rounded-md px-1 py-0.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="text-[5px] text-white/15 uppercase">Lin</div>
              <div className="font-bold text-[9px] text-purple-400">{lines}</div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK}
            className="rounded-lg"
            style={{ border: '1px solid rgba(100,140,255,0.06)', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.3)' }} />
          {lastClear && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-scale-in">
              <div className="font-heading font-black text-xs text-white px-2 py-1 rounded-lg text-center whitespace-nowrap"
                style={{ background: lastClear.includes('TETRIS') ? 'linear-gradient(135deg, rgba(255,214,10,0.9), rgba(255,159,10,0.9))' : 'linear-gradient(135deg, rgba(0,212,255,0.85), rgba(191,90,242,0.85))' }}>
                {lastClear}
              </div>
            </div>
          )}
          {paused && !gameOver && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg" style={{ background: 'rgba(5,8,15,0.85)' }}>
              <div className="text-center">
                <Pause size={14} className="text-cyan-400 mx-auto mb-1" />
                <div className="font-heading font-bold text-[10px]" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAUSE</div>
                <div className="text-white/25 text-[7px] mt-0.5">Tryk P</div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Next + buttons */}
        <div className="flex flex-col gap-1" style={{ width: 55 }}>
          {renderMiniPreview(nextPiece, 'Næste')}
          {combo > 1 && (
            <div className="rounded-md px-1 py-0.5 text-center animate-scale-in" style={{ border: '1px solid rgba(255,159,10,0.2)' }}>
              <div className="text-[7px] font-black" style={{ background: 'linear-gradient(135deg, #ff9f0a, #ff375f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔥×{combo}</div>
            </div>
          )}
          <button onClick={togglePause}
            className="rounded-md px-1 py-1 text-[7px] flex items-center justify-center gap-0.5 font-semibold cursor-pointer border text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
            {paused ? <><Play size={8} /> Spil</> : <><Pause size={8} /> Pau</>}
          </button>
          <button onClick={initGame}
            className="rounded-md px-1 py-1 text-[7px] flex items-center justify-center gap-0.5 font-semibold cursor-pointer border text-white/40 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
            🔄 Ny
          </button>
        </div>
      </div>
    </div>
  );
};
