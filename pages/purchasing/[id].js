import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import AppLayout from '../../components/AppLayout'
import { DataManager } from '../../lib/dataManager'
import {
    ArrowLeft,
    Save,
    Calculator,
    Truck,
    DollarSign,
    Package,
    CheckCircle,
    Trash2
} from 'lucide-react'

export default function PurchaseOrderDetailPage() {
    const router = useRouter()
    const { id } = router.query
    const [po, setPo] = useState(null)
    const [items, setItems] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Cost States
    const [costs, setCosts] = useState({
        shipping_origin: 0,
        shipping_intl: 0,
        duty_tax: 0,
        clearing_fee: 0,
        fines_charges: 0,
        shipping_destination: 0
    })

    useEffect(() => {
        if (id) loadPoData()
    }, [id])

    const loadPoData = async () => {
        setIsLoading(true)
        // ideally: DataManager.getPurchaseOrderById(id) which fetches PO + Items
        // For now simulating or adding that method
        const data = await DataManager.getPurchaseOrderById(id)
        if (data) {
            setPo(data)
            setItems(data.items || [])
            setCosts({
                shipping_origin: data.shipping_origin || 0,
                shipping_intl: data.shipping_intl || 0,
                duty_tax: data.duty_tax || 0,
                clearing_fee: data.clearing_fee || 0,
                fines_charges: data.fines_charges || 0,
                shipping_destination: data.shipping_destination || 0
            })
        }
        setIsLoading(false)
    }

    const handleCostChange = (field, value) => {
        setCosts(prev => ({
            ...prev,
            [field]: parseFloat(value) || 0
        }))
    }

    const calculateTotals = () => {
        const productTotal = po?.product_cost_total || 0
        const extraCostTotal = Object.values(costs).reduce((a, b) => a + b, 0)
        const landedTotal = productTotal + extraCostTotal
        return { productTotal, extraCostTotal, landedTotal }
    }

    const { productTotal, extraCostTotal, landedTotal } = calculateTotals()

    const handleSaveCosts = async () => {
        setIsSaving(true)
        try {
            await DataManager.updatePurchaseOrderCosts(id, {
                ...costs,
                total_landed_cost: landedTotal
            })
            // Reload to confirm update
            await loadPoData()
            alert('Costs updated successfully!')
        } catch (error) {
            console.error(error)
            alert('Failed to update costs')
        } finally {
            setIsSaving(false)
        }
    }



    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this Purchase Order? This action cannot be undone.')) return

        setIsSaving(true)
        try {
            const success = await DataManager.deletePurchaseOrder(id)
            if (success) {
                router.push('/purchasing')
            } else {
                throw new Error('Delete failed')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to delete PO')
            setIsSaving(false)
        }
    }

    if (isLoading) return <div className="p-10 text-center">Loading PO...</div>
    if (!po) return <div className="p-10 text-center">PO not found</div>

    return (
        <AppLayout>
            <Head>
                <title>PO #{id.substring(0, 8)} - 168VSC</title>
            </Head>

            <div className="space-y-6 max-w-5xl mx-auto pb-20">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} className="text-secondary-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            PO #{id.substring(0, 8)}
                            <span className={`text-sm font-normal px-2 py-0.5 rounded-full ${po.status === 'received' ? 'bg-green-100 text-green-700' :
                                po.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                    'bg-secondary-100 text-secondary-500'
                                }`}>
                                {po.status.toUpperCase()}
                            </span>
                        </h1>
                        <p className="text-secondary-500">{po.supplier_name} • {new Date(po.created_at).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Col: Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                            <div className="p-4 bg-secondary-50 border-b border-secondary-200 font-semibold flex justify-between">
                                <span>items ({items.length})</span>
                                <span>Product Cost: ฿{productTotal.toLocaleString()}</span>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white text-secondary-500 border-b border-secondary-100">
                                    <tr>
                                        <th className="px-4 py-2">Product</th>
                                        <th className="px-4 py-2 text-right">Qty</th>
                                        <th className="px-4 py-2 text-right">Unit Price</th>
                                        <th className="px-4 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-secondary-900">{item.product?.name}</div>
                                                <div className="text-xs text-secondary-500 font-mono">{item.product?.code}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right">฿{item.unit_price.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">฿{item.total_price.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Col: Landed Cost Calculator */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-secondary-900">
                                <Calculator className="text-primary-600" size={20} />
                                Landed Cost Breakdown
                            </h3>

                            <div className="space-y-4">
                                <div className="p-3 bg-secondary-50 rounded-lg flex justify-between items-center">
                                    <span className="text-secondary-600 text-sm">Product Subtotal</span>
                                    <span className="font-bold text-secondary-900">฿{productTotal.toLocaleString()}</span>
                                </div>

                                <div className="space-y-3">
                                    <CostInput label="Shipping (Origin)" value={costs.shipping_origin} onChange={v => handleCostChange('shipping_origin', v)} />
                                    <CostInput label="Shipping (International)" value={costs.shipping_intl} onChange={v => handleCostChange('shipping_intl', v)} icon={<Truck size={14} />} />
                                    <CostInput label="Duty & Tax" value={costs.duty_tax} onChange={v => handleCostChange('duty_tax', v)} />
                                    <CostInput label="Clearing Fee" value={costs.clearing_fee} onChange={v => handleCostChange('clearing_fee', v)} />
                                    <CostInput label="Fines / Charges" value={costs.fines_charges} onChange={v => handleCostChange('fines_charges', v)} />
                                    <CostInput label="Shipping (Destination)" value={costs.shipping_destination} onChange={v => handleCostChange('shipping_destination', v)} />
                                </div>

                                <div className="pt-4 border-t border-secondary-200">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-secondary-600 text-sm">Total Extra Costs</span>
                                        <span className="text-danger-600 font-medium">+฿{extraCostTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-lg">
                                        <span className="font-bold text-secondary-900">Total Landed Cost</span>
                                        <span className="font-bold text-primary-700">฿{landedTotal.toLocaleString()}</span>
                                    </div>
                                    <p className="text-xs text-right text-secondary-400 mt-1">
                                        (Avg Cost Increase: {productTotal > 0 ? ((extraCostTotal / productTotal) * 100).toFixed(1) : 0}%)
                                    </p>
                                </div>

                                <button
                                    onClick={handleSaveCosts}
                                    disabled={isSaving}
                                    className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Cost Settings
                                </button>
                            </div>
                        </div>



                        {po.status === 'received' && (
                            <div className="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
                                <div className="flex justify-center mb-2">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>
                                <h3 className="font-bold text-green-800">Received & Stocked</h3>
                                <p className="text-sm text-green-700 mt-1">
                                    All items have been added to inventory and QR codes generated.
                                </p>
                            </div>
                        )}
                        {/* Delete Action */}
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                            <button
                                onClick={handleDelete}
                                disabled={isSaving}
                                className="w-full py-2 border border-danger-200 text-danger-600 rounded-lg hover:bg-danger-50 font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Trash2 size={18} />
                                Delete Purchase Order
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}

function CostInput({ label, value, onChange, icon }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 text-sm text-secondary-600 flex items-center gap-1">
                {icon}
                {label}
            </div>
            <div className="relative w-28">
                <span className="absolute left-2 top-1.5 text-secondary-400 text-xs">฿</span>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full pl-6 pr-2 py-1 text-right text-sm border border-secondary-300 rounded focus:outline-none focus:border-primary-500"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={e => e.target.select()}
                />
            </div>
        </div>
    )
}
