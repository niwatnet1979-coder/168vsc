import React, { useState, useEffect } from 'react'
import { X, Wrench } from 'lucide-react'
import JobInfoCard from './JobInfoCard'
import Card from './Card'
import { calculateDistance, extractCoordinates } from '../lib/utils'
import { SHOP_LAT, SHOP_LON } from '../lib/mockData'

export default function SubJobModal({ isOpen, onClose, item, onSave, customer = {}, availableTeams, readOnly = false, isInline = false }) {
    const [formData, setFormData] = useState({
        jobType: 'installation',
        appointmentDate: '',
        completionDate: '',
        installLocationName: '',
        installAddress: '',
        googleMapLink: '',
        distance: '',
        inspector1: { name: '', phone: '' },
        description: '',
        team: ''
    })

    useEffect(() => {
        if (item && item.subJob) {
            // Helper: Format Date for Input (YYYY-MM-DDThh:mm)
            const toLocalInput = (dateStr) => {
                if (!dateStr) return ''
                try {
                    const d = new Date(dateStr)
                    if (isNaN(d.getTime())) return ''
                    // Adjust to local timezone
                    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
                } catch (e) { return '' }
            }

            // Helper: Hydrate Inspector from Customer Contacts
            let inspectorData = item.subJob.inspector1 || { name: '', phone: '' }
            if (inspectorData.id && !inspectorData.name && customer?.contacts) {
                const found = customer.contacts.find(c => c.id === inspectorData.id)
                if (found) {
                    inspectorData = { ...found, id: inspectorData.id } // Restore full contact data
                }
            }

            // Helper: Hydrate Address from Customer Addresses
            let locationId = item.subJob.installLocationId || ''
            let locationName = item.subJob.installLocationName || ''
            let address = item.subJob.installAddress || ''
            let mapLink = item.subJob.googleMapLink || ''
            let dist = item.subJob.distance || ''

            if (locationId && customer?.addresses) {
                const foundAddr = customer.addresses.find(a => a.id === locationId)
                if (foundAddr) {
                    if (!locationName) locationName = foundAddr.label
                    if (!address) address = typeof foundAddr.address === 'string' ? foundAddr.address : (foundAddr.address || '')
                    if (!mapLink) mapLink = foundAddr.googleMapLink || foundAddr.googleMapsLink
                    if (!dist) dist = foundAddr.distance
                }
            }

            // Async Distance Calculation
            const calcDistance = async () => {
                if (!dist && mapLink) {
                    let d = ''
                    let coords = extractCoordinates(mapLink)
                    if (coords) {
                        d = `${calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)} km`
                    } else {
                        try {
                            const res = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(mapLink)}`)
                            if (res.ok) {
                                const data = await res.json()
                                if (data.url) {
                                    coords = extractCoordinates(data.url)
                                    if (coords) {
                                        d = `${calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)} km`
                                    }
                                }
                            }
                        } catch (e) { console.error(e) }
                    }

                    if (d) {
                        setFormData(prev => ({ ...prev, distance: d }))
                    }
                }
            }

            setFormData({
                jobType: item.subJob.jobType || 'installation',
                appointmentDate: toLocalInput(item.subJob.appointmentDate),
                completionDate: toLocalInput(item.subJob.completionDate),
                installLocationId: locationId,
                installLocationName: locationName,
                installAddress: address,
                googleMapLink: mapLink,
                distance: dist,
                inspector1: inspectorData,
                description: item.subJob.description || '',
                team: item.subJob.team || ''
            })

            // Trigger calc if needed
            if (!dist && mapLink) {
                calcDistance()
            }
        } else {
            // Reset or set default
            setFormData({
                jobType: 'installation',
                appointmentDate: '',
                completionDate: '',
                installLocationId: '',
                installLocationName: '',
                installAddress: '',
                googleMapLink: '',
                distance: '',
                inspector1: { name: '', phone: '' },
                description: '',
                team: ''
            })
        }
    }, [item, isOpen, customer])

    if (!isOpen && !isInline) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    // Inline mode - no modal wrapper
    if (isInline) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-secondary-200 h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-secondary-200 flex items-center justify-between flex-shrink-0">
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                        <Wrench className="text-primary-600" size={20} />
                        ข้อมูลงานย่อย
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <JobInfoCard
                            data={formData}
                            onChange={setFormData}
                            customer={customer}
                            availableTeams={availableTeams}
                            note={formData.description}
                            onNoteChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                            showCompletionDate={true}
                            showHeader={false}
                            excludeJobTypes={['separate']}
                            readOnly={readOnly}
                        />
                    </div>

                    {/* Footer */}
                    {!readOnly && (
                        <div className="flex items-center justify-end gap-3 p-4 border-t border-secondary-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
                            <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30">
                                บันทึก
                            </button>
                        </div>
                    )}
                </form>
            </div>
        )
    }

    // Modal mode - original behavior
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden h-full">
                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/50">
                        <JobInfoCard
                            data={formData}
                            onChange={setFormData}
                            customer={customer}
                            availableTeams={availableTeams}
                            note={formData.description}
                            onNoteChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                            showCompletionDate={true}
                            showHeader={true}
                            title="ข้อมูลงานย่อย"
                            actions={
                                <button type="button" onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg -mr-2">
                                    <X size={20} className="text-secondary-500" />
                                </button>
                            }
                            excludeJobTypes={['separate']}
                            readOnly={readOnly}
                            className="border-0 shadow-none bg-transparent h-full"
                        />
                    </div>

                    {/* Footer - Fixed */}
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-secondary-200 bg-white flex-shrink-0 pb-8 md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium">
                            {readOnly ? 'ปิด' : 'ยกเลิก'}
                        </button>
                        {!readOnly && (
                            <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30">
                                บันทึก
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
