import React, { useState, useEffect } from 'react'
import { X, Save, CheckCircle, XCircle, AlertTriangle, Upload, Image as ImageIcon, Printer, Search, QrCode } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import { showSuccess, showError, showLoading } from '../lib/sweetAlert'


export default function QCInspectionModal({ isOpen, onClose, onItemSaved, item }) {
    const [status, setStatus] = useState('pass') // pass, fail, rework
    const [checklist, setChecklist] = useState({})
    const [notes, setNotes] = useState('')
    const [evidenceFiles, setEvidenceFiles] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [qcHistory, setQcHistory] = useState([])
    const [roundNumber, setRoundNumber] = useState(1)
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [serialNumber, setSerialNumber] = useState('')


    // Hardcoded template for now. In future, fetch from qc_templates based on product type
    const template = {
        name: "General Product Inspection",
        items: [
            "Packaging Condition (No damage)",
            "Product Appearance (Scratches/Dents)",
            "Accessories / Manuals Included",
            "Functional Test (Power On/Off)",
            "Label & Barcode Verification"
        ]
    }

    useEffect(() => {
        if (isOpen && item) {
            setStatus('pass')
            setNotes('')
            setEvidenceFiles([])
            // Initialize checklist
            const initialCheck = {}
            template.items.forEach(i => initialCheck[i] = true)
            setChecklist(initialCheck)

            // Set initial selected product
            if (item.product) {
                setSelectedProduct(item.product.uuid || item.product.id)
            }
            if (item.serial_number) {
                setSerialNumber(item.serial_number)
            }

            // Fetch History & Products
            const loadData = async () => {
                const history = await DataManager.getQCRecords(item.id)
                setQcHistory(history)
                setRoundNumber(history.length + 1)

                const allProducts = await DataManager.getProducts()
                setProducts(allProducts)
            }
            loadData()
        }
    }, [isOpen, item])

    const handleCheck = (criteria) => {
        setChecklist(prev => ({
            ...prev,
            [criteria]: !prev[criteria]
        }))
    }

    const handleFileChange = (e) => {
        if (e.target.files) {
            setEvidenceFiles(prev => [...prev, ...Array.from(e.target.files)])
        }
    }

    const removeFile = (index) => {
        setEvidenceFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!item) return

        showLoading('กำลังบันทึกข้อมูล...', 'กรุณารอสักครู่')
        try {
            await DataManager.saveQCRecord({
                inventory_item_id: item.id,
                inspector_name: 'Current User', // To be replaced with auth user
                status: status, // Changed from 'result' to 'status' to match DataManager expectations
                checklist_results: checklist,
                notes,
                evidenceFiles,
                new_product_id: selectedProduct, // Pass the selected product (might be changed)
                serial_number: serialNumber // Pass the manufacturer S/N
            })

            await showSuccess({
                title: 'บันทึกสำเร็จ',
                text: 'ผลการตรวจสอบถูกบันทึกเรียบร้อยแล้ว'
            })

            onItemSaved()
            onClose()
        } catch (error) {
            console.error(error)
            await showError({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกผล QC ได้'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen || !item) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-secondary-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                            <CheckCircle className="text-primary-600" />
                            QC Inspection (Round #{roundNumber})
                        </h2>
                        <div className="text-sm text-secondary-500 mt-1 flex flex-col sm:flex-row sm:gap-4">
                            <span className="flex items-center gap-2">
                                QR: <span className="font-mono bg-secondary-100 px-1 rounded">{item.qr_code}</span>

                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8 flex-1 overflow-y-auto">

                    {/* Inbound Evidence (New) */}
                    {(item.evidence?.length > 0 || item.set_id) && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-secondary-900 uppercase tracking-wider border-b border-secondary-100 pb-2 flex items-center justify-between">
                                Inbound Information
                                {item.set_id && (
                                    <span className="text-[10px] font-mono bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded border border-primary-200">
                                        SET: #{item.set_id.split('-')[0].toUpperCase()} ({item.box_number || 1}/{item.total_boxes || 1})
                                    </span>
                                )}
                            </h3>

                            {item.evidence?.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {item.evidence.map((ev, i) => (
                                        <div key={i} className="group relative rounded-lg border border-secondary-200 bg-secondary-50 aspect-square overflow-hidden cursor-zoom-in hover:shadow-md transition-all">
                                            <img src={ev.media_url} className="w-full h-full object-cover" alt={ev.category} />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                                {ev.category}: {ev.notes || 'No description'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Product Identification (Blind Check-in Support) */}
                    <div className={`p-4 rounded-xl border-2 transition-all ${item.status === 'pending_binding'
                        ? 'border-amber-200 bg-amber-50 shadow-sm'
                        : 'border-secondary-100 bg-white'
                        }`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === 'pending_binding' ? 'bg-amber-500 text-white' : 'bg-secondary-100 text-secondary-500'
                                }`}>
                                <Search size={18} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-secondary-900 italic">
                                    {item.status === 'pending_binding' ? 'Identify Product (Swift Receive)' : 'Product Verification (SKU)'}
                                </label>
                                <p className="text-[10px] text-secondary-500 uppercase tracking-widest font-black">Link with Master SKU</p>
                            </div>
                        </div>

                        <select
                            value={selectedProduct || ''}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className={`w-full p-3 border-2 rounded-xl focus:ring-4 transition-all text-sm font-bold ${item.status === 'pending_binding'
                                ? 'border-amber-300 bg-white focus:ring-amber-500/10 focus:border-amber-500'
                                : 'border-secondary-200 bg-secondary-50 focus:ring-primary-500/10 focus:border-primary-500'
                                }`}
                        >
                            <option value="">-- Select Product --</option>
                            {products.map(p => (
                                <option key={p.uuid || p.id} value={p.uuid || p.id}>
                                    {p.code} - {p.name}
                                </option>
                            ))}
                        </select>
                        <p className={`text-[11px] mt-2 flex items-center gap-1.5 ${item.status === 'pending_binding' ? 'text-amber-700' : 'text-secondary-500'
                            }`}>
                            <AlertTriangle size={12} />
                            {item.status === 'pending_binding'
                                ? 'This item was received swiftly. Please select the correct SKU now.'
                                : 'If this QR belongs to a different product, update it here.'}
                        </p>
                    </div>

                    {/* Serial Number Input */}
                    <div className="bg-white p-4 rounded-xl border border-secondary-100 space-y-3">
                        <div className="flex items-center gap-2">
                            <QrCode size={18} className="text-secondary-400" />
                            <label className="text-sm font-bold text-secondary-700">Manufacturer Serial Number</label>
                        </div>
                        <input
                            type="text"
                            value={serialNumber}
                            onChange={(e) => setSerialNumber(e.target.value)}
                            className="w-full p-3 border-2 border-secondary-200 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-bold"
                            placeholder="Scan or type manufacturer S/N..."
                        />
                    </div>

                    {/* Previous Result Summary */}
                    {qcHistory.length > 0 && (
                        <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                            <h4 className="text-sm font-bold text-secondary-700 mb-2">Previous Inspection (Round #{qcHistory.length})</h4>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase
                                    ${qcHistory[qcHistory.length - 1].status === 'pass' ? 'bg-success-100 text-success-700' :
                                        qcHistory[qcHistory.length - 1].status === 'fail' ? 'bg-danger-100 text-danger-700' :
                                            'bg-warning-100 text-warning-700'}`}>
                                    {qcHistory[qcHistory.length - 1].status}
                                </span>
                                <span className="text-xs text-secondary-500">
                                    by {qcHistory[qcHistory.length - 1].inspector_name || 'Unknown'} on {new Date(qcHistory[qcHistory.length - 1].created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {qcHistory[qcHistory.length - 1].notes && (
                                <p className="text-sm text-secondary-600 italic">" {qcHistory[qcHistory.length - 1].notes} "</p>
                            )}
                        </div>
                    )}

                    {/* 1. Checklist */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-secondary-900 uppercase tracking-wider border-b border-secondary-100 pb-2">
                            1. Inspection Checklist
                        </h3>
                        <div className="grid gap-3">
                            {template.items.map((criteria, idx) => (
                                <label key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-secondary-100 hover:bg-secondary-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        className="mt-1 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                        checked={checklist[criteria] || false}
                                        onChange={() => handleCheck(criteria)}
                                    />
                                    <span className={`text-sm ${checklist[criteria] ? 'text-secondary-900' : 'text-secondary-400'}`}>
                                        {criteria}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 2. Status Decision */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-secondary-900 uppercase tracking-wider border-b border-secondary-100 pb-2">
                            2. Final Decision
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <button
                                type="button"
                                onClick={() => setStatus('pass')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                                    ${status === 'pass'
                                        ? 'border-success-500 bg-success-50 text-success-700'
                                        : 'border-secondary-100 hover:border-secondary-300 text-secondary-400'}`}
                            >
                                <CheckCircle size={32} />
                                <span className="font-bold">PASS</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('rework')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                                    ${status === 'rework'
                                        ? 'border-warning-500 bg-warning-50 text-warning-700'
                                        : 'border-secondary-100 hover:border-secondary-300 text-secondary-400'}`}
                            >
                                <AlertTriangle size={32} />
                                <span className="font-bold">REWORK</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus('fail')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                                    ${status === 'fail'
                                        ? 'border-danger-500 bg-danger-50 text-danger-700'
                                        : 'border-secondary-100 hover:border-secondary-300 text-secondary-400'}`}
                            >
                                <XCircle size={32} />
                                <span className="font-bold">FAIL</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Evidence & Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-secondary-900 uppercase tracking-wider border-b border-secondary-100 pb-2">
                            3. Evidence & Notes
                        </h3>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-secondary-700">Remarks / Issues found</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-24 p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Describe any defects or reasons for failure..."
                            ></textarea>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-secondary-700">Photos / Videos</label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg cursor-pointer hover:bg-secondary-50 transition-colors">
                                    <Upload size={18} className="text-secondary-500" />
                                    <span className="text-sm text-secondary-700">Upload Files</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                                <span className="text-xs text-secondary-400">
                                    {evidenceFiles.length} files selected
                                </span>
                            </div>

                            {evidenceFiles.length > 0 && (
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {evidenceFiles.map((file, idx) => (
                                        <div key={idx} className="relative group">
                                            <div className="w-16 h-16 rounded-lg border border-secondary-200 bg-secondary-50 flex items-center justify-center overflow-hidden">
                                                {file.type.startsWith('image') ? (
                                                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-secondary-400" />
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-4 border-t border-secondary-100 bg-secondary-50 sticky bottom-0 z-10 flex justify-end gap-3 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-white font-medium"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`px-6 py-2 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all
                            ${isSubmitting ? 'bg-secondary-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 hover:shadow-md'}`}
                    >
                        {isSubmitting ? 'Saving...' : (
                            <>
                                <Save size={18} />
                                Confirm Result
                            </>
                        )}
                    </button>
                </div>
            </div>


        </div >
    )
}
