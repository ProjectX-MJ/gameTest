import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingStroke } from '../types/game';

interface DrawingCanvasProps {
  isDrawer: boolean;
  onStroke?: (stroke: DrawingStroke) => void;
  strokes: DrawingStroke[];
  disabled?: boolean;
}

export function DrawingCanvas({ isDrawer, onStroke, strokes, disabled }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);

  const colors = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8000'];

  const getPointerPosition = useCallback((e: PointerEvent | React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e: React.PointerEvent) => {
    if (!isDrawer || disabled) return;
    
    // Only start drawing on left mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Capture the pointer to ensure we get all events
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.setPointerCapture(e.pointerId);
    }
    
    setIsDrawing(true);
    const point = getPointerPosition(e);
    setCurrentStroke([point]);
  }, [isDrawer, disabled, getPointerPosition]);

  const draw = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !isDrawer || disabled) return;

    e.preventDefault();
    const point = getPointerPosition(e);
    setCurrentStroke(prev => {
      const newStroke = [...prev, point];
      
      // Draw in real-time
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || prev.length === 0) return newStroke;

      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (prev.length === 1) {
        ctx.beginPath();
        ctx.moveTo(prev[0].x, prev[0].y);
      }

      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      
      return newStroke;
    });
  }, [isDrawing, isDrawer, disabled, getPointerPosition, brushColor, brushSize]);

  const stopDrawing = useCallback((e: React.PointerEvent) => {
    if (!isDrawing || !isDrawer || disabled) return;

    e.preventDefault();
    e.stopPropagation();
    
    // Release pointer capture
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    
    setIsDrawing(false);
    
    if (currentStroke.length > 1 && onStroke) {
      const stroke: DrawingStroke = {
        id: Date.now().toString(),
        points: currentStroke,
        color: brushColor,
        size: brushSize,
        timestamp: Date.now(),
      };
      onStroke(stroke);
    }
    
    setCurrentStroke([]);
  }, [isDrawing, isDrawer, disabled, currentStroke, brushColor, brushSize, onStroke]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Redraw all strokes when strokes array changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    clearCanvas();

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
  }, [strokes, clearCanvas]);

  return (
    <div className="flex flex-col gap-4">
      {/* Guesser info moved above canvas */}
      {!isDrawer && (
        <div className="text-center">
          <span className="text-sm text-muted-foreground bg-blue-50 px-3 py-1 rounded">
            {disabled ? 'Round ended' : 'Watch the drawer!'}
          </span>
        </div>
      )}

      {/* Canvas */}
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full h-auto touch-none"
          style={{ maxHeight: '300px' }}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>

      {/* Drawing tools */}
      {isDrawer && !disabled && (
        <div className="flex flex-col gap-3">
          {/* Color palette */}
          <div className="flex gap-2 justify-center">
            {colors.map(color => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 ${
                  brushColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'
                } transition-all`}
                style={{ backgroundColor: color }}
                onClick={() => setBrushColor(color)}
              />
            ))}
          </div>

          {/* Brush size */}
          <div className="flex items-center gap-3 justify-center">
            <span className="text-sm">Size:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-20"
            />
            <div
              className="rounded-full bg-black"
              style={{ 
                width: `${Math.max(brushSize + 4, 8)}px`, 
                height: `${Math.max(brushSize + 4, 8)}px` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}