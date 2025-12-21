import React, { useState, useEffect, useRef } from 'react'
import { X, Plus, Upload, Trash2, Save, Image as ImageIcon } from 'lucide-react'
import { DataManager } from '../lib/dataManager'

export default function TeamManagementModal({ isOpen, onClose }) {
    const [teams, setTeams] = useState([])
    const [teamTypes, setTeamTypes] = useState([]) // Dynamic Team Types
    const [loading, setLoading] = useState(false)
    const [view, setView] = useState('list') // list, form
    const [formData, setFormData] = useState({ id: null, name: '', payment_qr_url: '' })
    const [previewUrl, setPreviewUrl] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            loadTeams()
            loadOptions() // Load dynamic options
            setView('list')
        }
    }, [isOpen])

    const loadOptions = async () => {
        const options = await DataManager.getProductOptions()
        if (options && options.teamTypes && options.teamTypes.length > 0) {
            setTeamTypes(options.teamTypes)
        } else {
            // Fallback defaults if settings are empty
            setTeamTypes(['General', 'Mechanic', 'Sales', 'Production', 'QC', 'Management'])
        }
    }

    const loadTeams = async () => {
        setLoading(true)
        const data = await DataManager.getTeams()
        setTeams(data)
        setLoading(false)
    }

    const handleEdit = (team) => {
        setFormData({
            ...team,
            teamType: team.team_type || 'General' // Map snake_case to camelCase
        })
        setPreviewUrl(team.payment_qr_url)
        setView('form')
    }

    const handleCreate = () => {
        setFormData({ id: null, name: '', payment_qr_url: '', teamType: 'General' })
        setPreviewUrl(null)
        setView('form')
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            // Create local preview
            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
            setFormData(prev => ({ ...prev, file }))
        }
    }

    const handleSave = async () => {
        if (!formData.name) return alert('กรุณาระบุชื่อทีม')

        setLoading(true)
        try {
            let finalQrUrl = formData.payment_qr_url

            // Upload File if new
            if (formData.file) {
                const fileExt = formData.file.name.split('.').pop()
                const fileName = `teams/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`

                // Upload
                const { output: uploadOutput, error: uploadError } = await DataManager.supabase.storage
                    .from('job-media')
                    .upload(fileName, formData.file) // Simple upload

                if (uploadError) throw uploadError

                // Get Public URL
                const { data: publicDesc } = DataManager.supabase.storage
                    .from('job-media')
                    .getPublicUrl(fileName)

                finalQrUrl = publicDesc.publicUrl
            }

            const result = await DataManager.saveTeam({
                id: formData.id,
                name: formData.name,
                payment_qr_url: finalQrUrl,
                teamType: formData.teamType // Pass teamType
            })

            if (result.success) {
                await loadTeams()
                setView('list')
            } else {
                alert('Error: ' + result.error)
            }

        } catch (error) {
            console.error('Error saving team:', error)
            alert('บันทึกไม่สำเร็จ: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">
                        {view === 'list' ? 'ข้อมูลทีม (Teams)' : (formData.id ? 'แก้ไขทีม' : 'เพิ่มทีมใหม่')}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
                    ) : view === 'list' ? (
                        <div className="space-y-4">
                            <button
                                onClick={handleCreate}
                                className="w-full py-3 border-2 border-dashed border-primary-200 text-primary-600 rounded-xl hover:bg-primary-50 transition-colors flex items-center justify-center gap-2 font-medium"
                            >
                                <Plus size={20} />
                                เพิ่มทีมใหม่
                            </button>

                            <div className="grid gap-3">
                                {teams.map(team => (
                                    <div key={team.id} onClick={() => handleEdit(team)} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-primary-200 hover:shadow-sm cursor-pointer transition-all bg-white group">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                                            {team.payment_qr_url ? (
                                                <img src={team.payment_qr_url} alt="QR" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon size={20} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900">{team.name}</div>
                                            <div className="text-xs text-gray-500">{team.payment_qr_url ? 'มี QR Code แล้ว' : 'ยังไม่มี QR Code'}</div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 text-primary-600">
                                            แก้ไข
                                        </div>
                                    </div>
                                ))}
                                {teams.length === 0 && (
                                    <div className="text-center text-gray-400 py-4">ยังไม่มีข้อมูลทีม</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อทีม</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    placeholder="เช่น ทีมช่าง A"
                                />
                            </div>

                            {/* Team Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภททีม</label>
                                <select
                                    value={formData.teamType || ''}
                                    onChange={e => setFormData({ ...formData, teamType: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกประเภททีม</option>
                                    {teamTypes.map((type, i) => (
                                        <option key={i} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            {/* QR Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">QR Code รับเงิน</label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-primary-300 transition-colors h-64 relative overflow-hidden"
                                >
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain absolute inset-0 p-2" />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Upload size={32} className="mx-auto mb-2" />
                                            <span>คลิกเพื่ออัพโหลดรูป</span>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                                {previewUrl && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setPreviewUrl(null)
                                            setFormData(prev => ({ ...prev, file: null, payment_qr_url: '' }))
                                        }}
                                        className="text-red-500 text-xs mt-2 flex items-center gap-1 hover:underline"
                                    >
                                        <Trash2 size={12} /> ลบรูปภาพ
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    {view === 'form' ? (
                        <>
                            <button
                                onClick={() => setView('list')}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                            >
                                <Save size={16} />
                                บันทึก
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            ปิด
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}
