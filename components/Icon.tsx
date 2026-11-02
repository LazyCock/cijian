type IconProps = {
  name: string;
  className?: string;
  size?: number;
};

export function Icon({ name, className = "icon", size }: IconProps) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      style={size ? { width: size, height: size } : undefined}
    >
      <use href={`#${name}`} />
    </svg>
  );
}
