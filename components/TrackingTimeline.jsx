import React from 'react'
import {
    Package,
    Truck,
    CheckCircle,
    MapPin,
    Clock,
    AlertCircle
} from 'lucide-react'

const TrackingTimeline = ({ events }) => {
    if (!events || events.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No tracking history found.</p>
            </div>
        )
    }

    const getIcon = (status) => {
        const lowerStatus = status.toLowerCase()
        if (lowerStatus.includes('received')) return Package
        if (lowerStatus.includes('check_in')) return Package
        if (lowerStatus.includes('qc')) return CheckCircle
        if (lowerStatus.includes('transit') || lowerStatus.includes('shipping')) return Truck
        return MapPin
    }

    const getStatusColor = (status) => {
        const lowerStatus = status.toLowerCase()
        if (lowerStatus.includes('received')) return 'bg-blue-100 text-blue-600'
        if (lowerStatus.includes('pass')) return 'bg-green-100 text-green-600'
        if (lowerStatus.includes('fail')) return 'bg-red-100 text-red-600'
        return 'bg-secondary-100 text-secondary-600'
    }

    return (
        <div className="relative pl-4 border-l-2 border-secondary-200 space-y-8">
            {events.map((event, index) => {
                const Icon = getIcon(event.step_status)
                const isLatest = index === 0

                return (
                    <div key={event.id} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm 
                            ${isLatest ? 'bg-primary-500 ring-4 ring-primary-100' : 'bg-secondary-300'}`}
                        />

                        {/* Content */}
                        <div className={`bg-white p-4 rounded-lg border shadow-sm transition-all
                            ${isLatest ? 'border-primary-200 ring-1 ring-primary-100' : 'border-secondary-100'}`}>

                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(event.step_status)}`}>
                                            {event.step_status}
                                        </span>
                                        <span className="text-sm font-medium text-secondary-900">
                                            {event.location_name}
                                        </span>
                                    </div>
                                    <p className="text-sm text-secondary-600 mt-1">
                                        {event.notes || 'No description provided'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-xs text-secondary-400">
                                        <Clock size={12} />
                                        {new Date(event.recorded_at).toLocaleDateString()}
                                    </div>
                                    <div className="text-xs text-secondary-400 mt-0.5">
                                        {new Date(event.recorded_at).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default TrackingTimeline
