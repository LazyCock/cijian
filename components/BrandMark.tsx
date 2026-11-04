export function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M84.37 69 A42 42 0 1 1 84.37 27 L73.98 33 A30 30 0 1 0 73.98 63 Z"
      />
      <path
        fill="currentColor"
        d="M48 33 L58 37 L51 39 L51 53 C51 58 48 61 44 61 C40 61 37 59 36 55 L40 54 C41 56 42 58 45 57 C47 56 47 54 46 51 L45 39 L38 38 Z"
      />
    </svg>
  );
}
