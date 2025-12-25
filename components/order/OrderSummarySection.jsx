import React from 'react'
import { DollarSign } from 'lucide-react'
import { currency } from '../../lib/utils'

/**
 * OrderSummarySection Component
 * Displays order financial summary including subtotal, discount, shipping, VAT, and total
 */
export default function OrderSummarySection({
    // Calculations
    subtotal,
    discount,
    discountAmt,
    shippingFee,
    afterDiscount,
    vatAmt,
    total,
    totalPaid,
    outstanding,

    // Settings
    vatIncluded,
    vatRate,

    // Other outstanding orders
    otherOutstandingOrders = []
}) {
    // Calculate total outstanding including other orders
    const otherPaymentsTotal = otherOutstandingOrders.reduce((sum, o) => sum + o.outstanding, 0)
    const grandOutstanding = outstanding + otherPaymentsTotal

    return (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="text-primary-600" size={20} />
                สรุปยอด
            </h3>

            <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary-600">ยอดรวมสินค้า</span>
                    <span className="font-medium text-secondary-900">{currency(subtotal)}</span>
                </div>

                {/* Shipping Fee */}
                {shippingFee > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-600">ค่าขนส่ง</span>
                        <span className="font-medium text-secondary-900">{currency(shippingFee)}</span>
                    </div>
                )}

                {/* Discount */}
                {discountAmt > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-600">ส่วนลด</span>
                        <span className="font-medium text-danger-600">-{currency(discountAmt)}</span>
                    </div>
                )}

                {/* After Discount */}
                {(shippingFee > 0 || discountAmt > 0) && (
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-secondary-100">
                        <span className="text-secondary-600">ยอดหลังหักส่วนลด</span>
                        <span className="font-medium text-secondary-900">{currency(afterDiscount)}</span>
                    </div>
                )}

                {/* VAT */}
                {vatRate > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-600">
                            VAT {(vatRate * 100).toFixed(0)}%
                            <span className="text-xs ml-1">({vatIncluded ? 'รวมใน' : 'แยก'})</span>
                        </span>
                        <span className="font-medium text-secondary-900">{currency(vatAmt)}</span>
                    </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-3 border-t-2 border-secondary-200">
                    <span className="font-semibold text-secondary-900">ยอดรวมทั้งสิ้น</span>
                    <span className="font-bold text-lg text-primary-600">{currency(total)}</span>
                </div>

                {/* Paid */}
                {totalPaid > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-600">ชำระแล้ว</span>
                        <span className="font-medium text-success-600">{currency(totalPaid)}</span>
                    </div>
                )}

                {/* Outstanding */}
                {outstanding > 0 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary-600">ค้างชำระ (ออเดอร์นี้)</span>
                        <span className="font-medium text-warning-600">{currency(outstanding)}</span>
                    </div>
                )}

                {/* Other Outstanding Orders */}
                {otherOutstandingOrders.length > 0 && (
                    <>
                        <div className="pt-2 border-t border-secondary-100">
                            <div className="text-xs font-medium text-secondary-500 mb-2">
                                ออเดอร์อื่นที่ค้างชำระ ({otherOutstandingOrders.length} ออเดอร์)
                            </div>
                            {otherOutstandingOrders.map((order, idx) => (
                                <div key={idx} className="flex justify-between items-center text-xs text-secondary-600 mb-1">
                                    <span className="truncate">
                                        #{order.id.length > 20 ? `OD${order.id.slice(-6)}` : order.id}
                                    </span>
                                    <span className="font-medium text-warning-600">{currency(order.outstanding)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Grand Total Outstanding */}
                        <div className="flex justify-between items-center pt-2 border-t-2 border-warning-200 bg-warning-50 -mx-6 px-6 py-2">
                            <span className="font-semibold text-warning-900">รวมค้างชำระทั้งหมด</span>
                            <span className="font-bold text-lg text-warning-600">{currency(grandOutstanding)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Summary Note */}
            <div className="mt-4 pt-4 border-t border-secondary-100">
                <p className="text-xs text-secondary-500 text-center">
                    {vatIncluded
                        ? 'ราคารวม VAT แล้ว'
                        : 'ราคายังไม่รวม VAT'}
                </p>
            </div>
        </div>
    )
}
