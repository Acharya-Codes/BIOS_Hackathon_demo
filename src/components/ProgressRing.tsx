interface ProgressRingProps {
  value: number;
  label?: string;
  size?: number;
}

export default function ProgressRing({ value, label = "complete", size = 72 }: ProgressRingProps) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value));

  return (
    <div aria-label={`${progress}% ${label}`} className="progress-ring" role="img" style={{ width: size, height: size }}>
      <svg aria-hidden="true" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
          strokeWidth={stroke}
        />
      </svg>
      <span>{progress}%</span>
    </div>
  );
}
