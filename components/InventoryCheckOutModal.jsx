import { useState, useEffect } from 'react'
import { X, LogOut, Search, QrCode, Scan } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import QRScanner from './QRScanner'

export default function InventoryCheckOutModal({ isOpen, onClose, onSave }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [scannedItem, setScannedItem] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showScanner, setShowScanner] = useState(false)
    const [checkOutReason, setCheckOutReason] = useState('sold') // sold, used, lost, damaged
    const [notes, setNotes] = useState('')

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('')
            setScannedItem(null)
            setCheckOutReason('sold')
            setNotes('')
            setShowScanner(false)
        }
    }, [isOpen])

    const handleScan = async (decodedText) => {
        // Assume decodedText is the UNIQUE scan code of the item (e.g. ITEM-123-ABC)
        setShowScanner(false)
        setSearchTerm(decodedText)
        await findItem(decodedText)
    }

    const findItem = async (code) => {
        // We need a method to find a specific physical item by its QR code
        // For now, we'll implement a simple lookup in DataManager or use direct query if needed
        // But since DataManager is our abstraction, let's assume we add `getInventoryItemByQR`
        // Or we just fetch all and filter (expensive but okay for prototype)
        // ideally: DataManager.getInventoryItemByQR(code)

        // For MVP, since we don't have that method yet, we might need to add it or do a direct lookup 
        // Let's assume we will add DataManager.getInventoryItemByQR

        try {
            const item = await DataManager.getInventoryItemByQR(code)
            if (item) {
                if (item.status !== 'in_stock') {
                    alert(`Item is not in stock! Status: ${item.status}`)
                    setScannedItem(null)
                } else {
                    setScannedItem(item)
                }
            } else {
                alert('Item not found!')
                setScannedItem(null)
            }
        } catch (error) {
            console.error(error)
            alert('Error finding item')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!scannedItem) return

        setIsSubmitting(true)
        try {
            await DataManager.checkoutInventoryItem(scannedItem.id, {
                reason: checkOutReason,
                notes: notes,
                action: 'check_out'
            })
            onSave()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Error checking out item')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-secondary-200 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                        <LogOut className="text-danger-600" />
                        Check-out Item
                    </h2>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Search / Scan */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">Scan Item QR Code</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Scan or enter Item ID..."
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
                        <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                            <h3 className="font-bold text-secondary-900">{scannedItem.product?.name}</h3>
                            <p className="text-sm text-secondary-600 font-mono mt-1">{scannedItem.product?.code}</p>
                            <div className="mt-3 flex gap-4 text-sm">
                                <div>
                                    <span className="text-secondary-500 block text-xs">Uniq ID</span>
                                    <span className="font-mono font-medium">{scannedItem.qr_code}</span>
                                </div>
                                <div>
                                    <span className="text-secondary-500 block text-xs">Location</span>
                                    <span className="font-medium">{scannedItem.current_location}</span>
                                </div>
                            </div>
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
                                disabled={isSubmitting}
                                className="w-full py-3 bg-danger-600 text-white rounded-lg hover:bg-danger-700 font-bold flex items-center justify-center gap-2"
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
