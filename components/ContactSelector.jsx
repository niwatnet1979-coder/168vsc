import React, { useState } from 'react'
import { Search, User, Phone, X, UserPlus } from 'lucide-react'

export default function ContactSelector({

    label,
    contacts = [],
    value,
    onChange,
    placeholder = "ค้นหาผู้ติดต่อ...",
    variant = "default",
    onAddNew, // New prop for adding contact
    readOnly = false // Add readOnly prop
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    // Filter contacts based on search term
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm))
    )

    const handleSelect = (contact) => {
        if (readOnly) return
        onChange(contact)
        setSearchTerm('')
        setShowDropdown(false)
    }

    const handleClear = () => {
        if (readOnly) return
        onChange(null)
    }

    return (
        <div className="">
            <label className="block text-sm font-medium text-secondary-700 mb-2">{label}</label>

            {!value || !value.name ? (
                <div className="relative">
                    <Search className={`absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400 ${variant === 'seamless' ? '' : 'left-3'}`} size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            if (!readOnly) {
                                setSearchTerm(e.target.value)
                                setShowDropdown(true)
                            }
                        }}
                        onFocus={() => !readOnly && setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        readOnly={readOnly}
                        className={`${variant === 'seamless'
                            ? "w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal"
                            : "w-full pl-9 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                            } ${readOnly ? 'cursor-default focus:ring-0' : ''}`}
                        placeholder={readOnly ? "-" : placeholder}
                        autoFocus={variant === 'seamless' && showDropdown} // Autofocus if switched from click
                    />
                    {showDropdown && !readOnly && (
                        <div className={`absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg overflow-hidden flex flex-col ${variant === 'seamless' ? 'left-0 mt-2' : ''}`}>
                            <div className="overflow-y-auto max-h-48">
                                {filteredContacts.length > 0 ? (
                                    filteredContacts.map(contact => (
                                        <div
                                            key={contact.id || Math.random()}
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
                            {onAddNew && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault() // Change from stopPropagation to preventDefault/stopPropagation combo if needed, but the main issue was structure
                                        onAddNew()
                                        setShowDropdown(false)
                                    }}
                                    onMouseDown={(e) => e.preventDefault()} // IMPORTANT: Prevent input blur happening before click
                                    className="px-3 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 border-t border-primary-100"
                                >
                                    <UserPlus size={16} /> เพิ่มผู้ติดต่อใหม่
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onClick={() => {
                        if (readOnly) return
                        if (variant === 'seamless') {
                            onChange(null); // Clear value to switch to input mode
                            setSearchTerm(''); // Reset search
                            setShowDropdown(true); // Open dropdown immediately
                        }
                    }}
                    className={`${variant === 'seamless'
                        ? 'bg-transparent border-none p-0 cursor-pointer'
                        : `${variant === 'blue' ? 'bg-primary-50 border-primary-200' : 'bg-secondary-50 border-secondary-200'} border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200`
                        } flex items-center justify-between`}
                >
                    <div className="flex items-center gap-3 w-full">
                        {variant !== 'seamless' && (
                            <div className={`w-8 h-8 bg-white rounded-full border ${variant === 'blue' ? 'border-primary-200 text-primary-600' : 'border-secondary-200 text-secondary-500'} flex items-center justify-center shrink-0`}>
                                <User size={16} />
                            </div>
                        )}
                        <div className="text-sm min-w-0 flex-1">
                            {variant === 'seamless' ? (
                                <div className="flex items-baseline gap-2 truncate">
                                    <span className="font-medium text-secondary-900">{value.name}</span>
                                    {value.phone && <span className="text-xs text-secondary-500">({value.phone})</span>}
                                </div>
                            ) : (
                                <>
                                    <div className="font-medium text-secondary-900 truncate">{value.name}</div>
                                    <div className="text-xs text-secondary-500 flex items-center gap-2 truncate">
                                        {value.position && <span>{value.position}</span>}
                                        {value.phone && (
                                            <>
                                                {value.position && <span className="w-1 h-1 bg-secondary-300 rounded-full"></span>}
                                                <span className="flex items-center gap-1"><Phone size={10} /> {value.phone}</span>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {variant !== 'seamless' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClear(); }}
                            className="text-secondary-400 hover:text-danger-500 p-1 hover:bg-white rounded transition-colors ml-2"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
