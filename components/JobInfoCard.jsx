import React, { useState } from 'react'
import { Wrench, ChevronDown, Search, Phone, Mail, MessageCircle, Edit2 } from 'lucide-react'
import AddressCard from './AddressCard'
import Card from './Card'
import ContactSelector from './ContactSelector'
import ContactDisplayCard from './ContactDisplayCard'
import TeamServiceFeeSelector from './TeamServiceFeeSelector'
import { DataManager } from '../lib/dataManager'
import { calculateDistance, extractCoordinates, SHOP_LAT, SHOP_LON } from '../lib/utils'

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
    actions = null, // Add actions prop
    orderId }) {
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
                <div className="flex items-center justify-between w-full">
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                        <Wrench className="text-primary-600" />
                        {title}
                    </h2>
                    {data.id ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const oid = orderId || data.orderId || data.order_id
                                window.open(`/print/job-order?orderId=${oid}&jobId=${data.id}`, '_blank');
                            }}
                            className="p-1.5 text-secondary-500 hover:text-primary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                            title="พิมพ์ใบงาน (Job Order)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect width="12" height="8" x="6" y="14"></rect></svg>
                        </button>
                    ) : null}
                </div>
            ) : null}
            actions={actions}
            contentClassName="flex-1"
        >
            <div className="space-y-3">
                {/* Job Type + Team (same row to save space) */}
                <div className="grid gap-3 grid-cols-2">
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
                        </select>
                    </div>

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
                {/* Location */}
                <AddressSelector
                    label="สถานที่ติดตั้ง / ขนส่ง"
                    addresses={customer?.addresses || []}
                    value={{
                        id: data.locationId,
                        label: data.installLocationName,
                        address: data.installAddress,
                        googleMapLink: data.googleMapLink,
                        distance: data.distance
                    }}
                    onChange={(newValue) => {
                        if (newValue) {
                            handleUpdate({
                                locationId: newValue.id,
                                installLocationName: newValue.label,
                                installAddress: newValue.address,
                                googleMapLink: newValue.googleMapLink,
                                distance: newValue.distance
                            })
                        } else {
                            // Reset
                            handleUpdate({
                                locationId: null,
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
                    {!data.inspector || !data.inspector.name ? (
                        <ContactSelector
                            variant="seamless"
                            label={null} // Hide internal label
                            contacts={customer.contacts || []}
                            value={data.inspector}
                            onChange={(contact) => {
                                handleUpdate({
                                    inspector: contact ? {
                                        id: contact.id,
                                        name: contact.name,
                                        phone: contact.phone || '',
                                        email: contact.email || '',
                                        line: contact.line || contact.lineId || contact.line_id || '',
                                        position: contact.position || '',
                                        note: contact.note || ''
                                    } : null,
                                    // Use new foreign key identifier
                                    inspectorId: contact ? contact.id : null,
                                    // Clear legacy ref
                                    siteInspectorRecord: contact ? contact : null
                                })
                            }}
                            readOnly={readOnly}
                            onAddNew={onAddNewInspector} // Pass through
                        />
                    ) : (
                        <ContactDisplayCard
                            contact={data.inspector}
                            onClick={() => handleUpdate({
                                // Explicitly clear inspector across all related fields to prevent re-hydration
                                inspector: null,
                                inspectorId: null,
                                siteInspectorRecord: null
                            })}
                            className="sm:mt-0"
                        />
                    )}
                </div>

                {/* Notes Section */}
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

                {/* Team Service Fee Selector (New) */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <TeamServiceFeeSelector
                        teamId={null}
                        teamName={data.team}
                        value={data.teamPaymentId} // FIX: use teamPaymentId
                        onChange={async (newId) => {
                            // Update UI state first
                            handleUpdate({ teamPaymentId: newId })

                            // Sync with DB if we have a valid Job ID
                            if (data.id) {
                                if (newId) {
                                    try {
                                        console.log('[JobInfoCard] Linking Job', data.id, 'to Service Fee Batch', newId)
                                        await DataManager.linkServiceFeeJobs(newId, [data.id])
                                    } catch (error) {
                                        console.error('[JobInfoCard] Error linking service fee:', error)
                                    }
                                } else {
                                    // Unlink (Delete button clicked)
                                    try {
                                        console.log('[JobInfoCard] Unlinking Job', data.id, 'from Service Fee Batch')
                                        await DataManager.unlinkServiceFeeJob(data.id)
                                    } catch (error) {
                                        console.error('[JobInfoCard] Error unlinking service fee:', error)
                                    }
                                }
                            }
                        }}
                        currentJobId={data.id}
                        readOnly={!data.team}
                    />
                </div>
            </div>
        </Card >
    )
}
