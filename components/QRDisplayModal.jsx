import React, { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { X, Printer, Copy } from 'lucide-react'

export default function QRDisplayModal({ isOpen, onClose, qrCode, productName, lotNumber }) {
    if (!isOpen) return null

    const handlePrint = () => {
        const printWindow = window.open('', '_blank')
        const canvas = document.getElementById('qr-canvas')
        const imgUrl = canvas.toDataURL('image/png')

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print QR - ${qrCode}</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                            font-family: sans-serif;
                        }
                        .container {
                            text-align: center;
                            border: 1px dashed #ccc;
                            padding: 20px;
                            border-radius: 8px;
                        }
                        img {
                            max-width: 200px;
                            height: auto;
                        }
                        .code {
                            font-size: 14px;
                            font-weight: bold;
                            margin-top: 10px;
                        }
                        .name {
                            font-size: 12px;
                            margin-top: 5px;
                            color: #555;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <img src="${imgUrl}" />
                        <div class="code">${qrCode}</div>
                        <div class="name">${productName}</div>
                        ${lotNumber ? `<div class="name">Lot: ${lotNumber}</div>` : ''}
                    </div>
                </body>
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
        navigator.clipboard.writeText(qrCode)
        alert('Copied specific QR Code to clipboard')
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

                <div className="p-8 flex flex-col items-center justify-center space-y-4">
                    <div className="bg-white p-4 border border-secondary-200 rounded-lg shadow-sm">
                        <QRCodeCanvas
                            id="qr-canvas"
                            value={qrCode}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                        />
                    </div>
                    <div className="text-center">
                        <p className="font-mono font-bold text-lg text-secondary-900">{qrCode}</p>
                        <p className="text-sm text-secondary-600 mt-1 font-medium">{productName}</p>
                        {lotNumber && <p className="text-xs text-secondary-400 font-mono mt-0.5">Lot: {lotNumber}</p>}
                    </div>
                </div>

                <div className="p-4 border-t border-secondary-100 flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex-1 px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium flex items-center justify-center gap-2"
                    >
                        <Copy size={18} />
                        Copy Text
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                    >
                        <Printer size={18} />
                        Print
                    </button>
                </div>
            </div>
        </div>
    )
}
