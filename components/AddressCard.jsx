import React from 'react'
import { MapPin, X, Map } from 'lucide-react'
import Card from './Card'

export default function AddressCard({
    title,
    address,
    distance,
    mapLink,
    onClear,
    variant = 'primary', // 'primary' | 'success'
    badge = null
}) {
    const isTransparent = variant === 'transparent' || variant === 'seamless'

    // Determine styles based on variant
    let bgColor, borderColor, iconBgColor, iconColor

    if (isTransparent) {
        bgColor = '!bg-transparent'
        borderColor = '!border-none'
        iconBgColor = 'border-secondary-100 bg-white' // Keep icon box clean
        iconColor = 'text-primary-600'
    } else if (variant === 'success') {
        bgColor = 'bg-success-50'
        borderColor = 'border-success-200'
        iconBgColor = 'border-success-100'
        iconColor = 'text-success-600'
    } else {
        // Default Primary
        bgColor = 'bg-primary-50'
        borderColor = 'border-primary-200'
        iconBgColor = 'border-primary-100'
        iconColor = 'text-primary-600'
    }

    return (
        <Card
            useBase={false}
            className={`${bgColor} ${isTransparent ? 'border-none p-0 shadow-none' : `border ${borderColor} p-5 shadow-sm hover:shadow-md`} relative rounded-lg transition-shadow duration-200`}
            contentClassName=""
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 bg-white rounded-lg border ${iconBgColor} ${isTransparent ? 'shadow-sm' : ''} mt-1`}>
                    <MapPin size={20} className={iconColor} />
                </div>
                <div className="flex-1 pr-6">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-bold text-secondary-900 text-sm">
                            {title}
                        </h4>
                        {badge}
                        {(distance || mapLink) && (
                            mapLink ? (
                                <a
                                    href={mapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2 py-0.5 bg-danger-50 text-danger-600 text-xs font-medium rounded-full border border-danger-200 hover:bg-danger-100 transition-colors cursor-pointer flex items-center gap-1"
                                    title="เปิดแผนที่ Google Map"
                                    onClick={(e) => e.stopPropagation()} // Prevent triggering parent onClick
                                >
                                    <Map size={10} />
                                    {distance ? `ระยะทาง ${distance}` : 'เปิดแผนที่'}
                                </a>
                            ) : (
                                <span className="px-2 py-0.5 bg-secondary-100 text-secondary-600 text-xs font-medium rounded-full border border-secondary-200">
                                    ระยะทาง {distance}
                                </span>
                            )
                        )}
                    </div>

                    <p className="text-sm text-secondary-800 leading-relaxed mb-2">
                        {address}
                    </p>
                </div>
            </div>
            {onClear && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClear();
                    }}
                    className="absolute top-2 right-2 text-secondary-400 hover:text-danger-500 p-1 hover:bg-white rounded transition-colors"
                >
                    <X size={16} />
                </button>
            )}
        </Card>
    )
}
