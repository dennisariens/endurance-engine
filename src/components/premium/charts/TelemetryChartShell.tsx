import type { ComponentType, ReactNode } from 'react'
import { LineChart as LineIcon } from 'lucide-react'

type Props = {
  title: string
  children: ReactNode
  icon?: ComponentType<{ size?: number; strokeWidth?: number }>
  description?: string
  fields?: string[]
  actions?: ReactNode
  unavailable?: boolean
}

export function TelemetryChartShell({ title, children, icon: Icon = LineIcon, description, fields = [], actions, unavailable }: Props) {
  return (
    <article className="premium-chart-shell">
      <div className="chart-shell-header">
        <div>
          <div className="chart-title"><Icon size={15} strokeWidth={1.8} /><span>{title}</span></div>
          {description && <p>{description}</p>}
        </div>
        {!unavailable && actions && <div className="chart-shell-actions">{actions}</div>}
      </div>
      <div className="chart-frame">{unavailable ? <p role="status">Unavailable — dated measurements are not available for this chart. No history has been estimated or substituted.</p> : children}</div>
      {!unavailable && fields.length > 0 && <div className="chart-field-row">{fields.map((field) => <span key={field}>{field}</span>)}</div>}
    </article>
  )
}
