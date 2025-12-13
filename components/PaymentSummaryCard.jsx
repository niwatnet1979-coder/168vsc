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
    readOnly = false,
    onEdit,
    onSave,
    onCancel
}) {
    const [localShipping, setLocalShipping] = React.useState(shippingFee)
    const [localDiscount, setLocalDiscount] = React.useState(discount)
    const [localVatRate, setLocalVatRate] = React.useState(vatRate)

    React.useEffect(() => {
        setLocalShipping(shippingFee)
        setLocalDiscount(discount)
        setLocalVatRate(vatRate)
    }, [shippingFee, discount, vatRate])

    // Internal handlers to update parent immediately or local state
    const handleShippingChange = (val) => {
        setLocalShipping(val)
        if (onShippingFeeChange) onShippingFeeChange(val)
    }

    // Calculations use LOCAL state for immediate feedback during edit
    const numSubtotal = Number(subtotal) || 0
    const numShippingFee = Number(localShipping) || 0
    const numDiscountValue = Number(localDiscount?.value) || 0

    const discountAmt = localDiscount?.mode === 'percent'
        ? (numSubtotal + numShippingFee) * (numDiscountValue / 100)
        : numDiscountValue

    const afterDiscount = Math.max(0, numSubtotal + numShippingFee - discountAmt)
    const vatAmt = afterDiscount * localVatRate
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

                {/* Shipping Fee */}
                <div className="flex justify-between items-center text-secondary-600">
                    <span>ค่าขนส่ง</span>
                    {readOnly ? (
                        <span className="font-medium text-secondary-900">{numShippingFee > 0 ? currency(numShippingFee) : '-'}</span>
                    ) : (
                        <input
                            type="number"
                            value={localShipping}
                            onChange={e => handleShippingChange(Number(e.target.value))}
                            className="w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm"
                        />
                    )}
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center text-secondary-600">
                    <span>ส่วนลด</span>
                    {readOnly ? (
                        <span className="font-medium text-secondary-900">
                            {numDiscountValue > 0
                                ? (localDiscount.mode === 'percent' ? `${numDiscountValue}% (${currency(discountAmt)})` : currency(discountAmt))
                                : '-'}
                        </span>
                    ) : (
                        <div className="flex gap-1">
                            <select
                                value={localDiscount?.mode || 'percent'}
                                onChange={e => {
                                    const newDiscount = { ...localDiscount, mode: e.target.value }
                                    setLocalDiscount(newDiscount)
                                    if (onDiscountChange) onDiscountChange(newDiscount)
                                }}
                                className="border border-secondary-300 rounded text-xs px-1"
                            >
                                <option value="percent">%</option>
                                <option value="amount">฿</option>
                            </select>
                            <input
                                type="number"
                                value={localDiscount?.value || 0}
                                onChange={e => {
                                    const newDiscount = { ...localDiscount, value: Number(e.target.value) }
                                    setLocalDiscount(newDiscount)
                                    if (onDiscountChange) onDiscountChange(newDiscount)
                                }}
                                className="w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-between text-secondary-900 font-medium pt-3 border-t border-secondary-100">
                    <span>หลังหักส่วนลด</span>
                    <span>{currency(afterDiscount)}</span>
                </div>

                {/* VAT */}
                <div className="flex justify-between items-center text-secondary-600">
                    <span className="flex items-center gap-2">
                        ภาษีมูลค่าเพิ่ม (7%)
                        {!readOnly && (
                            <input
                                type="checkbox"
                                checked={localVatRate > 0}
                                onChange={e => {
                                    const newRate = e.target.checked ? 0.07 : 0
                                    setLocalVatRate(newRate)
                                    if (onVatRateChange) onVatRateChange(newRate)
                                }}
                                className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                            />
                        )}
                    </span>
                    <span className={localVatRate > 0 ? "" : "text-gray-400"}>
                        {localVatRate > 0 ? currency(vatAmt) : '-'}
                    </span>
                </div>

                <div className="flex justify-between text-xl font-bold text-primary-700 pt-5 border-t border-secondary-200">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span>{currency(total)}</span>
                </div>

                {/* Payment Schedule List */}
                <div className="pt-5 border-t border-secondary-200">
                    <h3 className="text-sm font-bold text-secondary-900 mb-4">รายการการชำระเงิน</h3>

                    {/* Payment List */}
                    {paymentSchedule.length > 0 ? (
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
                    ) : (
                        <div className="text-center text-gray-400 mb-4 text-xs font-light">ยังไม่มีรายการชำระเงิน</div>
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

                    {/* Actions */}
                    <div className="mt-6 flex gap-2">
                        {readOnly ? (
                            <button
                                onClick={onEdit}
                                className="w-full py-2.5 bg-white border border-secondary-300 text-secondary-700 font-medium rounded-lg hover:bg-secondary-50 flex items-center justify-center gap-2"
                            >
                                <span>✎</span>
                                แก้ไขข้อมูล
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-2.5 bg-white border border-secondary-300 text-secondary-700 font-medium rounded-lg hover:bg-secondary-50"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={onSave}
                                    className="flex-1 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm"
                                >
                                    บันทึก
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
