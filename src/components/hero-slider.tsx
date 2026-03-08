"use client";

import { useEffect, useRef, useState } from "react";

export type HeroSlide = {
  before: string;
  value: string;
  after: string;
  color: "text-amber" | "text-teal" | "text-rose" | "text-blue";
};

const INTERVAL_MS = 4500;

export function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!paused.current) {
        setIndex((i) => (i + 1) % slides.length);
      }
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  const slide = slides[index];

  return (
    <div
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
    >
      <h1
        key={index}
        className="fade-up font-[family-name:var(--font-display)] text-5xl leading-tight text-bureau-100 sm:text-6xl"
      >
        {slide.before && <>{slide.before} </>}
        <span className={`italic ${slide.color}`}>{slide.value}</span>
        {slide.after && (
          <> <span className="text-bureau-400 text-3xl sm:text-4xl">{slide.after}</span></>
        )}
      </h1>

      <div className="mt-5 flex justify-center items-center gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Diapositive ${i + 1}`}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === index
                ? "w-6 bg-teal"
                : "w-1.5 bg-bureau-600 hover:bg-bureau-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
