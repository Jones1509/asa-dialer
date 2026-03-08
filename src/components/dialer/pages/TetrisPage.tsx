import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Gamepad2, Pause, Play, Trophy, Zap, Star } from 'lucide-react';

const COLS = 10, ROWS = 20, BLOCK = 30;
const PREVIEW_BLOCK = 18;

const COLORS = [
  '',
  '#00d4ff', '#00ff87', '#bf5af2', '#ff9f0a',
  '#0a84ff', '#ff375f', '#ffd60a',
];
const GLOW_COLORS = [
  '',
  'rgba(0,212,255,0.5)', 'rgba(0,255,135,0.5)', 'rgba(191,90,242,0.5)',
  'rgba(255,159,10,0.5)', 'rgba(10,132,255,0.5)', 'rgba(255,55,95,0.5)',
  'rgba(255,214,10,0.5)',
];
const PIECES = [
  [[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]],
  [[4,0],[4,0],[4,4]], [[0,5],[0,5],[5,5]],
  [[6,6,0],[0,6,6]], [[0,7,7],[7,7,0]],
];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface BGStar { x: number; y: number; size: number; speed: number; opacity: number; }

export const TetrisPage: React.FC = () => {
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
  const animFrameRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<BGStar[]>([]);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  useEffect(() => {
    starsRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * COLS * BLOCK, y: Math.random() * ROWS * BLOCK,
      size: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.3 + 0.1, opacity: Math.random() * 0.4 + 0.1,
    }));
  }, []);

  const spawnParticles = useCallback((row: number, color: string) => {
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: Math.random() * COLS * BLOCK, y: row * BLOCK + BLOCK / 2,
        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 6 - 2,
        life: 1, maxLife: 30 + Math.random() * 30, color, size: Math.random() * 4 + 2,
      });
    }
  }, []);

  const triggerShake = useCallback((intensity: number) => { shakeRef.current.intensity = intensity; }, []);

  const randomPiece = () => PIECES[Math.floor(Math.random() * PIECES.length)].map(r => [...r]);

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

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, glow: string, blockSize: number, ghost = false) => {
    const bx = x * blockSize, by = y * blockSize;
    if (ghost) {
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, blockSize - 4, blockSize - 4, 4); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1; return;
    }
    ctx.shadowColor = glow; ctx.shadowBlur = 18;
    const grad = ctx.createLinearGradient(bx, by, bx + blockSize, by + blockSize);
    grad.addColorStop(0, color); grad.addColorStop(1, shadeColor(color, -30));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.roundRect(bx + 1.5, by + 1.5, blockSize - 3, blockSize - 3, 5); ctx.fill(); ctx.shadowBlur = 0;
    const shine = ctx.createLinearGradient(bx, by, bx, by + blockSize * 0.6);
    shine.addColorStop(0, 'rgba(255,255,255,0.4)'); shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shine; ctx.beginPath(); ctx.roundRect(bx + 3, by + 3, blockSize - 6, blockSize - 6, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(bx + 7, by + 7, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.roundRect(bx + 1.5, by + 1.5, blockSize - 3, blockSize - 3, 5); ctx.stroke();
  };

  const spawnPiece = useCallback((g: any) => {
    g.piece = g.next || randomPiece(); g.next = randomPiece(); g.canHold = true;
    setNextPiece(g.next.map((r: number[]) => [...r]));
    g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0;
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) { g.gameOver = true; setGameOver(true); triggerShake(15); }
  }, [triggerShake]);

  const doHold = useCallback((g: any) => {
    if (!g.canHold) return; g.canHold = false;
    const current = g.piece;
    if (g.hold) { g.piece = g.hold; g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0; } else spawnPiece(g);
    g.hold = current; setHoldPiece(current.map((r: number[]) => [...r]));
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
    bg.addColorStop(0, '#0a0e1a'); bg.addColorStop(0.5, '#070b14'); bg.addColorStop(1, '#030508');
    ctx.fillStyle = bg; ctx.fillRect(-5, -5, w + 10, h + 10);
    starsRef.current.forEach(star => {
      star.y += star.speed; if (star.y > h) { star.y = 0; star.x = Math.random() * w; }
      ctx.fillStyle = `rgba(255,255,255,${star.opacity * (Math.sin(time * 0.003 + star.x) * 0.3 + 0.7)})`;
      ctx.beginPath(); ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(100,140,255,0.03)'; ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(w, r * BLOCK); ctx.stroke(); }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, h); ctx.stroke(); }
    if (!g.board) { ctx.restore(); return; }
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (g.board[r][c]) drawBlock(ctx, c, r, COLORS[g.board[r][c]], GLOW_COLORS[g.board[r][c]], BLOCK);
    if (!g.gameOver && g.piece) {
      const ghostY = getGhostY(g.board, g.piece, g.pieceX, g.pieceY);
      if (ghostY !== g.pieceY) for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) drawBlock(ctx, g.pieceX + c, ghostY + r, COLORS[g.piece[r][c]], '', BLOCK, true);
      const pulse = Math.sin(time * 0.005) * 0.1 + 1;
      for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) { ctx.globalAlpha = 0.9 + pulse * 0.1; drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]], GLOW_COLORS[g.piece[r][c]], BLOCK); ctx.globalAlpha = 1; }
    }
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
      const alpha = p.life / p.maxLife; ctx.globalAlpha = alpha; ctx.shadowColor = p.color; ctx.shadowBlur = 8;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; return p.life > 0;
    });
    if (g.gameOver) {
      ctx.fillStyle = 'rgba(5,8,15,0.85)'; ctx.fillRect(-5, -5, w + 10, h + 10);
      ctx.shadowColor = '#ff375f'; ctx.shadowBlur = 30; ctx.fillStyle = '#ff375f';
      ctx.font = 'bold 28px "Syne", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 15); ctx.shadowBlur = 0;
      ctx.font = '13px "DM Sans", sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Tryk R for at starte igen', w / 2, h / 2 + 18); ctx.textAlign = 'start';
    }
    ctx.restore();
  }, []);

  useEffect(() => {
    const g = gameRef.current;
    g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false; g.combo = 0; g.hold = null; g.canHold = true;
    setScore(0); setLines(0); setLevel(1); setPaused(false); setGameOver(false); setCombo(0); setLastClear(null); setHoldPiece(null);
    spawnPiece(g); lastDropRef.current = performance.now();
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
            const points = [0, 100, 300, 500, 800]; const comboBonus = gg.combo > 1 ? gg.combo * 50 : 0;
            gg.score += points[cleared] * gg.level + comboBonus; gg.lines += cleared; gg.level = Math.floor(gg.lines / 10) + 1;
            setScore(gg.score); setLines(gg.lines); setLevel(gg.level); setCombo(gg.combo);
            setLastClear(names[cleared] + (gg.combo > 1 ? ` ×${gg.combo}` : '')); setTimeout(() => setLastClear(null), 2000);
            clearedRows.forEach(row => spawnParticles(row, ['#00d4ff', '#bf5af2', '#ff375f', '#ffd60a', '#00ff87'][Math.floor(Math.random() * 5)]));
            triggerShake(cleared === 4 ? 12 : cleared * 3);
          } else { gg.combo = 0; setCombo(0); }
          spawnPiece(gg);
        }
      }
      render(time); animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [spawnPiece, render, spawnParticles, triggerShake]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const g = gameRef.current;
      if (e.key === 'r' || e.key === 'R') { if (g.gameOver) { g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0)); g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false; g.combo = 0; g.hold = null; setScore(0); setLines(0); setLevel(1); setPaused(false); setGameOver(false); setCombo(0); setHoldPiece(null); spawnPiece(g); } e.preventDefault(); return; }
      if (e.key === 'p' || e.key === 'P') { g.paused = !g.paused; setPaused(g.paused); e.preventDefault(); return; }
      if (g.paused || g.gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': if (!collides(g.board, g.piece, g.pieceX - 1, g.pieceY)) g.pieceX--; e.preventDefault(); break;
        case 'ArrowRight': if (!collides(g.board, g.piece, g.pieceX + 1, g.pieceY)) g.pieceX++; e.preventDefault(); break;
        case 'ArrowDown': if (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) { g.pieceY++; g.score += 1; setScore(g.score); } e.preventDefault(); break;
        case 'ArrowUp': { const result = tryRotate(g.board, g.piece, g.pieceX, g.pieceY); if (result) { g.piece = result.piece; g.pieceX = result.x; g.pieceY = result.y; } e.preventDefault(); break; }
        case ' ': { while (!collides(g.board, g.piece, g.pieceX, g.pieceY + 1)) { g.pieceY++; g.score += 2; } setScore(g.score); lastDropRef.current = 0; triggerShake(4); e.preventDefault(); break; }
        case 'c': case 'C': { doHold(g); e.preventDefault(); break; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [spawnPiece, doHold, triggerShake]);

  const togglePause = () => { gameRef.current.paused = !gameRef.current.paused; setPaused(gameRef.current.paused); };

  const renderPiecePreview = (piece: number[][] | null, label: string) => {
    if (!piece) return (
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-medium mb-2">{label}</div>
        <div className="flex items-center justify-center min-h-[48px]"><span className="text-white/10 text-xs">—</span></div>
      </div>
    );
    const rows = piece.length, cols = piece[0].length;
    return (
      <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-medium mb-2">{label}</div>
        <div className="flex items-center justify-center min-h-[48px]">
          <canvas ref={(el) => { if (!el) return; const ctx = el.getContext('2d')!; ctx.clearRect(0, 0, el.width, el.height); for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (piece[r][c]) drawBlock(ctx, c, r, COLORS[piece[r][c]], GLOW_COLORS[piece[r][c]], PREVIEW_BLOCK); }} width={cols * PREVIEW_BLOCK} height={rows * PREVIEW_BLOCK} className="mx-auto" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, rgba(10,14,30,0.97), rgba(3,5,10,0.99))' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.03] animate-pulse" style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.03] animate-pulse" style={{ background: 'radial-gradient(circle, #bf5af2, transparent 70%)', animationDelay: '1s' }} />
      </div>

      <div className="flex flex-col items-center gap-4 relative z-10">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
            <Gamepad2 size={22} className="text-white" strokeWidth={1.5} />
          </div>
          <h2 className="font-heading font-bold text-lg tracking-tight" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2, #ff375f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TETRIS LOUNGE
          </h2>
        </div>

        {/* Game area */}
        <div className="flex gap-4 items-start">
          {/* Left panel */}
          <div className="flex flex-col gap-3 min-w-[120px]">
            {renderPiecePreview(holdPiece, 'Hold (C)')}
            <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-medium mb-2">Kontroller</div>
              <div className="space-y-1.5 text-[10px] text-white/30">
                {[['←→', 'Flyt'], ['↑', 'Rotér'], ['↓', 'Soft drop'], ['Space', 'Hard drop'], ['C', 'Hold'], ['P', 'Pause']].map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 rounded text-[8px] bg-white/5 text-white/40 font-mono">{key}</kbd>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative">
            <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK} className="rounded-2xl relative z-10"
              style={{ border: '1px solid rgba(100,140,255,0.1)', boxShadow: '0 0 80px rgba(0,212,255,0.06), 0 0 40px rgba(191,90,242,0.04), inset 0 0 40px rgba(0,0,0,0.4)' }} />
            {lastClear && (
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-scale-in">
                <div className="font-heading font-black text-3xl text-white px-6 py-3 rounded-2xl text-center whitespace-nowrap"
                  style={{ background: lastClear.includes('TETRIS') ? 'linear-gradient(135deg, rgba(255,214,10,0.9), rgba(255,159,10,0.9))' : 'linear-gradient(135deg, rgba(0,212,255,0.85), rgba(191,90,242,0.85))', textShadow: '0 2px 10px rgba(0,0,0,0.4)', boxShadow: lastClear.includes('TETRIS') ? '0 0 40px rgba(255,214,10,0.4)' : '0 0 30px rgba(0,212,255,0.3)' }}>
                  {lastClear}
                </div>
              </div>
            )}
            {paused && !gameOver && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl" style={{ background: 'rgba(5,8,15,0.85)', backdropFilter: 'blur(8px)' }}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                    <Pause size={28} className="text-cyan-400" />
                  </div>
                  <div className="font-heading font-bold text-xl" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAUSE</div>
                  <div className="text-white/30 text-xs mt-1.5">Tryk P for at fortsætte</div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-3 min-w-[130px]">
            {renderPiecePreview(nextPiece, 'Næste')}
            <div className="rounded-xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-1.5 mb-1"><Trophy size={10} className="text-yellow-400/60" /><div className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-medium">Score</div></div>
              <div className="font-heading font-black text-xl" style={{ background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1 mb-0.5"><Zap size={9} className="text-cyan-400/60" /><div className="text-[8px] text-white/25 uppercase tracking-[0.15em]">Level</div></div>
                <div className="font-heading font-bold text-lg text-cyan-400">{level}</div>
              </div>
              <div className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-1 mb-0.5"><Star size={9} className="text-purple-400/60" /><div className="text-[8px] text-white/25 uppercase tracking-[0.15em]">Linjer</div></div>
                <div className="font-heading font-bold text-lg text-purple-400">{lines}</div>
              </div>
            </div>
            {combo > 1 && (
              <div className="rounded-xl px-3 py-2.5 text-center animate-scale-in relative overflow-hidden" style={{ border: '1px solid rgba(255,159,10,0.3)' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.1), rgba(255,55,95,0.1))' }} />
                <div className="relative text-[11px] font-black uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #ff9f0a, #ff375f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔥 COMBO ×{combo}</div>
              </div>
            )}
            <button onClick={togglePause} className="rounded-xl px-3 py-2.5 text-[12px] flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 active:scale-95 cursor-pointer border text-white/60 hover:text-white/90 hover:border-white/10" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              {paused ? <><Play size={13} /> Fortsæt</> : <><Pause size={13} /> Pause</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
