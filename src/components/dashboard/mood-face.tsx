"use client";

/**
 * MoodFace — 6-level line-drawn emoji that adapts to any theme.
 *
 * All strokes use `currentColor`, so the parent can set color via `style.color`
 * or Tailwind text-* classes (text-success, text-sage-300, text-danger, etc.)
 *
 * Levels (from healthiest → most distressed):
 *   "ecstatic"  — laughing wide grin             (commitments < 30% of income)
 *   "happy"     — gentle smile                   (30–50%)
 *   "neutral"   — flat / ambivalent              (50–70%)
 *   "concerned" — slight frown, raised brows     (70–90%)
 *   "sad"       — deep frown, weary brows        (90–100%)
 *   "crying"    — frown + tears                  (> 100%, debt > income)
 */

export type MoodLevel = "ecstatic" | "happy" | "neutral" | "concerned" | "sad" | "crying";

interface MoodFaceProps {
  level: MoodLevel;
  size?: number;
  className?: string;
  /** Optional explicit color override. If unset, uses currentColor (preferred — themeable). */
  color?: string;
  /** When true, adds a subtle pulse animation. */
  animate?: boolean;
}

/** Stroke width scales with size so 32px and 120px both feel right. */
function strokeWidth(size: number): number {
  return Math.max(1.5, Math.min(3, size / 32));
}

export function MoodFace({ level, size = 64, className, color, animate }: MoodFaceProps) {
  const sw = strokeWidth(size);
  const style = color ? { color } : undefined;

  // Outer circle is shared
  const outer = (
    <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth={sw} />
  );

  let eyes: React.ReactNode = null;
  let mouth: React.ReactNode = null;
  let brows: React.ReactNode = null;
  let extras: React.ReactNode = null;

  switch (level) {
    case "ecstatic":
      // Squinty laughing eyes (^_^) + wide open laughing mouth
      eyes = (
        <>
          <path d="M 19 26 Q 23 22, 27 26" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 37 26 Q 41 22, 45 26" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        </>
      );
      mouth = (
        <path
          d="M 18 38 Q 32 52, 46 38 Q 46 41, 32 41 Q 18 41, 18 38 Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={sw * 0.6}
          strokeLinejoin="round"
        />
      );
      break;

    case "happy":
      // Dot eyes + simple upward arc
      eyes = (
        <>
          <circle cx="23" cy="26" r={sw * 1.5} fill="currentColor" />
          <circle cx="41" cy="26" r={sw * 1.5} fill="currentColor" />
        </>
      );
      mouth = (
        <path d="M 20 38 Q 32 48, 44 38" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      );
      break;

    case "neutral":
      // Dot eyes + flat line
      eyes = (
        <>
          <circle cx="23" cy="27" r={sw * 1.5} fill="currentColor" />
          <circle cx="41" cy="27" r={sw * 1.5} fill="currentColor" />
        </>
      );
      mouth = (
        <line x1="22" y1="42" x2="42" y2="42" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      );
      break;

    case "concerned":
      // Slight brows + dot eyes + small downward arc
      brows = (
        <>
          <path d="M 17 19 Q 22 17, 28 19" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 36 19 Q 42 17, 47 19" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        </>
      );
      eyes = (
        <>
          <circle cx="23" cy="28" r={sw * 1.5} fill="currentColor" />
          <circle cx="41" cy="28" r={sw * 1.5} fill="currentColor" />
        </>
      );
      mouth = (
        <path d="M 22 44 Q 32 39, 42 44" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      );
      break;

    case "sad":
      // Heavier brows + sad eyes + deep frown
      brows = (
        <>
          <path d="M 16 20 Q 22 16, 28 21" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 36 21 Q 42 16, 48 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        </>
      );
      eyes = (
        <>
          <circle cx="23" cy="29" r={sw * 1.6} fill="currentColor" />
          <circle cx="41" cy="29" r={sw * 1.6} fill="currentColor" />
        </>
      );
      mouth = (
        <path d="M 20 46 Q 32 36, 44 46" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      );
      break;

    case "crying":
      // Heavy brows + closed weeping eyes + deep frown + two tears
      brows = (
        <>
          <path d="M 15 21 Q 22 16, 28 22" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 36 22 Q 42 16, 49 21" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        </>
      );
      eyes = (
        <>
          <path d="M 18 30 Q 23 26, 28 30" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
          <path d="M 36 30 Q 41 26, 46 30" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
        </>
      );
      mouth = (
        <path d="M 20 48 Q 32 38, 44 48" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" />
      );
      extras = (
        <>
          {/* Tear under left eye */}
          <path
            d="M 22 33 Q 19 38, 22 41 Q 25 38, 22 33 Z"
            fill="currentColor"
            opacity="0.7"
          />
          {/* Tear under right eye */}
          <path
            d="M 42 33 Q 39 38, 42 41 Q 45 38, 42 33 Z"
            fill="currentColor"
            opacity="0.7"
          />
        </>
      );
      break;
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={style}
      role="img"
      aria-label={`mood: ${level}`}
    >
      {animate && (
        <style>{`
          @keyframes mood-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.04); }
          }
          .mood-pulse { animation: mood-pulse 2.4s ease-in-out infinite; transform-origin: center; }
        `}</style>
      )}
      <g className={animate ? "mood-pulse" : undefined}>
        {outer}
        {brows}
        {eyes}
        {mouth}
        {extras}
      </g>
    </svg>
  );
}

