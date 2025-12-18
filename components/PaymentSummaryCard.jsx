import React from 'react'
import { CreditCard, Plus, QrCode, X } from 'lucide-react'
import { currency } from '../lib/utils'
import DataSourceTooltip from './DataSourceTooltip'

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
    onCancel,
    hideControls = false,
    otherOutstandingOrders = [],
    className = '',
    promptpayQr = '',
    showAddButton = false,
    vatIncluded = true,
    onVatIncludedChange
}) {
    const [localShipping, setLocalShipping] = React.useState(shippingFee)
    const [localDiscount, setLocalDiscount] = React.useState(discount)
    const [localVatRate, setLocalVatRate] = React.useState(vatRate)
    const [localVatIncluded, setLocalVatIncluded] = React.useState(vatIncluded)
    const [showQrPopup, setShowQrPopup] = React.useState(false)

    React.useEffect(() => {
        setLocalShipping(shippingFee)
        setLocalDiscount(discount)
        setLocalVatRate(vatRate)
        setLocalVatIncluded(vatIncluded)
    }, [shippingFee, discount, vatRate, vatIncluded])

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

    // VAT & Total Logic
    let displayVatAmt = 0
    let displayPreVat = 0
    let total = 0

    if (localVatRate > 0) {
        if (localVatIncluded) {
            // INVAT: Total = AfterDiscount
            // PreVAT = Total / 1.07
            // VAT = Total - PreVAT
            total = afterDiscount
            displayPreVat = total / (1 + localVatRate)
            displayVatAmt = total - displayPreVat
        } else {
            // EXVAT: PreVAT = AfterDiscount
            // VAT = PreVAT * 0.07
            // Total = PreVAT + VAT
            displayPreVat = afterDiscount
            displayVatAmt = displayPreVat * localVatRate
            total = displayPreVat + displayVatAmt
        }
    } else {
        total = afterDiscount
    }

    const totalPaid = paymentSchedule.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    const outstanding = Math.max(0, total - totalPaid)

    const handleVatModeChange = (isInvat) => {
        setLocalVatIncluded(isInvat)
        if (onVatIncludedChange) onVatIncludedChange(isInvat)
        // Ensure VAT rate is set to 0.07 if it was 0, or keep it?
        // If enabling mode, we assume user wants VAT.
        if (localVatRate === 0) {
            setLocalVatRate(0.07)
            if (onVatRateChange) onVatRateChange(0.07)
        }
    }

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-6 flex flex-col hover:shadow-md transition-shadow duration-200 ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <CreditCard className="text-primary-600" />
                    สรุปยอดชำระ
                </h2>
                {promptpayQr && (
                    <button
                        onClick={() => setShowQrPopup(true)}
                        className="p-1.5 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        title="สแกน QR Code"
                    >
                        <QrCode size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-secondary-500">รวมเป็นเงิน</span>
                    <DataSourceTooltip isRealtime={false} source="calculated">
                        <span className="text-sm font-medium text-secondary-900">{currency(numSubtotal)}</span>
                    </DataSourceTooltip>
                </div>

                {/* Shipping Fee */}
                {/* Shipping Fee */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-secondary-500">ค่าขนส่ง</span>
                    {readOnly ? (
                        <DataSourceTooltip isRealtime={false} source="saved">
                            <span className="text-sm font-medium text-secondary-900">{numShippingFee > 0 ? currency(numShippingFee) : '-'}</span>
                        </DataSourceTooltip>
                    ) : (
                        <DataSourceTooltip isRealtime={false} source="input">
                            <input
                                type="number"
                                value={localShipping}
                                onChange={e => handleShippingChange(Number(e.target.value))}
                                className="w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm font-medium text-secondary-900"
                            />
                        </DataSourceTooltip>
                    )}
                </div>

                {/* Discount */}
                {/* Discount */}
                <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-secondary-500">ส่วนลด</span>
                    {readOnly ? (
                        <span className="text-sm font-medium text-secondary-900">
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
                                className="border border-secondary-300 rounded text-xs px-1 text-secondary-900"
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
                                className="w-24 px-2 py-1 border border-secondary-300 rounded text-right text-sm font-medium text-secondary-900"
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-secondary-100">
                    <span className="text-xs font-bold text-secondary-700">หลังหักส่วนลด</span>
                    <span className="text-sm font-bold text-secondary-900">{currency(afterDiscount)}</span>
                </div>

                {/* VAT */}
                {/* Pre-VAT (Only for INVAT mode) */}
                {localVatIncluded && localVatRate > 0 && (
                    <div className="flex justify-between items-center text-secondary-500 text-xs">
                        <span>ราคาก่อน VAT</span>
                        <span>{currency(displayPreVat)}</span>
                    </div>
                )}

                {/* VAT */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-secondary-500">ภาษีมูลค่าเพิ่ม</span>
                        {!readOnly && (
                            <select
                                value={localVatRate === 0 ? 'novat' : (localVatIncluded ? 'invat' : 'exvat')}
                                onChange={(e) => {
                                    const mode = e.target.value
                                    if (mode === 'novat') {
                                        setLocalVatRate(0)
                                        if (onVatRateChange) onVatRateChange(0)
                                    } else if (mode === 'invat') {
                                        setLocalVatRate(0.07)
                                        setLocalVatIncluded(true)
                                        if (onVatRateChange) onVatRateChange(0.07)
                                        if (onVatIncludedChange) onVatIncludedChange(true)
                                    } else if (mode === 'exvat') {
                                        setLocalVatRate(0.07)
                                        setLocalVatIncluded(false)
                                        if (onVatRateChange) onVatRateChange(0.07)
                                        if (onVatIncludedChange) onVatIncludedChange(false)
                                    }
                                }}
                                className="ml-2 py-0.5 pl-2 pr-6 border border-secondary-300 rounded text-xs font-medium text-secondary-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                                dir="ltr"
                            >
                                <option value="invat">INVAT (7%)</option>
                                <option value="exvat">EXVAT (7%)</option>
                                <option value="novat">NO VAT</option>
                            </select>
                        )}
                    </div>
                    <span className={`text-sm font-medium ${localVatRate > 0 ? "text-secondary-900" : "text-gray-400"}`}>
                        {localVatRate > 0 ? currency(displayVatAmt) : '-'}
                    </span>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-secondary-200">
                    <span className="text-sm font-bold text-primary-900">ยอดรวมออเดอร์นี้</span>
                    <DataSourceTooltip isRealtime={false} source="calculated">
                        <span>{currency(total)}</span>
                    </DataSourceTooltip>
                </div>

                {/* Payment Schedule List */}
                {otherOutstandingOrders.length > 0 && (
                    <div className="pt-3 border-t border-secondary-200">
                        <h3 className="text-sm font-bold text-secondary-900 mb-3">ยอดค้างจากออเดอร์อื่น</h3>
                        <div className="space-y-2 mb-3">
                            {otherOutstandingOrders.map((order) => (
                                <div key={order.id} className="flex justify-between text-sm text-secondary-600">
                                    <span>{order.id}</span>
                                    <span className="font-medium text-warning-600">{currency(order.outstanding)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-base font-bold text-secondary-900 pt-2 border-t border-dashed border-secondary-200">
                            <span>รวมยอดทุกออเดอร์</span>
                            <span className="text-warning-600">
                                {currency(total + otherOutstandingOrders.reduce((s, o) => s + o.outstanding, 0))}
                            </span>
                        </div>
                    </div>
                )}

                <div className="pt-3 border-t border-secondary-200">
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
                    {((!readOnly) || showAddButton) && paymentSchedule.length < 5 && (
                        <button
                            onClick={onAddPayment}
                            className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-400"
                        >
                            <Plus size={16} />
                            เพิ่มการชำระ
                        </button>
                    )}

                    {/* QR Code Section */}


                    {/* Outstanding Balance */}
                    <div className="flex justify-between text-secondary-900 font-bold text-sm mt-4 pt-3 border-t border-secondary-200">
                        <span>รวมยอดค้างชำระ</span>
                        <DataSourceTooltip isRealtime={false} source="calculated">
                            <span>{currency(outstanding + otherOutstandingOrders.reduce((s, o) => s + o.outstanding, 0))}</span>
                        </DataSourceTooltip>
                    </div>

                    {/* Actions */}
                    {!hideControls && (
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
                    )}
                </div>
            </div>

            {/* QR Code Popup */}
            {
                showQrPopup && (
                    <div
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowQrPopup(false)}
                    >
                        <div
                            className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-auto relative animate-in zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setShowQrPopup(false)}
                                className="absolute -top-3 -right-3 p-2 bg-white text-secondary-500 hover:text-danger-500 rounded-full shadow-lg border border-secondary-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center">
                                <h3 className="text-lg font-bold text-secondary-900 mb-1">สแกนเพื่อชำระเงิน</h3>
                                <p className="text-secondary-500 text-sm mb-4">รองรับแอพธนาคารทุกธนาคาร</p>

                                <div className="bg-white p-2 rounded-xl border border-secondary-200 shadow-inner inline-block">
                                    <img
                                        src={promptpayQr}
                                        alt="PromptPay QR"
                                        className="w-64 h-64 object-contain"
                                    />
                                </div>

                                <div className="mt-4 pt-4 border-t border-secondary-100">
                                    <p className="text-secondary-500 text-sm mb-1">ยอดรวมที่ต้องชำระ</p>
                                    <div className="text-3xl font-bold text-primary-600">
                                        {currency(outstanding + otherOutstandingOrders.reduce((s, o) => s + o.outstanding, 0))}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-center gap-2 text-primary-600 font-medium text-sm">
                                    <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
                                    พร้อมรับชำระ
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
