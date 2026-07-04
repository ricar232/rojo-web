export default function LogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 6 L42 22 H36 V40 H12 V22 H6 Z"
        stroke="url(#rmt-gold)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <rect x="19" y="25" width="10" height="9" stroke="url(#rmt-gold)" strokeWidth="1.5" />
      <defs>
        <linearGradient id="rmt-gold" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4d570" />
          <stop offset="1" stopColor="#a97e1a" />
        </linearGradient>
      </defs>
    </svg>
  );
}
