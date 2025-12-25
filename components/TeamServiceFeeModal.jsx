import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Save, CreditCard, FileText, QrCode, ExternalLink, Calendar, DollarSign, Tooltip, Edit2 } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import { formatDate } from '../lib/utils' // Assuming utils exists
import ConfirmDialog from './ConfirmDialog'

export default function TeamServiceFeeModal({
    isOpen,
    onClose,
    batchId,
    teamId,
    teamName,
    onSaveSuccess
}) {
    const [loading, setLoading] = useState(false)
    const [batch, setBatch] = useState(null)
    const [teamQr, setTeamQr] = useState(null)

    // Form States
    const [costs, setCosts] = useState({ labor: 0, material: 0, travel: 0, deductPercent: 3, note: '' })
    const [adjustments, setAdjustments] = useState([])
    const [payments, setPayments] = useState([])
    const [jobs, setJobs] = useState([])

    // Sub-modals
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Transfer', slip: null, note: '', date: '' })

    // Confirm Dialog States
    const [showSaveConfirm, setShowSaveConfirm] = useState(false)
    const [showDeleteEntryConfirm, setShowDeleteEntryConfirm] = useState(false)
    const [entryToDelete, setEntryToDelete] = useState(null)
    const [showDeletePaymentConfirm, setShowDeletePaymentConfirm] = useState(false)
    const [showDeleteBatchConfirm, setShowDeleteBatchConfirm] = useState(false)

    useEffect(() => {
        if (isOpen && batchId) {
            loadBatch(batchId)
        } else if (isOpen && !batchId) {
            // New Batch Mode
            setBatch({ new: true })
            setCosts({ labor: 0, material: 0, travel: 0, deductPercent: 3, note: '' })
            setAdjustments([])
            setPayments([])
            setJobs([])
            if (teamId) loadTeamQr(teamId)
        }
    }, [isOpen, batchId, teamId])

    const loadBatch = async (id) => {
        setLoading(true)
        const data = await DataManager.getTeamServiceFeeById(id)
        if (data) {
            setBatch(data)
            setCosts({
                labor: data.labor_cost || 0,
                material: data.material_cost || 0,
                travel: data.travel_cost || 0,
                deductPercent: data.deduct_percent || 3,
                note: data.note || ''
            })
            setAdjustments(data.adjustments || [])
            setPayments(data.payments || [])
            setJobs(data.jobs || []) // jobs should be array of objects

            if (data.team_id) loadTeamQr(data.team_id)
        }
        setLoading(false)
    }

    const loadTeamQr = async (tid) => {
        // Find team QR from employees/teams list or specific API
        // We can use DataManager.getTeams() and find one
        const teams = await DataManager.getTeams()
        const t = teams.find(x => x.id === tid || x.name === teamName)
        if (t) setTeamQr(t.payment_qr_url)
    }

    // Calculations
    const totalLaborMatTravel = Number(costs.labor) + Number(costs.material) + Number(costs.travel)
    const deductAmount = totalLaborMatTravel * (Number(costs.deductPercent) / 100)
    const adjustmentsTotal = adjustments.reduce((sum, a) => sum + Number(a.amount), 0)
    const totalDue = (totalLaborMatTravel - deductAmount) + adjustmentsTotal
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const remaining = totalDue - totalPaid

    const handleSaveBatch = () => {
        setShowSaveConfirm(true)
    }

    const handleConfirmSave = async () => {
        setShowSaveConfirm(false)

        setLoading(true)
        const payload = {
            id: batchId,
            team_id: teamId || batch?.team_id,
            labor_cost: costs.labor,
            material_cost: costs.material,
            travel_cost: costs.travel,
            deduct_percent: costs.deductPercent,
            note: costs.note,
            status: 'active'
        }

        if (!payload.team_id) {
            alert('ไม่พบข้อมูลทีม (Missing Team ID). ระบบกำลังพยายามค้นหาทีม กรุณาลองใหม่ในอีกสักครู่ หรือเลือกทีมใหม่')
            setLoading(false)
            return
        }

        const res = await DataManager.saveTeamServiceFee(payload)
        if (res.success) {
            alert('บันทึกข้อมูลสำเร็จ!')
            if (onSaveSuccess) onSaveSuccess(res.data)
            if (!batchId) {
                // If created new, reload as existing
                onClose() // Simplest is close and let parent reload
            } else {
                loadBatch(batchId)
            }
        }
        setLoading(false)
    }

    const handleAddAdjustment = async (title, amount) => {
        if (!batchId) return alert('กรุณาบันทึกชุดค่าบริการก่อนเพิ่มรายการย่อย')
        setLoading(true)
        await DataManager.addServiceFeeAdjustment({
            service_fee_id: batchId,
            title,
            amount,
            created_at: new Date().toISOString()
        })
        loadBatch(batchId)
    }

    const handleDeleteAdjustment = (id) => {
        setEntryToDelete(id)
        setShowDeleteEntryConfirm(true)
    }

    const handleConfirmDeleteEntry = async () => {
        setShowDeleteEntryConfirm(false)
        if (!entryToDelete) return
        setLoading(true)
        await DataManager.deleteServiceFeeAdjustment(entryToDelete)
        setEntryToDelete(null)
        loadBatch(batchId)
    }

    const handleAddPayment = async () => {
        if (!batchId) return alert('กรุณาบันทึกชุดค่าบริการก่อนเพิ่มการชำระเงิน')
        setLoading(true)

        let slipUrl = null
        // Upload slip if needed (skipped for brevity, assuming URL or basic flow)
        // If file input logic needed, similar to TeamManagementModal

        if (paymentForm.id) {
            // Update mode
            await DataManager.updateServiceFeePayment(paymentForm.id, {
                amount: paymentForm.amount,
                payment_method: paymentForm.method,
                slip_url: slipUrl,
                note: paymentForm.note,
                paid_at: paymentForm.date || new Date().toISOString()
            })
        } else {
            // Create mode
            await DataManager.addServiceFeePayment({
                service_fee_id: batchId,
                amount: paymentForm.amount,
                payment_method: paymentForm.method,
                slip_url: slipUrl, // Todo: Handle file upload if required
                note: paymentForm.note,
                paid_at: paymentForm.date || new Date().toISOString()
            })
        }

        setShowPaymentForm(false)
        setPaymentForm({ amount: '', method: 'Transfer', slip: null, note: '', date: '' })
        loadBatch(batchId)
    }

    const formatUUID = (uuid) => uuid ? uuid.slice(-6) : ''
    const formatUUID12 = (uuid) => uuid ? uuid.slice(-12) : ''

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col my-8">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <FileText size={20} className="text-primary-600" />
                            ชุดเบิกค่าบริการทีม {teamName}
                        </h3>
                        <div className="text-xs text-gray-500 flex gap-2 mt-1">
                            <span>วันที่สร้าง: {batch?.created_at ? new Date(batch.created_at).toLocaleDateString('th-TH') : new Date().toLocaleDateString('th-TH')}</span>
                            {batch?.id && <span className="bg-gray-200 px-1 rounded">#{formatUUID(batch.id)}</span>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">

                    {/* 1. Job List (Moved to Top) */}
                    <div>
                        <h4 className="font-semibold text-secondary-800 text-sm mb-2">งานที่ผูกกับชุดนี้</h4>
                        <div className="flex flex-wrap gap-2">
                            {jobs.length > 0 ? jobs.map((job, i) => (
                                <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono text-xs border border-gray-200">
                                    JB{job.id ? job.id.slice(-6) : 'Unknown'}-{teamName}
                                </span>
                            )) : <span className="text-gray-400 text-xs">- ไม่ได้รับระบุงาน -</span>}
                        </div>
                    </div>

                    {/* 2. Main Costs */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <h4 className="font-semibold text-secondary-800 text-sm mb-2">ค่าบริการ / ค่าเดินทาง / ค่าของ</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">ค่าแรง (Labor)</label>
                                <input
                                    type="number"
                                    value={costs.labor}
                                    onChange={e => setCosts({ ...costs, labor: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded text-right font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">ค่าวัสดุ (Material)</label>
                                <input
                                    type="number"
                                    value={costs.material}
                                    onChange={e => setCosts({ ...costs, material: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded text-right font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">ค่าเดินทาง (Travel)</label>
                                <input
                                    type="number"
                                    value={costs.travel}
                                    onChange={e => setCosts({ ...costs, travel: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded text-right font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                            <div className="flex items-center gap-2 text-sm">
                                <span>หัก ณ ที่จ่าย (Default 3%)</span>
                                <input
                                    type="number"
                                    value={costs.deductPercent}
                                    onChange={e => setCosts({ ...costs, deductPercent: e.target.value })}
                                    className="w-16 p-1 text-center border border-gray-300 rounded"
                                />
                                <span>%</span>
                            </div>
                            <div className="text-red-600 font-medium">-{deductAmount.toLocaleString()}</div>
                        </div>
                        <div className="flex justify-between font-bold text-gray-800">
                            <span>ยอดเบิกสุทธิ (ก่อนรายการอื่น)</span>
                            <span>{(totalLaborMatTravel - deductAmount).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* 2. Adjustments (Top 10 max) */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-secondary-800 text-sm">รายการปรับยอดเพิ่มเติม (Adjustments)</h4>
                            <button
                                onClick={() => {
                                    const title = prompt('ชื่อรายการ:')
                                    if (title) {
                                        const amt = prompt('จำนวนเงิน (+เพิ่ม / -หัก):', '0')
                                        if (amt) handleAddAdjustment(title, amt)
                                    }
                                }}
                                className="text-xs text-primary-600 hover:bg-primary-50 px-2 py-1 rounded flex items-center gap-1"
                            >
                                <Plus size={14} /> เพิ่มรายการ
                            </button>
                        </div>
                        <div className="border rounded-lg overflow-hidden text-sm">
                            {adjustments.length === 0 ? (
                                <div className="p-3 text-center text-gray-400 text-xs">ไม่มีรายการปรับยอด</div>
                            ) : (
                                adjustments.slice(0, 10).map((adj) => (
                                    <div key={adj.id} className="flex justify-between p-3 border-b last:border-0 hover:bg-gray-50">
                                        <div className="flex gap-2">
                                            <span className="font-mono text-gray-400 text-xs">#{adj.id.slice(-6)}</span>
                                            <span>{adj.title}</span>
                                            <span className="text-gray-400 text-xs">({new Date(adj.created_at).toLocaleString()})</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={Number(adj.amount) >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {Number(adj.amount) >= 0 ? '+' : ''}{Number(adj.amount).toLocaleString()}
                                            </span>
                                            <button onClick={() => handleDeleteAdjustment(adj.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>


                    {/* 4. Totals and Payments */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>ยอดรวมที่ต้องชำระ (Total Due)</span>
                            <span className="text-primary-700">{totalDue.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2">
                            <h5 className="font-semibold text-xs text-gray-500 uppercase">ประวัติการชำระเงิน</h5>
                            {payments.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-gray-500">{new Date(p.paid_at).toLocaleString()}</div>
                                        <div className="font-medium text-gray-700">{p.payment_method}</div>
                                        {p.slip_url && <a href={p.slip_url} target="_blank" className="text-blue-500 text-xs hover:underline">ดูสลิป</a>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-green-600 font-medium">{Number(p.amount).toLocaleString()}</div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setPaymentForm({
                                                    id: p.id,
                                                    amount: p.amount,
                                                    method: p.payment_method || 'Transfer',
                                                    slip: p.slip_url,
                                                    note: p.note || '',
                                                    date: p.paid_at ? new Date(p.paid_at).toISOString().slice(0, 16) : ''
                                                })
                                                setShowPaymentForm(true)
                                            }}
                                            className="text-gray-400 hover:text-blue-500 transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Payment Form Button */}
                            <div className="flex justify-between items-center pt-2">
                                <div className="text-sm font-medium">คงเหลือชำระ (Remaining)</div>
                                <div className={`text-lg font-bold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {remaining.toLocaleString()}
                                </div>
                            </div>

                            {remaining > 0 && (
                                <button
                                    onClick={() => {
                                        setPaymentForm(prev => ({
                                            ...prev,
                                            amount: remaining > 0 ? remaining : '',
                                            date: new Date().toLocaleString('sv').slice(0, 16)
                                        }))
                                        setShowPaymentForm(true)
                                    }}
                                    className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={18} /> เพิ่มรายการชำระเงิน
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Payment Popover (Inline) */}
                    {showPaymentForm && (
                        <div className="bg-white border rounded-lg p-4 shadow-inner space-y-3 relative">
                            <button onClick={() => setShowPaymentForm(false)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                <X size={16} />
                            </button>
                            <h6 className="font-bold text-sm">บันทึกการชำระใหม่</h6>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs block mb-1">วันที่ชำระ</label>
                                    <input type="datetime-local" className="w-full p-2 border rounded text-sm"
                                        value={paymentForm.date}
                                        onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">จำนวนเงิน</label>
                                    <input type="number" className="w-full p-2 border rounded text-sm"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">ช่องทาง</label>
                                    <select className="w-full p-2 border rounded text-sm"
                                        value={paymentForm.method}
                                        onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                                    >
                                        <option value="Transfer">โอนเงิน</option>
                                        <option value="Cash">เงินสด</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs block mb-1">หมายเหตุ</label>
                                    <input type="text" className="w-full p-2 border rounded text-sm"
                                        value={paymentForm.note}
                                        onChange={e => setPaymentForm({ ...paymentForm, note: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* QR Section */}
                            {teamQr && (
                                <div className="flex items-center gap-3 p-2 bg-gray-50 rounded border border-gray-200">
                                    <img src={teamQr} className="w-16 h-16 object-cover bg-white rounded" alt="Q" />
                                    <div className="text-xs text-gray-600">
                                        <div className="font-bold">QR รับเงินของทีม</div>
                                        <div>สแกนเพื่อจ่ายยอด: {remaining.toLocaleString()}</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-2">
                                {/* Left: Delete Button (Only in Edit Mode) */}
                                <div>
                                    {paymentForm.id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setShowDeletePaymentConfirm(true)
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="ลบรายการชำระเงิน"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Right: Confirm Button */}
                                <button
                                    onClick={handleAddPayment}
                                    className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm font-medium"
                                >
                                    ยืนยันการชำระ
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-600">
                        {batchId && (
                            <button
                                onClick={() => setShowDeleteBatchConfirm(true)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                                title="ลบชุดเบิกนี้"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSaveBatch}
                        disabled={loading}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
                    >
                        <Save size={18} />
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>
            </div>

            {/* Save Batch Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showSaveConfirm}
                title="ยืนยันการบันทึกข้อมูล"
                message="คุณต้องการบันทึกข้อมูลชุดเบิกนี้ใช่หรือไม่?"
                onConfirm={handleConfirmSave}
                onCancel={() => setShowSaveConfirm(false)}
            />

            {/* Delete Entry Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteEntryConfirm}
                title="ยืนยันการลบรายการ"
                message="คุณต้องการลบรายการปรับยอดนี้ใช่หรือไม่?"
                onConfirm={handleConfirmDeleteEntry}
                onCancel={() => {
                    setShowDeleteEntryConfirm(false)
                    setEntryToDelete(null)
                }}
            />

            {/* Delete Payment Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeletePaymentConfirm}
                title="ยืนยันการลบรายการชำระเงิน"
                message="คุณต้องการลบรายการชำระเงินนี้ใช่หรือไม่?"
                onConfirm={async () => {
                    setShowDeletePaymentConfirm(false)
                    setLoading(true)
                    await DataManager.deleteServiceFeePayment(paymentForm.id)
                    setShowPaymentForm(false)
                    loadBatch(batchId)
                }}
                onCancel={() => setShowDeletePaymentConfirm(false)}
            />

            {/* Delete Batch Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteBatchConfirm}
                title="ยืนยันการลบชุดเบิก"
                message="คุณต้องการลบชุดเบิกนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
                onConfirm={async () => {
                    setShowDeleteBatchConfirm(false)
                    setLoading(true)
                    const res = await DataManager.deleteTeamServiceFee(batchId)
                    if (res.success) {
                        if (onSaveSuccess) onSaveSuccess(null)
                        onClose()
                    } else {
                        alert('เกิดข้อผิดพลาดในการลบ')
                    }
                    setLoading(false)
                }}
                onCancel={() => setShowDeleteBatchConfirm(false)}
            />
        </div>
    )
}
