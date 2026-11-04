export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M87.95 57.27 A42 30 0 1 1 87.95 38.73 L76.53 42.44 A30 18 0 1 0 76.53 53.56 Z"
      />
      <path
        d="M48 38 V52 C48 56 45 58 41 58 C38 58 36 57 34 55"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
