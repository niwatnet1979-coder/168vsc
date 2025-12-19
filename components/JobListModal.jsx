import React from 'react'
import { X, Plus, Trash2, Edit2, Calendar, CheckCircle, Clock, Wrench, Truck, AlertCircle } from 'lucide-react'

export default function JobListModal({ isOpen, onClose, item, jobs = [], onAddJob, onEditJob, onDeleteJob }) {
    if (!isOpen) return null

    // Sort jobs: Latest first? or Sequence 1 first?
    // User asked for "List of jobs". Usually sequence 1, 2, 3 is better for history.
    // But currently dataManager sorts desc.
    // Let's display sorted by Sequence ASC for the list (1 -> N).

    // Sort logic safely
    const sortedJobs = [...jobs].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))

    const getStatusColor = (status) => {
        switch (status) {
            case 'เสร็จสิ้น':
            case 'completed': return 'text-green-600 bg-green-50 border-green-200'
            case 'ยกเลิก':
            case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
            case 'กำลังดำเนินการ':
            case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200'
            default: return 'text-orange-600 bg-orange-50 border-orange-200'
        }
    }

    const getIcon = (type) => {
        return type === 'delivery' ? <Truck size={16} /> : <Wrench size={16} />
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-4 border-b border-secondary-200 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-lg text-secondary-900 flex items-center gap-2">
                            <span className="bg-primary-100 text-primary-700 p-1 rounded-md"><Wrench size={16} /></span>
                            รายการงาน ({jobs.length})
                        </h3>
                        <p className="text-xs text-secondary-500 truncate max-w-[250px]">{item.product?.name || 'สินค้า'}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-secondary-100 rounded-full text-secondary-400 hover:text-secondary-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* List Body */}
                <div className="overflow-y-auto p-4 flex-1 space-y-3 bg-gray-50/50">
                    {sortedJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-secondary-400 gap-2">
                            <AlertCircle size={32} />
                            <p>ยังไม่มีรายการงาน</p>
                        </div>
                    ) : (
                        sortedJobs.map((job, idx) => (
                            <div
                                key={idx}
                                className="bg-white border border-secondary-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden"
                                onClick={() => onEditJob(idx, job)} // Click row to view/edit
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 bg-secondary-100 text-secondary-700 text-xs font-bold rounded-full">
                                            {job.sequence_number || idx + 1}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded border capitalize flex items-center gap-1 ${getStatusColor(job.status || 'รอดำเนินการ')}`}>
                                            {job.status || 'รอดำเนินการ'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteJob(idx, job); }}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="ลบงาน"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-secondary-700 font-medium mb-1">
                                    {getIcon(job.jobType)}
                                    <span>
                                        {job.jobType === 'delivery' ? 'จัดส่ง' : 'ติดตั้ง/บริการ'}
                                    </span>
                                    <span className="text-secondary-400 text-xs mx-1">•</span>
                                    <span className="text-secondary-600 text-sm">{job.assigned_team || job.team || '-'}</span>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-secondary-500 mt-2">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        <span>{job.appointmentDate ? new Date(job.appointmentDate).toLocaleDateString('th-TH') : '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{job.appointmentDate ? new Date(job.appointmentDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-secondary-200 bg-white">
                    <button
                        onClick={onAddJob}
                        className="w-full bg-primary-600 text-white rounded-xl py-3 font-medium shadow-lg shadow-primary-500/20 hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        เพิ่มงานใหม่
                    </button>
                </div>
            </div>
        </div>
    )
}
