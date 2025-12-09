import React from 'react'

export default function Card({
  title = null,
  children,
  className = '',
  contentClassName = '',
  actions = null,
  useBase = true
}) {
  const base = 'bg-white p-4 rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow duration-200'

  return (
    <div className={`${useBase ? base : ''} ${className}`.trim()}>
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <div>{title}</div>
          {actions}
        </div>
      )}

      <div className={`space-y-3 ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  )
}
