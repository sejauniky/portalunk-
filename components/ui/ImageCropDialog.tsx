import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";

interface ImageCropDialogProps {
  open: boolean;
  title?: string;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
  outputWidth: number;
  outputHeight: number;
  circleMask?: boolean;
}

export const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  open,
  title = "Ajustar imagem",
  file,
  onOpenChange,
  onCancel,
  onSave,
  outputWidth,
  outputHeight,
  circleMask = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  // Create object URL for file
  useEffect(() => {
    if (!file) {
      setImgUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => {
      try { URL.revokeObjectURL(url); } catch {}
    };
  }, [file]);

  // Load image and set initial scale/offset to cover the canvas
  useEffect(() => {
    if (!imgUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      // compute cover scale
      const cw = outputWidth;
      const ch = outputHeight;
      const sx = cw / img.naturalWidth;
      const sy = ch / img.naturalHeight;
      const cover = Math.max(sx, sy);
      setScale(cover);
      setOffset({ x: 0, y: 0 });
      draw(img, cover, { x: 0, y: 0 });
    };
    img.src = imgUrl;
  }, [imgUrl, outputWidth, outputHeight]);

  // Draw current state
  const draw = (img: HTMLImageElement | null, s: number, o: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Optional circle mask
    if (circleMask) {
      ctx.save();
      ctx.beginPath();
      const r = Math.min(canvas.width, canvas.height) / 2;
      ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    const dw = img.naturalWidth * s;
    const dh = img.naturalHeight * s;
    const dx = canvas.width / 2 - dw / 2 + o.x;
    const dy = canvas.height / 2 - dh / 2 + o.y;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, dw, dh);

    if (circleMask) {
      ctx.restore();
      // Draw mask edge for preview
      ctx.beginPath();
      const r = Math.min(canvas.width, canvas.height) / 2;
      ctx.arc(canvas.width / 2, canvas.height / 2, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Sync canvas when state changes
  useEffect(() => {
    draw(imgRef.current, scale, offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, offset]);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    setIsDragging(true);
    setLastPoint({ x: e.clientX, y: e.clientY });
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!isDragging || !lastPoint) return;
    const dx = e.clientX - lastPoint.x;
    const dy = e.clientY - lastPoint.y;
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPoint({ x: e.clientX, y: e.clientY });
  };
  const onPointerUp = () => {
    setIsDragging(false);
    setLastPoint(null);
  };

  const zoomBy = (delta: number) => {
    setScale((prev) => Math.max(0.1, prev + delta));
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const delta = -e.deltaY / 600; // smooth
    zoomBy(delta);
  };

  const reset = () => {
    if (!naturalSize) return;
    const sx = outputWidth / naturalSize.w;
    const sy = outputHeight / naturalSize.h;
    const cover = Math.max(sx, sy);
    setScale(cover);
    setOffset({ x: 0, y: 0 });
  };

  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/jpeg", 0.92);
  };

  const zoomPercent = useMemo(() => Math.round(scale * 100), [scale]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div
            ref={containerRef}
            className="relative mx-auto select-none touch-none"
            style={{ width: "100%", maxWidth: 900 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onWheel={handleWheel}
          >
            <div className="w-full rounded-xl overflow-hidden border border-white/15 bg-black/50">
              <canvas
                ref={canvasRef}
                className="block w-full h-auto"
                style={{ aspectRatio: `${outputWidth} / ${outputHeight}` }}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Zoom</span>
              <input
                type="range"
                min={0.1}
                max={4}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-48"
              />
              <span>{zoomPercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={reset}>Centralizar</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
