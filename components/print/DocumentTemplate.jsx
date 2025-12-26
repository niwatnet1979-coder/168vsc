import React, { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

// Helper function for currency formatting
function currency(n) {
    return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}

// Thai Date Formatter
function formatDate(dateStr) {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export default function DocumentTemplate({ type, payment, order, customer, settings, showItems }) {
    // type: 'IV' (Invoice/Tax Invoice) or 'RC' (Receipt)

    const isInvoice = type === 'IV'
    const docTitle = isInvoice ? 'ใบแจ้งหนี้ / ใบกำกับภาษี' : 'ใบเสร็จรับเงิน'
    const docNo = isInvoice ? payment.invoiceNo : payment.receiptNo
    const docDate = isInvoice ? payment.invoiceDate : payment.receiptDate

    // Company Info (Default or from settings)
    const company = {
        name: settings?.shopName || 'บริษัท 168 ไลท์ติ้ง แอนด์ เบดดิ้ง จำกัด',
        address: settings?.shopAddress || 'เลขที่ 168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
        taxid: settings?.shopTaxId || '0135566027619',
        phone: settings?.shopPhone || '084-282-9465',
        email: settings?.shopEmail || 'LINE@: @interior-lighting',
        branch: 'สำนักงานใหญ่' // Hardcoded for now or add to settings
    }

    // Calculate totals
    const amount = Number(payment.amount || 0)
    // Extract VAT if needed. Assuming the payment amount matches the 'total' (inclusive of VAT7%)
    // If user is VAT registered:
    const vatRate = 0.07
    const amountBeforeVat = Math.round((amount / 1.07) * 100) / 100
    const vatAmount = Math.round((amount - amountBeforeVat) * 100) / 100

    return (
        <div className="document-container">
            {/* Header */}
            <header className="doc-header">
                <div className="company-info">
                    <h1 className="company-name">{company.name}</h1>
                    <div className="company-details">
                        <p>{company.address}</p>
                        <p>
                            <strong>เลขประจำตัวผู้เสียภาษี:</strong> {company.taxid} &nbsp;
                            <strong>({company.branch})</strong>
                        </p>
                        <p><strong>โทร:</strong> {company.phone} &nbsp; <strong>Email/Line:</strong> {company.email}</p>
                    </div>
                </div>
                <div className="doc-meta">
                    <h2 className="doc-title">{docTitle}</h2>
                    <div className="meta-row">
                        <span className="meta-label">เลขที่เอกสาร:</span>
                        <span className="meta-value">{docNo}</span>
                    </div>
                    <div className="meta-row">
                        <span className="meta-label">วันที่:</span>
                        <span className="meta-value">{formatDate(docDate)}</span>
                    </div>
                    <div className="meta-row">
                        <span className="meta-label">อ้างอิงออเดอร์:</span>
                        <span className="meta-value">{order.id?.substring(0, 8).toUpperCase()}</span>
                    </div>
                </div>
            </header>

            {/* Customer Section */}
            <section className="customer-section">
                <div className="box-title">ลูกค้า (Customer)</div>
                <div className="customer-details">
                    <p><strong>ชื่อ:</strong> {customer.name}</p>
                    <p><strong>ที่อยู่:</strong> {customer.address || '-'}</p>
                    <p><strong>เลขประจำตัวผู้เสียภาษี:</strong> {customer.taxid || '-'}</p>
                    <p><strong>โทร:</strong> {customer.phone || '-'}</p>
                </div>
            </section>

            {/* Items Table */}
            <table className="doc-table">
                <thead>
                    <tr>
                        <th style={{ width: '50px', textAlign: 'center' }}>ลำดับ</th>
                        <th>รายการ (Description)</th>
                        <th style={{ width: '150px', textAlign: 'right' }}>จำนวนเงิน (Amount)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style={{ textAlign: 'center' }}>1</td>
                        <td>
                            <div className="item-title">ชำระค่าสินค้า/บริการ (Payment for Goods/Services)</div>
                            <div className="item-desc">
                                อ้างอิงใบสั่งซื้อเลขที่ {order.id?.substring(0, 8)}
                                {payment.type && ` (${payment.type})`}
                            </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>{currency(amount)}</td>
                    </tr>
                    {/* Empty rows filler */}
                    <tr>
                        <td style={{ height: '50px' }}></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={2} className="text-right label-cell">จำนวนเงินรวมก่อนภาษีมูลค่าเพิ่ม (Subtotal)</td>
                        <td className="text-right value-cell">{currency(amountBeforeVat)}</td>
                    </tr>
                    <tr>
                        <td colSpan={2} className="text-right label-cell">ภาษีมูลค่าเพิ่ม (VAT 7%)</td>
                        <td className="text-right value-cell">{currency(vatAmount)}</td>
                    </tr>
                    <tr className="grand-total-row">
                        <td colSpan={2} className="text-right label-cell"><strong>จำนวนเงินรวมทั้งสิ้น (Grand Total)</strong></td>
                        <td className="text-right value-cell"><strong>{currency(amount)}</strong></td>
                    </tr>
                </tfoot>
            </table>

            {/* Reference Items List (Optional) */}
            {showItems && order.items && order.items.length > 0 && (
                <div style={{ marginTop: '20px', marginBottom: '20px', pageBreakInside: 'avoid' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
                        รายการสินค้าอ้างอิง (Reference Items)
                    </div>
                    <table style={{ width: '100%', fontSize: '12px', color: '#555' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb' }}>
                                <th style={{ textAlign: 'left', padding: '4px' }}>สินค้า</th>
                                <th style={{ textAlign: 'right', padding: '4px', width: '60px' }}>จำนวน</th>
                                <th style={{ textAlign: 'right', padding: '4px', width: '100px' }}>รวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, i) => {
                                const sku = item.sku || item.variant?.sku || item.product?.product_code || item.code || '-'
                                const name = item.product?.name || item.name || 'รายการสินค้า'
                                const dim = item.dimensions || (item.width && item.height ? `${item.width}x${item.height}cm` : '')
                                const color = item.variant?.color ? ` (${item.variant.color})` : ''
                                const qty = item.qty || item.quantity || 1
                                const price = item.price || item.unit_price || 0
                                const total = price * qty

                                return (
                                    <tr key={i} style={{ borderBottom: '1px dashed #eee' }}>
                                        <td style={{ padding: '4px' }}>
                                            <div style={{ fontWeight: '600' }}>{name}</div>
                                            <div style={{ fontSize: '11px', color: '#777' }}>
                                                {sku} {dim ? ` - ${dim}` : ''}{color}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '4px' }}>{qty}</td>
                                        <td style={{ textAlign: 'right', padding: '4px' }}>{currency(total)}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Signatures */}
            <section className="signatures-section">
                <div className="sig-block">
                    <div className="sig-line"></div>
                    <div className="sig-label">ผู้รับเงิน / Collector</div>
                    <div className="sig-date">วันที่: _____/_____/_____</div>
                </div>
                <div className="sig-block">
                    <div className="sig-line"></div>
                    <div className="sig-label">ผู้มีอำนาจลงนาม / Authorized Signature</div>
                    <div className="sig-date">วันที่: _____/_____/_____</div>
                </div>
            </section>

            {/* Styles */}
            <style jsx>{`
                .document-container {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    margin: 0 auto;
                    background: white;
                    box-sizing: border-box;
                    font-family: 'Sarabun', sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #333;
                    position: relative;
                }

                /* Header */
                .doc-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .company-info { flex: 1; padding-right: 10px; }
                .company-name { margin: 0 0 5px; font-size: 20px; font-weight: bold; color: #000; }
                .company-details p { margin: 0; font-size: 12px; color: #555; }
                
                .doc-meta { 
                    flex: 0 0 45%; 
                    background: #f9fafb;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #eee;
                }
                .doc-title { margin: 0 0 10px; font-size: 18px; font-weight: bold; text-align: center; color: #000; border-bottom: 2px solid #ddd; padding-bottom: 5px; white-space: nowrap; }
                .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                .meta-label { font-weight: bold; color: #555; }
                .meta-value { font-weight: 500; }

                /* Customer */
                .customer-section {
                    margin-bottom: 25px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .box-title {
                    background: #f3f4f6;
                    padding: 6px 12px;
                    font-weight: bold;
                    border-bottom: 1px solid #ddd;
                    font-size: 13px;
                }
                .customer-details { padding: 12px; }
                .customer-details p { margin: 2px 0; }

                /* Table */
                .doc-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                .doc-table th {
                    border: 1px solid #ccc;
                    background: #f3f4f6;
                    padding: 8px;
                    font-weight: bold;
                }
                .doc-table td {
                    border: 1px solid #ccc;
                    padding: 8px;
                    vertical-align: top;
                }
                .item-title { font-weight: 600; margin-bottom: 4px; }
                .item-desc { font-size: 12px; color: #666; }
                
                .label-cell { border-right: none; }
                .value-cell { border-left: none; }
                .grand-total-row td { background: #f9fafb; border-top: 2px solid #999; }

                /* Signatures */
                .signatures-section {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 50px;
                    padding-top: 20px;
                }
                .sig-block {
                    width: 40%;
                    text-align: center;
                }
                .sig-line {
                    border-bottom: 1px solid #000;
                    margin-bottom: 8px;
                    height: 30px;
                }
                .sig-label { font-weight: 600; font-size: 12px; }
                .sig-date { margin-top: 15px; font-size: 12px; color: #888; }

                @media print {
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .document-container { margin: 0; padding: 0; border: none; width: 100%; }
                    @page { size: A4; margin: 15mm; }
                }
            `}</style>
        </div>
    )
}
