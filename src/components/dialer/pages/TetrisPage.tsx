import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Gamepad2, Pause, Play, Trophy, Zap, Star, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const COLS = 10, ROWS = 20;

const COLORS = ['', '#00d4ff', '#00ff87', '#bf5af2', '#ff9f0a', '#0a84ff', '#ff375f', '#ffd60a'];
const GLOW_COLORS = ['', 'rgba(0,212,255,0.5)', 'rgba(0,255,135,0.5)', 'rgba(191,90,242,0.5)', 'rgba(255,159,10,0.5)', 'rgba(10,132,255,0.5)', 'rgba(255,55,95,0.5)', 'rgba(255,214,10,0.5)'];
const PIECES = [[[1,1,1,1]], [[2,2],[2,2]], [[0,3,0],[3,3,3]], [[4,0],[4,0],[4,4]], [[0,5],[0,5],[5,5]], [[6,6,0],[0,6,6]], [[0,7,7],[7,7,0]]];

interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: string; size: number; }
interface HighScore { id: string; player_name: string; score: number; lines_cleared: number; level: number; created_at: string; }

export const TetrisPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [blockSize, setBlockSize] = useState(24);
  const animFrameRef = useRef<number>(0);
  const lastDropRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const starsRef = useRef<{ x: number; y: number; size: number; speed: number; opacity: number }[]>([]);
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  // Auto-scale block size
  useEffect(() => {
    const resize = () => {
      const maxH = window.innerHeight - 200;
      const maxW = (window.innerWidth - 68 - 400) * 0.55; // sidebar + side panels
      const bs = Math.floor(Math.min(maxH / ROWS, maxW / COLS, 28));
      setBlockSize(Math.max(16, bs));
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const BLOCK = blockSize;
  const PREVIEW_BLOCK = Math.max(12, Math.floor(blockSize * 0.6));

  // Fetch high scores
  const fetchScores = useCallback(async () => {
    const { data } = await supabase.from('tetris_scores').select('*').order('score', { ascending: false }).limit(10);
    if (data) setHighScores(data as HighScore[]);
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const saveScore = useCallback(async (finalScore: number, finalLines: number, finalLevel: number) => {
    if (finalScore === 0 || scoreSaved) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
    await supabase.from('tetris_scores').insert({ user_id: user.id, player_name: profile?.full_name || 'Ukendt', score: finalScore, lines_cleared: finalLines, level: finalLevel });
    setScoreSaved(true);
    fetchScores();
  }, [scoreSaved, fetchScores]);

  useEffect(() => {
    starsRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * COLS * 30, y: Math.random() * ROWS * 30,
      size: Math.random() * 1.2 + 0.3, speed: Math.random() * 0.2 + 0.05, opacity: Math.random() * 0.3 + 0.1,
    }));
  }, []);

  const spawnParticles = useCallback((row: number) => {
    const colors = ['#00d4ff', '#bf5af2', '#ff375f', '#ffd60a', '#00ff87'];
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: Math.random() * COLS * BLOCK, y: row * BLOCK + BLOCK / 2,
        vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 5 - 1,
        life: 1, maxLife: 25 + Math.random() * 20, color: colors[Math.floor(Math.random() * 5)], size: Math.random() * 3 + 1.5,
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
    if (ghost) { ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = 0.2; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, bs - 4, bs - 4, 3); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; return; }
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
    if (collides(g.board, g.piece, g.pieceX, g.pieceY)) {
      g.gameOver = true; setGameOver(true); triggerShake(12);
      saveScore(g.score, g.lines, g.level);
    }
  }, [triggerShake, saveScore]);

  const doHold = useCallback((g: any) => {
    if (!g.canHold) return; g.canHold = false;
    const cur = g.piece;
    if (g.hold) { g.piece = g.hold; g.pieceX = Math.floor(COLS / 2) - Math.floor(g.piece[0].length / 2); g.pieceY = 0; } else spawnPiece(g);
    g.hold = cur; setHoldPiece(cur.map((r: number[]) => [...r]));
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
      for (let r = 0; r < g.piece.length; r++) for (let c = 0; c < g.piece[r].length; c++) if (g.piece[r][c]) { ctx.globalAlpha = 0.9 + Math.sin(time * 0.005) * 0.1; drawBlock(ctx, g.pieceX + c, g.pieceY + r, COLORS[g.piece[r][c]], GLOW_COLORS[g.piece[r][c]], BLOCK); ctx.globalAlpha = 1; }
    }
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
      ctx.globalAlpha = p.life / p.maxLife; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; return p.life > 0;
    });
    if (g.gameOver) {
      ctx.fillStyle = 'rgba(5,8,15,0.85)'; ctx.fillRect(-5, -5, w + 10, h + 10);
      ctx.shadowColor = '#ff375f'; ctx.shadowBlur = 25; ctx.fillStyle = '#ff375f';
      ctx.font = `bold ${Math.floor(BLOCK * 0.9)}px "Syne", sans-serif`; ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', w / 2, h / 2 - 12); ctx.shadowBlur = 0;
      ctx.font = `${Math.floor(BLOCK * 0.45)}px "DM Sans", sans-serif`; ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('Tryk R for at starte igen', w / 2, h / 2 + 14); ctx.textAlign = 'start';
    }
    ctx.restore();
  }, [BLOCK]);

  const initGame = useCallback(() => {
    const g = gameRef.current;
    g.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    g.score = 0; g.lines = 0; g.level = 1; g.paused = false; g.gameOver = false; g.combo = 0; g.hold = null; g.canHold = true;
    setScore(0); setLines(0); setLevel(1); setPaused(false); setGameOver(false); setCombo(0); setLastClear(null); setHoldPiece(null); setScoreSaved(false);
    spawnPiece(g);
  }, [spawnPiece]);

  useEffect(() => {
    initGame();
    lastDropRef.current = performance.now();
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
      render(time); animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
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
    <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="text-[8px] text-white/25 uppercase tracking-[0.2em] font-medium mb-1.5">{label}</div>
      <div className="flex items-center justify-center min-h-[36px]">
        {piece ? (
          <canvas ref={(el) => { if (!el) return; const ctx = el.getContext('2d')!; ctx.clearRect(0, 0, el.width, el.height); for (let r = 0; r < piece.length; r++) for (let c = 0; c < piece[r].length; c++) if (piece[r][c]) drawBlock(ctx, c, r, COLORS[piece[r][c]], GLOW_COLORS[piece[r][c]], PREVIEW_BLOCK); }} width={piece[0].length * PREVIEW_BLOCK} height={piece.length * PREVIEW_BLOCK} className="mx-auto" />
        ) : <span className="text-white/10 text-[10px]">—</span>}
      </div>
    </div>
  );

  const medalColors = ['#ffd60a', '#c0c0c0', '#cd7f32'];

  return (
    <div className="flex-1 flex overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #0a0e1a, #030508)' }}>
      {/* Ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full opacity-[0.025] animate-pulse" style={{ background: 'radial-gradient(circle, #00d4ff, transparent 70%)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 rounded-full opacity-[0.025] animate-pulse" style={{ background: 'radial-gradient(circle, #bf5af2, transparent 70%)', animationDelay: '1s' }} />
      </div>

      {/* Game section */}
      <div className="flex-1 flex items-center justify-center relative z-10" ref={containerRef}>
        <div className="flex gap-3 items-start">
          {/* Left — Hold + Controls */}
          <div className="flex flex-col gap-2" style={{ width: 100 }}>
            {renderPiecePreview(holdPiece, 'Hold (C)')}
            <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div className="text-[8px] text-white/20 uppercase tracking-[0.15em] font-medium mb-1.5">Kontroller</div>
              <div className="space-y-1 text-[9px] text-white/25">
                {[['←→', 'Flyt'], ['↑', 'Rotér'], ['↓', 'Drop'], ['⎵', 'Hard'], ['C', 'Hold'], ['P', 'Pause']].map(([k, l]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    <kbd className="px-1 py-0.5 rounded text-[7px] bg-white/5 text-white/35 font-mono min-w-[18px] text-center">{k}</kbd>
                    <span>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative">
            <canvas ref={canvasRef} width={COLS * BLOCK} height={ROWS * BLOCK} className="rounded-xl"
              style={{ border: '1px solid rgba(100,140,255,0.08)', boxShadow: '0 0 60px rgba(0,212,255,0.04), inset 0 0 30px rgba(0,0,0,0.4)' }} />
            {lastClear && (
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none animate-scale-in">
                <div className="font-heading font-black text-2xl text-white px-5 py-2.5 rounded-xl text-center whitespace-nowrap"
                  style={{ background: lastClear.includes('TETRIS') ? 'linear-gradient(135deg, rgba(255,214,10,0.9), rgba(255,159,10,0.9))' : 'linear-gradient(135deg, rgba(0,212,255,0.85), rgba(191,90,242,0.85))', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {lastClear}
                </div>
              </div>
            )}
            {paused && !gameOver && (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl" style={{ background: 'rgba(5,8,15,0.85)', backdropFilter: 'blur(6px)' }}>
                <div className="text-center">
                  <Pause size={24} className="text-cyan-400 mx-auto mb-2" />
                  <div className="font-heading font-bold text-base" style={{ background: 'linear-gradient(135deg, #00d4ff, #bf5af2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PAUSE</div>
                  <div className="text-white/25 text-[10px] mt-1">Tryk P</div>
                </div>
              </div>
            )}
          </div>

          {/* Right — Stats */}
          <div className="flex flex-col gap-2" style={{ width: 110 }}>
            {renderPiecePreview(nextPiece, 'Næste')}
            <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-1 mb-0.5"><Trophy size={8} className="text-yellow-400/60" /><span className="text-[8px] text-white/25 uppercase tracking-[0.15em]">Score</span></div>
              <div className="font-heading font-black text-base" style={{ background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{score.toLocaleString()}</div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-0.5"><Zap size={7} className="text-cyan-400/50" /><span className="text-[7px] text-white/20 uppercase">Lvl</span></div>
                <div className="font-heading font-bold text-sm text-cyan-400">{level}</div>
              </div>
              <div className="rounded-lg px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-0.5"><Star size={7} className="text-purple-400/50" /><span className="text-[7px] text-white/20 uppercase">Linjer</span></div>
                <div className="font-heading font-bold text-sm text-purple-400">{lines}</div>
              </div>
            </div>
            {combo > 1 && (
              <div className="rounded-lg px-2 py-1.5 text-center animate-scale-in relative overflow-hidden" style={{ border: '1px solid rgba(255,159,10,0.25)' }}>
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,159,10,0.08), rgba(255,55,95,0.08))' }} />
                <div className="relative text-[10px] font-black uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, #ff9f0a, #ff375f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>🔥 ×{combo}</div>
              </div>
            )}
            <button onClick={togglePause} className="rounded-lg px-2 py-1.5 text-[10px] flex items-center justify-center gap-1 font-semibold transition-all duration-200 active:scale-95 cursor-pointer border text-white/50 hover:text-white/80" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
              {paused ? <><Play size={11} /> Fortsæt</> : <><Pause size={11} /> Pause</>}
            </button>
          </div>
        </div>
      </div>

      {/* Highscore panel */}
      <div className="w-[220px] border-l flex flex-col py-5 px-4 shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ffd60a, #ff9f0a)', boxShadow: '0 0 15px rgba(255,214,10,0.2)' }}>
            <Crown size={14} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <div className="font-heading font-bold text-xs text-white/80 tracking-tight">Highscores</div>
            <div className="text-[9px] text-white/25">Top 10</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {highScores.length === 0 && (
            <div className="text-center text-white/15 text-[11px] mt-8">Ingen scores endnu</div>
          )}
          {highScores.map((hs, i) => (
            <div key={hs.id} className="rounded-lg px-3 py-2 flex items-center gap-2.5 transition-all"
              style={{ background: i < 3 ? `rgba(${i === 0 ? '255,214,10' : i === 1 ? '192,192,192' : '205,127,50'},0.06)` : 'rgba(255,255,255,0.02)', border: `1px solid ${i < 3 ? `rgba(${i === 0 ? '255,214,10' : i === 1 ? '192,192,192' : '205,127,50'},0.12)` : 'rgba(255,255,255,0.04)'}` }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
                style={{ background: i < 3 ? `rgba(${i === 0 ? '255,214,10' : i === 1 ? '192,192,192' : '205,127,50'},0.2)` : 'rgba(255,255,255,0.05)', color: i < 3 ? medalColors[i] : 'rgba(255,255,255,0.3)' }}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-white/70 truncate">{hs.player_name}</div>
                <div className="text-[9px] text-white/25">Lvl {hs.level} · {hs.lines_cleared} linjer</div>
              </div>
              <div className="text-[11px] font-bold tabular-nums shrink-0" style={{ color: i < 3 ? medalColors[i] : 'rgba(255,255,255,0.4)' }}>
                {hs.score.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[8px] text-white/15 uppercase tracking-[0.15em] text-center">
            Spil for at komme på listen
          </div>
        </div>
      </div>
    </div>
  );
};
