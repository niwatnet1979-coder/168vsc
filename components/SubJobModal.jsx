import React, { useState, useEffect } from 'react'
import { X, Wrench, Calendar, MapPin, ChevronDown } from 'lucide-react'

export default function SubJobModal({ isOpen, onClose, item, onSave, customersData, customerName, availableTeams }) {
    const [formData, setFormData] = useState({
        jobType: 'installation',
        appointmentDate: '',
        installLocationName: '',
        installAddress: '',
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

    const currentCustomer = customersData.find(c => c.name === customerName)
    const addresses = currentCustomer ? currentCustomer.addresses : []

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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภทงาน</label>
                            <div className="relative">
                                <select
                                    value={formData.jobType}
                                    onChange={e => setFormData({ ...formData, jobType: e.target.value })}
                                    className="w-full px-4 py-2 border border-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium text-secondary-900"
                                >
                                    <option value="installation">งานติดตั้ง (Installation)</option>
                                    <option value="delivery">ส่งของ (Delivery)</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-1">วันที่นัดหมาย</label>
                            <div className="relative">
                                <input
                                    type="datetime-local"
                                    value={formData.appointmentDate}
                                    onChange={e => setFormData({ ...formData, appointmentDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">สถานที่ติดตั้ง / จัดส่ง</label>
                        <div className="relative">
                            <select
                                value={addresses.findIndex(addr => addr.label === formData.installLocationName && addr.address === formData.installAddress)}
                                onChange={(e) => {
                                    const idx = e.target.value;
                                    if (idx !== '') {
                                        const addr = addresses[idx];
                                        setFormData({
                                            ...formData,
                                            installLocationName: addr.label || '',
                                            installAddress: addr.address || ''
                                        });
                                    } else {
                                        setFormData({
                                            ...formData,
                                            installLocationName: '',
                                            installAddress: ''
                                        });
                                    }
                                }}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium text-secondary-900"
                            >
                                <option value="">-- เลือกสถานที่ติดตั้ง / จัดส่ง --</option>
                                {addresses.map((addr, index) => (
                                    <option key={index} value={index}>
                                        {addr.label} - {addr.address}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">รายละเอียด</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows="4"
                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
                            placeholder="รายละเอียดเพิ่มเติม..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">ทีม</label>
                        <div className="relative">
                            <select
                                value={formData.team}
                                onChange={e => setFormData({ ...formData, team: e.target.value })}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium text-secondary-900"
                            >
                                <option value="">-- เลือกทีม --</option>
                                {availableTeams && availableTeams.map((team, idx) => (
                                    <option key={idx} value={team}>{team}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                        </div>
                    </div>

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
