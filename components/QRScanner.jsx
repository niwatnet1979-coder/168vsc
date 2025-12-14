import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

export default function QRScanner({ onScan, onClose }) {
    const scannerRef = useRef(null)

    useEffect(() => {
        // Render scanner
        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true
            },
            /* verbose= */ false
        )

        scanner.render((decodedText) => {
            scanner.clear()
            onScan(decodedText)
        }, (error) => {
            // ignore errors during scanning
        })

        scannerRef.current = scanner

        return () => {
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear()
                } catch (e) {
                    console.error("Error clearing scanner", e)
                }
            }
        }
    }, [onScan])

    return (
        <div className="fixed inset-0 bg-black/80 z-[10001] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md overflow-hidden relative">
                <div className="p-4 border-b border-secondary-200 flex justify-between items-center">
                    <h3 className="font-bold text-secondary-900">Scan QR Code</h3>
                    <button onClick={onClose} className="text-secondary-500 hover:text-secondary-700">Cancel</button>
                </div>
                <div className="p-4">
                    <div id="reader" className="w-full"></div>
                    <p className="text-center text-sm text-secondary-500 mt-4">
                        Point camera at a QR code
                    </p>
                </div>
            </div>
        </div>
    )
}
