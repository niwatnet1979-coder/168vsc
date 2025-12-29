import React, { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
    X,
    Printer,
    BoxSelect,
    Palette,
    Diamond
} from 'lucide-react'

export default function PrintModal({ itemToPrint, onClose }) {
    // If lpnList exists, boxCount is fixed to its length
    const initialBoxCount = itemToPrint.lpnList ? itemToPrint.lpnList.length : 1
    const [boxCount, setBoxCount] = useState(initialBoxCount)
    const isFixedCount = !!itemToPrint.lpnList

    const productLabelRef = useRef(null)
    const handlePrintLabel = useReactToPrint({
        content: () => productLabelRef.current,
        documentTitle: `Label-${itemToPrint?.qr_code || 'Product'}`,
    })

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-[900px] flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-secondary-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h3 className="font-bold text-secondary-900">Print Label</h3>
                        <p className="text-secondary-500 text-xs">Set number of boxes/labels to print</p>
                    </div>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 bg-gray-100 overflow-auto flex-1 flex flex-col items-center">
                    {/* Controls */}
                    <div className="mb-4 flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm">
                        <span className="text-sm font-medium text-secondary-700">Number of Boxes:</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => !isFixedCount && setBoxCount(Math.max(1, boxCount - 1))}
                                disabled={isFixedCount}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center ${isFixedCount ? 'bg-gray-50 text-gray-300' : 'border-secondary-200 hover:bg-secondary-50'}`}
                            >
                                -
                            </button>
                            <span className="w-8 text-center font-bold">{boxCount}</span>
                            <button
                                onClick={() => !isFixedCount && setBoxCount(boxCount + 1)}
                                disabled={isFixedCount}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center ${isFixedCount ? 'bg-gray-50 text-gray-300' : 'border-secondary-200 hover:bg-secondary-50'}`}
                            >
                                +
                            </button>
                        </div>
                        {isFixedCount && (
                            <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                Fixed for Multi-Box Set
                            </span>
                        )}
                    </div>

                    {/* Paper Preview Container */}
                    <div className="overflow-auto max-w-full">
                        <div ref={productLabelRef} className="bg-white p-2">
                            <style type="text/css" media="print">
                                {`
                                @page { size: 6.5cm 5cm; margin: 0; }
                                body { -webkit-print-color-adjust: exact; }
                                .page-break { page-break-after: always; }
                                `}
                            </style>
                            {Array.from({ length: boxCount }).map((_, idx) => {
                                // For multi-box sets with distinct LPNs, use the LPN from the list
                                const currentLpn = itemToPrint.lpnList ? itemToPrint.lpnList[idx] : itemToPrint.qr_code;

                                return (
                                    <div
                                        key={idx}
                                        className="print-label bg-white border border-gray-100 mb-8 last:mb-0 shadow-sm mx-auto"
                                        style={{
                                            width: '6.5cm',
                                            height: '5.0cm',
                                            padding: '0.3cm',
                                            pageBreakAfter: 'always',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            position: 'relative',
                                            boxSizing: 'border-box'
                                        }}
                                    >
                                        {/* Label Content Header: Image and Basic Info */}
                                        <div className="flex gap-2 h-[1.8cm] overflow-hidden">
                                            <div className="w-[1.6cm] h-[1.6cm] border rounded overflow-hidden flex-shrink-0">
                                                <img
                                                    src={itemToPrint.variants?.image_url || itemToPrint.product?.image || '/placeholder.png'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/100x100?text=No+Image' }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-[11px] font-mono leading-tight break-all uppercase text-black">
                                                    {itemToPrint.variants?.sku || itemToPrint.product?.code || itemToPrint.product?.product_code}
                                                </div>
                                                <div className="text-[9px] text-gray-700 leading-tight mt-1 line-clamp-2">
                                                    {itemToPrint.product?.name}
                                                    {itemToPrint.product?.material && ` • ${itemToPrint.product.material}`}
                                                    {(itemToPrint.variants?.size || itemToPrint.variants?.color) && (
                                                        <span className="block text-[8px] text-gray-500 mt-1">
                                                            {[itemToPrint.variants?.size, itemToPrint.variants?.color, itemToPrint.variants?.crystal_color].filter(Boolean).join(' / ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Description Section */}
                                        {itemToPrint.product?.description && (
                                            <div className="mt-1 text-[7px] text-gray-500 leading-[1.1] line-clamp-2 h-[18px] border-t border-gray-50 pt-1">
                                                {itemToPrint.product.description}
                                            </div>
                                        )}

                                        {/* QR and Box X/Y Section */}
                                        <div className="mt-auto flex items-end justify-between border-t border-gray-100 pt-2">
                                            <div className="flex flex-col">
                                                <div className="w-[1.6cm] h-[1.6cm] bg-white border p-1 rounded">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentLpn}`}
                                                        alt="QR Code"
                                                        className="w-full h-full"
                                                    />
                                                </div>
                                                <div className="text-[7px] font-mono mt-1 font-bold text-black">
                                                    LPN: {currentLpn}
                                                    <div className="text-[6px] text-gray-400">DATE: {new Date().toLocaleDateString('th-TH')}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end">
                                                <div className="text-[14px] font-black italic text-gray-300 mb-1">168VSC</div>
                                                <div className="text-right">
                                                    {itemToPrint.set_id && (
                                                        <div className="text-[7px] font-bold text-gray-400 leading-none mb-1">SET REF: #{itemToPrint.set_id}</div>
                                                    )}
                                                    <span className="text-[18px] font-black leading-none block text-black">
                                                        {itemToPrint.lpnList ? (
                                                            `Box ${idx + 1}/${boxCount}`
                                                        ) : (itemToPrint.total_boxes > 1 ? (
                                                            `Box ${itemToPrint.box_number}/${itemToPrint.total_boxes}`
                                                        ) : (
                                                            boxCount > 1 ? `Box ${idx + 1}/${boxCount}` : '1 PCS'
                                                        ))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-secondary-100 flex justify-end gap-2 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-secondary-600 hover:bg-secondary-50 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePrintLabel}
                        className="px-4 py-2 bg-secondary-900 text-white rounded-lg hover:bg-secondary-800 flex items-center gap-2"
                    >
                        <Printer size={18} />
                        Print {boxCount} Label{boxCount > 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    )
}
