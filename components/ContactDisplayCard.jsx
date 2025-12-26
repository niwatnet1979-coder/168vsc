import React from 'react'
import { Phone, Mail, MessageCircle } from 'lucide-react'

export default function ContactDisplayCard({ contact, onClick, className = "" }) {
    if (!contact) return null

    return (
        <div
            onClick={onClick}
            className={`mt-1 cursor-pointer rounded-lg transition-all ${className}`}
            title="คลิกเพื่อเปลี่ยนผู้ติดต่อ"
        >
            <div className="space-y-1.5 p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {/* Row 2: Name & Position */}
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-secondary-900">{contact.name}</span>
                    {contact.position && (
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-wide">
                            {contact.position}
                        </span>
                    )}
                </div>

                {/* Row 3: Phone | Email | Line */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-600">
                    {contact.phone && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors">
                            <Phone size={11} className="text-secondary-400 shrink-0" />
                            <span>{contact.phone}</span>
                        </div>
                    )}
                    {contact.email && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                            <Mail size={11} className="text-secondary-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{contact.email}</span>
                        </div>
                    )}
                    {(contact.line || contact.lineId || contact.line_id) && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                            <MessageCircle size={11} className="text-[#06c755] shrink-0" />
                            <span className="font-medium text-[#06c755]">{contact.line || contact.lineId || contact.line_id}</span>
                        </div>
                    )}
                </div>

                {/* Row 4: Note */}
                {contact.note && (
                    <div className="flex items-start gap-1.5 mt-1 pl-1">
                        <span className="text-[10px] font-bold text-secondary-500 whitespace-nowrap mt-0.5">Note:</span>
                        <span className="text-[11px] text-secondary-700 leading-relaxed italic">{contact.note}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
