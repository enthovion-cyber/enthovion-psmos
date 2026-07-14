'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { RotateCcw } from 'lucide-react';

type Point = { x: number; y: number; t: number };
type Stroke = Point[];
type DrawValue = Record<string, unknown> & { strokes?: Stroke[]; imageDataUrl?: string; width?: number; height?: number };

const WIDTH = 760;
const HEIGHT = 220;

export function SignatureDrawPad({ value, onChange }: { value: DrawValue | null; onChange: (value: DrawValue | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>(Array.isArray(value?.strokes) ? value.strokes : []);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    strokesRef.current = Array.isArray(value?.strokes) ? value.strokes : [];
    redraw();
  }, [value]);

  function context() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return null;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--psm-text') || '#0f172a';
    return { canvas, ctx };
  }

  function redraw() {
    const target = context();
    if (!target) return;
    target.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    target.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--psm-bg') || '#ffffff';
    target.ctx.fillRect(0, 0, WIDTH, HEIGHT);
    target.ctx.strokeStyle = 'rgba(100,116,139,.35)';
    target.ctx.lineWidth = 1;
    target.ctx.beginPath();
    target.ctx.moveTo(36, HEIGHT - 44);
    target.ctx.lineTo(WIDTH - 36, HEIGHT - 44);
    target.ctx.stroke();
    target.ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--psm-text') || '#0f172a';
    target.ctx.lineWidth = 3;
    for (const stroke of strokesRef.current) drawStroke(stroke, target.ctx);
  }

  function drawStroke(stroke: Stroke, ctx: CanvasRenderingContext2D) {
    if (!stroke.length) return;
    const first = stroke[0];
    if (!first) return;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    for (const point of stroke.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  function point(event: PointerEvent<HTMLCanvasElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      t: Date.now()
    };
  }

  function begin(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    strokesRef.current = [...strokesRef.current, [point(event)]];
    setDrawing(true);
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const target = context();
    const current = strokesRef.current.at(-1);
    if (!target || !current) return;
    current.push(point(event));
    redraw();
    const imageDataUrl = target.canvas.toDataURL('image/png');
    onChange({
      strokes: strokesRef.current,
      width: WIDTH,
      height: HEIGHT,
      imageDataUrl,
      capturedAt: new Date().toISOString()
    });
  }

  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDrawing(false);
    const target = context();
    const payload: DrawValue = {
      strokes: strokesRef.current,
      width: WIDTH,
      height: HEIGHT,
      capturedAt: new Date().toISOString()
    };
    const imageDataUrl = target?.canvas.toDataURL('image/png');
    onChange(imageDataUrl ? { ...payload, imageDataUrl } : payload);
  }

  function clear() {
    strokesRef.current = [];
    onChange(null);
    redraw();
  }

  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Draw signature</div>
          <div className="text-xs text-[var(--psm-muted)]">Draw with mouse, stylus, or touch. Strokes and snapshot are stored for immutable signing.</div>
        </div>
        <button type="button" className="psm-button psm-button-secondary min-h-8 px-3 text-xs" onClick={clear}>
          <RotateCcw size={14} /> Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="mt-4 h-48 w-full touch-none rounded-lg border border-dashed border-[var(--psm-line)] bg-[var(--psm-bg)]"
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      {value ? <div className="mt-2 text-xs text-success">Drawn signature captured and ready to save.</div> : <div className="mt-2 text-xs text-[var(--psm-muted)]">Sign above to capture a signature preview in real time.</div>}
    </div>
  );
}
