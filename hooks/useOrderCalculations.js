import { useMemo } from 'react'

/**
 * Custom hook for calculating order totals, VAT, and other financial calculations
 * All calculations are memoized to prevent unnecessary recalculations
 * 
 * @param {Array} items - Array of order items with {qty, unitPrice, ...}
 * @param {Object} discount - Discount object with {mode: 'percent'|'fixed', value: number}
 * @param {number} shippingFee - Shipping fee amount
 * @param {boolean} vatIncluded - Whether VAT is included in prices
 * @param {number} vatRate - VAT rate (default 0.07 for 7%)
 */
export function useOrderCalculations(items, discount, shippingFee, vatIncluded, vatRate = 0.07) {
    const calculations = useMemo(() => {
        // Calculate subtotal from all items (using unitPrice and qty to match Order.jsx)
        const subtotal = items.reduce((sum, item) => {
            const itemPrice = Number(item.unitPrice) || 0
            const itemQuantity = Number(item.qty) || 0
            return sum + (itemPrice * itemQuantity)
        }, 0)

        // Calculate discount amount based on mode
        const discountAmt = discount.mode === 'percent'
            ? (subtotal + Number(shippingFee)) * (Number(discount.value) / 100)
            : Number(discount.value)

        const afterDiscount = Math.max(0, subtotal + Number(shippingFee) - discountAmt)

        // Calculate VAT
        let vatAmt = 0
        if (vatRate > 0) {
            if (vatIncluded) {
                // Inclusive: Base = After / (1+rate) -> VAT = After - Base
                const base = afterDiscount / (1 + Number(vatRate))
                vatAmt = afterDiscount - base
            } else {
                // Exclusive: VAT = After * rate
                vatAmt = afterDiscount * Number(vatRate)
            }
        }

        // Total Calculation
        // If INVAT: Total = AfterDiscount (VAT is inside)
        // If EXVAT: Total = AfterDiscount + VAT
        const total = vatIncluded ? afterDiscount : (afterDiscount + vatAmt)

        return {
            subtotal,
            discountAmt,
            afterDiscount,
            vatAmt,
            total
        }
    }, [items, discount, shippingFee, vatIncluded, vatRate])

    return calculations
}

/**
 * Custom hook for calculating payment schedule totals
 */
export function usePaymentCalculations(paymentSchedule) {
    const paymentTotals = useMemo(() => {
        const totalPaid = paymentSchedule.reduce((sum, payment) => {
            return sum + (Number(payment.amount) || 0)
        }, 0)

        const totalScheduled = paymentSchedule.reduce((sum, payment) => {
            // Only count payments that are scheduled (have a date)
            if (payment.dueDate || payment.paidDate) {
                return sum + (Number(payment.amount) || 0)
            }
            return sum
        }, 0)

        return {
            totalPaid,
            totalScheduled,
            paymentsCount: paymentSchedule.length
        }
    }, [paymentSchedule])

    return paymentTotals
}
