import React from 'react'
import {
    User, Search, Edit2, UserPlus, Phone, Mail, MessageCircle,
    Facebook, Instagram, Globe, Users, Video
} from 'lucide-react'
import Card from '../Card'
import CustomerModal from '../CustomerModal'
import ContactSelector from '../ContactSelector'
import ContactDisplayCard from '../ContactDisplayCard'

/**
 * OrderCustomerSection Component
 * Handles customer selection, display, and contact person selection
 */
export default function OrderCustomerSection({
    // Customer data
    customer,
    customersData,
    receiverContact,
    purchaserContact,

    // Handlers
    onSelectCustomer,
    onUpdateCustomer,
    onAddNewCustomer,
    onDeleteCustomer,
    onSetCustomer,
    onSetReceiverContact,
    onSetPurchaserContact,

    // UI State
    showCustomerDropdown,
    setShowCustomerDropdown,
    showAddCustomerModal,
    setShowAddCustomerModal,
    showEditCustomerModal,
    setShowEditCustomerModal,
    handleEditCustomer,

    // Modal state
    addingContactFor,
    setAddingContactFor,
    customerModalTab,
    setCustomerModalTab,

    // Handlers for adding new items
    onAddNewContact
}) {
    return (
        <div className="order-1 md:order-1 flex flex-col h-full">
            <Card className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                        <User className="text-primary-600" />
                        ข้อมูลลูกค้า
                    </h2>
                    {customer.id && (
                        <button
                            onClick={handleEditCustomer}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                        >
                            <Edit2 size={14} />
                            แก้ไข
                        </button>
                    )}
                </div>

                <div className="flex-1 space-y-3">
                    {/* Customer Search */}
                    {!customer.id ? (
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            <div className="relative">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">
                                    ค้นหาลูกค้า / บริษัท <span className="text-danger-500">*</span>
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                    <input
                                        type="text"
                                        value={customer.name || ''}
                                        onChange={e => {
                                            onSetCustomer({ ...customer, name: e.target.value })
                                            setShowCustomerDropdown(true)
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                                        className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal"
                                        placeholder="ค้นหาชื่อ, เบอร์โทร..."
                                    />
                                    {showCustomerDropdown && (
                                        <div className="absolute z-20 w-full mt-2 left-0 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {customersData
                                                .filter(c => !customer.name || c.name.toLowerCase().includes(customer.name.toLowerCase()) || (c.phone && c.phone.includes(customer.name)))
                                                .map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => {
                                                            onSelectCustomer(c)
                                                            setShowCustomerDropdown(false)
                                                        }}
                                                        className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                    >
                                                        <div className="font-medium text-secondary-900 text-sm">{c.name}</div>
                                                        <div className="text-xs text-secondary-500">{c.phone} {c.email ? `| ${c.email}` : ''}</div>
                                                    </div>
                                                ))}
                                            <div
                                                onClick={() => {
                                                    setShowAddCustomerModal(true)
                                                    setShowCustomerDropdown(false)
                                                }}
                                                className="px-3 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 sticky bottom-0 border-t border-primary-100"
                                            >
                                                <UserPlus size={16} /> เพิ่มลูกค้าใหม่
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Customer Details Card */}
                    {customer.id && (
                        <div
                            onClick={() => onSetCustomer({})}
                            className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md space-y-2 cursor-pointer group"
                            title="คลิกเพื่อเปลี่ยนลูกค้า"
                        >
                            {/* Header: Name, Code */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-secondary-900 text-sm leading-tight group-hover:text-primary-600 transition-colors">
                                                {String(customer.name)}
                                            </h3>
                                            {customer.media && (
                                                <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-medium rounded border border-primary-200">
                                                    {(() => {
                                                        const options = [
                                                            { id: 'facebook', label: 'Facebook', icon: <Facebook size={10} /> },
                                                            { id: 'line', label: 'Line', icon: <MessageCircle size={10} /> },
                                                            { id: 'google', label: 'Google', icon: <Search size={10} /> },
                                                            { id: 'tiktok', label: 'Tiktok', icon: <Video size={10} /> },
                                                            { id: 'instagram', label: 'Instagram', icon: <Instagram size={10} /> },
                                                            { id: 'walkin', label: 'Walk-in', icon: <User size={10} /> },
                                                            { id: 'referral', label: 'บอกต่อ', icon: <Users size={10} /> },
                                                            { id: 'other', label: 'อื่นๆ', icon: <Globe size={10} /> }
                                                        ];
                                                        const source = options.find(o => o.id === customer.media);
                                                        return (
                                                            <span className="flex items-center gap-1">
                                                                {source?.icon}
                                                                {source?.label || customer.media}
                                                            </span>
                                                        );
                                                    })()}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-secondary-500 mt-0.5 font-mono">CODE: {customer.id || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pt-1">
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
                                {customer.line && (
                                    <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                        <MessageCircle size={12} className="text-[#06c755] shrink-0" />
                                        <span className="truncate">{customer.line.replace(/^(Line|ID):?\s*/i, '')}</span>
                                    </div>
                                )}
                                {customer.facebook && (
                                    <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                        <Facebook size={12} className="text-[#1877F2] shrink-0" />
                                        <span className="truncate">{customer.facebook.replace(/^(FB|Facebook):?\s*/i, '')}</span>
                                    </div>
                                )}
                                {customer.instagram && (
                                    <div className="flex items-center gap-2 text-secondary-700 text-xs">
                                        <Instagram size={12} className="text-[#E1306C] shrink-0" />
                                        <span className="truncate">{customer.instagram.replace(/^(IG|Instagram):?\s*/i, '')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Purchaser Contact Selection */}
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ติดต่อจัดซื้อ</label>
                        {!purchaserContact ? (
                            <ContactSelector
                                label={null}
                                contacts={customer.contacts || []}
                                value={purchaserContact}
                                onChange={onSetPurchaserContact}
                                variant="seamless"
                                placeholder="ค้นหาผู้ติดต่อ..."
                                onAddNew={() => onAddNewContact('purchaserContact')}
                            />
                        ) : (
                            <ContactDisplayCard
                                contact={purchaserContact}
                                onClick={() => onSetPurchaserContact(null)}
                            />
                        )}
                    </div>
                </div>
            </Card>

            {/* Customer Modal */}
            {showEditCustomerModal && (
                <CustomerModal
                    show={showEditCustomerModal}
                    onClose={() => setShowEditCustomerModal(false)}
                    customer={customer}
                    onSave={(updatedCustomer) => onUpdateCustomer(updatedCustomer, addingContactFor, setAddingContactFor, setCustomerModalTab, setShowEditCustomerModal)}
                    onDelete={(customerId) => onDeleteCustomer(customerId, setShowEditCustomerModal)}
                    initialTab={customerModalTab}
                />
            )}

            {/* Add Customer Modal */}
            {showAddCustomerModal && (
                <CustomerModal
                    show={showAddCustomerModal}
                    onClose={() => setShowAddCustomerModal(false)}
                    customer={null}
                    onSave={(newCustomer) => onAddNewCustomer(newCustomer, setShowAddCustomerModal)}
                    initialTab="customer"
                />
            )}
        </div>
    )
}
