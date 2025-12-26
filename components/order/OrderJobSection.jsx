import React from 'react'
import { Wrench, Plus, ChevronDown, Trash2, Package, Copy } from 'lucide-react'
import JobInfoCard from '../JobInfoCard'

/**
 * OrderJobSection Component
 * Handles job information display and management
 */
export default function OrderJobSection({
    // Job data
    currentJobInfo,
    items,
    selectedItemIndex,
    selectedJobIndex,
    flatJobs,

    // Customer & Teams
    customer,
    availableTeams,

    // Handlers
    onJobInfoUpdate,
    onAddJob,
    onDeleteJob,
    onSelectJob,
    onSelectItem,
    onShareJobInfo,
    onAddNewInstallAddress,
    onAddNewInspector,

    // UI State
    showJobDropdown,
    setShowJobDropdown,
    showItemDropdown,

    setShowItemDropdown,
    orderId
}) {
    const canShare = items.every(item => !item.jobs || item.jobs.length <= 1);

    return (
        <div className="order-3 md:order-4 flex flex-col h-full">
            <JobInfoCard
                className="h-full"
                orderId={orderId}
                title={
                    <div className="flex items-center gap-3">
                        <span>ข้อมูลงาน</span>
                        {/* Job Selector */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <div
                                onClick={(e) => {
                                    e.preventDefault()
                                    setShowJobDropdown(!showJobDropdown)
                                }}
                                className="flex items-center gap-1.5 bg-white border border-secondary-200 rounded-md px-2 py-1 cursor-pointer hover:border-primary-400 transition-colors focus-within:ring-1 focus-within:ring-primary-500 min-w-[120px] text-base font-normal leading-normal"
                            >
                                <span className="text-[10px] font-bold text-secondary-500">
                                    {(() => {
                                        const currentItem = items[selectedItemIndex]
                                        if (currentItem && currentItem.jobs && currentItem.jobs[selectedJobIndex]) {
                                            return selectedJobIndex + 1
                                        }
                                        return flatJobs.length > 0 ? (flatJobs.length + 1) : 1
                                    })()}
                                </span>
                                <Wrench size={12} className="text-secondary-400" />
                                <span className="text-[10px] text-secondary-700 flex-1 truncate">
                                    {(() => {
                                        const currentItem = items[selectedItemIndex]
                                        if (currentItem && currentItem.jobs && currentItem.jobs[selectedJobIndex]) {
                                            const job = currentItem.jobs[selectedJobIndex]
                                            return job.id && job.id.length > 20 ? `JB${job.id.slice(-6)}` : (job.id || 'New Job')
                                        }
                                        return 'New'
                                    })()}
                                </span>
                                <ChevronDown size={10} className={`text-secondary-400 transition-transform ${showJobDropdown ? 'rotate-180' : ''}`} />
                            </div>

                            {showJobDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-20"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowJobDropdown(false)
                                        }}
                                    ></div>
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-secondary-200 rounded-lg shadow-xl z-30 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="max-h-48 overflow-y-auto">
                                            {flatJobs.map((job, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`group px-3 py-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${(selectedItemIndex === job._itemIndex && selectedJobIndex === job._jobIndex)
                                                        ? 'bg-primary-50 text-primary-700 font-medium'
                                                        : 'hover:bg-secondary-50 text-secondary-700'
                                                        }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onSelectJob(job._itemIndex, job._jobIndex)
                                                        setShowJobDropdown(false)
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 flex-1">
                                                        <span className="w-4 text-center text-[10px] font-bold text-secondary-400">{idx + 1}</span>
                                                        <span className="font-mono">{job.id && String(job.id).length > 20 ? `JB${String(job.id).slice(-6)}` : (job.id || 'New Job')}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onDeleteJob(job._itemIndex, job._jobIndex)
                                                        }}
                                                        className="p-1 text-secondary-400 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                                        title="ลบงานนี้"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onAddJob()
                                                setShowJobDropdown(false)
                                            }}
                                            className="px-3 py-2 bg-primary-50 text-primary-600 text-xs font-semibold flex items-center gap-2 cursor-pointer hover:bg-primary-100 border-t border-primary-100 transition-colors"
                                        >
                                            <Plus size={14} />
                                            เพิ่มงานใหม่
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                }
                data={currentJobInfo || {}}
                onChange={onJobInfoUpdate}
                customer={customer}
                availableTeams={availableTeams}
                note={currentJobInfo?.description || ''}
                onNoteChange={(value) => onJobInfoUpdate({ description: value })}
                onAddNewAddress={onAddNewInstallAddress}
                onAddNewInspector={onAddNewInspector}
                excludeJobTypes={['separate']}
                actions={
                    <div className="flex items-center gap-1.5">
                        {/* Item Selector */}
                        <div className="relative">
                            <div
                                onClick={() => setShowItemDropdown(!showItemDropdown)}
                                className="flex items-center gap-1.5 bg-white border border-secondary-200 rounded-md px-2 py-1 cursor-pointer hover:border-primary-400 transition-colors focus-within:ring-1 focus-within:ring-primary-500 min-w-[120px]"
                            >
                                <span className="text-[10px] font-bold text-secondary-500">{selectedItemIndex + 1}</span>
                                <Package size={12} className="text-secondary-400" />
                                <span className="text-[10px] text-secondary-700 flex-1 truncate">
                                    {items[selectedItemIndex]?.id && String(items[selectedItemIndex].id).length > 20 ? `IT${String(items[selectedItemIndex].id).slice(-6)}` : (items[selectedItemIndex]?.id || 'New Item')}
                                </span>
                                <ChevronDown size={10} className={`text-secondary-400 transition-transform ${showItemDropdown ? 'rotate-180' : ''}`} />
                            </div>

                            {showItemDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowItemDropdown(false)}
                                    ></div>
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-secondary-200 rounded-lg shadow-xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="max-h-48 overflow-y-auto">
                                            {items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        onSelectItem(idx)
                                                        setShowItemDropdown(false)
                                                    }}
                                                    className={`px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors ${selectedItemIndex === idx ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-secondary-50 text-secondary-700'}`}
                                                >
                                                    <span className="w-4 text-center text-[10px] font-bold text-secondary-400">{idx + 1}</span>
                                                    <span className="font-mono">{item.id && String(item.id).length > 20 ? `IT${String(item.id).slice(-6)}` : (item.id || 'New Item')}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Share Job Info Button */}
                        <button
                            type="button"
                            onClick={canShare ? onShareJobInfo : null}
                            disabled={!canShare}
                            className={`p-1 rounded border transition-colors ${canShare
                                ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 shadow-sm'
                                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                }`}
                            title={canShare ? "ใช้ข้อมูลงานนี้ร่วมกันกับสินค้าทุกรายการ" : "ไม่สามารถใช้ร่วมกันได้เนื่องจากบางรายการมีหลายงาน"}
                        >
                            <div className="flex items-center gap-1 px-1">
                                <Copy size={12} />
                                <span className="text-[10px] font-medium">ใช้ร่วมกัน</span>
                            </div>
                        </button>
                    </div>
                }
            />
        </div>
    )
}
