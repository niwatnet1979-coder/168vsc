import { supabase } from '../supabaseClient'

export const getShipments = async () => {
    const { data, error } = await supabase
        .from('inbound_shipments')
        .select(`
            *,
            costs:inbound_shipment_costs(amount, currency, exchange_rate),
            purchase_orders(id, external_ref_no, status, product_cost_total, supplier_name)
        `)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export const getShipmentById = async (id) => {
    const { data, error } = await supabase
        .from('inbound_shipments')
        .select(`
            *,
            costs:inbound_shipment_costs(*),
            costs:inbound_shipment_costs(*),
            purchase_orders(id, external_ref_no, status, product_cost_total, supplier_name, items:purchase_order_items(count))
        `)
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

export const createShipment = async (shipmentData) => {
    const { data, error } = await supabase
        .from('inbound_shipments')
        .insert(shipmentData)
        .select()
        .single()

    if (error) throw error
    return data
}

export const updateShipment = async (id, shipmentData) => {
    const { data, error } = await supabase
        .from('inbound_shipments')
        .update(shipmentData)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error
    return data
}

export const deleteShipment = async (id) => {
    const { error } = await supabase
        .from('inbound_shipments')
        .delete()
        .eq('id', id)

    if (error) throw error
    return true
}

// Cost Management
export const addShipmentCost = async (costData) => {
    const { data, error } = await supabase
        .from('inbound_shipment_costs')
        .insert(costData)
        .select()
        .single()

    if (error) throw error
    return data
}

export const deleteShipmentCost = async (id) => {
    const { error } = await supabase
        .from('inbound_shipment_costs')
        .delete()
        .eq('id', id)

    if (error) throw error
    return true
}

// PO Assignment
export const assignPOToShipment = async (poId, shipmentId) => {
    const { error } = await supabase
        .from('purchase_orders')
        .update({ inbound_shipment_id: shipmentId })
        .eq('id', poId)

    if (error) throw error
    return true
}

export const removePOFromShipment = async (poId) => {
    const { error } = await supabase
        .from('purchase_orders')
        .update({ inbound_shipment_id: null })
        .eq('id', poId)

    if (error) throw error
    return true
}

// Helper to calculate total cost in THB
export const calculateShipmentTotalCost = (costs) => {
    if (!costs || !Array.isArray(costs)) return 0
    return costs.reduce((acc, cost) => {
        return acc + (parseFloat(cost.amount || 0) * parseFloat(cost.exchange_rate || 1))
    }, 0)
}

// COST ALLOCATION LOGIC
export const allocateShipmentCosts = async (shipmentId) => {
    // 1. Get Shipment Costs and Linked POs
    const shipment = await getShipmentById(shipmentId)
    const costs = shipment.costs || []
    const purchaseOrders = shipment.purchase_orders || []

    if (purchaseOrders.length === 0) throw new Error("No linked Purchase Orders found")
    if (costs.length === 0) throw new Error("No shipment costs found")

    // 2. Calculate Total PO Values (Base for allocation)
    // We use total_amount (which should be product cost) converted to THB
    // If PO currency is not THB, assume exchange_rate is set

    let totalAllPOsValue = 0
    const poValues = purchaseOrders.map(po => {
        const rate = po.exchange_rate || 1 // Assuming 5.0 default if missing but safest is 1 if THB
        // Logic: if currency is THB, rate is 1. If not, use rate.
        // Actually best to trust the computed total_amount if it's in currency
        // Let's assume we want to allocate based on THB value.

        let valueTHB = 0
        if (po.currency === 'THB') {
            valueTHB = parseFloat(po.product_cost_total || 0)
        } else {
            valueTHB = parseFloat(po.product_cost_total || 0) * parseFloat(po.exchange_rate || 1)
        }

        totalAllPOsValue += valueTHB
        return { ...po, valueTHB }
    })

    if (totalAllPOsValue === 0) throw new Error("Total value of linked Purchase Orders is 0")

    // 3. Aggregate Costs by Type (THB)
    const costSummary = {
        shipping: 0,
        tax: 0,
        clearance: 0,
        other: 0,
        total: 0
    }

    costs.forEach(cost => {
        const amountTHB = parseFloat(cost.amount || 0) * parseFloat(cost.exchange_rate || 1)
        costSummary.total += amountTHB

        // Map cost_type to PO columns
        if (['shipping', 'freight'].includes(cost.cost_type?.toLowerCase())) {
            costSummary.shipping += amountTHB
        } else if (['tax', 'duty', 'vat'].includes(cost.cost_type?.toLowerCase())) {
            costSummary.tax += amountTHB
        } else if (['clearance', 'clearing'].includes(cost.cost_type?.toLowerCase())) {
            costSummary.clearance += amountTHB
        } else {
            costSummary.other += amountTHB // 'other', 'trucking', etc.
        }
    })

    // 4. Update each PO
    for (const po of poValues) {
        const ratio = po.valueTHB / totalAllPOsValue

        const allocatedShipping = costSummary.shipping * ratio
        const allocatedTax = costSummary.tax * ratio
        const allocatedClearance = costSummary.clearance * ratio
        const allocatedOther = costSummary.other * ratio

        // Calculate new Total Landed Cost
        // Formula: ProductCost (THB) + Allocated Costs
        const totalLandedCost = po.valueTHB + allocatedShipping + allocatedTax + allocatedClearance + allocatedOther

        // Update DB
        const { error } = await supabase
            .from('purchase_orders')
            .update({
                shipping_intl: allocatedShipping, // Map Shipping -> shipping_intl
                duty_tax: allocatedTax,           // Map Tax -> duty_tax
                clearing_fee: allocatedClearance, // Map Clearance -> clearing_fee
                fines_charges: allocatedOther,    // Map Other -> fines_charges
                total_landed_cost: totalLandedCost,
                updated_at: new Date().toISOString()
            })
            .eq('id', po.id)

        if (error) throw error
    }

    return {
        success: true,
        poCount: purchaseOrders.length,
        totalAllocated: costSummary.total
    }
}
