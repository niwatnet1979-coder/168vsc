import React, { useState, useEffect } from 'react'
import { X, Wrench } from 'lucide-react'
import JobInfoCard from './JobInfoCard'

export default function SubJobModal({ isOpen, onClose, item, onSave, customersData, customerName, availableTeams }) {
    const [formData, setFormData] = useState({
        jobType: 'installation',
        appointmentDate: '',
        installLocationName: '',
        installAddress: '',
        googleMapLink: '',
        distance: '',
        inspector1: { name: '', phone: '' },
        inspector2: { name: '', phone: '' },
        description: '',
        team: ''
    })

    useEffect(() => {
        if (item && item.subJob) {
            setFormData({
                jobType: item.subJob.jobType || 'installation',
                appointmentDate: item.subJob.appointmentDate || '',
                installLocationName: item.subJob.installLocationName || '',
                installAddress: item.subJob.installAddress || '',
                googleMapLink: item.subJob.googleMapLink || '',
                distance: item.subJob.distance || '',
                inspector1: item.subJob.inspector1 || { name: '', phone: '' },
                inspector2: item.subJob.inspector2 || { name: '', phone: '' },
                description: item.subJob.description || '',
                team: item.subJob.team || ''
            })
        } else {
            // Reset or set default
            setFormData({
                jobType: 'installation',
                appointmentDate: '',
                installLocationName: '',
                installAddress: '',
                googleMapLink: '',
                distance: '',
                inspector1: { name: '', phone: '' },
                inspector2: { name: '', phone: '' },
                description: '',
                team: ''
            })
        }
    }, [item, isOpen])

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-secondary-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                        <Wrench className="text-primary-600" size={24} />
                        ข้อมูลงานหลัก (งานย่อย)
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-secondary-100 rounded-lg">
                        <X size={24} className="text-secondary-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <JobInfoCard
                        data={formData}
                        onChange={setFormData}
                        customersData={customersData}
                        customerName={customerName}
                        availableTeams={availableTeams}
                        note={formData.description}
                        onNoteChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                        showCompletionDate={true}
                        showHeader={false}
                        excludeJobTypes={['separate']}
                    />

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary-200">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium">
                            ยกเลิก
                        </button>
                        <button type="submit" className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-lg shadow-primary-500/30">
                            บันทึก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
