import { useState, useEffect } from 'react'
import {
    X, User, FileText, MapPin, Plus, Trash2, Home, Phone, Mail,
    MessageCircle, Facebook, Instagram, Globe, Sparkles
} from 'lucide-react'
import TaxAddressParserModal from './TaxAddressParserModal'
import ConfirmDialog from './ConfirmDialog'

export default function CustomerModal({ isOpen, onClose, customer, onSave, onDelete, initialTab = 'customer' }) {
    const [activeTab, setActiveTab] = useState(initialTab)
    const [isSaving, setIsSaving] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', line: '', facebook: '', instagram: '',
        contact1: { name: '', phone: '' }, contact2: { name: '', phone: '' },
        mediaSource: '',
        taxInvoices: [],
        addresses: [],
        contacts: []  // New contacts array
    })

    // Parser State
    const [isParserOpen, setIsParserOpen] = useState(false)
    const [activeParserTaxId, setActiveParserTaxId] = useState(null)
    const [activeParserAddressId, setActiveParserAddressId] = useState(null)
    const [activeParserContactId, setActiveParserContactId] = useState(null)
    const [activeParserBasicInfo, setActiveParserBasicInfo] = useState(false)

    useEffect(() => {
        if (customer) {
            setFormData({
                ...customer,
                contact1: customer.contact1 || { name: '', phone: '' },
                contact2: customer.contact2 || { name: '', phone: '' },
                // Ensure taxInvoices is never empty - always show at least one form
                // Ensure taxInvoices is never empty - always show at least one form
                taxInvoices: (Array.isArray(customer.taxInvoices) && customer.taxInvoices.length > 0)
                    ? customer.taxInvoices.filter(Boolean)
                    : [{ id: Date.now(), companyName: '', taxId: '', branch: '', address: '' }],
                // Ensure addresses is never empty - always show at least one form
                addresses: (Array.isArray(customer.addresses) && customer.addresses.length > 0)
                    ? customer.addresses.filter(Boolean).map(addr => ({
                        ...addr,
                        // Map DB snake_case to camelCase for UI
                        googleMapsLink: addr.google_maps_link || addr.googleMapsLink || '',
                        label: addr.label || addr.location_name || '',
                        // Map all address fields from snake_case to camelCase
                        addrNumber: addr.addr_number || addr.addrNumber || '',
                        addrMoo: addr.addr_moo || addr.addrMoo || '',
                        addrVillage: addr.addr_village || addr.addrVillage || '',
                        addrSoi: addr.addr_soi || addr.addrSoi || '',
                        addrRoad: addr.addr_road || addr.addrRoad || '',
                        addrTambon: addr.addr_tambon || addr.addrTambon || '',
                        addrAmphoe: addr.addr_amphoe || addr.addrAmphoe || '',
                        province: addr.addr_province || addr.province || '',
                        zipcode: addr.addr_zipcode || addr.zipcode || ''
                    }))
                    : [{
                        id: Date.now() + 1,
                        label: '',
                        address: '',
                        googleMapsLink: ''
                    }],
                // Ensure contacts is never empty - always show at least one form
                contacts: (Array.isArray(customer.contacts) && customer.contacts.length > 0)
                    ? customer.contacts.filter(Boolean)
                    : [{
                        id: (Date.now() + 2).toString(),
                        name: '',
                        position: '',
                        phone: '',
                        email: '',
                        note: ''
                    }]
            })
        } else {
            // Reset for new customer
            setFormData({
                name: '', phone: '', email: '', line: '', facebook: '', instagram: '',
                contact1: { name: '', phone: '' }, contact2: { name: '', phone: '' },
                contact1: { name: '', phone: '' }, contact2: { name: '', phone: '' },
                mediaSource: '',
                // Initialize with one empty item each
                taxInvoices: [{ id: Date.now(), companyName: '', taxId: '', branch: '', address: '' }],
                addresses: [{
                    id: Date.now() + 1,
                    label: '',
                    address: '',
                    googleMapsLink: '',
                    inspector1: { name: '', phone: '' }
                }],
                contacts: [{
                    id: (Date.now() + 2).toString(),
                    name: '',
                    position: '',
                    phone: '',
                    email: '',
                    note: ''
                }]
            })
        }
    }, [customer, isOpen])

    // Reset tab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab)
        }
    }, [isOpen, initialTab])

    if (!isOpen) return null

    const handleSave = async () => {
        if (!formData.name) return alert('กรุณาระบุชื่อลูกค้า')
        if (!formData.phone) return alert('กรุณาระบุเบอร์โทรศัพท์')

        setIsSaving(true)
        try {
            await onSave(formData)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSaving(false)
        }
    }

    const tabs = [
        { id: 'customer', label: 'ข้อมูลลูกค้า', icon: User },
        { id: 'tax', label: 'ข้อมูลใบกำกับภาษี', icon: FileText },
        { id: 'address', label: 'ที่อยู่ติดตั้ง/จัดส่ง', icon: MapPin },
        { id: 'contacts', label: 'ผู้ติดต่อ', icon: User }
    ]

    // Helper functions for updating nested arrays (taxInvoices, addresses)
    const addTaxInvoice = () => {
        setFormData(prev => ({
            ...prev,
            taxInvoices: [...prev.taxInvoices, { id: Date.now(), companyName: '', taxId: '', branch: '', address: '' }]
        }))
    }

    const removeTaxInvoice = (id) => {
        setFormData(prev => ({
            ...prev,
            taxInvoices: prev.taxInvoices.filter(t => t.id !== id)
        }))
    }

    const updateTaxInvoice = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            taxInvoices: prev.taxInvoices.map(t => t.id === id ? { ...t, [field]: value } : t)
        }))
    }

    const addAddress = () => {
        setFormData(prev => ({
            ...prev,
            addresses: [...prev.addresses, {
                id: Date.now(),
                label: '',
                address: '',
                googleMapsLink: '',
                inspector1: { name: '', phone: '' }
            }]
        }))
    }

    const removeAddress = (id) => {
        setFormData(prev => ({
            ...prev,
            addresses: prev.addresses.filter(a => a.id !== id)
        }))
    }

    const updateAddress = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            addresses: prev.addresses.map(a => a.id === id ? { ...a, [field]: value } : a)
        }))
    }

    // Contact management functions
    const addContact = () => {
        const newContact = {
            id: Date.now().toString(),
            name: '',
            position: '',
            phone: '',
            email: '',
            note: ''
        }
        setFormData(prev => ({
            ...prev,
            contacts: [...prev.contacts, newContact]
        }))
    }

    const removeContact = (id) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.filter(c => c.id !== id)
        }))
    }

    const updateContact = (id, field, value) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts.map(c => c.id === id ? { ...c, [field]: value } : c)
        }))
    }

    const handleParserResult = (result) => {
        // Handle Tax Invoice Parse
        if (activeParserTaxId) {
            setFormData(prev => ({
                ...prev,
                taxInvoices: prev.taxInvoices.map(t => {
                    if (t.id === activeParserTaxId) {
                        return {
                            ...t,
                            companyName: result.companyName || t.companyName,
                            taxId: result.taxId || t.taxId,
                            branch: result.branch || t.branch,
                            // Address fields
                            addrNumber: result.addrNumber || t.addrNumber,
                            addrMoo: result.addrMoo || t.addrMoo,
                            addrVillage: result.addrVillage || t.addrVillage,
                            addrSoi: result.addrSoi || t.addrSoi,
                            addrRoad: result.addrRoad || t.addrRoad,
                            addrTambon: result.addrTambon || t.addrTambon,
                            addrAmphoe: result.addrAmphoe || t.addrAmphoe,
                            addrProvince: result.addrProvince || t.addrProvince,
                            addrZipcode: result.addrZipcode || t.addrZipcode
                        }
                    }
                    return t
                })
            }))
            setActiveParserTaxId(null) // Reset
        }

        // Handle Delivery Address Parse
        if (activeParserAddressId) {
            setFormData(prev => ({
                ...prev,
                addresses: prev.addresses.map(a => {
                    if (a.id === activeParserAddressId) {
                        return {
                            ...a,
                            label: result.fullLabel || result.companyName || a.label, // Use Full Label (Person + Company) if available
                            addrNumber: result.addrNumber || a.addrNumber,
                            addrMoo: result.addrMoo || a.addrMoo,
                            addrVillage: result.addrVillage || a.addrVillage,
                            addrSoi: result.addrSoi || a.addrSoi,
                            addrRoad: result.addrRoad || a.addrRoad,
                            addrTambon: result.addrTambon || a.addrTambon,
                            addrAmphoe: result.addrAmphoe || a.addrAmphoe,
                            province: result.addrProvince || a.province, // Map addrProvince -> province
                            zipcode: result.addrZipcode || a.zipcode // Map addrZipcode -> zipcode
                        }
                    }
                    return a
                })
            }))
            setActiveParserAddressId(null) // Reset
        } else if (activeParserContactId) {
            setFormData(prev => ({
                ...prev,
                contacts: prev.contacts.map(c => {
                    if (c.id === activeParserContactId) {
                        return {
                            ...c,
                            name: result.contactName || result.companyName || c.name, // Prefer Contact Name
                            phone: result.phone || c.phone,
                            email: result.email || c.email
                        }
                    }
                    return c
                })
            }))
            setActiveParserContactId(null)
        } else if (activeParserBasicInfo) {
            setFormData(prev => ({
                ...prev,
                name: result.companyName || result.fullLabel || prev.name, // For Basic Info, prefer Company Name if available
                phone: result.phone || prev.phone,
                email: result.email || prev.email
            }))
            setActiveParserBasicInfo(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-secondary-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
                    <h3 className="text-lg font-bold text-secondary-900">
                        {customer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-secondary-200 bg-white">
                    <div className="grid grid-cols-4 p-1 gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-medium transition-all rounded-lg ${activeTab === tab.id
                                        ? 'text-primary-600 bg-primary-50 ring-1 ring-primary-200 shadow-sm'
                                        : 'text-secondary-500 hover:text-secondary-900 hover:bg-secondary-50'
                                        }`}
                                >
                                    <Icon size={18} strokeWidth={2} />
                                    <span className="leading-tight truncate w-full text-center">{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1" style={{ minHeight: 0, maxHeight: 'calc(85vh - 200px)' }}>
                    {activeTab === 'customer' && (
                        <div className="p-4 space-y-4">
                            {/* Basic Information Card */}
                            <div className="p-4 border-2 border-secondary-200 rounded-xl bg-secondary-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-secondary-900">ข้อมูลพื้นฐาน</h4>
                                        <button
                                            onClick={() => {
                                                setActiveParserBasicInfo(true)
                                                setIsParserOpen(true)
                                            }}
                                            className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors flex items-center justify-center"
                                            title="กรอกอัตโนมัติ"
                                        >
                                            <Sparkles size={16} />
                                        </button>
                                    </div>
                                    {/* Show delete button only if it's an existing customer (customer prop exists) and onDelete is provided */}
                                    {customer && onDelete && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="p-1.5 text-danger-600 bg-danger-50 hover:bg-danger-100 rounded-full transition-colors flex items-center justify-center"
                                            title="ลบลูกค้า"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                            <label className="block text-xs font-medium text-secondary-500 mb-1">ชื่อลูกค้า / บริษัท <span className="text-danger-500">*</span></label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                placeholder="ระบุชื่อลูกค้า หรือชื่อบริษัท..."
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                            <label className="block text-xs font-medium text-secondary-500 mb-1">เบอร์โทรศัพท์ <span className="text-danger-500">*</span></label>
                                            <div className="relative">
                                                <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                    placeholder="0xx-xxx-xxxx"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                            <label className="block text-xs font-medium text-secondary-500 mb-1">อีเมล</label>
                                            <div className="relative">
                                                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                    placeholder="example@mail.com"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media Card */}
                            <div className="p-4 border-2 border-secondary-200 rounded-xl bg-secondary-50">
                                <h4 className="font-semibold text-secondary-900 mb-4">ช่องทางติดต่อ Social Media</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-[#06c755]/30 transition-all shadow-sm">
                                            <label className="block text-xs font-medium text-secondary-500 mb-1">LINE ID</label>
                                            <div className="relative">
                                                <MessageCircle className="absolute left-0 top-1/2 -translate-y-1/2 text-[#06c755]" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.line}
                                                    onChange={e => setFormData({ ...formData, line: e.target.value })}
                                                    className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                    placeholder="ไอดีไลน์..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-[#1877f2]/30 transition-all shadow-sm">
                                            <label className="block text-xs font-medium text-secondary-500 mb-1">Facebook</label>
                                            <div className="relative">
                                                <Facebook className="absolute left-0 top-1/2 -translate-y-1/2 text-[#1877f2]" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.facebook}
                                                    onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                                                    className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                    placeholder="ชื่อลิงก์เฟสบุ๊ค..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-[#e4405f]/30 transition-all shadow-sm">
                                            <label className="block text-xs font-medium text-secondary-500 mb-1">Instagram</label>
                                            <div className="relative">
                                                <Instagram className="absolute left-0 top-1/2 -translate-y-1/2 text-[#e4405f]" size={16} />
                                                <input
                                                    type="text"
                                                    value={formData.instagram}
                                                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                                    className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                    placeholder="ชื่อบัญชีไอจี..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Media Source Card */}
                            <div className="p-4 border-2 border-secondary-200 rounded-xl bg-secondary-50">
                                <h4 className="font-semibold text-secondary-900 mb-4">ที่มาของลูกค้า</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                            <label className="block text-xs font-medium text-secondary-500 mb-1">สื่อที่ลูกค้าเห็น</label>
                                            <select
                                                value={formData.mediaSource}
                                                onChange={e => setFormData({ ...formData, mediaSource: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0"
                                            >
                                                <option value="">ระบุสื่อที่ลูกค้าเห็น</option>
                                                <option value="FB">FB</option>
                                                <option value="LINE@">LINE@</option>
                                                <option value="GOOGLE">GOOGLE</option>
                                                <option value="OFFLINE">OFFLINE</option>
                                                <option value="FREND">FREND</option>
                                                <option value="OTHER">OTHER</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tax' && (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-secondary-900">ข้อมูลใบกำกับภาษี</h3>
                            </div>
                            {Array.isArray(formData.taxInvoices) && formData.taxInvoices.map((tax, index) => (
                                <div key={tax.id} className="p-4 border-2 border-secondary-200 rounded-xl bg-secondary-50 relative mb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-secondary-900">ข้อมูลชุดที่ {index + 1}</h4>
                                            <button
                                                onClick={() => {
                                                    setActiveParserTaxId(tax.id)
                                                    setIsParserOpen(true)
                                                }}
                                                className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors flex items-center justify-center"
                                                title="กรอกอัตโนมัติ"
                                            >
                                                <Sparkles size={16} />
                                            </button>
                                        </div>
                                        <button onClick={() => removeTaxInvoice(tax.id)} className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                <label className="block text-xs font-medium text-secondary-500 mb-1">ชื่อบริษัท / นิติบุคคล</label>
                                                <input type="text" value={tax.companyName} onChange={e => updateTaxInvoice(tax.id, 'companyName', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                <label className="block text-xs font-medium text-secondary-500 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                                                <input type="text" value={tax.taxId} onChange={e => updateTaxInvoice(tax.id, 'taxId', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                <label className="block text-xs font-medium text-secondary-500 mb-1">สาขา</label>
                                                <input type="text" value={tax.branch} onChange={e => updateTaxInvoice(tax.id, 'branch', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                            </div>
                                        </div>

                                        {/* Tax Address Fields */}
                                        <div className="md:col-span-2 mt-4">
                                            <h4 className="font-semibold text-secondary-900 mb-3 border-b pb-2">ที่อยู่ใบกำกับภาษี</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="col-span-1">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">เลขที่</label>
                                                        <input type="text" value={tax.addrNumber || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrNumber', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-1">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">หมู่</label>
                                                        <input type="text" value={tax.addrMoo || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrMoo', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">อาคาร/หมู่บ้าน</label>
                                                        <input type="text" value={tax.addrVillage || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrVillage', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">ซอย</label>
                                                        <input type="text" value={tax.addrSoi || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrSoi', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">ถนน</label>
                                                        <input type="text" value={tax.addrRoad || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrRoad', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">แขวง/ตำบล</label>
                                                        <input type="text" value={tax.addrTambon || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrTambon', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">เขต/อำเภอ</label>
                                                        <input type="text" value={tax.addrAmphoe || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrAmphoe', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">จังหวัด</label>
                                                        <input type="text" value={tax.addrProvince || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrProvince', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">รหัสไปรษณีย์</label>
                                                        <input type="text" value={tax.addrZipcode || ''} onChange={(e) => updateTaxInvoice(tax.id, 'addrZipcode', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addTaxInvoice}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-secondary-300 text-secondary-600 rounded-lg hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all text-sm font-medium"
                            >
                                <Plus size={18} />
                                เพิ่มข้อมูล
                            </button>
                        </div>
                    )}

                    {activeTab === 'address' && (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-secondary-900">ที่อยู่ติดตั้ง/จัดส่ง</h3>
                            </div>
                            {Array.isArray(formData.addresses) && formData.addresses.map((addr, index) => (
                                <div key={addr.id} className="p-4 border-2 border-secondary-200 rounded-xl bg-secondary-50 relative mb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-secondary-900">ที่อยู่ #{index + 1}</h4>
                                            <button
                                                onClick={() => {
                                                    setActiveParserAddressId(addr.id)
                                                    setIsParserOpen(true)
                                                }}
                                                className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors flex items-center justify-center"
                                                title="กรอกอัตโนมัติ"
                                            >
                                                <Sparkles size={16} />
                                            </button>
                                        </div>
                                        <button onClick={() => removeAddress(addr.id)} className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                <label className="block text-xs font-medium text-secondary-500 mb-1">ชื่อที่อยู่ (Label)</label>
                                                <input type="text" value={addr.label} onChange={e => updateAddress(addr.id, 'label', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-secondary-700 mb-2">ที่อยู่</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div className="col-span-1">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">เลขที่</label>
                                                        <input type="text" value={addr.addrNumber || ''} onChange={(e) => updateAddress(addr.id, 'addrNumber', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-1">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">หมู่</label>
                                                        <input type="text" value={addr.addrMoo || ''} onChange={(e) => updateAddress(addr.id, 'addrMoo', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">อาคาร/หมู่บ้าน</label>
                                                        <input type="text" value={addr.addrVillage || ''} onChange={(e) => updateAddress(addr.id, 'addrVillage', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">ซอย</label>
                                                        <input type="text" value={addr.addrSoi || ''} onChange={(e) => updateAddress(addr.id, 'addrSoi', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">ถนน</label>
                                                        <input type="text" value={addr.addrRoad || ''} onChange={(e) => updateAddress(addr.id, 'addrRoad', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">แขวง/ตำบล</label>
                                                        <input type="text" value={addr.addrTambon || ''} onChange={(e) => updateAddress(addr.id, 'addrTambon', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">เขต/อำเภอ</label>
                                                        <input type="text" value={addr.addrAmphoe || ''} onChange={(e) => updateAddress(addr.id, 'addrAmphoe', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">จังหวัด</label>
                                                        <input type="text" value={addr.province || ''} onChange={(e) => updateAddress(addr.id, 'province', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <div className="bg-white p-2 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                        <label className="block text-[10px] font-medium text-secondary-500 mb-0.5">รหัสไปรษณีย์</label>
                                                        <input type="text" value={addr.zipcode || ''} onChange={(e) => updateAddress(addr.id, 'zipcode', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                <label className="block text-xs font-medium text-secondary-500 mb-1">Google Maps Link</label>
                                                <input type="text" value={addr.googleMapsLink} onChange={e => updateAddress(addr.id, 'googleMapsLink', e.target.value)} className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addAddress}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-secondary-300 text-secondary-600 rounded-lg hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all text-sm font-medium"
                            >
                                <Plus size={18} />
                                เพิ่มที่อยู่
                            </button>
                        </div>
                    )}

                    {/* Tab 4: Contacts */}
                    {activeTab === 'contacts' && (
                        <div className="p-4 space-y-4">
                            {Array.isArray(formData.contacts) && formData.contacts.map((contact, index) => (
                                <div key={contact.id} className="p-4 border-2 border-secondary-200 rounded-xl bg-secondary-50 relative">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-secondary-900">ผู้ติดต่อ {index + 1}</h4>
                                            <button
                                                onClick={() => {
                                                    setActiveParserContactId(contact.id)
                                                    setIsParserOpen(true)
                                                }}
                                                className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors flex items-center justify-center"
                                                title="กรอกอัตโนมัติ"
                                            >
                                                <Sparkles size={16} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeContact(contact.id)}
                                            className="p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                <label className="block text-xs font-medium text-secondary-500 mb-1">ชื่อผู้ติดต่อ <span className="text-danger-500">*</span></label>
                                                <input
                                                    type="text"
                                                    value={contact.name}
                                                    onChange={e => updateContact(contact.id, 'name', e.target.value)}
                                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                    placeholder="ชื่อ-นามสกุล"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                    <label className="block text-xs font-medium text-secondary-500 mb-1">ตำแหน่ง</label>
                                                    <input
                                                        type="text"
                                                        value={contact.position}
                                                        onChange={e => updateContact(contact.id, 'position', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                        placeholder="เช่น ผู้จัดการ, เจ้าของ"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                    <label className="block text-xs font-medium text-secondary-500 mb-1">เบอร์โทร</label>
                                                    <input
                                                        type="text"
                                                        value={contact.phone}
                                                        onChange={e => updateContact(contact.id, 'phone', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                        placeholder="0xx-xxx-xxxx"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                    <label className="block text-xs font-medium text-secondary-500 mb-1">อีเมล</label>
                                                    <input
                                                        type="email"
                                                        value={contact.email}
                                                        onChange={e => updateContact(contact.id, 'email', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                        placeholder="example@mail.com"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                    <label className="block text-xs font-medium text-secondary-500 mb-1">Line ID</label>
                                                    <input
                                                        type="text"
                                                        value={contact.lineId}
                                                        onChange={e => updateContact(contact.id, 'lineId', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                        placeholder="ไอดีไลน์..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <div className="bg-white p-2.5 rounded-lg border border-secondary-200 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all shadow-sm">
                                                    <label className="block text-xs font-medium text-secondary-500 mb-1">หมายเหตุ</label>
                                                    <textarea
                                                        value={contact.note}
                                                        onChange={e => updateContact(contact.id, 'note', e.target.value)}
                                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                                        placeholder="ระบุหมายเหตุเพิ่มเติม..."
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addContact}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-secondary-300 text-secondary-600 rounded-lg hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50/50 transition-all text-sm font-medium"
                            >
                                <Plus size={18} />
                                เพิ่มผู้ติดต่อ
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3 bg-secondary-50">
                    <button onClick={onClose} className="px-6 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-white transition-colors font-medium" disabled={isSaving}>ยกเลิก</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-500/30 flex items-center gap-2">
                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>

            <TaxAddressParserModal
                isOpen={isParserOpen}
                onClose={() => setIsParserOpen(false)}
                onParse={handleParserResult}
            />

            {/* Delete Customer Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="ยืนยันการลบลูกค้า"
                message="คุณต้องการลบลูกค้าคนนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
                onConfirm={() => {
                    setShowDeleteConfirm(false)
                    onDelete(customer.id)
                }}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    )
}