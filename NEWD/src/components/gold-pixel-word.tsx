"use client";

import { useEffect, useRef } from "react";

type Particle = {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  color: string;
};

const golds = ["#b88934", "#d9ae52", "#f0ce78", "#ffe6a1"];

export function GoldPixelWord({ word }: { word: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement = canvas;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, active: false };
    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let resizeTimer = 0;

    function sampleWord() {
      if (!canvas || !context) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      if (!width || !height) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const sample = document.createElement("canvas");
      sample.width = canvas.width;
      sample.height = canvas.height;
      const sampleContext = sample.getContext("2d");
      if (!sampleContext) return;
      sampleContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      sampleContext.fillStyle = "#fff";
      sampleContext.textAlign = "center";
      sampleContext.textBaseline = "middle";

      let fontSize = Math.min(height * 0.58, 170);
      sampleContext.font = `900 ${fontSize}px Arial Narrow, Impact, sans-serif`;
      const measured = sampleContext.measureText(word).width;
      if (measured > width * 0.84) fontSize *= (width * 0.84) / measured;
      sampleContext.font = `900 ${fontSize}px Arial Narrow, Impact, sans-serif`;
      sampleContext.fillText(word, width / 2, height / 2);

      const image = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
      const gap = Math.max(4, Math.round(3.5 * pixelRatio));
      const next: Particle[] = [];
      for (let y = 0; y < sample.height; y += gap) {
        for (let x = 0; x < sample.width; x += gap) {
          if (image[(y * sample.width + x) * 4 + 3] < 150) continue;
          const homeX = x / pixelRatio;
          const homeY = y / pixelRatio;
          const color = golds[Math.min(golds.length - 1, Math.floor((homeX / width) * golds.length))];
          next.push({ homeX, homeY, x: homeX + (Math.random() - 0.5) * 7, y: homeY + (Math.random() - 0.5) * 7, velocityX: 0, velocityY: 0, color });
        }
      }
      particles = next;
    }

    function render() {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      particles.forEach((particle) => {
        let accelerationX = (particle.homeX - particle.x) * 0.045;
        let accelerationY = (particle.homeY - particle.y) * 0.045;
        if (pointer.active) {
          const deltaX = particle.x - pointer.x;
          const deltaY = particle.y - pointer.y;
          const distanceSquared = deltaX * deltaX + deltaY * deltaY;
          const radius = 68;
          if (distanceSquared < radius * radius) {
            const distance = Math.sqrt(distanceSquared) || 1;
            const force = (1 - distance / radius) * 5.2;
            accelerationX += (deltaX / distance) * force;
            accelerationY += (deltaY / distance) * force;
          }
        }
        particle.velocityX = (particle.velocityX + accelerationX) * 0.82;
        particle.velocityY = (particle.velocityY + accelerationY) * 0.82;
        particle.x += particle.velocityX + (reducedMotion ? 0 : (Math.random() - 0.5) * 0.18);
        particle.y += particle.velocityY + (reducedMotion ? 0 : (Math.random() - 0.5) * 0.18);
        context.fillStyle = particle.color;
        context.fillRect(reducedMotion ? particle.homeX : particle.x, reducedMotion ? particle.homeY : particle.y, 1.8, 1.8);
      });
      if (!reducedMotion) animationFrame = window.requestAnimationFrame(render);
    }

    function onPointerMove(event: PointerEvent) {
      const bounds = canvasElement.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        sampleWord();
        if (reducedMotion) render();
      }, 150);
    }

    sampleWord();
    render();
    canvasElement.addEventListener("pointermove", onPointerMove);
    canvasElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(resizeTimer);
      canvasElement.removeEventListener("pointermove", onPointerMove);
      canvasElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [word]);

  return <canvas aria-hidden="true" className="gold-pixel-word" ref={canvasRef} />;
}
