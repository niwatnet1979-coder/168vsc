import { useState, useEffect } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import { supabase } from '../lib/supabaseClient'
import {
    Truck,
    Plus,
    Calendar,
    Search,
    FileText,
    CheckCircle,
    User,
    MapPin,
    Package,
    X,
    Trash2
} from 'lucide-react'
import { showConfirm, showSuccess, showError } from '../lib/sweetAlert'

export default function ShippingPage() {
    const [plans, setPlans] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState(null)

    useEffect(() => {
        loadPlans()
    }, [])

    const loadPlans = async () => {
        setIsLoading(true)
        // Fetch plans with item count
        const { data, error } = await supabase
            .from('shipping_plans')
            .select(`
                *,
                items:shipping_plan_items(count)
            `)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setPlans(data)
        }
        setIsLoading(false)
    }

    const deletePlan = async (id) => {
        const result = await showConfirm({
            title: 'Delete Shipping Plan?',
            text: 'Are you sure you want to delete this shipping plan? This cannot be undone.',
            confirmButtonText: 'Delete',
            confirmButtonColor: '#d33'
        })
        if (!result.isConfirmed) return

        setIsLoading(true)
        // Delete items first
        try {
            await supabase.from('shipping_plan_items').delete().eq('shipping_plan_id', id)
            const { error } = await supabase.from('shipping_plans').delete().eq('id', id)

            if (error) throw error

            await showSuccess({ title: 'Deleted', text: 'Shipping plan deleted successfully' })
            loadPlans()
        } catch (error) {
            showError({ text: 'Error deleting plan: ' + error.message })
            setIsLoading(false)
        }
    }

    return (
        <AppLayout>
            <Head>
                <title>Shipping Management - 168VSC</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            <Truck className="text-primary-600" />
                            Shipping Management
                        </h1>
                        <p className="text-secondary-500 text-sm">Manage daily shipments and courier plans</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        New Shipping Plan
                    </button>
                </div>

                {/* Plans Grid */}
                {isLoading ? (
                    <div className="text-center py-12 text-secondary-500">Loading plans...</div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-secondary-200 shadow-sm">
                        <Truck size={48} className="mx-auto text-secondary-300 mb-4" />
                        <h3 className="text-lg font-medium text-secondary-900">No Shipping Plans</h3>
                        <p className="text-secondary-500">Create a new plan to start organizing deliveries.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map(plan => (
                            <div key={plan.id} className="relative bg-white rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                                            <Truck size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-secondary-900">{plan.courier || 'Unknown Courier'}</h4>
                                            <span className="text-xs text-secondary-500 font-mono">
                                                {new Date(plan.plan_date).toLocaleDateString('th-TH')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold
                                            ${plan.status === 'completed' ? 'bg-success-100 text-success-700' :
                                                plan.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-secondary-100 text-secondary-600'}`}>
                                            {plan.status.toUpperCase()}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deletePlan(plan.id)
                                            }}
                                            className="p-1 text-secondary-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            title="Delete Plan"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-secondary-600 mb-4">
                                    {plan.driver_name && (
                                        <div className="flex items-center gap-2">
                                            <User size={14} /> <span>Driver: {plan.driver_name}</span>
                                        </div>
                                    )}
                                    {plan.license_plate && (
                                        <div className="flex items-center gap-2">
                                            <Truck size={14} /> <span>Plate: {plan.license_plate}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Package size={14} />
                                        <span>Items: <b>{plan.items?.[0]?.count || 0} Orders</b></span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedPlan(plan)}
                                    className="w-full py-2 border border-secondary-200 rounded-lg text-secondary-600 hover:bg-secondary-50 font-medium transition-colors"
                                >
                                    Manage Items
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {
                showCreateModal && (
                    <CreatePlanModal
                        onClose={() => setShowCreateModal(false)}
                        onSave={async (formData) => {
                            const { error } = await supabase.from('shipping_plans').insert([{
                                courier: formData.courier,
                                driver_name: formData.driver_name,
                                license_plate: formData.license_plate,
                                plan_date: new Date().toISOString(),
                                status: 'draft'
                            }])
                            if (error) showError({ text: 'Error creating plan' })
                            else {
                                showSuccess({ title: 'Created', text: 'Shipping plan created' })
                                loadPlans()
                                setShowCreateModal(false)
                            }
                        }}
                    />
                )
            }

            {/* Manage Modal */}
            {
                selectedPlan && (
                    <ManagePlanModal
                        plan={selectedPlan}
                        onClose={() => setSelectedPlan(null)}
                        onUpdate={loadPlans}
                        onDelete={() => {
                            deletePlan(selectedPlan.id)
                            setSelectedPlan(null)
                        }}
                    />
                )
            }
        </AppLayout >
    )
}

function ManagePlanModal({ plan, onClose, onUpdate, onDelete }) {
    const [items, setItems] = useState([])
    const [availableInventory, setAvailableInventory] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [selectedInventoryId, setSelectedInventoryId] = useState('')

    useEffect(() => {
        loadItems()
        loadInventory()
    }, [plan])

    const loadItems = async () => {
        // Fetch shipping plan items with linked inventory details
        const { data } = await supabase
            .from('shipping_plan_items')
            .select(`
                *,
                inventory_item:inventory_items (
                    id,
                    qr_code,
                    box_count,
                    status,
                    product:products(name, product_code),
                    variants:product_variants!variant_id(sku, color, size)
                ),
                order:orders(id, customer:customers(name))
            `)
            .eq('shipping_plan_id', plan.id)
        setItems(data || [])
    }

    const loadInventory = async () => {
        const inventory = await DataManager.getInventoryItemsForShipping()
        setAvailableInventory(inventory)
    }

    const addItem = async (e) => {
        e.preventDefault()
        if (!selectedInventoryId) return
        setIsAdding(true)

        try {
            // Find selected inventory item
            const invItem = availableInventory.find(i => i.id === selectedInventoryId)

            // Insert into shipping_plan_items
            const { error } = await supabase.from('shipping_plan_items').insert({
                shipping_plan_id: plan.id,
                inventory_item_id: selectedInventoryId,
                status: 'pending'
                // We might also link order_id here if the inventory item is reserved for an order?
                // For now, let's assume we link primarily via inventory_item_id
            })

            if (error) throw error

            // Update Inventory Status to 'shipping' or similar?
            // Or just keep it as 'in_stock' until actually shipped?
            // Let's keep it simple: Link created. Status change happens on 'Ship' action.

            setSelectedInventoryId('')
            loadItems()
            onUpdate() // Update parent list counts
        } catch (error) {
            showError({ text: 'Error adding item: ' + error.message })
        } finally {
            setIsAdding(false)
        }
    }

    // Filter inventory based on search
    const filteredInventory = availableInventory.filter(item => {
        const term = searchTerm.toLowerCase()
        const name = item.product?.name?.toLowerCase() || ''
        const code = item.product?.product_code?.toLowerCase() || ''
        const sku = item.variants?.sku?.toLowerCase() || ''
        const qr = item.qr_code?.toLowerCase() || ''
        return name.includes(term) || code.includes(term) || sku.includes(term) || qr.includes(term)
    })

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-primary-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-primary-900">{plan.courier} Plan</h2>
                        <span className="text-xs text-primary-600">{new Date(plan.plan_date).toLocaleDateString()}</span>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-secondary-400" /></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Current Items in Plan */}
                    <div className="w-1/2 border-r p-6 overflow-y-auto bg-secondary-50/30">
                        <h3 className="font-bold text-secondary-800 mb-4 flex items-center gap-2">
                            <Package size={18} />
                            Shipment Items ({items.length})
                        </h3>

                        {items.length === 0 ? (
                            <div className="text-center p-8 border-2 border-dashed border-secondary-200 rounded-lg text-secondary-500">
                                No items added yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map(item => {
                                    const inv = item.inventory_item
                                    const productName = inv?.product?.name || 'Unknown Item'
                                    const variantStr = inv?.variants
                                        ? `${inv.variants.sku} ${inv.variants.color || ''} ${inv.variants.size || ''}`
                                        : ''

                                    return (
                                        <div key={item.id} className="bg-white p-3 border border-secondary-200 rounded-lg shadow-sm flex justify-between items-start group">
                                            <div>
                                                <div className="font-bold text-secondary-900 line-clamp-1">{productName}</div>
                                                <div className="text-xs text-secondary-500 mb-1">{variantStr}</div>
                                                <div className="flex gap-2">
                                                    <span className="text-[10px] bg-secondary-100 px-1.5 py-0.5 rounded text-secondary-600 font-mono">
                                                        {inv?.qr_code || 'No QR'}
                                                    </span>
                                                    {item.status && (
                                                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const result = await showConfirm({
                                                        title: 'Remove Item?',
                                                        text: 'Remove this item from the shipping plan?',
                                                        confirmButtonText: 'Remove',
                                                        confirmButtonColor: '#d33'
                                                    })
                                                    if (!result.isConfirmed) return

                                                    await supabase.from('shipping_plan_items').delete().eq('id', item.id)
                                                    loadItems()
                                                    onUpdate()
                                                }}
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right: Add Inventory */}
                    <div className="w-1/2 p-6 overflow-y-auto flex flex-col">
                        <h3 className="font-bold text-secondary-800 mb-4 flex items-center gap-2">
                            <Search size={18} />
                            Add from Inventory
                        </h3>

                        {/* Search */}
                        <div className="mb-4 relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search Name, SKU, QR..."
                                className="w-full pl-9 pr-4 py-2 border border-secondary-300 rounded-lg text-sm"
                            />
                            <Search size={16} className="absolute left-3 top-2.5 text-secondary-400" />
                        </div>

                        {/* Inventory List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {filteredInventory.length === 0 ? (
                                <div className="text-center py-8 text-secondary-400 text-sm">
                                    No available inventory found.
                                </div>
                            ) : (
                                filteredInventory.map(inv => {
                                    const isAlreadyAdded = items.some(i => i.inventory_item_id === inv.id)
                                    if (isAlreadyAdded) return null // Hide already added items

                                    const productName = inv.product?.name || 'Unknown'
                                    return (
                                        <div key={inv.id} className="p-3 border border-secondary-200 rounded-lg hover:border-primary-300 transition-colors flex justify-between items-center bg-white">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <div className="font-medium text-sm text-secondary-900 truncate">{productName}</div>
                                                <div className="text-xs text-secondary-500 truncate">
                                                    {inv.variants?.sku} · {inv.variants?.color}
                                                </div>
                                                <div className="mt-1 flex gap-2">
                                                    <span className="text-[10px] bg-secondary-100 px-1.5 py-0.5 rounded font-mono text-secondary-600">
                                                        {inv.qr_code}
                                                    </span>
                                                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedInventoryId(inv.id)
                                                    // Auto-submit specific item
                                                    // But we need to bypass the form state logic or set it and trigger
                                                    // Let's just call insert logic directly directly for UX
                                                    const autoAdd = async () => {
                                                        const { error } = await supabase.from('shipping_plan_items').insert({
                                                            shipping_plan_id: plan.id,
                                                            inventory_item_id: inv.id,
                                                            status: 'pending'
                                                        })
                                                        if (!error) {
                                                            loadItems() // Refresh left side
                                                            onUpdate()
                                                        }
                                                    }
                                                    autoAdd()
                                                }}
                                                className="shrink-0 p-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-between items-center">
                    <button
                        onClick={onDelete}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium"
                    >
                        <Trash2 size={18} />
                        Delete Plan
                    </button>
                    <button onClick={onClose} className="px-6 py-2 bg-secondary-100 text-secondary-700 rounded-lg hover:bg-secondary-200 font-medium">
                        Done
                    </button>
                </div>
            </div>
        </div>
    )
}

function CreatePlanModal({ onClose, onSave }) {
    const [formData, setFormData] = useState({
        courier: 'Flash Express',
        driver_name: '',
        license_plate: ''
    })

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">New Shipping Plan</h2>
                    <button onClick={onClose}><X size={24} className="text-secondary-400" /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Courier / Type</label>
                        <select
                            value={formData.courier}
                            onChange={e => setFormData({ ...formData, courier: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                        >
                            <option>Flash Express</option>
                            <option>Kerry Express</option>
                            <option>Lalamove</option>
                            <option>Company Car (รถบริษัท)</option>
                            <option>Customer Pickup (รับเอง)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">Driver Name (Optional)</label>
                        <input
                            type="text"
                            value={formData.driver_name}
                            onChange={e => setFormData({ ...formData, driver_name: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                            placeholder="Name of driver"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">License Plate (Optional)</label>
                        <input
                            type="text"
                            value={formData.license_plate}
                            onChange={e => setFormData({ ...formData, license_plate: e.target.value })}
                            className="w-full p-2 border border-secondary-300 rounded-lg"
                            placeholder="e.g. 1กข-1234"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-secondary-600 hover:bg-secondary-50 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(formData)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        Create Plan
                    </button>
                </div>
            </div>
        </div>
    )
}
