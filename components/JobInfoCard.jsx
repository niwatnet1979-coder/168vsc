import React, { useState } from 'react'
import { Wrench, ChevronDown, Search, Phone, Mail, MessageCircle, Edit2 } from 'lucide-react'
import AddressCard from './AddressCard'
import Card from './Card'
import ContactSelector from './ContactSelector'
import { calculateDistance, extractCoordinates } from '../lib/utils'
import { SHOP_LAT, SHOP_LON } from '../lib/mockData'
import AddressSelector from './AddressSelector'
import DataSourceTooltip from './DataSourceTooltip'

export default function JobInfoCard({
    data,
    onChange,
    customer = {},
    availableTeams = [], // Default to empty array
    note,
    onNoteChange,
    showCompletionDate = true,
    showHeader = true,
    excludeJobTypes = [],
    readOnly = false,
    className = '',
    onAddNewAddress,
    onAddNewInspector,
    title = 'ข้อมูลงานหลัก', // Default title
    actions = null // Add actions prop
}) {
    const [installLocationSearchTerm, setInstallLocationSearchTerm] = useState('')
    const [showInstallLocationDropdown, setShowInstallLocationDropdown] = useState(false)

    const handleUpdate = (updates) => {
        if (!readOnly) {
            onChange({ ...data, ...updates })
        }
    }



    // Unified View - Always use Form style (disabled if readOnly)
    return (
        <Card
            className={`flex flex-col h-full ${!showHeader ? 'border-0 shadow-none p-0' : 'md:p-6'} ${className}`}
            title={showHeader ? (
                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <Wrench className="text-primary-600" />
                    {title}
                </h2>
            ) : null}
            actions={actions}
            contentClassName="flex-1"
        >
            <div className="space-y-3">
                {/* Job Type */}
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                    <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทงาน</label>
                    <select
                        value={data.jobType}
                        onChange={e => handleUpdate({ jobType: e.target.value })}
                        disabled={readOnly}
                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 cursor-pointer"
                    >
                        <option value="">-- เลือกประเภทงาน --</option>
                        {!excludeJobTypes.includes('installation') && <option value="installation">งานติดตั้ง (Installation)</option>}
                        {!excludeJobTypes.includes('delivery') && <option value="delivery">ขนส่ง (Delivery)</option>}
                        {!excludeJobTypes.includes('separate') && <option value="separate">งานแยก (Separate)</option>}
                    </select>
                </div>

                {data.jobType !== 'separate' && (
                    <>
                        {/* Team */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            <label className="block text-xs font-medium text-secondary-500 mb-1">ทีม</label>
                            <div className="relative">
                                <DataSourceTooltip isRealtime={false} source="input" showHighlight={false}>
                                    <select
                                        value={data.team}
                                        onChange={(e) => handleUpdate({ team: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                    >
                                        <option value="">-- เลือกทีม --</option>
                                        {availableTeams.map((team, idx) => (
                                            <option key={idx} value={team}>{team}</option>
                                        ))}
                                    </select>
                                </DataSourceTooltip>
                                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่นัดหมาย</label>
                                <DataSourceTooltip isRealtime={false} source="input" showHighlight={false} className="w-full block">
                                    <input
                                        type="datetime-local"
                                        value={data.appointmentDate || ''}
                                        onChange={e => handleUpdate({ appointmentDate: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                    />
                                </DataSourceTooltip>
                            </div>
                            {showCompletionDate && (
                                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่สำเร็จ</label>
                                    <input
                                        type="datetime-local"
                                        value={data.completionDate || ''}
                                        onChange={e => handleUpdate({ completionDate: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <AddressSelector
                            label="สถานที่ติดตั้ง / ขนส่ง"
                            addresses={customer?.addresses || []}
                            value={{
                                label: data.installLocationName,
                                address: data.installAddress,
                                googleMapLink: data.googleMapLink,
                                distance: data.distance
                            }}
                            onChange={(newValue) => {
                                if (newValue) {
                                    handleUpdate({
                                        installLocationName: newValue.label,
                                        installAddress: newValue.address,
                                        googleMapLink: newValue.googleMapLink,
                                        distance: newValue.distance
                                    })
                                } else {
                                    // Reset
                                    handleUpdate({
                                        installLocationName: '',
                                        installAddress: '',
                                        googleMapLink: '',
                                        distance: ''
                                    })
                                }
                            }}
                            placeholder="ค้นหาสถานที่ติดตั้ง..."
                            readOnly={readOnly}
                            addressClassName="text-xs"
                            onAddNew={onAddNewAddress} // Pass through
                        />

                        {/* Inspector Selection */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            {/* Note: ContactSelector has its own label usage, but we wrap it for consistency */}
                            <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ตรวจงาน / รับสินค้า</label>
                            {!data.inspector1 || !data.inspector1.name ? (
                                <ContactSelector
                                    variant="seamless"
                                    label={null} // Hide internal label
                                    contacts={customer.contacts || []}
                                    value={data.inspector1}
                                    onChange={(contact) => {
                                        handleUpdate({
                                            inspector1: contact ? {
                                                id: contact.id,
                                                name: contact.name,
                                                phone: contact.phone || '',
                                                email: contact.email || '',
                                                lineId: contact.lineId || '',
                                                position: contact.position || '',
                                                note: contact.note || ''
                                            } : null
                                        })
                                    }}
                                    readOnly={readOnly}
                                    onAddNew={onAddNewInspector} // Pass through
                                />
                            ) : (
                                <div
                                    onClick={() => handleUpdate({ inspector1: null })}
                                    className="cursor-pointer group relative -mt-2 hover:bg-secondary-50 transition-colors rounded-lg"
                                    title="คลิกเพื่อเปลี่ยนผู้ตรวจงาน"
                                >
                                    <div className="mt-2 pt-2 border-t border-secondary-100 space-y-1.5 p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                        {/* Row 2: Name & Position */}
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm text-secondary-900">{data.inspector1.name}</span>
                                            {data.inspector1.position && (
                                                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-wide">
                                                    {data.inspector1.position}
                                                </span>
                                            )}
                                        </div>

                                        {/* Row 3: Phone | Email | Line */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-600">
                                            {data.inspector1.phone && (
                                                <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors">
                                                    <Phone size={11} className="text-secondary-400 shrink-0" />
                                                    <span>{data.inspector1.phone}</span>
                                                </div>
                                            )}
                                            {data.inspector1.email && (
                                                <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                                                    <Mail size={11} className="text-secondary-400 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{data.inspector1.email}</span>
                                                </div>
                                            )}
                                            {(data.inspector1.lineId || data.inspector1.line) && (
                                                <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                                                    <MessageCircle size={11} className="text-[#06c755] shrink-0" />
                                                    <span className="font-medium text-[#06c755]">{data.inspector1.lineId || data.inspector1.line}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Row 4: Note */}
                                        {data.inspector1.note && (
                                            <div className="flex items-start gap-1.5 mt-1 bg-secondary-50/80 p-2 rounded-md border border-dashed border-secondary-200">
                                                <span className="text-[10px] font-bold text-secondary-500 whitespace-nowrap mt-0.5">Note:</span>
                                                <span className="text-[11px] text-secondary-700 leading-relaxed italic">{data.inspector1.note}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 size={12} className="text-secondary-400" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Notes Section */}
                {data.jobType !== 'separate' && (
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">รายละเอียด</label>
                        <textarea
                            rows={1}
                            value={note}
                            onChange={e => onNoteChange && onNoteChange(e.target.value)}
                            disabled={readOnly}
                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal resize-none"
                            placeholder="รายละเอียดเพิ่มเติม..."
                        />
                    </div>
                )}
            </div>
        </Card >
    )
}
