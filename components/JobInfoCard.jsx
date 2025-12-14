import React, { useState } from 'react'
import { Wrench, ChevronDown, Search } from 'lucide-react'
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
    availableTeams,
    note,
    onNoteChange,
    showCompletionDate = true,
    showHeader = true,
    excludeJobTypes = [],
    readOnly = false,
    className = ''
}) {
    const [installLocationSearchTerm, setInstallLocationSearchTerm] = useState('')
    const [showInstallLocationDropdown, setShowInstallLocationDropdown] = useState(false)

    const handleUpdate = (updates) => {
        if (!readOnly) {
            onChange({ ...data, ...updates })
        }
    }



    // Read-Only View (Display Mode - Matches ProductDetailView style)
    if (readOnly) {
        const val = (v) => v || '-'
        const getJobTypeLabel = (t) => {
            if (t === 'installation') return 'งานติดตั้ง (Installation)'
            if (t === 'delivery') return 'ขนส่ง (Delivery)'
            if (t === 'separate') return 'งานแยก (Separate)'
            return t || '-'
        }

        return (
            <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-4 h-full flex flex-col ${className}`}>
                {showHeader && (
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2 mb-4">
                        <Wrench className="text-primary-600" />
                        ข้อมูลงานหลัก
                    </h2>
                )}
                <div className="space-y-3">
                    {/* Job Type */}
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทงาน</label>
                        <div className="text-sm font-medium text-secondary-900">{getJobTypeLabel(data.jobType)}</div>
                    </div>

                    {data.jobType !== 'separate' && (
                        <>
                            {/* Team */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ทีม</label>
                                <div className="text-sm font-medium text-secondary-900">{val(data.team)}</div>
                            </div>

                            {/* Dates Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่นัดหมาย</label>
                                    <div className="text-sm font-medium text-secondary-900">{val(data.appointmentDate?.replace('T', ' '))}</div>
                                </div>
                                {showCompletionDate && (
                                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                        <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่สำเร็จ</label>
                                        <div className="text-sm font-medium text-secondary-900">{val(data.completionDate?.replace('T', ' '))}</div>
                                    </div>
                                )}
                            </div>

                            {/* Location */}
                            {(data.installAddress || data.installLocationName) && (
                                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">สถานที่ติดตั้ง / ขนส่ง</label>
                                    <DataSourceTooltip isRealtime={false} source="input/google_maps">
                                        <div className="space-y-1">
                                            {data.installLocationName && (
                                                <div className="text-sm font-medium text-secondary-900">{data.installLocationName}</div>
                                            )}
                                            {data.installAddress && (
                                                <div className="text-sm text-secondary-600 leading-relaxed">{data.installAddress}</div>
                                            )}
                                            {(data.distance || data.googleMapLink) && (
                                                <div className="pt-1 flex flex-wrap gap-2 items-center">
                                                    {data.distance && (
                                                        <span className="text-xs bg-white border border-secondary-200 text-secondary-600 px-2 py-0.5 rounded-full">
                                                            {data.distance}
                                                        </span>
                                                    )}
                                                    {data.googleMapLink && (
                                                        <a href={data.googleMapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                                            เปิดแผนที่
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </DataSourceTooltip>
                                </div>
                            )}

                            {/* Inspector */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ตรวจงาน / รับสินค้า</label>
                                <div className="flex items-center gap-2 text-sm font-medium text-secondary-900">
                                    <span>{data.inspector1?.name || '-'}</span>
                                    {data.inspector1?.phone && <span className="text-secondary-500 text-xs">({data.inspector1.phone})</span>}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Note */}
                    {note && (
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                            <label className="block text-xs font-medium text-secondary-500 mb-1">รายละเอียด</label>
                            <div className="text-sm font-medium text-secondary-900 opacity-80">{note}</div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Card
            className={`flex flex-col h-full ${!showHeader ? 'border-0 shadow-none p-0' : 'md:p-6'} ${className}`}
            title={showHeader ? (
                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <Wrench className="text-primary-600" />
                    ข้อมูลงานหลัก
                </h2>
            ) : null}
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
                        />

                        {/* Inspector Selection */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            {/* Note: ContactSelector has its own label usage, but we wrap it for consistency */}
                            <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ตรวจงาน / รับสินค้า</label>
                            <ContactSelector
                                variant="seamless"
                                label={null} // Hide internal label
                                contacts={customer.contacts || []}
                                value={data.inspector1}
                                onChange={(contact) => {
                                    handleUpdate({
                                        inspector1: contact ? {
                                            name: contact.name,
                                            phone: contact.phone || ''
                                        } : { name: '', phone: '' }
                                    })
                                }}
                                isReadOnly={readOnly}
                            />
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
