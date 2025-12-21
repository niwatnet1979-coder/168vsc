import React, { useState, useEffect } from 'react'
import { ChevronDown, Plus, Edit2, FileText, Check } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import TeamServiceFeeModal from './TeamServiceFeeModal'
import { formatDate } from '../lib/utils'

export default function TeamServiceFeeSelector({
    teamId,
    teamName, // Needed for modal
    value, // current service_fee_id
    onChange, // (newId) => ...
    readOnly = false
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [batches, setBatches] = useState([])
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingBatchId, setEditingBatchId] = useState(null)
    const [resolvedTeamId, setResolvedTeamId] = useState(null)

    // Resolve Team ID if missing
    useEffect(() => {
        const resolveTeam = async () => {
            console.log('[Selector] Resolving Team. Props:', { teamId, teamName })
            if (teamId) {
                setResolvedTeamId(teamId)
            } else if (teamName) {
                // Find team by name
                const teams = await DataManager.getTeams()
                console.log('[Selector] Fetched Teams:', teams)

                const normalizedTarget = String(teamName).trim().toLowerCase()

                // Flexible Match
                const found = teams.find(t => {
                    const tName = String(t.name || '').trim().toLowerCase()
                    const tId = String(t.id || '').trim().toLowerCase()
                    return tName === normalizedTarget || tId === normalizedTarget
                })

                console.log('[Selector] Found Team:', found)
                if (found) setResolvedTeamId(found.id)
            }
        }
        resolveTeam()
    }, [teamId, teamName])

    useEffect(() => {
        if (resolvedTeamId) loadBatches()
    }, [resolvedTeamId])

    const loadBatches = async () => {
        if (!resolvedTeamId) return
        setLoading(true)
        const data = await DataManager.getTeamServiceFees(resolvedTeamId)
        setBatches(data)
        setLoading(false)
    }

    const handleSelect = (batchId) => {
        onChange(batchId)
        setIsOpen(false)
    }

    const handleEditClick = (e, batchId) => {
        e.stopPropagation()
        setEditingBatchId(batchId)
        setShowModal(true)
    }

    const handleCreateNew = () => {
        setEditingBatchId(null) // New
        setShowModal(true)
        setIsOpen(false)
    }

    const selectedBatch = batches.find(b => b.id === value)

    // Calculate Team Total Outstanding (Team Level)
    const teamOutstanding = batches.reduce((sum, b) => sum + (b.remaining || 0), 0)

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-secondary-500 mb-1">
                ค่าบริการทีม (Team Payment Batch)
            </label>

            {/* Display / Trigger */}
            <div
                onClick={() => !readOnly && setIsOpen(!isOpen)}
                className={`
                    w-full min-h-[42px] px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-colors
                    ${readOnly ? 'bg-gray-50 border-gray-200 cursor-default' : 'bg-white border-secondary-300 hover:border-primary-500'}
                `}
            >
                {selectedBatch ? (
                    <div className="flex-1 font-mono text-xs leading-relaxed grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center">
                        <div className="text-gray-900 font-medium truncate">TP{selectedBatch.id.slice(-6)}-{teamName}</div>
                        <div className="text-gray-600">{new Date(selectedBatch.created_at).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-right text-gray-900 w-16">ยอดเบิก</div>
                        <div className="text-right text-gray-900 w-20">{Number(selectedBatch.totalDue || 0).toLocaleString()} บาท</div>

                        {/* Row 2 */}
                        <div></div>
                        <div className="text-gray-400">{new Date(selectedBatch.created_at).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-right text-gray-500">ยอดค้าง</div>
                        <div className="text-right text-gray-500">{Number(selectedBatch.remaining).toLocaleString()} บาท</div>
                    </div>
                ) : (
                    <span className="text-sm text-gray-400">-- เลือกชุดเบิกค่าบริการ --</span>
                )}
                {!readOnly && <ChevronDown size={16} className="text-gray-400" />}
            </div>

            {/* Dropdown */}
            {isOpen && !readOnly && (
                <div className="absolute z-20 w-[120%] -left-[10%] mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-80 flex flex-col">
                    {/* Header: Team Outstanding */}
                    <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 text-xs flex justify-between font-medium text-gray-600">
                        <span>ยอดค้างรวมทีม:</span>
                        <span className={teamOutstanding > 0 ? 'text-red-600' : 'text-green-600'}>
                            {teamOutstanding.toLocaleString()}
                        </span>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1 space-y-1">
                        {batches.map(batch => (
                            <div
                                key={batch.id}
                                onClick={() => handleSelect(batch.id)}
                                className={`
                                    flex items-center justify-between p-2 rounded hover:bg-blue-50 cursor-pointer group border-b border-transparent hover:border-blue-100
                                    ${value === batch.id ? 'bg-blue-50 border-blue-200' : ''}
                                `}
                            >
                                <div className="flex-1 font-mono text-xs leading-relaxed grid grid-cols-[1fr_auto_auto_auto] gap-x-2 items-center">
                                    <div className="text-gray-900 font-medium truncate">TP{batch.id.slice(-6)}-{teamName}</div>
                                    <div className="text-gray-600">{new Date(batch.created_at).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="text-right text-gray-900 w-16">ยอดเบิก</div>
                                    <div className="text-right text-gray-900 w-20">{Number(batch.totalDue || 0).toLocaleString()} บาท</div>

                                    {/* Row 2 */}
                                    <div></div>
                                    <div className="text-gray-400">{new Date(batch.created_at).toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="text-right text-gray-500">ยอดค้าง</div>
                                    <div className="text-right text-gray-500">{Number(batch.remaining).toLocaleString()} บาท</div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {value === batch.id && <Check size={16} className="text-blue-600 mr-2" />}
                                    <button
                                        onClick={(e) => handleEditClick(e, batch.id)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                        title="แก้ไขรายละเอียด"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer: Create New */}
                    <button
                        onClick={handleCreateNew}
                        className="p-3 border-t border-gray-100 bg-primary-50 text-primary-700 hover:bg-primary-100 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> สร้างชุดเบิกใหม่
                    </button>
                </div>
            )
            }

            {/* Modal */}
            <TeamServiceFeeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                batchId={editingBatchId}
                teamId={resolvedTeamId}
                teamName={teamName}
                onSaveSuccess={(savedBatch) => {
                    loadBatches()
                    if (!editingBatchId) onChange(savedBatch.id) // Auto select new
                }}
            />
        </div >
    )
}
