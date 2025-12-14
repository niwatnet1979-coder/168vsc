import React from 'react'
import { User, Phone, Mail, Instagram, Facebook, MessageCircle, Edit } from 'lucide-react'

export default function CustomerInfoCard({ customer, className = '' }) {
    if (!customer) return null

    // Determine tag based on source or type if available, else hardcode or hide
    // For now, let's look for a 'source' or 'type' field, or default to 'GOOGLE' as in design if undefined
    const customerTag = customer.source || customer.type || 'GOOGLE'

    // Helper to safely get value
    const val = (v) => v || '-'

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-6 ${className}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <User className="text-primary-600" size={24} />
                    <h2 className="text-lg font-bold text-secondary-900">ข้อมูลลูกค้า</h2>
                </div>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary-200 text-primary-600 text-sm font-medium hover:bg-primary-50 transition-colors">
                    <Edit size={16} />
                    แก้ไข
                </button>
            </div>

            <div className="space-y-4">
                {/* Main Customer Details */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-base font-bold text-secondary-900">{customer.name || 'Unknown'}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 uppercase tracking-wider">
                            {customerTag}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-4 font-mono">
                        CODE: {customer.code || customer.id || '-'}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8">
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                            <Phone size={16} className="text-gray-400" />
                            <span>{val(customer.phone)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                            <Mail size={16} className="text-gray-400" />
                            <span>{val(customer.email)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                            <MessageCircle size={16} className="text-green-500" />
                            <span>{val(customer.lineId)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                            <Facebook size={16} className="text-blue-600" />
                            <span>{val(customer.facebook)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-secondary-700">
                            <Instagram size={16} className="text-pink-600" />
                            <span>{val(customer.instagram)}</span>
                        </div>
                    </div>
                </div>

                {/* Purchasing Contact */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <h3 className="text-sm font-bold text-secondary-600 mb-2">ผู้ติดต่อจัดซื้อ</h3>
                    <div className="flex items-center gap-4 text-sm text-secondary-900 font-medium">
                        <span>{val(customer.contactPerson || customer.purchasingContact)}</span>
                        <span className="text-gray-400 font-normal">({val(customer.contactPhone || customer.purchasingPhone)})</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
