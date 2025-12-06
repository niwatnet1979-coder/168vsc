import React, { useState } from 'react'
import { Search, User, Phone, X } from 'lucide-react'

export default function ContactSelector({
    label,
    contacts = [],
    value,
    onChange,
    placeholder = "ค้นหาผู้ติดต่อ..."
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    // Filter contacts based on search term
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    )

    const handleSelect = (contact) => {
        onChange(contact)
        setSearchTerm('')
        setShowDropdown(false)
    }

    const handleClear = () => {
        onChange(null)
    }

    return (
        <div className="pt-4 border-t border-secondary-200">
            <label className="block text-sm font-medium text-secondary-700 mb-2">{label}</label>

            {!value || !value.name ? (
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-secondary-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setShowDropdown(true)
                        }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        className="w-full pl-9 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                        placeholder={placeholder}
                    />
                    {showDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => (
                                    <div
                                        key={contact.id || Math.random()} // Fallback key if id missing
                                        onClick={() => handleSelect(contact)}
                                        className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                    >
                                        <div className="font-medium text-secondary-900 text-sm">{contact.name}</div>
                                        <div className="text-xs text-secondary-500">
                                            {contact.position ? `${contact.position} | ` : ''}{contact.phone}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-secondary-500 text-center">
                                    ไม่พบผู้ติดต่อ
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-full border border-secondary-200 flex items-center justify-center text-secondary-500">
                            <User size={16} />
                        </div>
                        <div className="text-sm">
                            <div className="font-medium text-secondary-900">{value.name}</div>
                            <div className="text-xs text-secondary-500 flex items-center gap-2">
                                {value.position && <span>{value.position}</span>}
                                {value.phone && (
                                    <>
                                        <span className="w-1 h-1 bg-secondary-300 rounded-full"></span>
                                        <span className="flex items-center gap-1"><Phone size={10} /> {value.phone}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleClear}
                        className="text-secondary-400 hover:text-danger-500 p-1 hover:bg-white rounded transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    )
}
