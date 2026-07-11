import React, { useRef, useState, useEffect } from "react";
import { Paintbrush, Eraser, RotateCcw, HelpCircle } from "lucide-react";

interface ScratchpadProps {
  onClear?: () => void;
}

export default function Scratchpad({ onClear }: ScratchpadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#3b82f6"); // Default blue
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);

  const colors = [
    { value: "#ef4444", label: "Red" },
    { value: "#f97316", label: "Orange" },
    { value: "#eab308", label: "Yellow" },
    { value: "#22c55e", label: "Green" },
    { value: "#3b82f6", label: "Blue" },
    { value: "#a855f7", label: "Purple" },
    { value: "#000000", label: "Black" },
  ];

  // Initialize and handle resize of the canvas properly
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on parent container
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      
      // Save current content
      const tempImage = canvas.toDataURL();
      
      canvas.width = container.clientWidth;
      canvas.height = 180; // Fixed height for standard scratching area
      
      // Restore content
      const img = new Image();
      img.src = tempImage;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        // Reset properties because sizing resets them
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      };

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = isEraser ? "#ffffff" : color;
    ctx.lineWidth = isEraser ? 15 : lineWidth;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    
    // Prevent scrolling on touch devices while drawing
    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onClear) onClear();
  };

  return (
    <div className="bg-yellow-50/70 border-2 border-dashed border-amber-300 rounded-2xl p-3 shadow-inner" id="scratchpad-container">
      <div className="flex flex-wrap items-center justify-between mb-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-amber-800">
          <Paintbrush size={14} className="animate-bounce" />
          <span>Interactive Scratchpad (Vẽ nháp tự do)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Colors */}
          <div className="flex gap-1 bg-white/80 p-1 rounded-full border border-amber-200">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setColor(c.value);
                  setIsEraser(false);
                }}
                className={`w-4.5 h-4.5 rounded-full transition-transform hover:scale-125 ${
                  color === c.value && !isEraser ? "ring-2 ring-amber-500 scale-110" : ""
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
                id={`color-btn-${c.label}`}
              />
            ))}
          </div>

          {/* Tools */}
          <div className="flex gap-1 bg-white/80 p-1 rounded-full border border-amber-200">
            <button
              onClick={() => setIsEraser(true)}
              className={`p-1 rounded-full hover:bg-amber-100 transition-colors ${
                isEraser ? "bg-amber-200 text-amber-900" : "text-amber-700"
              }`}
              title="Eraser (Tẩy)"
              id="eraser-btn"
            >
              <Eraser size={13} />
            </button>
            <button
              onClick={clearCanvas}
              className="p-1 rounded-full hover:bg-amber-100 transition-colors text-amber-700"
              title="Clear All (Xóa hết)"
              id="clear-btn"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full bg-white rounded-xl border border-amber-200 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block touch-none bg-white"
          id="scratch-canvas"
        />
        
        {/* Help Tip Overlay */}
        <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-amber-600/80 pointer-events-none select-none">
          <HelpCircle size={10} />
          <span>Draw blocks to solve comparison problems! (Vẽ sơ đồ đoạn thẳng giải toán)</span>
        </div>
      </div>
    </div>
  );
}
