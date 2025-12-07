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
    const isPrimary = variant === 'primary'
    const bgColor = isPrimary ? 'bg-primary-50' : 'bg-success-50'
    const borderColor = isPrimary ? 'border-primary-200' : 'border-success-200'
    const iconBgColor = isPrimary ? 'border-primary-100' : 'border-success-100'
    const iconColor = isPrimary ? 'text-primary-600' : 'text-success-600'

    return (
        <Card useBase={false} className={`${bgColor} border ${borderColor} rounded-lg p-4 relative`} contentClassName="">
            <div className="flex items-start gap-3">
                <div className={`p-2 bg-white rounded-lg border ${iconBgColor} mt-1`}>
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
            <button
                onClick={onClear}
                className="absolute top-2 right-2 text-secondary-400 hover:text-danger-500 p-1 hover:bg-white rounded transition-colors"
            >
                <X size={16} />
            </button>
        </Card>
    )
}
