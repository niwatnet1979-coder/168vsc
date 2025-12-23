import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { DataManager } from '../../lib/dataManager'
import { Printer } from 'lucide-react'

export default function EnvelopePage() {
    const router = useRouter()
    const { orderId } = router.query
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState(null)
    const [size, setSize] = useState('DL') // DL, C5, C4
    const [sender, setSender] = useState({
        name: 'บริษัท 168 ไลท์ติ้ง แอนด์ เบดดิ้ง จำกัด',
        address: 'เลขที่ 168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 \nตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
        phone: '084-282-9465'
    })

    useEffect(() => {
        if (!router.isReady) return
        loadData()
    }, [router.isReady, orderId])

    const loadData = async () => {
        try {
            setLoading(true)

            // 1. Load Global Settings (Company Info)
            // 1. Load Global Settings (Company Info)
            const settings = await DataManager.getSettings()
            if (settings) {
                setSender({
                    name: settings.shopName || sender.name,
                    address: settings.shopAddress || sender.address,
                    phone: settings.shopPhone || sender.phone
                })
            }

            // 2. Load Order Data
            if (orderId) {
                const order = await DataManager.getOrderById(orderId)
                if (order) {
                    processOrderData(order)
                }
            } else {
                // Fallback / Demo data if needed
            }
        } catch (error) {
            console.error("Error loading envelope data:", error)
        } finally {
            setLoading(false)
        }
    }

    const processOrderData = (order) => {
        // Priority: Tax Invoice Address -> Receiver Contact -> Customer Address
        // User Request: "Use Tax Invoice Info if available"

        let receiverName = order.customer
        let receiverAddress = order.address
        let receiverPhone = order.phone

        // Try to use "Document Contact" (ผู้ติดต่อรับเอกสาร) if available
        if (order.receiverContact && order.receiverContact.name) {
            receiverName = order.receiverContact.name
            receiverPhone = order.receiverContact.phone || receiverPhone
        }

        // Try to use "Tax Invoice Address" (ที่อยู่จัดส่งใบกำกับภาษี) if available
        if (order.taxInvoiceDeliveryAddress && order.taxInvoiceDeliveryAddress.address) {
            const taxAddr = order.taxInvoiceDeliveryAddress
            // Construct address from components if needed, or use full string
            let fullAddr = taxAddr.address
            if (taxAddr.subdistrict) fullAddr += ` ت. ${taxAddr.subdistrict}` // Typo fix later
            if (taxAddr.district) fullAddr += ` อ. ${taxAddr.district}`
            if (taxAddr.province) fullAddr += ` จ. ${taxAddr.province}`
            if (taxAddr.zipcode) fullAddr += ` ${taxAddr.zipcode}`

            // If taxInvoiceDeliveryAddress is an object with 'address' field possibly being the full string
            // In DataManager, it maps finalDeliveryAddress.
            // Let's assume order.taxInvoiceDeliveryAddress is the object structure we use in ContactSelector
            receiverAddress = fullAddr || order.taxInvoiceDeliveryAddress.address || receiverAddress
        } else if (order.taxInvoice && order.taxInvoice.address) {
            // Fallback to Tax Invoice Billing Address
            receiverAddress = order.taxInvoice.address
            if (order.taxInvoice.name) receiverName = order.taxInvoice.name // Corp name?
        }

        setData({
            receiver: {
                name: receiverName,
                address: receiverAddress,
                phone: receiverPhone
            }
        })
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>

    const getDimensions = () => {
        switch (size) {
            case 'C5': return { width: '229mm', height: '162mm' }
            case 'C4': return { width: '324mm', height: '229mm' }
            case 'DL': default: return { width: '220mm', height: '110mm' }
        }
    }

    const dims = getDimensions()

    return (
        <div className="min-h-screen bg-gray-100 print:bg-white font-sans">
            <Head>
                <title>Print Envelope</title>
            </Head>

            {/* Controls */}
            <div className="print:hidden bg-white border-b p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-gray-800">Print Envelope</h1>
                        <select
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                            className="border rounded px-3 py-1 text-sm bg-gray-50"
                        >
                            <option value="DL">DL (110 x 220 mm)</option>
                            <option value="C5">C5 (162 x 229 mm) - A5/A4 Folded</option>
                            <option value="C4">C4 (229 x 324 mm) - A4 Full</option>
                        </select>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Printer size={18} /> Print
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="p-8 flex justify-center print:p-0">
                <div
                    className="bg-white shadow-lg relative print:shadow-none print:m-0"
                    style={{
                        width: dims.width,
                        height: dims.height,
                        padding: '20mm',
                        overflow: 'hidden',
                        backgroundColor: 'white'
                    }}
                >
                    {/* Sender (Top Left) */}
                    <div className="absolute top-8 left-10 text-xs text-gray-600" style={{ maxWidth: '40%' }}>
                        <div className="font-bold text-sm text-gray-900 mb-1">กรุณาส่ง (From)</div>
                        <div className="font-bold text-gray-800">{sender.name}</div>
                        <div className="whitespace-pre-wrap">{sender.address}</div>
                        <div className="mt-1">Tel: {sender.phone}</div>
                    </div>

                    {/* Receiver (Center / Bottom Right) */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 translate-x-[-10%] w-[60%] p-6 border rounded border-gray-100">
                        <div className="font-bold text-sm text-gray-900 mb-2">กรุณาส่ง (To)</div>
                        <div className="text-lg font-bold text-black mb-1">{data?.receiver?.name || 'Customer Name'}</div>
                        <div className="text-base text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {data?.receiver?.address || 'Address Line 1...'}
                        </div>
                        {data?.receiver?.phone && (
                            <div className="mt-4 font-bold text-gray-800">Tel: {data.receiver.phone}</div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @page {
                    size: ${size === 'DL' ? '220mm 110mm' : size === 'C5' ? '229mm 162mm' : '324mm 229mm'};
                    margin: 0;
                }
                body {
                    margin: 0;
                    padding: 0;
                    background: white;
                }
            `}</style>
        </div>
    )
}
