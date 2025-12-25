import { useState, useEffect } from 'react'
import { DataManager } from '../lib/dataManager'

/**
 * Custom hook for loading and managing order-related data
 * Handles customers, products, teams, and realtime subscriptions
 */
export function useOrderData() {
    const [customersData, setCustomersData] = useState([])
    const [productsData, setProductsData] = useState([])
    const [availableTeams, setAvailableTeams] = useState([])
    const [promptpayQr, setPromptpayQr] = useState('')
    const [loading, setLoading] = useState(true)

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)

                // Load Customers
                const customers = await DataManager.getCustomers()
                setCustomersData(customers)

                // Load Products
                const products = await DataManager.getProducts()
                setProductsData(products)

                // Load Teams (filtered by team_type = ช่าง or QC)
                const teams = await DataManager.getAvailableTeams()
                setAvailableTeams(teams)

                // Load Settings for PromptPay QR
                try {
                    const settings = await DataManager.getSettings()
                    if (settings?.promptpayQr) {
                        setPromptpayQr(settings.promptpayQr)
                    }
                } catch (err) {
                    console.error('Error loading settings:', err)
                }
            } catch (error) {
                console.error('Error loading order data:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()

        // Realtime Subscription for Stock Updates
        const channel = DataManager.supabase
            .channel('order_form_stock_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'order_items' },
                () => {
                    console.log('Realtime: order_items changed, reloading products...')
                    DataManager.getProducts().then(setProductsData)
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'inventory_transactions' },
                () => {
                    console.log('Realtime: inventory changed, reloading products...')
                    DataManager.getProducts().then(setProductsData)
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'product_variants' },
                () => {
                    console.log('Realtime: variants changed, reloading products...')
                    DataManager.getProducts().then(setProductsData)
                }
            )
            .subscribe()

        return () => {
            DataManager.supabase.removeChannel(channel)
        }
    }, [])

    return {
        customersData,
        setCustomersData,
        productsData,
        setProductsData,
        availableTeams,
        setAvailableTeams,
        promptpayQr,
        setPromptpayQr,
        loading
    }
}

/**
 * Custom hook for loading other outstanding orders for a customer
 */
export function useOtherOutstandingOrders(customerId, currentOrderId) {
    const [otherOutstandingOrders, setOtherOutstandingOrders] = useState([])

    useEffect(() => {
        const loadOtherOrders = async () => {
            if (customerId) {
                try {
                    const orders = await DataManager.getOrdersByCustomerId(customerId)

                    const otherOutstanding = orders
                        .filter(o => o.id !== currentOrderId)
                        .map(o => {
                            const paid = (o.paymentSchedule || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                            const total = Number(o.totalAmount) || 0
                            return {
                                id: o.id,
                                total: total,
                                paid: paid,
                                outstanding: Math.max(0, total - paid)
                            }
                        })
                        .filter(o => o.outstanding > 0)

                    setOtherOutstandingOrders(otherOutstanding)
                } catch (err) {
                    console.error('Error loading other orders:', err)
                }
            } else {
                setOtherOutstandingOrders([])
            }
        }
        loadOtherOrders()
    }, [customerId, currentOrderId])

    return otherOutstandingOrders
}
