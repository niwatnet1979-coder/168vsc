import React, { useState, useEffect, useRef } from 'react'
import {
    X,
    ClipboardCheck,
    ScanLine,
    CheckCircle,
    AlertTriangle,
    XCircle,
    RotateCcw,
    Search
} from 'lucide-react'
import { DataManager } from '../lib/dataManager'

export default function StockCheckModal({ isOpen, onClose }) {
    // Audit State
    const [auditItems, setAuditItems] = useState([]) // All expected items from DB
    const [scannedCodes, setScannedCodes] = useState(new Set()) // Set of strings
    const [scanLog, setScanLog] = useState([]) // Array of { code, status, time, message }
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState('scanned') // scanned, missing
    const [currentInput, setCurrentInput] = useState('')

    // Feedback State
    const [lastScanResult, setLastScanResult] = useState(null) // { status: 'success'|'duplicate'|'unknown', message: '' }

    const inputRef = useRef(null)

    // Load expected inventory on open
    useEffect(() => {
        if (isOpen) {
            loadExpectedInventory()
            setScannedCodes(new Set())
            setScanLog([])
            setLastScanResult(null)
            setCurrentInput('')
            // Focus input automatically
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isOpen])

    const loadExpectedInventory = async () => {
        setIsLoading(true)
        // Fetch only 'in_stock' items
        const allItems = await DataManager.getInventoryItems()
        const inStock = allItems.filter(i => i.status === 'in_stock')
        setAuditItems(inStock)
        setIsLoading(false)
    }

    const handleScan = (e) => {
        e.preventDefault()
        const code = currentInput.trim().toUpperCase()
        if (!code) return

        processScan(code)
        setCurrentInput('')
    }

    const processScan = (code) => {
        const timestamp = new Date()
        let status = 'unknown' // success, duplicate, unknown
        let message = ''

        // 1. Check if Code matches an expected item
        const foundItem = auditItems.find(i => i.qr_code === code)

        // 2. Determine Result
        if (scannedCodes.has(code)) {
            status = 'duplicate'
            message = 'Item already scanned in this session.'
        } else if (foundItem) {
            status = 'success'
            message = `Verified: ${foundItem.product?.name || 'Item'}`
            setScannedCodes(prev => new Set(prev).add(code))
        } else {
            // Check if it exists in DB but not in 'in_stock' (e.g. Sold/Lost)
            status = 'unknown' // Or 'unexpected'
            message = 'QR Code not found or not in Stock.'
        }

        // 3. Update Log (Latest first)
        setScanLog(prev => [{
            id: timestamp.getTime(),
            code,
            status,
            message,
            time: timestamp.toLocaleTimeString()
        }, ...prev])

        // 4. Update Feedback UI
        setLastScanResult({ status, message, code })
    }

    // Stats
    const totalExpected = auditItems.length
    const totalScanned = scannedCodes.size
    const percentage = totalExpected > 0 ? Math.round((totalScanned / totalExpected) * 100) : 0

    const missingItems = auditItems.filter(i => !scannedCodes.has(i.qr_code))

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-secondary-100 flex items-center justify-between bg-primary-900 text-white rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <ClipboardCheck className="text-primary-300" />
                            Stock Audit Mode
                        </h2>
                        <p className="text-primary-300 text-sm mt-1">
                            Scan items to verify current stock levels.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-primary-300 hover:text-white transition-colors">
                        <X size={28} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

                    {/* LEFT PANEL: Scanning Area & Feedback */}
                    <div className="flex-[3] p-6 flex flex-col border-r border-secondary-100 bg-secondary-50 overflow-y-auto">

                        {/* 1. Progress Card */}
                        <div className="bg-white p-4 rounded-xl border border-secondary-200 shadow-sm mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-secondary-500 font-medium">Progress</span>
                                <span className="text-2xl font-bold text-primary-900">
                                    {totalScanned} <span className="text-secondary-400 text-lg">/ {totalExpected}</span>
                                </span>
                            </div>
                            <div className="w-full bg-secondary-100 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-primary-600 h-full transition-all duration-500 ease-out"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>

                        {/* 2. Scan Input */}
                        <div className="mb-6">
                            <form onSubmit={handleScan} className="relative">
                                <ScanLine className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600" size={24} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    // Keep focus handling simple for now
                                    onBlur={() => setTimeout(() => inputRef.current?.focus(), 2000)}
                                    className="w-full pl-12 pr-4 py-4 text-xl font-mono border-2 border-primary-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-100 shadow-sm"
                                    placeholder="Scan QR Code here..."
                                    autoFocus
                                />
                                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold">
                                    ENTER
                                </button>
                            </form>
                            <p className="text-xs text-secondary-500 mt-2 text-center">
                                * Click inside the box and use your scanner. Auto-focus enabled.
                            </p>
                        </div>

                        {/* 3. Live Feedback */}
                        {lastScanResult && (
                            <div className={`p-6 rounded-xl border-l-8 shadow-sm mb-6 animate-in fade-in slide-in-from-top-2 duration-300
                                ${lastScanResult.status === 'success' ? 'bg-success-50 border-success-500 text-success-900' :
                                    lastScanResult.status === 'duplicate' ? 'bg-warning-50 border-warning-500 text-warning-900' :
                                        'bg-danger-50 border-danger-500 text-danger-900'}`
                            }>
                                <div className="flex items-start gap-4">
                                    {lastScanResult.status === 'success' ? <CheckCircle size={32} className="text-success-600 shrink-0" /> :
                                        lastScanResult.status === 'duplicate' ? <RotateCcw size={32} className="text-warning-600 shrink-0" /> :
                                            <XCircle size={32} className="text-danger-600 shrink-0" />}

                                    <div>
                                        <h3 className="text-lg font-bold uppercase tracking-wide">
                                            {lastScanResult.status === 'success' ? 'OK - COUNTED' :
                                                lastScanResult.status === 'duplicate' ? 'WARNING - DUPLICATE' :
                                                    'ERROR - UNKNOWN/WRONG'}
                                        </h3>
                                        <p className="font-mono text-xl mt-1">{lastScanResult.code}</p>
                                        <p className="mt-1 opacity-90">{lastScanResult.message}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Recent Logs */}
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-secondary-500 mb-3 uppercase tracking-wider">Recent Scans</h4>
                            <div className="space-y-2">
                                {scanLog.slice(0, 5).map(log => (
                                    <div key={log.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-secondary-200 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            {log.status === 'success' ? <CheckCircle size={16} className="text-success-500" /> :
                                                log.status === 'duplicate' ? <RotateCcw size={16} className="text-warning-500" /> :
                                                    <XCircle size={16} className="text-danger-500" />}
                                            <span className="font-mono text-sm font-medium">{log.code}</span>
                                        </div>
                                        <span className="text-xs text-secondary-400">{log.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Lists (Missing/Scanned) */}
                    <div className="flex-[2] flex flex-col border-secondary-100 bg-white md:border-l">
                        {/* Tabs */}
                        <div className="flex border-b border-secondary-200">
                            <button
                                onClick={() => setActiveTab('scanned')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                                    ${activeTab === 'scanned' ? 'border-primary-600 text-primary-700 bg-primary-50' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                            >
                                Scanned ({totalScanned})
                            </button>
                            <button
                                onClick={() => setActiveTab('missing')}
                                className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors
                                    ${activeTab === 'missing' ? 'border-danger-500 text-danger-700 bg-danger-50' : 'border-transparent text-secondary-500 hover:text-secondary-700'}`}
                            >
                                Missing ({missingItems.length})
                            </button>
                        </div>

                        {/* Inventory List */}
                        <div className="flex-1 overflow-y-auto p-0">
                            {activeTab === 'scanned' ? (
                                <ul className="divide-y divide-secondary-100">
                                    {Array.from(scannedCodes).map(code => {
                                        const item = auditItems.find(i => i.qr_code === code)
                                        return (
                                            <li key={code} className="p-3 hover:bg-secondary-50 flex items-center gap-3">
                                                <CheckCircle size={16} className="text-success-500 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-secondary-900 truncate">{item?.product?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-secondary-500 font-mono">{code}</p>
                                                </div>
                                            </li>
                                        )
                                    })}
                                    {scannedCodes.size === 0 && (
                                        <div className="p-8 text-center text-secondary-400 text-sm">No items scanned yet.</div>
                                    )}
                                </ul>
                            ) : (
                                <ul className="divide-y divide-secondary-100">
                                    {missingItems.map(item => (
                                        <li key={item.id} className="p-3 hover:bg-secondary-50 flex items-center gap-3 border-l-4 border-transparent hover:border-danger-400">
                                            <AlertTriangle size={16} className="text-danger-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-secondary-900 truncate">{item.product?.name || 'Unknown'}</p>
                                                <p className="text-xs text-secondary-500 font-mono">{item.qr_code}</p>
                                                <p className="text-[10px] text-secondary-400">{item.current_location}</p>
                                            </div>
                                        </li>
                                    ))}
                                    {missingItems.length === 0 && (
                                        <div className="p-8 text-center text-success-600 bg-success-50 m-4 rounded-lg">
                                            <CheckCircle size={32} className="mx-auto mb-2" />
                                            <p className="font-bold">All Clear!</p>
                                            <p className="text-sm">No items missing from stock.</p>
                                        </div>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
