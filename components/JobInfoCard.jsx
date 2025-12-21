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
                {/* Job Type + Team (same row to save space) */}
                <div className={`grid gap-3 ${data.jobType !== 'separate' ? 'grid-cols-2' : 'grid-cols-1'}`}>
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

                    {/* Team */}
                    {data.jobType !== 'separate' && (
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
                    )}
                </div>

                {data.jobType !== 'separate' && (
                    <>
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
                                id: data.installLocationId,
                                label: data.installLocationName,
                                address: data.installAddress,
                                googleMapLink: data.googleMapLink,
                                distance: data.distance
                            }}
                            onChange={(newValue) => {
                                if (newValue) {
                                    handleUpdate({
                                        installLocationId: newValue.id,
                                        installLocationName: newValue.label,
                                        installAddress: newValue.address,
                                        googleMapLink: newValue.googleMapLink,
                                        distance: newValue.distance
                                    })
                                } else {
                                    // Reset
                                    handleUpdate({
                                        installLocationId: null,
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
                                                lineId: contact.lineId || contact.line_id || '',
                                                position: contact.position || '',
                                                note: contact.note || ''
                                            } : null,
                                            // Keep canonical DB field in sync so save/load remains consistent
                                            site_inspector_id: contact ? contact.id : null,
                                            // Clear any joined fallback when explicitly setting a new inspector
                                            siteInspectorRecord: contact ? contact : null
                                        })
                                    }}
                                    readOnly={readOnly}
                                    onAddNew={onAddNewInspector} // Pass through
                                />
                            ) : (
                                <ContactDisplayCard
                                    contact={data.inspector1}
                                    onClick={() => handleUpdate({
                                        // Explicitly clear inspector across all related fields to prevent re-hydration
                                        inspector1: null,
                                        siteInspectorRecord: null,
                                        site_inspector_id: null
                                    })}
                                    className="sm:mt-0"
                                />
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

                {/* Team Service Fee Selector (New) */}
                {data.jobType !== 'separate' && data.team && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <TeamServiceFeeSelector
                            teamId={null} // We need teamId. 'data.team' is likely a NAME string in current app, not ID.
                            // We need to resolve Name -> ID for the selector to work completely.
                            // Or the selector can search by Name?
                            // My implementation uses teamId.
                            // Let's pass teamName and let Selector find ID or use Name?
                            // Modified Selector to accept teamName? NO, Selector uses DataManager.getTeamServiceFees(teamId).
                            // I should probably try to resolve ID if possible, or pass teamName to Selector to resolve.
                            // In JobInfoCard, 'data.team' is string. 
                            // I'll update Selector to handle teamName prop and lookup ID internally if needed.
                            teamName={data.team}
                            // Assuming Job ID is available in data.id
                            value={data.serviceFeeId} // Need this in prop
                            onChange={async (newId) => {
                                handleUpdate({ serviceFeeId: newId })
                                // Link immediately if job exists (and newId is valid)
                                if (data.id && newId) {
                                    try {
                                        await DataManager.linkServiceFeeJobs(newId, [data.id])
                                        // Optional: Notify success?
                                    } catch (err) {
                                        console.error('Failed to link service fee:', err)
                                    }
                                }
                            }}
                            readOnly={readOnly}
                        />
                    </div>
                )}
            </div>
        </Card >
    )
}
