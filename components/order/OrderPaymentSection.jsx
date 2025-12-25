import React from 'react'
import { CreditCard } from 'lucide-react'
import PaymentSummaryCard from '../PaymentSummaryCard'

/**
 * OrderPaymentSection Component
 * Handles payment schedule display and management
 */
export default function OrderPaymentSection({
    // Payment data
    paymentSchedule,

    // Financial data
    total,
    totalPaid,
    outstanding,

    // Settings
    promptpayQr,

    // Handlers
    onAddPayment,
    onEditPayment,
    onDeletePayment,

    // Modal state
    showPaymentModal,
    setShowPaymentModal,
    editingPaymentIndex,
    setEditingPaymentIndex
}) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="text-primary-600" size={20} />
                การชำระเงิน
            </h3>

            <PaymentSummaryCard
                paymentSchedule={paymentSchedule}
                total={total}
                totalPaid={totalPaid}
                outstanding={outstanding}
                promptpayQr={promptpayQr}
                onAddPayment={onAddPayment}
                onEditPayment={onEditPayment}
                onDeletePayment={onDeletePayment}
                showPaymentModal={showPaymentModal}
                setShowPaymentModal={setShowPaymentModal}
                editingPaymentIndex={editingPaymentIndex}
                setEditingPaymentIndex={setEditingPaymentIndex}
            />
        </div>
    )
}
