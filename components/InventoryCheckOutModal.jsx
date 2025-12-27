import { useState, useEffect } from 'react'
import { X, LogOut, Search, QrCode, Scan, Box, CheckCircle, AlertTriangle } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import QRScanner from './QRScanner'
import { showError, showSuccess } from '../lib/sweetAlert'

export default function InventoryCheckOutModal({ isOpen, onClose, onSave }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [scannedItem, setScannedItem] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [checkOutReason, setCheckOutReason] = useState('sold')
    const [notes, setNotes] = useState('')

    const [scannedBoxes, setScannedBoxes] = useState([])
    const [expectedBoxes, setExpectedBoxes] = useState([])
    const [allBoxesVerified, setAllBoxesVerified] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('')
            setScannedItem(null)
            setScannedBoxes([])
            setExpectedBoxes([])
            setAllBoxesVerified(true)
            setCheckOutReason('sold')
            setNotes('')
            setShowScanner(false)
        }
    }, [isOpen])

    const handleScan = async (decodedText) => {
        setShowScanner(false)
        setSearchTerm(decodedText)
        await findItem(decodedText)
    }

    const findItem = async (code) => {
        try {
            // Check if we are already in a multi-box flow and scanning subsequent boxes
            if (scannedItem && scannedItem.box_count > 1) {
                // Determine if the scanned code corresponds to a box of the CURRENT item
                const matchedBox = scannedItem.boxes?.find(b => b.qr_code === code)

                if (matchedBox) {
                    // Check if already scanned
                    if (scannedBoxes.includes(matchedBox.box_number)) {
                        await showSuccess({ title: 'Already Scanned', text: `Box ${matchedBox.box_number} is already verified.` })
                        return
                    }

                    // Add to verified
                    const newScanned = [...scannedBoxes, matchedBox.box_number]
                    setScannedBoxes(newScanned)

                    if (newScanned.length === scannedItem.box_count) {
                        setAllBoxesVerified(true)
                        await showSuccess({ title: 'Complete!', text: 'All boxes verified.' })
                    }
                    return
                } else if (code === scannedItem.qr_code) {
                    // Scanned Parent Code again? Maybe treat as "Box 1" if we loosely define it, but strict is better.
                    // For now, let's assume Parent QR doesn't count as a Box QR in strict mode, OR we can map it.
                    // Actually, if user scans a NEW item, we should likely switch to that item (with confirmation?)
                }

                // If code doesn't match current boxes, warn user
                // "You are changing items!"
                const confirmChange = confirm("Scanned code does not match current item's boxes. Switch to new item?")
                if (!confirmChange) return
            }


            // New Item Search
            const item = await DataManager.getInventoryItemByQR(code)

            if (item) {
                if (item.status !== 'in_stock') {
                    await showError({ title: 'Unavailable', text: `Item is ${item.status}` })
                    setScannedItem(null)
                    return
                }

                setScannedItem(item)

                // Multi-box setup
                if (item.box_count > 1) {
                    setExpectedBoxes(Array.from({ length: item.box_count }, (_, i) => i + 1))

                    if (item.scanned_type === 'box' && item.scanned_box) {
                        setScannedBoxes([item.scanned_box.box_number])
                        setAllBoxesVerified(false)
                    } else {
                        // Scanned Parent Item QR directly
                        // If strict, we might require scanning boxes separately?
                        // Or assume Parent QR counts as verifiable if physically attached to box 1?
                        // Let's assume strict: Parent QR identifies Object, but we need to scan BOX labels.
                        setScannedBoxes([])
                        setAllBoxesVerified(false)
                    }
                } else {
                    // Single box
                    setExpectedBoxes([])
                    setScannedBoxes([])
                    setAllBoxesVerified(true)
                }

            } else {
                await showError({ title: 'Not Found', text: 'Item or Box QR not found.' })
            }
        } catch (error) {
            console.error(error)
            await showError({ title: 'Error', text: 'Failed to process code' })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!scannedItem || !allBoxesVerified) return

        setIsSubmitting(true)
        try {
            await DataManager.checkoutInventoryItem(scannedItem.id, {
                reason: checkOutReason,
                notes: notes,
                action: 'check_out'
            })
            onSave() // Refresh list
            onClose() // Close modal
            await showSuccess({ title: 'Success', text: 'Item checked out successfully' })
        } catch (error) {
            console.error(error)
            await showError({ title: 'Error', text: 'Failed to checkout item' })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-secondary-200 flex items-center justify-between bg-white shrink-0">
                    <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                        <LogOut className="text-danger-600" />
                        Check-out Item
                    </h2>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Search / Scan */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Scan Item / Box QR</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Scan QR..."
                                    className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') findItem(searchTerm)
                                    }}
                                />
                                <Search className="absolute left-3 top-2.5 text-secondary-400" size={18} />
                            </div>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="px-3 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200"
                            >
                                <Scan size={20} />
                            </button>
                            <button
                                onClick={() => findItem(searchTerm)}
                                className="px-4 py-2 bg-secondary-800 text-white rounded-lg hover:bg-secondary-900"
                            >
                                Find
                            </button>
                        </div>
                    </div>

                    {/* Item Details */}
                    {scannedItem && (
                        <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200 space-y-3">
                            <div>
                                <h3 className="font-bold text-secondary-900 text-lg">{scannedItem.product?.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-secondary-600 font-mono bg-white px-2 py-0.5 rounded border border-secondary-200">{scannedItem.product?.code}</span>
                                    {scannedItem.variants && (
                                        <span className="text-sm text-primary-700 font-medium bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                                            {scannedItem.variants.color} {scannedItem.variants.size}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-secondary-200">
                                <div>
                                    <span className="text-secondary-500 block text-xs">Total Boxes</span>
                                    <span className="font-bold flex items-center gap-1">
                                        <Box size={14} /> {scannedItem.box_count} Boxes
                                    </span>
                                </div>
                                <div>
                                    <span className="text-secondary-500 block text-xs">Location</span>
                                    <span className="font-medium">{scannedItem.current_location}</span>
                                </div>
                            </div>

                            {/* Multi-box Verification UI */}
                            {scannedItem.box_count > 1 && (
                                <div className={`mt-4 p-3 rounded-lg border-2 ${allBoxesVerified ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}`}>
                                    <h4 className={`font-bold text-sm mb-2 flex items-center gap-2 ${allBoxesVerified ? 'text-success-800' : 'text-warning-800'}`}>
                                        {allBoxesVerified ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                                        {allBoxesVerified ? 'Verification Complete' : `Verify All Boxes (${scannedBoxes.length}/${scannedItem.box_count})`}
                                    </h4>

                                    <div className="grid grid-cols-4 gap-2">
                                        {expectedBoxes.map(boxNum => {
                                            const isScanned = scannedBoxes.includes(boxNum)
                                            return (
                                                <div
                                                    key={boxNum}
                                                    className={`aspect-square flex flex-col items-center justify-center rounded border text-xs font-bold transition-all
                                                        ${isScanned
                                                            ? 'bg-success-500 text-white border-success-600'
                                                            : 'bg-white text-secondary-400 border-secondary-200 border-dashed'
                                                        }`}
                                                >
                                                    <span>BOX</span>
                                                    <span className="text-lg">{boxNum}</span>
                                                    {isScanned && <CheckCircle size={10} className="mt-1" />}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {!allBoxesVerified && (
                                        <p className="text-xs text-warning-700 mt-2 text-center animate-pulse font-medium">
                                            Please scan the remaining boxes...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Check-out Form */}
                    {scannedItem && (
                        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-secondary-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-secondary-700 block mb-1">Reason</label>
                                    <select
                                        value={checkOutReason}
                                        onChange={e => setCheckOutReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500"
                                    >
                                        <option value="sold">Sold (Sale)</option>
                                        <option value="used">Used (Project)</option>
                                        <option value="damaged">Damaged/Defect</option>
                                        <option value="lost">Lost</option>
                                        <option value="transfer_out">Transfer Out</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-secondary-700 block mb-1">Notes</label>
                                    <input
                                        type="text"
                                        placeholder="Optional..."
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !allBoxesVerified}
                                className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all
                                    ${isSubmitting || !allBoxesVerified
                                        ? 'bg-secondary-300 text-secondary-500 cursor-not-allowed'
                                        : 'bg-danger-600 text-white hover:bg-danger-700 shadow-md'
                                    }`}
                            >
                                {isSubmitting ? 'Processing...' : (
                                    <>
                                        <LogOut size={20} />
                                        Confirm Check-out
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {showScanner && (
                <QRScanner
                    onScan={handleScan}
                    onClose={() => setShowScanner(false)}
                />
            )}
        </div>
    )
}
