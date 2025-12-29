import { useState, useRef } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { useLanguage } from '../contexts/LanguageContext'
import {
    Printer,
    RefreshCw,
    QrCode
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useReactToPrint } from 'react-to-print'

export default function LPNManagerPage() {
    const { t } = useLanguage()
    const [batchSize, setBatchSize] = useState(20)
    const [prefix, setPrefix] = useState('LPN')
    const [generatedCodes, setGeneratedCodes] = useState([])
    const [isGenerating, setIsGenerating] = useState(false)
    const printRef = useRef()

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `LPN-Batch-${new Date().toISOString().slice(0, 10)}`,
        pageStyle: `
            @page { size: auto; margin: 0; }
            @media print {
                body { -webkit-print-color-adjust: exact; }
            }
        `
    })

    const generateCodes = () => {
        setIsGenerating(true)
        const codes = []
        // Format: LPN-YYMMDD-XXXX (4 random chars)
        const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '') // 251230

        for (let i = 0; i < batchSize; i++) {
            const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
            codes.push(`${prefix}-${datePart}-${randomPart}`)
        }
        setGeneratedCodes(codes)
        setIsGenerating(false)
    }

    return (
        <AppLayout>
            <Head>
                <title>LPN Manager (Print QR) - 168VSC</title>
            </Head>

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                        <QrCode className="text-primary-600" />
                        LPN Manager (QR Generator)
                    </h1>
                    <p className="text-secondary-500">
                        {t('Generate and Print empty QR codes for Inbound')}
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">Prefix</label>
                            <input
                                type="text"
                                value={prefix}
                                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono"
                                placeholder="LPN"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">Quantity</label>
                            <input
                                type="number"
                                value={batchSize}
                                onChange={(e) => setBatchSize(Number(e.target.value))}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                min="1"
                                max="1000"
                            />
                        </div>
                        <div>
                            <button
                                onClick={generateCodes}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary-900 text-white rounded-lg hover:bg-secondary-800 transition-colors"
                            >
                                <RefreshCw size={18} className={isGenerating ? 'animate-spin' : ''} />
                                Generate Batch
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview & Print */}
                {generatedCodes.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-secondary-900">
                                Batch Preview ({generatedCodes.length})
                            </h2>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                            >
                                <Printer size={20} />
                                Print Labels
                            </button>
                        </div>

                        {/* Print Container (Hidden from Screen technically, but we show preview) */}
                        <div className="bg-secondary-100 p-8 rounded-xl overflow-auto max-h-[600px] border border-secondary-200">
                            <div ref={printRef} className="bg-white p-4 max-w-[21cm] mx-auto min-h-[29.7cm] shadow-lg grid grid-cols-4 gap-4 content-start">
                                {/* Print CSS: Adjust for Sticker Sheet (e.g., A4 4x10 or Thermal Roll) 
                                    For MVP, we use a simple grid that should work on A4 */}
                                {generatedCodes.map((code, idx) => (
                                    <div key={idx} className="border border-gray-200 p-2 rounded flex flex-col items-center justify-center gap-1 aspect-square">
                                        <QRCodeCanvas value={code} size={80} level="M" />
                                        <span className="font-mono text-[10px] font-bold text-black">{code}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