/* ── Helpers ───────────────────────────────────────────── */

/**
 * Maps a debt/income ratio to a mood level.
 * Returns "neutral" as a safe default when income is 0 or undefined.
 */
export function ratioToMood(ratio: number): MoodLevel {
  if (!Number.isFinite(ratio) || ratio < 0) return "neutral";
  if (ratio < 0.30) return "ecstatic";
  if (ratio < 0.50) return "happy";
  if (ratio < 0.70) return "neutral";
  if (ratio < 0.90) return "concerned";
  if (ratio <= 1.0) return "sad";
  return "crying";
}

/**
 * Theme-aware color token (Tailwind class) for each mood level.
 * Designed so swapping CardPulse themes (Sage/Midnight/Cyberpunk/Molten/Mono/Terminal)
 * keeps the meaning intact — colors are CSS variables driven.
 */
export function moodColorClass(level: MoodLevel): string {
  switch (level) {
    case "ecstatic":
      return "text-success"; // mint green
    case "happy":
      return "text-sage-300";
    case "neutral":
      return "text-sand-300";
    case "concerned":
      return "text-warning"; // gold
    case "sad":
      return "text-danger"; // muted rose
    case "crying":
      return "text-danger"; // muted rose, with stronger emphasis via animate prop
  }
}

/** Short human label for the mood level (shown next to the face). */
export function moodLabel(level: MoodLevel): string {
  switch (level) {
    case "ecstatic":  return "Thriving";
    case "happy":     return "Comfortable";
    case "neutral":   return "Balanced";
    case "concerned": return "Tight";
    case "sad":       return "Stretched";
    case "crying":    return "Underwater";
  }
}

/** Subtitle / explanation copy keyed to the mood. */
export function moodCopy(level: MoodLevel, ratioPct: number): string {
  const pct = Math.round(ratioPct);
  switch (level) {
    case "ecstatic":  return `Only ${pct}% of income goes to commitments. Plenty of breathing room.`;
    case "happy":     return `${pct}% of income goes to commitments. You're in good shape.`;
    case "neutral":   return `${pct}% of income goes to commitments. Manageable, but watch new debt.`;
    case "concerned": return `${pct}% of income is committed. Margins are tight.`;
    case "sad":       return `${pct}% of income is committed. Almost no buffer left.`;
    case "crying":    return `Commitments exceed income by ${pct - 100}%. Action needed.`;
  }
}
