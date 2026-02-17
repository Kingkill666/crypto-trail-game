"use client";
import { useRef, useEffect, useState } from "react";

function PixelTrailCanvas({ width = 600, height = 300, animFrame }: { width?: number; height?: number; animFrame: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const lamboImgRef = useRef<HTMLImageElement | null>(null);
  const bgLoadedRef = useRef(false);
  const lamboLoadedRef = useRef(false);

  useEffect(() => {
    const bgImg = new Image();
    bgImg.onload = () => { bgLoadedRef.current = true; bgImgRef.current = bgImg; };
    bgImg.src = "/images/sprites/cityscape-trail.png";
    const lamboImg = new Image();
    lamboImg.onload = () => { lamboLoadedRef.current = true; lamboImgRef.current = lamboImg; };
    lamboImg.src = "/images/sprites/lambo-red.png";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    if (bgLoadedRef.current && bgImgRef.current) {
      const bgW = bgImgRef.current.width;
      const bgH = bgImgRef.current.height;
      const scale = H / bgH;
      const drawW = bgW * scale;
      const offset = -(animFrame * 3) % drawW;
      for (let x = offset; x < W; x += drawW) {
        ctx.drawImage(bgImgRef.current, x, 0, drawW, H);
      }
    } else {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, W, H);
    }

    // Road
    const roadY = H * 0.72;

    // Stars
    for (let i = 0; i < 30; i++) {
      const sx = (i * 137 + 23) % W;
      const sy = (i * 89 + 11) % (H * 0.25);
      const twinkle = (animFrame + i * 3) % 6;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = twinkle < 2 ? 0.7 : twinkle < 4 ? 0.15 : 0.35;
      ctx.fillRect(sx, sy, twinkle === 0 ? 2 : 1, twinkle === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    // Lambo
    const lamboW = 315;
    const lamboH = 158;
    const lamboX = ((animFrame * 3) % (W + lamboW * 2)) - lamboW;
    const lamboYPos = roadY - lamboH * 0.45;
    const bounce = animFrame % 3 === 0 ? -1 : 0;

    if (lamboLoadedRef.current && lamboImgRef.current) {
      ctx.drawImage(lamboImgRef.current, lamboX, lamboYPos + bounce, lamboW, lamboH);

      // Reflection
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.translate(lamboX, roadY + lamboH * 0.15);
      ctx.scale(1, -0.4);
      ctx.drawImage(lamboImgRef.current, 0, 0, lamboW, lamboH);
      ctx.restore();
    }

    // Exhaust
    for (let ei = 0; ei < 6; ei++) {
      const ex = lamboX - 4 - ei * 6 - ((animFrame * 4 + ei * 5) % 18);
      const ey = lamboYPos + lamboH * 0.55 + bounce + Math.sin(animFrame * 0.5 + ei) * 2;
      ctx.globalAlpha = 0.2 - ei * 0.03;
      ctx.fillStyle = "#aaaacc";
      ctx.fillRect(ex, ey, 3, 2);
    }
    ctx.globalAlpha = 1;

    // Headlight
    const beamX = lamboX + lamboW;
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffee44";
    ctx.fillRect(beamX, lamboYPos + lamboH * 0.4 + bounce, 80, 6);
    ctx.globalAlpha = 0.03;
    ctx.fillRect(beamX, lamboYPos + lamboH * 0.3 + bounce, 120, 12);
    ctx.globalAlpha = 1;

    // Mile marker
    const milesTraveled = 250;
    const totalMiles = 900;
    const progress = milesTraveled / totalMiles;
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(0, H - 4, W * progress, 4);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`${milesTraveled} / ${totalMiles} mi`, 8, H - 8);
  }, [animFrame]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", borderRadius: 8, border: "1px solid #333" }} />;
}

function PixelTitleCanvas({ width = 600, height = 300, animFrame }: { width?: number; height?: number; animFrame: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImgRef = useRef<HTMLImageElement | null>(null);
  const lamboImgRef = useRef<HTMLImageElement | null>(null);
  const bgLoadedRef = useRef(false);
  const lamboLoadedRef = useRef(false);

  useEffect(() => {
    const bgImg = new Image();
    bgImg.onload = () => { bgLoadedRef.current = true; bgImgRef.current = bgImg; };
    bgImg.src = "/images/sprites/cityscape-trail.png";
    const lamboImg = new Image();
    lamboImg.onload = () => { lamboLoadedRef.current = true; lamboImgRef.current = lamboImg; };
    lamboImg.src = "/images/sprites/lambo-red.png";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    if (bgLoadedRef.current && bgImgRef.current) {
      const bgW = bgImgRef.current.width;
      const bgH = bgImgRef.current.height;
      const scale = H / bgH;
      const drawW = bgW * scale;
      const offset = -(animFrame * 4) % drawW;
      for (let x = offset; x < W; x += drawW) {
        ctx.drawImage(bgImgRef.current, x, 0, drawW, H);
      }
    } else {
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, W, H);
    }

    // Stars
    for (let i = 0; i < 40; i++) {
      const sx = (i * 137 + 23) % W;
      const sy = (i * 89 + 11) % (H * 0.25);
      const twinkle = (animFrame + i * 3) % 6;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = twinkle < 2 ? 0.7 : twinkle < 4 ? 0.15 : 0.35;
      ctx.fillRect(sx, sy, twinkle === 0 ? 2 : 1, twinkle === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1;

    // Lambo
    const lamboW = 360;
    const lamboH = 180;
    const roadY = H * 0.72;
    const lamboX = ((animFrame * 4) % (W + lamboW * 2)) - lamboW;
    const lamboYPos = roadY - lamboH * 0.45;
    const bounce = animFrame % 3 === 0 ? -1 : 0;

    if (lamboLoadedRef.current && lamboImgRef.current) {
      ctx.drawImage(lamboImgRef.current, lamboX, lamboYPos + bounce, lamboW, lamboH);

      // Reflection
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.translate(lamboX, roadY + lamboH * 0.15);
      ctx.scale(1, -0.4);
      ctx.drawImage(lamboImgRef.current, 0, 0, lamboW, lamboH);
      ctx.restore();
    }

    // Exhaust
    for (let ei = 0; ei < 6; ei++) {
      const ex = lamboX - 4 - ei * 6 - ((animFrame * 4 + ei * 5) % 18);
      const ey = lamboYPos + lamboH * 0.55 + bounce + Math.sin(animFrame * 0.5 + ei) * 2;
      ctx.globalAlpha = 0.2 - ei * 0.03;
      ctx.fillStyle = "#aaaacc";
      ctx.fillRect(ex, ey, 3, 2);
    }
    ctx.globalAlpha = 1;

    // Headlight
    const beamX = lamboX + lamboW;
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffee44";
    ctx.fillRect(beamX, lamboYPos + lamboH * 0.4 + bounce, 80, 6);
    ctx.globalAlpha = 0.03;
    ctx.fillRect(beamX, lamboYPos + lamboH * 0.3 + bounce, 120, 12);
    ctx.globalAlpha = 1;
  }, [animFrame]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%", borderRadius: 8, border: "1px solid #333" }} />;
}

export default function DevPreview() {
  const [animFrame, setAnimFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setAnimFrame((f) => f + 1), 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: "#0a0a1a", minHeight: "100vh", padding: 24, color: "white", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Dev Preview - Canvas Sprites</h1>

      <h2 style={{ fontSize: 16, marginBottom: 8, color: "#06b6d4" }}>Title Canvas</h2>
      <PixelTitleCanvas width={600} height={300} animFrame={animFrame} />

      <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 8, color: "#06b6d4" }}>Trail Canvas</h2>
      <PixelTrailCanvas width={600} height={300} animFrame={animFrame} />
    </div>
  );
}
