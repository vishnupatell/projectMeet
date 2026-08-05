'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { addWhiteboardStroke, clearWhiteboard } from '@/store/slices/featuresSlice';
import { Eraser, Pencil, Circle, Square, Undo2, Trash2, Palette } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

const COLORS = ['#ffffff', '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8800'];
const WIDTHS = [2, 4, 6, 8, 12];

export function Whiteboard({ socket }: { socket: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [color, setColor] = useState('#ffffff');
  const [width, setWidth] = useState(4);
  const [tool, setTool] = useState<'pencil' | 'eraser'>('pencil');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const strokes = useSelector((state: RootState) => state.features.whiteboardStrokes);
  const dispatch = useDispatch();

  // Redraw all strokes
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#1a1a2e' : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.points.length > 0) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    redraw();
  }, [redraw]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setCurrentPoints([point]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const point = getCanvasPoint(e);
    setCurrentPoints((prev) => [...prev, point]);

    // Draw live
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.strokeStyle = tool === 'eraser' ? '#1a1a2e' : color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    const prev = currentPoints[currentPoints.length - 1] || point;
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPoints.length > 1) {
      const stroke = { userId: '', points: currentPoints, color, width, tool };
      dispatch(addWhiteboardStroke(stroke));

      // Broadcast to others
      if (socket) {
        socket.emit('whiteboard:draw', { points: currentPoints, color, width, tool });
      }
    }
    setCurrentPoints([]);
  };

  const handleClear = () => {
    dispatch(clearWhiteboard());
    if (socket) {
      socket.emit('whiteboard:clear');
    }
  };

  const handleUndo = () => {
    if (socket) {
      socket.emit('whiteboard:undo');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => setTool('pencil')}
          className={`p-2 rounded ${tool === 'pencil' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={`p-2 rounded ${tool === 'eraser' ? 'bg-blue-600' : 'bg-gray-700'} text-white`}
        >
          <Eraser className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded bg-gray-700"
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-10 left-0 bg-gray-800 rounded-lg p-2 flex gap-1 z-10 shadow-xl">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setShowColorPicker(false); }}
                  className="w-6 h-6 rounded-full border-2 border-gray-600 hover:border-white transition-colors"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        <select
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          className="bg-gray-700 text-white text-xs rounded px-2 py-1"
        >
          {WIDTHS.map((w) => (
            <option key={w} value={w}>{w}px</option>
          ))}
        </select>

        <div className="w-px h-6 bg-gray-600 mx-1" />

        <button onClick={handleUndo} className="p-2 rounded bg-gray-700 text-white hover:bg-gray-600">
          <Undo2 className="w-4 h-4" />
        </button>
        <button onClick={handleClear} className="p-2 rounded bg-red-700 text-white hover:bg-red-600">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}
