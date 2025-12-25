import React from 'react'
import {
    User,
    Edit2,
    Search,
    Video,
    Users,
    Globe,
    Phone,
    Mail,
    MessageCircle,
    Facebook,
    Instagram,
    MapPin,
    FileText
} from 'lucide-react'

export default function CustomerInfoCard({ customer = {}, onEdit, className = '' }) {
    if (!customer) return null

    // Determine tag based on source
    // Logic copied from OrderFormClean.jsx
    const getMediaSourceElement = () => {
        const options = [
            { id: 'facebook', label: 'Facebook', icon: <Facebook size={10} /> },
            { id: 'line', label: 'Line', icon: <MessageCircle size={10} /> },
            { id: 'google', label: 'Google', icon: <Search size={10} /> },
            { id: 'tiktok', label: 'Tiktok', icon: <Video size={10} /> },
            { id: 'instagram', label: 'Instagram', icon: <Instagram size={10} /> },
            { id: 'walkin', label: 'Walk-in', icon: <User size={10} /> },
            { id: 'referral', label: 'บอกต่อ', icon: <Users size={10} /> },
            { id: 'other', label: 'อื่นๆ', icon: <Globe size={10} /> }
        ]
        const source = options.find(o => o.id === (customer.media || customer.source))
        if (!source && !customer.media) return null

        return (
            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-medium rounded border border-primary-200">
                <span className="flex items-center gap-1">
                    {source?.icon}
                    {source?.label || customer.media || customer.source}
                </span>
            </span>
        )
    }

    // Helper for safe values
    const val = (v) => v || '-'

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <User className="text-primary-600" />
                    ข้อมูลลูกค้า
                </h2>
                {/* Always show Edit button if onEdit provided */}
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                    >
                        <Edit2 size={14} />
                        แก้ไข
                    </button>
                )}
            </div>

            {/* Content Body - Mimics OrderFormClean card body */}
            <div className="flex-1 space-y-3">
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md space-y-2 group">
                    {/* Name & Code & Tag */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="font-bold text-secondary-900 text-sm leading-tight group-hover:text-primary-600 transition-colors">
                                        {customer.name || 'Unknown'}
                                    </h3>
                                    {getMediaSourceElement()}
                                </div>
                                <p className="text-xs text-secondary-500 mt-0.5 font-mono">
                                    CODE: {customer.code || customer.id || '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1 border-t border-secondary-200/50 mt-2">
                        <div className="flex items-center gap-2 text-secondary-700 text-xs">
                            <Phone size={12} className="text-secondary-400 shrink-0" />
                            <span className="truncate">{customer.phone || '-'}</span>
                        </div>
                        {customer.email && (
                            <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                <Mail size={12} className="text-secondary-400 shrink-0" />
                                <span className="truncate">{customer.email}</span>
                            </div>
                        )}
                        {customer.line && ( // OrderFormClean uses customer.line (aliased from line_id)
                            <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                <MessageCircle size={12} className="text-[#06c755] shrink-0" />
                                <span className="truncate">
                                    {/* Simple cleanup in case it has prefix */}
                                    {String(customer.line).replace(/^(Line|ID):?\s*/i, '')}
                                </span>
                            </div>
                        )}
                        {customer.facebook && (
                            <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                <Facebook size={12} className="text-[#1877F2] shrink-0" />
                                <span className="truncate">
                                    {String(customer.facebook).replace(/^(FB|Facebook):?\s*/i, '')}
                                </span>
                            </div>
                        )}
                        {customer.instagram && (
                            <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                <Instagram size={12} className="text-[#E1306C] shrink-0" />
                                <span className="truncate">
                                    {String(customer.instagram).replace(/^(IG|Instagram):?\s*/i, '')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Address - Only show if available */}
                    {customer.address && (
                        <div className="flex items-start gap-2 text-secondary-600 text-xs mt-1 pt-1 border-t border-secondary-200/50">
                            <MapPin size={12} className="text-secondary-400 mt-0.5 shrink-0" />
                            <span className="line-clamp-2">{customer.address}</span>
                        </div>
                    )}
                </div>

                {/* Receiver / Purchasing Contact - Optional */}
                {(customer.contactPerson || customer.purchasingContact) && (
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ติดต่อจัดซื้อ</label>
                        <div className="text-sm font-medium text-secondary-900">
                            {customer.contactPerson || customer.purchasingContact}
                            <span className="text-secondary-500 font-normal ml-2">
                                ({customer.contactPhone || customer.purchasingPhone || '-'})
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
