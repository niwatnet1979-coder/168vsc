import { useState, useEffect } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import { supabase } from '../lib/supabaseClient'
import Swal from 'sweetalert2'
import {
    Ship,
    Plus,
    Calendar,
    Search,
    FileText,
    DollarSign,
    MoreVertical,
    Edit,
    Trash2,
    Anchor,
    Package,
    ArrowRight
} from 'lucide-react'

export default function ShipmentsPage() {
    const [shipments, setShipments] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedShipment, setSelectedShipment] = useState(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    useEffect(() => {
        loadShipments()
    }, [])

    const loadShipments = async () => {
        setIsLoading(true)
        try {
            const data = await DataManager.getShipments()
            setShipments(data || [])
        } catch (error) {
            console.error(error)
            Swal.fire('Error', error.message || 'Failed to load shipments', 'error')
        }
        setIsLoading(false)
    }

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Shipment?',
            text: "You won't be able to revert this! Linked POs will be unlinked.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        })

        if (result.isConfirmed) {
            try {
                await DataManager.deleteShipment(id)
                await Swal.fire('Deleted!', 'Shipment has been deleted.', 'success')
                loadShipments()
            } catch (error) {
                Swal.fire('Error', error.message, 'error')
            }
        }
    }

    const filteredShipments = shipments.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.forwarder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.tracking_no?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <AppLayout>
            <Head>
                <title>Inbound Shipments - 168VSC</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                            <Ship className="text-primary-600" />
                            Inbound Shipments
                        </h1>
                        <p className="text-secondary-500 text-sm">Track incoming sea/air freight and manage logistics costs.</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        New Shipment
                    </button>
                </div>

                {/* Filters */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search Shipment Name, Forwarder, Tracking..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-4">
                    {isLoading ? (
                        <div className="text-center py-12 text-secondary-500">Loading shipments...</div>
                    ) : filteredShipments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-secondary-200">
                            <Anchor size={48} className="mx-auto text-secondary-300 mb-4" />
                            <h3 className="text-lg font-medium text-secondary-900">No Shipments Found</h3>
                            <p className="text-secondary-500">Create a new shipment to start tracking.</p>
                        </div>
                    ) : (
                        filteredShipments.map(shipment => (
                            <div key={shipment.id} className="bg-white rounded-xl border border-secondary-200 shadow-sm hover:shadow-md transition-shadow p-5">
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-secondary-900">{shipment.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase
                                                ${shipment.status === 'arrived' ? 'bg-green-100 text-green-700' :
                                                    shipment.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                                        shipment.status === 'closed' ? 'bg-gray-100 text-gray-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {shipment.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-secondary-600">
                                            <div className="flex items-center gap-2">
                                                <Ship size={16} className="text-secondary-400" />
                                                <span>Forwarder: <b>{shipment.forwarder || '-'}</b></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-secondary-400" />
                                                <span>Tracking: <span className="font-mono">{shipment.tracking_no || '-'}</span></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-secondary-400" />
                                                <span>ETD: {shipment.etd ? new Date(shipment.etd).toLocaleDateString() : '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <ArrowRight size={16} className="text-secondary-400" />
                                                <span>ETA: {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 px-4 border-l border-secondary-100">
                                        <div className="text-center">
                                            <div className="text-xs text-secondary-500 mb-1">Total POs</div>
                                            <div className="font-bold text-xl text-secondary-900">{shipment.purchase_orders?.length || 0}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-secondary-500 mb-1">Logistics Cost</div>
                                            <div className="font-bold text-xl text-primary-600">
                                                ฿{DataManager.calculateShipmentTotalCost(shipment.costs).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setSelectedShipment(shipment)}
                                            className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                                            title="Edit / Manage"
                                        >
                                            <Edit size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(shipment.id)}
                                            className="p-2 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            {(isCreateModalOpen || selectedShipment) && (
                <ShipmentModal
                    shipment={selectedShipment}
                    onClose={() => {
                        setIsCreateModalOpen(false)
                        setSelectedShipment(null)
                    }}
                    onSave={() => {
                        setIsCreateModalOpen(false)
                        setSelectedShipment(null)
                        loadShipments()
                    }}
                />
            )}

        </AppLayout>
    )
}

function ShipmentModal({ shipment, onClose, onSave }) {
    const isEdit = !!shipment
    const [activeTab, setActiveTab] = useState('info') // info, pos, costs
    const [isLoading, setIsLoading] = useState(false)

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        forwarder: '',
        tracking_no: '',
        status: 'planned',
        etd: '',
        eta: '',
        notes: ''
    })

    // Lists
    const [linkedPOs, setLinkedPOs] = useState([])
    const [costs, setCosts] = useState([])
    const [availablePOs, setAvailablePOs] = useState([])

    // Cost Form
    const [newCost, setNewCost] = useState({ type: 'shipping', amount: '', currency: 'THB', rate: 1 })

    useEffect(() => {
        if (shipment) {
            setFormData({
                name: shipment.name,
                forwarder: shipment.forwarder || '',
                tracking_no: shipment.tracking_no || '',
                status: shipment.status,
                etd: shipment.etd || '',
                eta: shipment.eta || '',
                notes: shipment.notes || ''
            })
            setLinkedPOs(shipment.purchase_orders || [])
            setCosts(shipment.costs || [])
        } else {
            // Default Name
            const date = new Date()
            const name = `SHP-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
            setFormData(prev => ({ ...prev, name }))
        }
        loadAvailablePOs()
    }, [shipment])

    const loadAvailablePOs = async () => {
        // Fetch POs that are NOT assigned to a shipment (or assigned to THIS shipment)
        // For simplicity, fetch all 'ordered'/'arrived' POs and filter client side
        const { data } = await supabase
            .from('purchase_orders')
            .select('id, external_ref_no, supplier_name, product_cost_total, status, inbound_shipment_id')
            .in('status', ['ordered', 'arrived', 'received'])
            .order('created_at', { ascending: false })

        if (data) {
            // Filter: PO has no shipment ID OR matches this shipment ID
            const shipmentId = shipment?.id
            setAvailablePOs(data.filter(po => !po.inbound_shipment_id || po.inbound_shipment_id === shipmentId))
        }
    }

    const handleSaveInfo = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            if (isEdit) {
                await DataManager.updateShipment(shipment.id, formData)
                Swal.fire('Saved', 'Shipment updated', 'success')
            } else {
                await DataManager.createShipment(formData)
                Swal.fire('Created', 'Shipment created successfully', 'success')
            }
            onSave()
        } catch (error) {
            Swal.fire('Error', error.message, 'error')
        }
        setIsLoading(false)
    }

    const handleAddCost = async () => {
        if (!isEdit) return Swal.fire('Save First', 'Please create the shipment before adding costs.', 'warning')
        if (!newCost.amount) return

        try {
            await DataManager.addShipmentCost({
                shipment_id: shipment.id,
                cost_type: newCost.type,
                amount: newCost.amount,
                currency: newCost.currency,
                exchange_rate: newCost.rate
            })

            // Reload shipment data to refresh costs
            const updated = await DataManager.getShipmentById(shipment.id)
            setCosts(updated.costs)
            setNewCost({ type: 'shipping', amount: '', currency: 'THB', rate: 1 })

        } catch (error) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const handleTogglePO = async (po) => {
        if (!isEdit) return Swal.fire('Save First', 'Please create the shipment first.', 'warning')

        try {
            const isLinked = linkedPOs.some(p => p.id === po.id)
            if (isLinked) {
                await DataManager.removePOFromShipment(po.id)
            } else {
                await DataManager.assignPOToShipment(po.id, shipment.id)
            }

            // Refresh
            const updated = await DataManager.getShipmentById(shipment.id)
            setLinkedPOs(updated.purchase_orders || [])
            loadAvailablePOs() // Refresh available list

        } catch (error) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const handleAllocateCosts = async () => {
        if (!isEdit) return
        if (costs.length === 0 || linkedPOs.length === 0) {
            Swal.fire('Missing Data', 'Please add costs and link purchase orders first.', 'warning')
            return
        }

        const result = await Swal.fire({
            title: 'Allocate Costs?',
            text: `This will distribute ฿${DataManager.calculateShipmentTotalCost(costs).toLocaleString()} to ${linkedPOs.length} Purchase Orders based on their value. Existing allocation data will be overwritten.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Allocate',
            confirmButtonColor: '#0066cc'
        })

        if (!result.isConfirmed) return

        setIsLoading(true)
        try {
            const res = await DataManager.allocateShipmentCosts(shipment.id)
            Swal.fire('Success', `Costs allocated to ${res.poCount} POs.`, 'success')
            loadAvailablePOs() // Refresh data if needed (though POs are same)
            // Ideally we'd refresh linkedPOs to show new 'total_landed_cost' if displayed
        } catch (error) {
            Swal.fire('Error', error.message, 'error')
        }
        setIsLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-secondary-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-secondary-900">
                        {isEdit ? `Manage Shipment: ${shipment.name}` : 'New Shipment'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-secondary-200 rounded-full text-secondary-500">
                        <Trash2 size={24} className="rotate-45" /> {/* Close Icon */}
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-6 pt-4 border-b flex gap-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500'}`}
                    >
                        Basic Info
                    </button>
                    <button
                        onClick={() => setActiveTab('pos')}
                        disabled={!isEdit}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pos' ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500'} ${!isEdit && 'opacity-50 cursor-not-allowed'}`}
                    >
                        Linked POs <span className="bg-secondary-100 px-1.5 rounded-full text-xs">{linkedPOs.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('costs')}
                        disabled={!isEdit}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'costs' ? 'border-primary-600 text-primary-600' : 'border-transparent text-secondary-500'} ${!isEdit && 'opacity-50 cursor-not-allowed'}`}
                    >
                        Logistics Costs <span className="text-xs bg-green-100 text-green-700 px-1.5 rounded-full">฿{DataManager.calculateShipmentTotalCost(costs).toLocaleString()}</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">

                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <form onSubmit={handleSaveInfo} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Shipment Name / ID</label>
                                    <input type="text" className="input-field" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Forwarder</label>
                                    <input type="text" className="input-field" placeholder="e.g. TTP, Cargo..."
                                        value={formData.forwarder} onChange={e => setFormData({ ...formData, forwarder: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Tracking No.</label>
                                    <input type="text" className="input-field"
                                        value={formData.tracking_no} onChange={e => setFormData({ ...formData, tracking_no: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Status</label>
                                    <select className="input-field"
                                        value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="planned">Planned (Waiting)</option>
                                        <option value="shipped">Shipped (On Way)</option>
                                        <option value="arrived">Arrived (Thailand)</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">ETD (Depart)</label>
                                    <input type="date" className="input-field"
                                        value={formData.etd} onChange={e => setFormData({ ...formData, etd: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">ETA (Arrive)</label>
                                    <input type="date" className="input-field"
                                        value={formData.eta} onChange={e => setFormData({ ...formData, eta: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-full">
                                    <label className="label">Notes</label>
                                    <textarea className="input-field h-24"
                                        value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button type="submit" disabled={isLoading} className="btn btn-primary">
                                    {isLoading ? 'Saving...' : 'Save Info'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* POS TAB */}
                    {activeTab === 'pos' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                            {/* Available POs */}
                            <div className="border rounded-xl flex flex-col overflow-hidden">
                                <div className="bg-secondary-50 p-3 font-semibold border-b text-sm">Available Purchase Orders</div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {availablePOs.filter(p => !p.inbound_shipment_id).map(po => (
                                        <div key={po.id} className="p-3 border rounded-lg hover:border-primary-400 cursor-pointer bg-white group flex justify-between items-center"
                                            onClick={() => handleTogglePO(po)}
                                        >
                                            <div>
                                                <div className="font-bold text-sm text-secondary-900">{po.external_ref_no || po.supplier_name || 'No Ref'}</div>
                                                <div className="text-xs text-secondary-500">฿{(po.product_cost_total || 0).toLocaleString()} · {po.status}</div>
                                            </div>
                                            <Plus size={16} className="text-secondary-300 group-hover:text-primary-600" />
                                        </div>
                                    ))}
                                    {availablePOs.filter(p => !p.inbound_shipment_id).length === 0 && <div className="text-center p-4 text-xs text-secondary-400">No POs available</div>}
                                </div>
                            </div>

                            {/* Linked POs */}
                            <div className="border rounded-xl flex flex-col overflow-hidden shadow-inner bg-secondary-50/50">
                                <div className="bg-blue-50 p-3 font-semibold border-b text-sm text-blue-800">Linked to Shipment</div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                    {linkedPOs.map(po => (
                                        <div key={po.id} className="p-3 border border-blue-200 bg-white rounded-lg flex justify-between items-center shadow-sm">
                                            <div>
                                                <div className="font-bold text-sm text-secondary-900">{po.external_ref_no || po.supplier_name || 'No Ref'}</div>
                                                <div className="text-xs text-secondary-500">฿{(po.product_cost_total || 0).toLocaleString()}</div>
                                            </div>
                                            <button onClick={() => handleTogglePO(po)} className="text-red-400 hover:text-red-600 p-1">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {linkedPOs.length === 0 && <div className="text-center p-4 text-xs text-secondary-400">No POs selected</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* COSTS TAB */}
                    {activeTab === 'costs' && (
                        <div className="flex flex-col h-full">
                            {/* Add Cost Form */}
                            <div className="flex gap-2 items-end mb-6 p-4 bg-secondary-50 rounded-xl border border-secondary-200">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-secondary-600 mb-1 block">Type</label>
                                    <select className="input-field text-sm py-1.5"
                                        value={newCost.type} onChange={e => setNewCost({ ...newCost, type: e.target.value })}
                                    >
                                        <option value="shipping">Freight / Shipping</option>
                                        <option value="tax">Tax / Duty</option>
                                        <option value="clearance">Clearance</option>
                                        <option value="trucking">Trucking (Local)</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="text-xs font-medium text-secondary-600 mb-1 block">Amount</label>
                                    <input type="number" className="input-field text-sm py-1.5" placeholder="0.00"
                                        value={newCost.amount} onChange={e => setNewCost({ ...newCost, amount: e.target.value })}
                                    />
                                </div>
                                <div className="w-20">
                                    <label className="text-xs font-medium text-secondary-600 mb-1 block">Cur</label>
                                    <select className="input-field text-sm py-1.5"
                                        value={newCost.currency} onChange={e => setNewCost({ ...newCost, currency: e.target.value })}
                                    >
                                        <option value="THB">THB</option>
                                        <option value="CNY">CNY</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                {newCost.currency !== 'THB' && (
                                    <div className="w-20">
                                        <label className="text-xs font-medium text-secondary-600 mb-1 block">Rate</label>
                                        <input type="number" className="input-field text-sm py-1.5" placeholder="1.0"
                                            value={newCost.rate} onChange={e => setNewCost({ ...newCost, rate: e.target.value })}
                                        />
                                    </div>
                                )}
                                <button onClick={handleAddCost} className="btn btn-primary py-1.5 px-3 mb-[1px]">
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Cost List */}
                            <div className="flex-1 border rounded-xl overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-secondary-50 text-secondary-600 border-b">
                                        <tr>
                                            <th className="text-left p-3">Type</th>
                                            <th className="text-right p-3">Amount</th>
                                            <th className="text-right p-3">Ex. Rate</th>
                                            <th className="text-right p-3">Total (THB)</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100">
                                        {costs.map(cost => (
                                            <tr key={cost.id} className="hover:bg-secondary-50">
                                                <td className="p-3 capitalize">{cost.cost_type}</td>
                                                <td className="p-3 text-right font-mono">
                                                    {parseFloat(cost.amount).toLocaleString()} {cost.currency}
                                                </td>
                                                <td className="p-3 text-right text-secondary-500">
                                                    {cost.currency !== 'THB' ? `x${cost.exchange_rate}` : '-'}
                                                </td>
                                                <td className="p-3 text-right font-bold text-secondary-900">
                                                    ฿{(parseFloat(cost.amount) * parseFloat(cost.exchange_rate || 1)).toLocaleString()}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button className="text-secondary-400 hover:text-red-500">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {costs.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-secondary-400 italic">No costs recorded yet.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {costs.length > 0 && (
                                        <tfoot className="bg-secondary-50 font-bold border-t">
                                            <tr>
                                                <td colSpan={3} className="p-3 text-right">Grand Total:</td>
                                                <td className="p-3 text-right text-primary-600">
                                                    ฿{DataManager.calculateShipmentTotalCost(costs).toLocaleString()}
                                                </td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>

                            {/* Actions */}
                            {costs.length > 0 && linkedPOs.length > 0 && (
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={handleAllocateCosts}
                                        disabled={isLoading}
                                        className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        <DollarSign size={18} />
                                        {isLoading ? 'Allocating...' : 'Allocate Costs to POs'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div >
    )
}
