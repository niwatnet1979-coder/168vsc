import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { DataManager } from '../../lib/dataManager'
import DocumentTemplate from '../../components/print/DocumentTemplate'
import { Printer, AlertCircle } from 'lucide-react'

export default function DocumentPrintPage() {
    const router = useRouter()
    const { orderId, paymentId, type } = router.query
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)
    const [settings, setSettings] = useState(null)
    const [showItems, setShowItems] = useState(false)

    useEffect(() => {
        if (!router.isReady) return

        const fetchData = async () => {
            try {
                if (!orderId || !paymentId) {
                    throw new Error('Missing parameters: orderId or paymentId')
                }

                // 1. Fetch Order Data
                const order = await DataManager.getOrderById(orderId)
                if (!order) throw new Error('Order not found')

                // 2. Find Payment
                const payment = (order.paymentSchedule || []).find(p => p.id === paymentId)
                // Fallback: If IDs don't match (e.g. legacy data without IDs in old arrays), try index if passed, but prefer ID specific logic
                // For now, strict ID check.

                if (!payment) throw new Error('Payment record not found')

                // 3. Fetch Settings for Company Info
                // Assuming DataManager has a way to get settings, or use hardcoded for now if not available in public API
                // Currently DataManager.saveSettings exists, but getSettings might need check.
                // Checking DataManager manually: it has getProductOptions (system_options), but maybe not full settings?
                // Let's check getOrderById implementation again... it doesn't return settings.
                // We'll trust the component to fallback to defaults or fetch if possible.
                // Actually, let's try to fetch settings if the method exists, otherwise null.

                // Mock or Fetch settings if available
                // const settings = await DataManager.getSettings?.() 

                setData({ order, payment, customer: order.customer })
            } catch (err) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router.isReady, orderId, paymentId])

    if (loading) return <div className="p-8 text-center text-gray-500">Loading document...</div>
    if (error) return (
        <div className="p-8 text-center text-red-500 flex flex-col items-center gap-2">
            <AlertCircle size={48} />
            <p className="text-lg font-bold">Error loading document</p>
            <p>{error}</p>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
            <Head>
                <title>{type === 'IV' ? 'Tax Invoice' : 'Receipt'} - {data.payment.invoiceNo || data.payment.receiptNo}</title>
            </Head>

            {/* Print Controls (Hidden on print) */}
            <div className="print:hidden bg-white border-b border-gray-200 p-4 shadow-sm mb-8 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="font-bold text-gray-800 flex items-center gap-4">
                        Print Preview: {type === 'IV' ? 'Tax Invoice' : 'Receipt'}

                        <label className="flex items-center gap-2 text-sm font-normal text-gray-600 bg-gray-50 px-3 py-1 rounded cursor-pointer hover:bg-gray-100 border border-gray-200">
                            <input
                                type="checkbox"
                                checked={showItems}
                                onChange={(e) => setShowItems(e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            Show Reference Items
                        </label>
                    </h1>
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                        <Printer size={18} />
                        Print / Save as PDF
                    </button>
                </div>
            </div>

            {/* Document Render */}
            <div className="pb-12 print:pb-0">
                <DocumentTemplate
                    type={type || 'RC'} // Default to Receipt
                    order={data.order}
                    payment={data.payment}
                    customer={data.customer}
                    settings={settings}
                    showItems={showItems}
                />
            </div>
        </div>
    )
}
