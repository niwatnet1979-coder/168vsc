import React, { useState } from 'react'
import { useDebug } from '../contexts/DebugContext'

/**
 * DataSourceTooltip
 * Wraps content and shows a debug tooltip on hover if debug mode is enabled.
 * 
 * @param {Object} props
 * @param {boolean} props.isRealtime - If true, indicates data is live/realtime. If false, indicates snapshot.
 * @param {string} props.source - Optional source name (e.g. "Order Item", "Product DB")
 * @param {children} props.children - The content to wrap
 */
export default function DataSourceTooltip({ isRealtime = false, source = '', children, className = '' }) {
    const { isMouseDebugEnabled } = useDebug()
    const [showTooltip, setShowTooltip] = useState(false)

    if (!isMouseDebugEnabled) {
        return <>{children}</>
    }

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Visual Indicator Border */}
            <div className={`
                ${showTooltip ? (isRealtime ? 'ring-2 ring-success-400' : 'ring-2 ring-warning-400') : ''}
                rounded transition-all duration-200
            `}>
                {children}
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/80 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                    <div className="font-bold flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isRealtime ? 'bg-success-500' : 'bg-warning-500'}`}></span>
                        {isRealtime ? 'Realtime Data' : 'Snapshot Data'}
                    </div>
                    {source && <div className="text-secondary-300 text-[10px] mt-0.5">{source}</div>}

                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/80"></div>
                </div>
            )}
        </div>
    )
}
