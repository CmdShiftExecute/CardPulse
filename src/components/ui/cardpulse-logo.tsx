/**
 * CardPulseLogo — theme-adaptive inline SVG.
 *
 * All accent strokes/fills use `currentColor`, so the parent's text color
 * drives the whole mark. Wrap in `text-sage-400` to get the active theme's
 * primary accent (sage in Sage theme, neon in Cyberpunk, etc.).
 *
 * Design lineage: derived from the approved CardPulse logo assets
 * (rounded chip + tilted card + ECG-style pulse + end dot).
 */

interface CardPulseLogoProps {
  size?: number;
  className?: string;
  /** When true, draws the chip background. When false, only the pulse motif. */
  filled?: boolean;
}

export function CardPulseLogo({ size = 28, className, filled = true }: CardPulseLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="CardPulse"
    >
      <defs>
        {/* Subtle two-stop gradient using currentColor at different opacities — preserves the depth of the original mark while staying theme-adaptive */}
        <linearGradient id="cp-chip" x1="120" y1="225" x2="904" y2="799" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="1" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.62" />
        </linearGradient>
        <filter id="cp-glow" x="0" y="105" width="1024" height="814" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="45" />
        </filter>
        <filter id="cp-shadow" x="190" y="280" width="640" height="440" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="cp-pulse-glow" x="110" y="270" width="790" height="460" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {filled && (
        <>
          {/* Outer ambient glow */}
          <rect
            x="120"
            y="225"
            width="784"
            height="574"
            rx="125"
            fill="currentColor"
            opacity="0.40"
            filter="url(#cp-glow)"
          />
          {/* Chip body */}
          <rect x="120" y="225" width="784" height="574" rx="125" fill="url(#cp-chip)" />
          {/* Highlight stroke */}
          <rect
            x="122"
            y="227"
            width="780"
            height="570"
            rx="123"
            stroke="white"
            strokeOpacity="0.22"
            strokeWidth="4"
          />
          {/* Tilted underlay card (depth) */}
          <g transform="rotate(-5 512 512)">
            <rect
              x="240"
              y="310"
              width="545"
              height="355"
              rx="55"
              fill="white"
              fillOpacity="0.20"
              stroke="white"
              strokeOpacity="0.18"
              strokeWidth="2"
            />
          </g>
          {/* Card shadow */}
          <rect
            x="230"
            y="320"
            width="560"
            height="360"
            rx="58"
            fill="black"
            opacity="0.28"
            filter="url(#cp-shadow)"
          />
          {/* Card face */}
          <rect x="230" y="320" width="560" height="360" rx="58" fill="#FCFCFC" />
          <rect
            x="231.5"
            y="321.5"
            width="557"
            height="357"
            rx="56.5"
            stroke="white"
            strokeOpacity="0.40"
            strokeWidth="3"
          />
          {/* Card "data" bars */}
          <rect x="300" y="395" width="145" height="35" rx="10" fill="currentColor" opacity="0.62" />
          <rect x="300" y="470" width="110" height="30" rx="10" fill="currentColor" opacity="0.62" />
        </>
      )}

      {/* Pulse waveform — glow layer */}
      <path
        d="M155 512H340L370 485L395 535L427 560L465 318L512 680L555 432L600 548L628 512H850"
        stroke="currentColor"
        strokeWidth="38"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
        filter="url(#cp-pulse-glow)"
      />
      {/* Pulse waveform — solid */}
      <path
        d="M155 512H340L370 485L395 535L427 560L465 318L512 680L555 432L600 548L628 512H850"
        stroke="currentColor"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle cx="850" cy="512" r="16" fill="currentColor" />
    </svg>
  );
}
