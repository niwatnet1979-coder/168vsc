import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import PrintModal from '../components/PrintModal'
import { useLanguage } from '../contexts/LanguageContext'
import {
    Camera,
    Printer,
    Package,
    ArrowRight,
    QrCode,
    Search,
    X,
    CheckCircle,
    AlertCircle,
    Image as ImageIcon,
    BoxSelect,
    Palette,
    Diamond,
    Gem
} from 'lucide-react'
import { searchProducts, bindLpnToProduct, bindLpnSetToProduct, uploadEvidencePhoto, checkLpnForResume } from '../lib/data/inboundManager'

export default function InboundStationPage() {
    const { t } = useLanguage()

    // States
    const [step, setStep] = useState(1) // 1: Evidence, 2: Bind LPN, 3: Success/Next
    const [evidencePhotos, setEvidencePhotos] = useState([]) // Array of URLs
    // Multi-Box State
    const [bindBoxCount, setBindBoxCount] = useState(1) // Total boxes in set
    const [scannedLpns, setScannedLpns] = useState([]) // List of scanned LPNs
    const [isUploading, setIsUploading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [lpn, setLpn] = useState('')
    const [scanBuffer, setScanBuffer] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [lastBoundSetId, setLastBoundSetId] = useState(null)

    // Refs
    const lpnInputRef = useRef(null)
    const fileInputRef = useRef(null)
    const productLabelRefPlaceholder = useRef(null) // Renamed to avoid using it


    // Handle Barcode Scanner (Keyboard Shim)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // If in Step 2 and LPN input is not focused, capture keys
            if (step === 2 && document.activeElement !== lpnInputRef.current) {
                if (e.key === 'Enter') {
                    if (scanBuffer) {
                        checkAndHandleLpn(scanBuffer)
                        setScanBuffer('')
                    }
                } else if (e.key.length === 1) {
                    setScanBuffer(prev => prev + e.key)
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [step, scanBuffer, selectedProduct, selectedVariant])

    const handleSearchProduct = async (query) => {
        setSearchQuery(query)
        if (query.length < 2) {
            setSearchResults([])
            return
        }
        const data = await searchProducts(query)
        setSearchResults(data)
    }

    const handleSelectProduct = (prod) => {
        setSelectedProduct(prod)
        if (prod.variants && prod.variants.length === 1) {
            setSelectedVariant(prod.variants[0])
        } else {
            setSelectedVariant(null)
        }
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setIsUploading(true)
        try {
            const url = await uploadEvidencePhoto(file)
            setEvidencePhotos(prev => [...prev, {
                url,
                category: 'YDNumber', // Default to YDNumber as it's common
                captured_text: '',
                custom_notes: '',
                tags: ['inbound']
            }])
        } catch (error) {
            console.error(error)
            alert("Error uploading photo")
        } finally {
            setIsUploading(false)
        }
    }

    const updatePhotoData = (idx, updates) => {
        setEvidencePhotos(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p))
    }

    const togglePhotoTag = (photoIdx, tag) => {
        setEvidencePhotos(prev => prev.map((p, i) => {
            if (i !== photoIdx) return p
            const currentTags = p.tags || []
            const newTags = currentTags.includes(tag)
                ? currentTags.filter(t => t !== tag)
                : [...currentTags, tag]
            return { ...p, tags: newTags }
        }))
    }

    const removePhoto = (photoIdx) => {
        setEvidencePhotos(prev => prev.filter((_, i) => i !== photoIdx))
    }

    // Unified LPN Check & Handle
    const checkAndHandleLpn = async (code) => {
        if (!code) return

        // 1. Check if LPN exists in DB (Resume Case)
        const existingItem = await checkLpnForResume(code)

        if (existingItem) {
            // Already bound and fully stocked?
            if (existingItem.status === 'in_stock') {
                alert(`LPN ${code} is already in stock and bound to ${existingItem.product?.name || 'a product'}.`)
                return
            }

            // Pending Binding? Suggest Resume
            if (existingItem.status === 'pending_binding') {
                const confirmResume = confirm(`LPN ${code} has been received but not bound. Resume binding?`)
                if (confirmResume) {
                    // Load Evidence
                    if (existingItem.photos) {
                        setEvidencePhotos(existingItem.photos.map(p => ({
                            url: p.photo_url,
                            category: p.category || 'Other',
                            captured_text: p.captured_text || '',
                            custom_notes: p.custom_notes || '',
                            tags: p.tags || []
                        })))
                    }
                    // Load product/variant if any (though usually null for pending)
                    if (existingItem.product) setSelectedProduct(existingItem.product)
                    if (existingItem.variants) setSelectedVariant(existingItem.variants)

                    setLpn(code)
                    setStep(2)
                    return
                }
            } else {
                alert(`LPN ${code} is already in use (Status: ${existingItem.status}).`)
                return
            }
        }

        // 2. New LPN Handling
        if (bindBoxCount > 1) {
            handleBoxScan(code)
        } else {
            setLpn(code)
            // Auto-submit if product selected
            if (selectedProduct) {
                if (!(selectedProduct.variants?.length > 0 && !selectedVariant)) {
                    setTimeout(() => submitBinding(), 10)
                }
            }
        }
    }

    const handleBoxScan = (scannedCode) => {
        if (!scannedCode) return
        if (scannedLpns.includes(scannedCode)) {
            alert('LPN already scanned!')
            return
        }
        setScannedLpns(prev => [...prev, scannedCode])
    }

    const removeScannedLpn = (codeToRemove) => {
        setScannedLpns(scannedLpns.filter(c => c !== codeToRemove))
    }

    const submitBinding = async (isSwift = false) => {
        // Validation for full binding
        if (!isSwift) {
            if (!selectedProduct) {
                alert('Please select a product')
                return
            }
            if (selectedProduct.variants?.length > 0 && !selectedVariant) {
                alert('Please select a variant')
                return
            }
        }

        // Single LPN Validation
        if (bindBoxCount === 1 && !lpn) {
            alert('Please scan LPN')
            return
        }

        // Multi LPN Validation
        if (bindBoxCount > 1 && scannedLpns.length !== bindBoxCount) {
            alert(`Please scan all ${bindBoxCount} boxes (Current: ${scannedLpns.length})`)
            return
        }

        setIsSubmitting(true)
        try {
            if (bindBoxCount > 1) {
                const results = await bindLpnSetToProduct({
                    lpnList: scannedLpns,
                    product: isSwift ? null : selectedProduct,
                    variantId: isSwift ? null : (selectedVariant?.id || null),
                    evidencePhotos: evidencePhotos
                })
                if (results && results.length > 0) {
                    setLastBoundSetId(results[0].set_id)
                }
            } else {
                await bindLpnToProduct({
                    lpnCode: lpn,
                    product: isSwift ? null : selectedProduct,
                    variantId: isSwift ? null : (selectedVariant?.id || null),
                    evidencePhotos: evidencePhotos
                })
            }

            setStep(3)
        } catch (error) {
            console.error(error)
            alert(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Printing Logic (Shared Component)
    const [itemToPrint, setItemToPrint] = useState(null)

    const onPrintClick = () => {
        // Construct item object for printing
        const item = {
            qr_code: bindBoxCount > 1 ? scannedLpns[0] : lpn,
            lpnList: bindBoxCount > 1 ? scannedLpns : null,
            set_id: lastBoundSetId,
            product: selectedProduct,
            variants: selectedVariant,
            variant_id: selectedVariant?.id
        }
        setItemToPrint(item)
    }

    const resetProcess = () => {
        setStep(1)
        setEvidencePhotos([])
        setLastBoundSetId(null)
        setSelectedProduct(null)
        setSelectedVariant(null)
        setLpn('')
        setSearchQuery('')
        setSearchResults([])
        setBindBoxCount(1)
        setScannedLpns([])
    }

    return (
        <AppLayout>
            <Head>
                <title>Inbound Station - 168VSC</title>
            </Head>

            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            <Package className="text-primary-600" />
                            Inbound Station
                        </h1>
                        <p className="text-secondary-500">
                            {step === 1 && "Step 1: Capture Evidence (Optional)"}
                            {step === 2 && "Step 2: Select Product & Scan LPN"}
                            {step === 3 && "Success!"}
                        </p>
                    </div>
                    <button onClick={resetProcess} className="text-secondary-500 hover:text-secondary-700">
                        Reset
                    </button>
                </div>

                {/* STEP 1: Evidence */}
                {step === 1 && (
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-8 text-center space-y-6">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileUpload}
                        />

                        {evidencePhotos.length === 0 ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-secondary-300 rounded-xl bg-secondary-50 hover:bg-secondary-100 transition-colors cursor-pointer"
                            >
                                <Camera size={48} className="text-secondary-400 mb-2" />
                                <p className="font-medium text-secondary-600">Take Photo of Box / Label</p>
                                <p className="text-xs text-secondary-400 mt-1">Supports OCR & Tracking Number Detection</p>
                                {isUploading && <p className="text-primary-600 mt-2 font-bold animate-pulse">Uploading...</p>}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {evidencePhotos.map((photo, idx) => (
                                    <div key={idx} className="relative rounded-xl overflow-hidden border border-secondary-200 bg-secondary-50 flex flex-col group">
                                        <div className="aspect-video relative">
                                            <img src={photo.url} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => removePhoto(idx)}
                                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="p-4 bg-white border-t border-secondary-100 space-y-3 text-left">
                                            {/* Category Selector */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {[
                                                    { id: 'YDNumber', label: 'YD Number' },
                                                    { id: 'TrackingNumber', label: 'Tracking' },
                                                    { id: 'BillNumber', label: 'Bill' },
                                                    { id: 'Other', label: 'อื่นๆ' }
                                                ].map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => updatePhotoData(idx, { category: cat.id })}
                                                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all border ${photo.category === cat.id
                                                            ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                                                            : 'bg-secondary-50 border-secondary-200 text-secondary-500'
                                                            }`}
                                                    >
                                                        {cat.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Code Input (Scan/OCR result) */}
                                            <div className="relative">
                                                <QrCode size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Scan or Type Code..."
                                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-secondary-50/50"
                                                    value={photo.captured_text || ''}
                                                    onChange={e => updatePhotoData(idx, { captured_text: e.target.value })}
                                                />
                                            </div>

                                            {/* Custom Notes (ONLY for Other or always?) */}
                                            {photo.category === 'Other' && (
                                                <input
                                                    type="text"
                                                    placeholder="Specify details..."
                                                    className="w-full px-3 py-1.5 text-sm border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 bg-secondary-50/50 italic"
                                                    value={photo.custom_notes || ''}
                                                    onChange={e => updatePhotoData(idx, { custom_notes: e.target.value })}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center border-2 border-dashed border-secondary-300 rounded-xl bg-secondary-50 hover:bg-secondary-100 cursor-pointer min-h-[160px] transition-all group"
                                >
                                    <Camera size={32} className="text-secondary-400 mb-2 group-hover:scale-110 transition-transform" />
                                    <span className="text-secondary-500 text-sm font-medium">Add More Photo</span>
                                    {isUploading && <p className="text-primary-600 mt-2 font-bold animate-pulse text-xs">Uploading...</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center gap-2 pt-4 border-t border-secondary-100">
                            <div className="text-left">
                                <p className="text-xs text-secondary-400 font-medium uppercase tracking-wider">Fast Track</p>
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 group"
                                >
                                    Skip to Binding <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <button
                                onClick={() => setStep(2)}
                                className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-200 transition-all active:scale-95 flex items-center gap-2"
                            >
                                Continue to LPN Binding <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 2: Binding */}
                {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LEFT: Product Selection */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 space-y-4">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Search size={20} className="text-primary-600" />
                                1. Select Product
                            </h3>

                            {!selectedProduct ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Search SKU or Name..."
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        value={searchQuery}
                                        onChange={e => handleSearchProduct(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {searchResults.map(prod => (
                                            <div
                                                key={prod.uuid}
                                                onClick={() => handleSelectProduct(prod)}
                                                className="flex items-center gap-3 p-3 hover:bg-primary-50 hover:border-primary-100 rounded-lg cursor-pointer border border-transparent transition-colors"
                                            >
                                                <div className="w-10 h-10 bg-white rounded flex-shrink-0 overflow-hidden border border-secondary-100">
                                                    {prod.image && <img src={prod.image} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-secondary-900">{prod.name}</div>
                                                    <div className="text-xs text-secondary-500 font-mono">{prod.code}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-primary-50 border border-primary-100 p-4 rounded-xl relative">
                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        className="absolute top-2 right-2 p-1 text-primary-400 hover:text-primary-700"
                                    >
                                        <X size={16} />
                                    </button>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 overflow-hidden border border-primary-100">
                                            {selectedProduct.image && <img src={selectedProduct.image} className="w-full h-full object-cover" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-primary-900">{selectedProduct.name}</div>
                                            <div className="text-sm text-primary-700 font-mono">{selectedProduct.code}</div>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-primary-200">
                                        {selectedProduct.variants?.length > 0 ? (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-primary-700 uppercase tracking-wide">Select Variant:</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {selectedProduct.variants.map(v => (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => setSelectedVariant(v)}
                                                            className={`
                                                                text-left p-3 rounded-lg border transition-all flex items-start gap-3
                                                                ${selectedVariant?.id === v.id
                                                                    ? 'bg-primary-600 text-white border-primary-600 ring-2 ring-primary-300 ring-offset-1'
                                                                    : 'bg-white text-secondary-700 border-secondary-200 hover:border-primary-400 hover:shadow-sm'
                                                                }
                                                            `}
                                                        >
                                                            <div className={`w-12 h-12 bg-white rounded-lg border overflow-hidden flex-shrink-0 ${selectedVariant?.id === v.id ? 'border-primary-400' : 'border-secondary-100'}`}>
                                                                <img
                                                                    src={v.image_url || selectedProduct.image || '/placeholder.png'}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className={`font-bold font-mono text-sm mb-1 ${selectedVariant?.id === v.id ? 'text-white' : 'text-secondary-900'}`}>
                                                                    {v.sku || selectedProduct.code}
                                                                </div>
                                                                <div className={`flex items-center gap-3 text-xs flex-wrap ${selectedVariant?.id === v.id ? 'text-primary-100' : 'text-secondary-500'}`}>
                                                                    {v.size && (
                                                                        <span className="flex items-center gap-1">
                                                                            <BoxSelect size={12} /> {v.size}
                                                                        </span>
                                                                    )}
                                                                    {v.color && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Palette size={12} /> {v.color}
                                                                        </span>
                                                                    )}
                                                                    {v.crystal_color && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Diamond size={12} /> {v.crystal_color}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {(selectedProduct.description || selectedProduct.material) && (
                                                                    <div className={`text-[10px] mt-1 line-clamp-1 ${selectedVariant?.id === v.id ? 'text-primary-200' : 'text-secondary-400'}`}>
                                                                        {[selectedProduct.description, selectedProduct.material].filter(Boolean).join(' • ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-primary-600 italic">No variants available</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Scan LPN */}
                        <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-6 space-y-4 ${!selectedProduct ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <QrCode size={20} className="text-primary-600" />
                                2. Scan LPN Sticker
                            </h3>

                            <div className="p-6 bg-secondary-50 rounded-xl border-2 border-dashed border-secondary-300 text-center space-y-4">

                                {/* Box Count Selector */}
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <span className="text-sm font-medium text-secondary-700">Total Boxes in Set:</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (scannedLpns.length === 0) setBindBoxCount(Math.max(1, bindBoxCount - 1))
                                            }}
                                            disabled={scannedLpns.length > 0}
                                            className={`w-8 h-8 rounded-full border flex items-center justify-center ${scannedLpns.length > 0 ? 'bg-gray-100 text-gray-400' : 'border-secondary-200 hover:bg-white'}`}
                                        >
                                            -
                                        </button>
                                        <span className="w-8 text-center font-bold text-lg">{bindBoxCount}</span>
                                        <button
                                            onClick={() => setBindBoxCount(bindBoxCount + 1)}
                                            className="w-8 h-8 rounded-full border border-secondary-200 flex items-center justify-center hover:bg-white"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <p className="text-sm text-secondary-600">
                                    {bindBoxCount > 1
                                        ? `Scan LPN for Box ${scannedLpns.length + 1} of ${bindBoxCount}`
                                        : "Scan the QR Code on the box now"
                                    }
                                </p>

                                {/* Multi-Box Progress List */}
                                {bindBoxCount > 1 && (
                                    <div className="space-y-2 mb-2">
                                        {Array.from({ length: bindBoxCount }).map((_, idx) => {
                                            const isScanned = idx < scannedLpns.length
                                            const isCurrent = idx === scannedLpns.length
                                            return (
                                                <div key={idx} className={`flex items-center justify-between p-2 rounded-lg text-sm border ${isScanned ? 'bg-green-50 border-green-200 text-green-700' : isCurrent ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                    <span className="font-mono font-bold">Box {idx + 1}</span>
                                                    {isScanned ? (
                                                        <div className="flex items-center gap-2">
                                                            <span>{scannedLpns[idx]}</span>
                                                            <button onClick={() => removeScannedLpn(scannedLpns[idx])} className="p-1 hover:bg-green-100 rounded-full text-green-600"><X size={14} /></button>
                                                        </div>
                                                    ) : (
                                                        <span className="italic">{isCurrent ? 'Waiting for scan...' : 'Pending'}</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        ref={lpnInputRef}
                                        type="text"
                                        value={lpn}
                                        onChange={e => {
                                            setLpn(e.target.value)
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                if (bindBoxCount > 1) {
                                                    handleBoxScan(e.target.value)
                                                }
                                            }
                                        }}
                                        disabled={bindBoxCount > 1 && scannedLpns.length >= bindBoxCount}
                                        className="w-full px-4 py-2 text-center text-lg font-mono tracking-wider border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                                        placeholder={bindBoxCount > 1 && scannedLpns.length >= bindBoxCount ? "All Scanned" : "Scan LPN-XXXXXX"}
                                    />
                                    {bindBoxCount > 1 && scannedLpns.length < bindBoxCount && (
                                        <button
                                            onClick={() => handleBoxScan(lpn)}
                                            disabled={!lpn}
                                            className="px-4 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ArrowRight size={20} />
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => submitBinding(true)} // SWIFT BINDING
                                        disabled={
                                            isSubmitting ||
                                            (bindBoxCount === 1 && !lpn) ||
                                            (bindBoxCount > 1 && scannedLpns.length !== bindBoxCount)
                                        }
                                        className="flex-1 py-3 bg-secondary-900 text-white rounded-xl hover:bg-black disabled:bg-secondary-300 disabled:cursor-not-allowed transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                                    >
                                        <span className="font-bold flex items-center gap-1"><CheckCircle size={18} /> Finish Swiftly</span>
                                        <span className="text-[10px] opacity-70 uppercase font-bold tracking-wider">Save Only</span>
                                    </button>
                                    <button
                                        onClick={() => submitBinding(false)} // FULL BINDING
                                        disabled={
                                            isSubmitting ||
                                            !selectedProduct ||
                                            (selectedProduct?.variants?.length > 0 && !selectedVariant) ||
                                            (bindBoxCount === 1 && !lpn) ||
                                            (bindBoxCount > 1 && scannedLpns.length !== bindBoxCount)
                                        }
                                        className="flex-[1.5] py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed shadow-lg shadow-primary-100 transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5"
                                    >
                                        <span className="font-bold flex items-center gap-1">{isSubmitting ? 'Processing...' : 'Complete Binding'} <ArrowRight size={18} /></span>
                                        <span className="text-[10px] opacity-80 uppercase font-bold tracking-wider">Save & Print Label</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: Success */}
                {step === 3 && (
                    <div className="bg-green-50 rounded-xl border border-green-200 p-10 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-green-800">Item Bound Successfully!</h2>
                            <p className="text-green-700">
                                LPN: {bindBoxCount > 1 ? `${scannedLpns.length} Boxes` : lpn} linked to {selectedProduct?.code}
                                {lastBoundSetId && (
                                    <span className="ml-2 bg-green-200 text-green-800 px-2 py-0.5 rounded text-xs font-bold">SET: #{lastBoundSetId}</span>
                                )}
                            </p>
                        </div>

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={onPrintClick}
                                className="px-6 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-100 flex items-center gap-2 shadow-sm"
                            >
                                <Printer size={18} />
                                Re-print Product Label
                            </button>
                            <button
                                onClick={resetProcess}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm"
                            >
                                Process Next Item <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Print Preview Modal - MATCHING INVENTORY PAGE EXACTLY */}
                {itemToPrint && (
                    <PrintModal
                        itemToPrint={itemToPrint}
                        onClose={() => setItemToPrint(null)}
                    />
                )}
            </div>
        </AppLayout>
    )
}
