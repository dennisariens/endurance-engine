type InfoTooltipProps = {
  label: string
  text: string
}

export function InfoTooltip({ label, text }: InfoTooltipProps) {
  return (
    <span className="info-tooltip" tabIndex={0} aria-label={`${label}: ${text}`}>
      <span aria-hidden="true">?</span>
      <span className="tooltip-bubble" role="tooltip">
        <strong>{label}</strong>
        {text}
      </span>
    </span>
  )
}
