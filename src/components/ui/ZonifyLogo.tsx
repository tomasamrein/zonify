interface ZonifyLogoProps {
  size?: number
  className?: string
  withBackground?: boolean
}

export function ZonifyLogo({ size = 40, className, withBackground = true }: ZonifyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Zonify"
    >
      {withBackground && <rect width="100" height="100" rx="22" fill="#F4F7FE" />}
      {/* Top bar */}
      <rect x="19" y="21" width="62" height="23" fill="#2E3192" />
      {/* Diagonal connector */}
      <polygon points="81,44 50,44 19,59 50,59" fill="#2E3192" />
      {/* Bottom bar */}
      <rect x="19" y="59" width="62" height="23" fill="#2E3192" />
    </svg>
  )
}
