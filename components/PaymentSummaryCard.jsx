import React from 'react'
import { CreditCard, Plus } from 'lucide-react'
import { currency } from '../lib/utils'

export default function PaymentSummaryCard({
    subtotal = 0,
    shippingFee = 0,
    onShippingFeeChange,
    discount = { mode: 'percent', value: 0 },
    onDiscountChange,
    vatRate = 0.07,
    onVatRateChange,
    paymentSchedule = [],
    onEditPayment,
    onAddPayment,
    readOnly = false
}) {
    // Calculations
    // Ensure numeric values
    const numSubtotal = Number(subtotal) || 0
    const numShippingFee = Number(shippingFee) || 0
    const numDiscountValue = Number(discount?.value) || 0

    const discountAmt = discount?.mode === 'percent'
        ? (numSubtotal + numShippingFee) * (numDiscountValue / 100)
        : numDiscountValue

    const afterDiscount = Math.max(0, numSubtotal + numShippingFee - discountAmt)
    const vatAmt = afterDiscount * vatRate
    const total = afterDiscount + vatAmt

    const totalPaid = paymentSchedule.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    const outstanding = Math.max(0, total - totalPaid)

    return (
        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 h-full flex flex-col">
            <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                <CreditCard className="text-primary-600" />
                สรุปยอดชำระ
            </h2>

            <div className="flex-1 space-y-5 text-sm">
                <div className="flex justify-between text-secondary-600">
                    <span>รวมเป็นเงิน</span>
                    <span>{currency(numSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-secondary-600">
                    <span>ค่าขนส่ง</span>
                    <input
                        type="number"
                        value={shippingFee}
                        onChange={e => onShippingFeeChange && onShippingFeeChange(Number(e.target.value))}
                        disabled={readOnly}
                        className={`w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm ${readOnly ? 'bg-gray-100' : ''}`}
                    />
                </div>
                <div className="flex justify-between items-center text-secondary-600">
                    <span>ส่วนลด</span>
                    <div className="flex gap-1">
                        <select
                            value={discount?.mode || 'percent'}
                            onChange={e => onDiscountChange && onDiscountChange({ ...discount, mode: e.target.value })}
                            disabled={readOnly}
                            className={`border border-secondary-300 rounded text-xs px-1 ${readOnly ? 'bg-gray-100' : ''}`}
                        >
                            <option value="percent">%</option>
                            <option value="amount">฿</option>
                        </select>
                        <input
                            type="number"
                            value={discount?.value || 0}
                            onChange={e => onDiscountChange && onDiscountChange({ ...discount, value: Number(e.target.value) })}
                            disabled={readOnly}
                            className={`w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm ${readOnly ? 'bg-gray-100' : ''}`}
                        />
                    </div>
                </div>
                <div className="flex justify-between text-secondary-900 font-medium pt-3 border-t border-secondary-100">
                    <span>หลังหักส่วนลด</span>
                    <span>{currency(afterDiscount)}</span>
                </div>
                <div className="flex justify-between items-center text-secondary-600">
                    <span className="flex items-center gap-2">
                        ภาษีมูลค่าเพิ่ม (7%)
                        <input
                            type="checkbox"
                            checked={vatRate > 0}
                            onChange={e => onVatRateChange && onVatRateChange(e.target.checked ? 0.07 : 0)}
                            disabled={readOnly}
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                        />
                    </span>
                    <span>{currency(vatAmt)}</span>
                </div>

                <div className="flex justify-between text-xl font-bold text-primary-700 pt-5 border-t border-secondary-200">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span>{currency(total)}</span>
                </div>

                {/* Payment Schedule List */}
                <div className="pt-5 border-t border-secondary-200">
                    <h3 className="text-sm font-bold text-secondary-900 mb-4">รายการการชำระเงิน</h3>

                    {/* Payment List */}
                    {paymentSchedule.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {paymentSchedule.map((payment, index) => (
                                <div
                                    key={index}
                                    onClick={() => !readOnly && onEditPayment && onEditPayment(index)}
                                    className={`flex items-center justify-between p-3 bg-secondary-50 rounded-lg border border-secondary-200 transition-colors shadow-sm ${!readOnly ? 'cursor-pointer hover:bg-secondary-100 hover:shadow-md' : ''}`}
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-medium">{payment.date ? new Date(payment.date).toLocaleDateString('th-TH') : '-'}</span>
                                        <span className="text-secondary-500">•</span>
                                        <span className="text-secondary-600">{payment.paymentMethod || '-'}</span>
                                    </div>
                                    <span className="text-primary-600 font-bold text-sm">{currency(payment.amount || 0)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Payment Button */}
                    {!readOnly && paymentSchedule.length < 5 && (
                        <button
                            onClick={onAddPayment}
                            className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400"
                        >
                            <Plus size={16} />
                            เพิ่มการชำระ
                        </button>
                    )}

                    {/* Outstanding Balance */}
                    <div className="flex justify-between text-secondary-900 font-bold text-sm mt-4 pt-5 border-t border-secondary-200">
                        <span>รวมยอดค้างชำระ</span>
                        <span>{currency(outstanding)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
