import React, { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { X, Printer, Copy } from 'lucide-react'

export default function QRDisplayModal({ isOpen, onClose, qrCode, productName, lotNumber, boxCount = 1, boxes = [] }) {
    const [selectedBoxIndex, setSelectedBoxIndex] = React.useState(0)

    if (!isOpen) return null

    // Determine QRs to display
    // If boxes data exists, use it. Otherwise fallback to generation loop (legacy/fallback)
    const qrList = []
    if (boxes && boxes.length > 0) {
        // Sort boxes by box_number
        const sortedBoxes = [...boxes].sort((a, b) => (a.box_number || 0) - (b.box_number || 0))
        sortedBoxes.forEach(box => {
            qrList.push({
                qr: box.qr_code,
                label: `Box ${box.box_number}/${box.total_boxes}`,
                lot: box.lot_number || lotNumber // specific or inherited
            })
        })
    } else {
        // Fallback or Single Item
        const loops = boxCount > 0 ? boxCount : 1
        for (let i = 1; i <= loops; i++) {
            qrList.push({
                qr: boxCount > 1 ? `${qrCode}-BOX-${i}` : qrCode,
                label: boxCount > 1 ? `Box ${i}/${loops}` : 'Item',
                lot: lotNumber
            })
        }
    }

    const currentDisplay = qrList[selectedBoxIndex] || qrList[0]

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')

        let content = ''
        const loops = qrList.length

        qrList.forEach((item, index) => {
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.qr)}`

            content += `
                <div class="container" style="${index < loops - 1 ? 'page-break-after: always;' : ''}">
                    <img src="${qrSrc}" />
                    <div class="code">${item.qr}</div>
                    <div class="name">${productName}</div>
                    ${item.lot ? `<div class="name">Lot: ${item.lot}</div>` : ''}
                    ${loops > 1 ? `<div class="box-info">${item.label}</div>` : ''}
                </div>
            `
        })

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR - ${qrCode}</title>
                    <style>
                        body { margin: 0; font-family: sans-serif; }
                        .container {
                            display: flex; flex-direction: column; align-items: center; justify-content: center;
                            height: 100vh; text-align: center; padding: 20px; box-sizing: border-box;
                        }
                        img { max-width: 200px; height: auto; }
                        .code { font-size: 14px; font-weight: bold; margin-top: 10px; }
                        .name { font-size: 12px; margin-top: 5px; color: #555; }
                        .box-info {
                            font-size: 12px; font-weight: bold; margin-top: 5px;
                            padding: 2px 8px; background: #eee; border-radius: 4px;
                        }
                        @media print { @page { size: auto; margin: 0mm; } }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(currentDisplay.qr)
        alert(`Copied ${currentDisplay.qr} to clipboard`)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-secondary-100 flex items-center justify-between bg-secondary-50">
                    <h3 className="text-lg font-bold text-secondary-900">QR Code Label</h3>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center justify-center space-y-4">
                    {/* Tabs if multiple */}
                    {qrList.length > 1 && (
                        <div className="flex gap-2 mb-2 w-full overflow-x-auto pb-2 justify-center">
                            {qrList.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedBoxIndex(idx)}
                                    className={`px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-colors ${selectedBoxIndex === idx
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-secondary-600 border-secondary-200 hover:bg-secondary-50'
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="bg-white p-4 border border-secondary-200 rounded-lg shadow-sm">
                        <QRCodeCanvas
                            id="qr-canvas"
                            value={currentDisplay.qr}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                        />
                    </div>
                    <div className="text-center">
                        <p className="font-mono font-bold text-lg text-secondary-900">{currentDisplay.qr}</p>
                        <p className="text-sm text-secondary-600 mt-1 font-medium">{productName}</p>
                        {currentDisplay.lot && <p className="text-xs text-secondary-400 font-mono mt-0.5">Lot: {currentDisplay.lot}</p>}
                        {qrList.length > 1 && (
                            <span className="inline-block mt-2 text-xs font-bold bg-secondary-100 text-secondary-700 px-2 py-1 rounded">
                                {currentDisplay.label}
                            </span>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-secondary-100 flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium flex items-center justify-center gap-2"
                    >
                        <Copy size={18} />
                        Copy QR
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                    >
                        <Printer size={18} />
                        Print All ({qrList.length})
                    </button>
                </div>
            </div>
        </div>
    )
}
