export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M84.37 69 A42 42 0 1 1 84.37 27 L73.98 33 A30 30 0 1 0 73.98 63 Z"
      />
      <path
        d="M48 28 V56 C48 62 43 66 37 66 C32 66 28 63 26 59"
        fill="none"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
