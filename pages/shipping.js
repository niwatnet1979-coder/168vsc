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
    X
} from 'lucide-react'

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
                            <div key={plan.id} className="bg-white rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow p-5">
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
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold
                                        ${plan.status === 'completed' ? 'bg-success-100 text-success-700' :
                                            plan.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                'bg-secondary-100 text-secondary-600'}`}>
                                        {plan.status.toUpperCase()}
                                    </span>
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
            {showCreateModal && (
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
                        if (error) alert('Error creating plan')
                        else {
                            loadPlans()
                            setShowCreateModal(false)
                        }
                    }}
                />
            )}

            {/* Manage Modal */}
            {selectedPlan && (
                <ManagePlanModal
                    plan={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                    onUpdate={loadPlans}
                />
            )}
        </AppLayout>
    )
}

function ManagePlanModal({ plan, onClose, onUpdate }) {
    const [items, setItems] = useState([])
    const [newItemId, setNewItemId] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    useEffect(() => {
        loadItems()
    }, [plan])

    const loadItems = async () => {
        const { data } = await supabase
            .from('shipping_plan_items')
            .select('*, order:orders(*)')
            .eq('shipping_plan_id', plan.id)
        setItems(data || [])
    }

    const addItem = async (e) => {
        e.preventDefault()
        if (!newItemId) return
        setIsAdding(true)

        // Verify Address/Order exists? For now just try to link by Order ID (short UUID or manual code?)
        // Assuming we rely on full UUID or we need a search.
        // Let's assume input is a full Order UUID for MVP, or we would need a search picker.
        // TO KEEP IT SIMPLE FOR NOW: We will assume user enters Order ID.
        // Ideally we should have a dropdown of 'Ready to Ship' orders.

        // Let's implement a quick search separately? No, let's just insert for now.
        const { error } = await supabase.from('shipping_plan_items').insert({
            shipping_plan_id: plan.id,
            order_id: newItemId
        })

        if (error) {
            alert('Error adding order: ' + error.message)
        } else {
            setNewItemId('')
            loadItems()
            onUpdate()
        }
        setIsAdding(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-primary-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-primary-900">{plan.courier} Plan</h2>
                        <span className="text-xs text-primary-600">{new Date(plan.plan_date).toLocaleDateString()}</span>
                    </div>
                    <button onClick={onClose}><X size={24} className="text-secondary-400" /></button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Items List */}
                    <div className="space-y-4 mb-6">
                        <h3 className="font-bold text-secondary-800">Items in this shipment</h3>
                        {items.length === 0 ? (
                            <div className="text-center p-8 bg-secondary-50 rounded-lg text-secondary-500">
                                No items added yet.
                            </div>
                        ) : (
                            items.map(item => (
                                <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Package size={20} className="text-secondary-400" />
                                        <div>
                                            {/* Defensive check if order data is missing */}
                                            <p className="font-bold">{item.order?.customer_name || 'Order #' + item.order_id}</p>
                                            <p className="text-xs text-secondary-500">Status: {item.status}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            await supabase.from('shipping_plan_items').delete().eq('id', item.id)
                                            loadItems()
                                            onUpdate()
                                        }}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Item Form */}
                    <div className="bg-secondary-50 p-4 rounded-lg">
                        <h4 className="font-bold text-sm mb-2">Add Order to Shipment</h4>
                        <p className="text-xs text-secondary-500 mb-2">Enter available Order ID to add to this truck</p>
                        <form onSubmit={addItem} className="flex gap-2">
                            <input
                                type="text"
                                value={newItemId}
                                onChange={e => setNewItemId(e.target.value)}
                                placeholder="Order UUID..."
                                className="flex-1 p-2 border rounded"
                            />
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </form>
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 text-secondary-600">Close</button>
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
