"use client";

import { useEffect, useRef } from "react";

type EntryPhase = "consent" | "forming" | "arrival" | "dissolving" | "reforming" | "docked" | "site";

type Particle = {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  startX: number;
  startY: number;
  velocityX: number;
  velocityY: number;
  size: number;
  alpha: number;
  drift: number;
  spin: number;
};

type Bounds = { left: number; top: number; right: number; bottom: number };

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function inside(bounds: Bounds, x: number, y: number) {
  return x > bounds.left && x < bounds.right && y > bounds.top && y < bounds.bottom;
}

export function EntryParticleField({ phase }: { phase: EntryPhase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const phaseRef = useRef<EntryPhase>(phase);
  const formationStartedRef = useRef(0);
  const arrivalStartedRef = useRef(0);
  const exclusionRef = useRef<Bounds>({ left: 0, top: 0, right: 0, bottom: 0 });
  const pointerRef = useRef({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    if (phase === "forming" && phaseRef.current !== "forming") {
      formationStartedRef.current = performance.now();
      particlesRef.current.forEach((particle) => {
        particle.startX = particle.x;
        particle.startY = particle.y;
      });
    }
    if (phase === "arrival" && phaseRef.current !== "arrival") {
      arrivalStartedRef.current = performance.now();
    }
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const random = seededRandom(689);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frame = 0;

    const updateExclusion = () => {
      const card = document.querySelector<HTMLElement>(".consent-card");
      const rect = card?.getBoundingClientRect();
      const margin = 42;
      exclusionRef.current = rect
        ? { left: rect.left - margin, top: rect.top - margin, right: rect.right + margin, bottom: rect.bottom + margin }
        : { left: width * .27, top: height * .18, right: width * .73, bottom: height * .82 };
    };

    const createParticles = () => {
      updateExclusion();
      const count = Math.max(130, Math.min(260, Math.round((width * height) / 6200)));
      const particles: Particle[] = [];
      for (let index = 0; index < count; index += 1) {
        let x = random() * width;
        let y = random() * height;
        let attempts = 0;
        while (inside(exclusionRef.current, x, y) && attempts < 24) {
          x = random() * width;
          y = random() * height;
          attempts += 1;
        }
        if (inside(exclusionRef.current, x, y)) {
          x = random() < .5 ? random() * Math.max(1, exclusionRef.current.left) : exclusionRef.current.right + random() * Math.max(1, width - exclusionRef.current.right);
        }
        particles.push({
          x,
          y,
          homeX: x,
          homeY: y,
          startX: x,
          startY: y,
          velocityX: 0,
          velocityY: 0,
          size: .55 + random() * 1.2,
          alpha: .28 + random() * .58,
          drift: random() * Math.PI * 2,
          spin: .75 + random() * 1.4,
        });
      }
      particlesRef.current = particles;
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const density = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(density, 0, 0, density, 0, 0);
      createParticles();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY, active: true };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };

    const drawParticle = (particle: Particle, alpha: number) => {
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fillStyle = `rgba(241, 210, 138, ${Math.max(0, alpha)})`;
      context.shadowColor = "rgba(217, 174, 82, .72)";
      context.shadowBlur = particle.size * 5;
      context.fill();
    };

    const animate = (now: number) => {
      context.clearRect(0, 0, width, height);
      const currentPhase = phaseRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      if (currentPhase === "consent") {
        const pointer = pointerRef.current;
        particlesRef.current.forEach((particle, index) => {
          const driftX = reducedMotion ? 0 : Math.sin(now * .00042 + particle.drift) * 5;
          const driftY = reducedMotion ? 0 : Math.cos(now * .00035 + particle.drift * 1.2) * 7;
          let accelerationX = (particle.homeX + driftX - particle.x) * .011;
          let accelerationY = (particle.homeY + driftY - particle.y) * .011;

          if (!reducedMotion && pointer.active) {
            const deltaX = particle.x - pointer.x;
            const deltaY = particle.y - pointer.y;
            const distance = Math.hypot(deltaX, deltaY);
            if (distance < 145 && distance > .1) {
              const force = (1 - distance / 145) * .72;
              accelerationX += (deltaX / distance) * force + (-deltaY / distance) * force * .16;
              accelerationY += (deltaY / distance) * force + (deltaX / distance) * force * .16;
            }
          }

          particle.velocityX = (particle.velocityX + accelerationX) * .9;
          particle.velocityY = (particle.velocityY + accelerationY) * .9;
          particle.x += particle.velocityX;
          particle.y += particle.velocityY;
          if (!inside(exclusionRef.current, particle.x, particle.y)) {
            drawParticle(particle, particle.alpha * (.72 + Math.sin(now * .001 + index) * .22));
          }
        });
      } else if (currentPhase === "forming") {
        const progress = Math.min(1, Math.max(0, (now - formationStartedRef.current) / (reducedMotion ? 80 : 1450)));
        const eased = 1 - Math.pow(1 - progress, 3);
        particlesRef.current.forEach((particle, index) => {
          const deltaX = particle.startX - centerX;
          const deltaY = particle.startY - centerY;
          const radius = Math.hypot(deltaX, deltaY) * (1 - eased);
          const angle = Math.atan2(deltaY, deltaX) + eased * Math.PI * 4.25 * particle.spin;
          const finalRadius = 4 + (index % 17) * .52;
          particle.x = centerX + Math.cos(angle) * (radius + eased * finalRadius);
          particle.y = centerY + Math.sin(angle) * (radius * .72 + eased * finalRadius);
          drawParticle(particle, particle.alpha * (.78 + progress * .22));
        });
      } else if (currentPhase === "arrival") {
        const progress = Math.min(1, Math.max(0, (now - arrivalStartedRef.current) / (reducedMotion ? 80 : 720)));
        particlesRef.current.forEach((particle) => {
          drawParticle(particle, particle.alpha * (1 - progress) * .8);
        });
      }

      frame = window.requestAnimationFrame(animate);
    };

    resize();
    window.requestAnimationFrame(updateExclusion);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="entry-particle-field" aria-hidden="true" />;
}
