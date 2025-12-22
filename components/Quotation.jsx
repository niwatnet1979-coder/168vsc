import React, { useState } from 'react'

function QRImage({ src, alt }) {
  const [url, setUrl] = useState(src)
  const [errored, setErrored] = useState(false)
  const [showModal, setShowModal] = useState(false)

  function handleError() {
    if (!errored) {
      // fallback to placeholder svg if original fails
      setErrored(true)
      setUrl('/qr.svg')
    }
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src={url}
        alt={alt}
        onError={handleError}
        onClick={() => setShowModal(true)}
        style={{ maxWidth: 100, width: '100%', height: 'auto', borderRadius: 6, border: '1px solid #eee', cursor: 'pointer' }}
      />

      {showModal && (
        <div className="qr-modal" onClick={() => setShowModal(false)}>
          <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
            <img src={url} alt={alt} style={{ maxWidth: '80vw', maxHeight: '80vh', width: 'auto', height: 'auto', display: 'block' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <a href={url} download style={{ fontSize: 14, textDecoration: 'none', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 6 }}>ดาวน์โหลด</a>
              <button onClick={() => setShowModal(false)} style={{ fontSize: 14, padding: '8px 12px', borderRadius: 6 }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .qr-modal{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999}
        .qr-modal-content{background:#fff;padding:16px;border-radius:8px;max-width:90%;max-height:90%;box-shadow:0 8px 24px rgba(0,0,0,0.3)}
      `}</style>
    </div>
  )
}

function currency(n) {
  return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}

export default function Quotation({ data }) {
  const subtotal = data.items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
  const vatRate = data.company.vatRegistered ? 0.07 : 0
  // Initialize state from savedData if available
  const saved = data.savedData || {}

  const [discountMode, setDiscountMode] = useState(saved.discount_type || 'percent')
  const [discountValue, setDiscountValue] = useState(saved.discount_value || 0)
  const [depositPercent, setDepositPercent] = useState(saved.deposit_percent !== undefined ? saved.deposit_percent : 50)

  // Terms and Notes state
  const [terms, setTerms] = useState(saved.terms || data.terms) // Fallback to prop default
  const [notes, setNotes] = useState(saved.notes || '')

  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'success', 'error', null

  // calculate discount (apply on subtotal before VAT)
  let discountPercent = 0
  let discountAmount = 0
  if (discountMode === 'percent') {
    discountPercent = Number(discountValue) || 0
    discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100
  } else {
    discountAmount = Math.round((Number(discountValue) || 0) * 100) / 100
    discountPercent = subtotal > 0 ? Math.round((discountAmount / subtotal) * 10000) / 100 : 0
  }
  if (discountAmount > subtotal) discountAmount = subtotal

  const vatAmount = Math.round((subtotal - discountAmount) * vatRate * 100) / 100
  const total = Math.round((subtotal - discountAmount + vatAmount) * 100) / 100
  const depositAmount = Math.round((total * (depositPercent / 100)) * 100) / 100
  const outstanding = Math.round((total - depositAmount) * 100) / 100

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      // Import dynamically or pass as prop if DataManager is not available here?
      // Assuming DataManager is imported or window.DataManager
      // Ideally we should import it at top.
      const { DataManager } = require('../lib/dataManager')

      const payload = {
        order_id: data.id,
        quotation_number: data.quotationNumber,
        discount_value: discountValue,
        discount_type: discountMode,
        deposit_percent: depositPercent,
        valid_until: data.validUntil, // Could be editable too
        terms: terms,
        notes: notes
      }

      const res = await DataManager.saveQuotation(payload)
      if (res.success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus('error')
      }
    } catch (e) {
      console.error(e)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="quotation">
      <div className="print-controls flex items-center justify-end gap-2">
        {saveStatus === 'success' && <span className="text-green-600 text-sm font-medium">บันทึกเรียบร้อย</span>}
        {saveStatus === 'error' && <span className="text-red-600 text-sm font-medium">บันทึกไม่สำเร็จ</span>}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
        </button>
        <button onClick={() => window.print()} className="btn-primary">พิมพ์ / บันทึกเป็น PDF</button>
      </div>
      <header className="q-header">
        <div>
          <h2>{data.company.name}</h2>
          <div>{data.company.branch}</div>
          <div>{data.company.address}</div>
          <div>Tax ID: {data.company.taxId}</div>
          <div>Phone: {data.company.phone} | {data.company.email}</div>
        </div>
        <div className="q-meta">
          <h3>ใบเสนอราคา</h3>
          <div><strong>เลขที่:</strong> {data.quotationNumber}</div>
          <div><strong>วันที่:</strong> {data.date}</div>
          <div><strong>วันที่สิ้นสุดความถูกต้อง:</strong> {data.validUntil}</div>
        </div>
      </header>

      <section className="q-customer">
        <h4>ข้อมูลลูกค้า</h4>
        <div style={{ marginTop: 6 }}><strong>ผู้ติดต่อ1:</strong> {data.customer.contact1?.name} &nbsp; <strong>โทร:</strong> {data.customer.contact1?.phone}</div>
        <div style={{ marginTop: 6 }}><strong>ผู้ติดต่อ2:</strong> {data.customer.contact2?.name} &nbsp; <strong>โทร:</strong> {data.customer.contact2?.phone}</div>
        <div style={{ marginTop: 8 }}><strong>ข้อมูลใบกำกับภาษี:</strong> {data.customer.invoiceName}</div>
        <div><strong>เลขที่ใบกำกับภาษี:</strong> {data.customer.invoiceTaxId}</div>
        <div><strong>ที่อยู่:</strong> {data.customer.address}</div>
      </section>

      <table className="q-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th style={{ width: '80px' }}>รูปภาพ</th>
            <th>รายละเอียด</th>
            <th>จำนวน</th>
            <th>ราคาต่อหน่วย</th>
            <th>รวม</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((it, idx) => (
            <tr key={idx}>
              <td>{idx + 1}</td>
              <td style={{ textAlign: 'center' }}>
                {it.image ? (
                  <img src={it.image} alt={it.description} style={{ maxWidth: '60px', maxHeight: '60px', objectFit: 'contain' }} />
                ) : '-'}
              </td>
              <td>{it.description}</td>
              <td style={{ textAlign: 'right' }}>{it.qty}</td>
              <td style={{ textAlign: 'right' }}>{currency(it.unitPrice)}</td>
              <td style={{ textAlign: 'right' }}>{currency(it.qty * it.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>รวมเป็นเงิน</td>
            <td style={{ textAlign: 'right' }}>{currency(subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>
              <div className="table-footer-label-group">
                <span>ส่วนลด</span>
                <div className="table-discount-controls">
                  <select value={discountMode} onChange={(e) => setDiscountMode(e.target.value)}>
                    <option value="percent">%</option>
                    <option value="amount">฿</option>
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={discountMode === 'percent' ? 100 : subtotal}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </td>
            <td style={{ textAlign: 'right' }}>
              {discountAmount > 0 ? ('-' + currency(discountAmount)) : '0.00'}
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>จำนวนเงินก่อนภาษี</td>
            <td style={{ textAlign: 'right' }}>{currency(Math.round((subtotal - discountAmount) * 100) / 100)}</td>
          </tr>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>ภาษีมูลค่าเพิ่ม (VAT) {(vatRate * 100).toFixed(0)}%</td>
            <td style={{ textAlign: 'right' }}>{currency(vatAmount)}</td>
          </tr>
          <tr className="row-total">
            <td colSpan={5} style={{ textAlign: 'right' }}><strong>ยอดรวมทั้งสิ้น</strong></td>
            <td style={{ textAlign: 'right' }}><strong>{currency(total)}</strong></td>
          </tr>
          <tr>
            <td colSpan={5} style={{ textAlign: 'right' }}>
              <div className="table-footer-label-group">
                <span>มัดจำ ({depositPercent}%)</span>
                <input
                  type="number"
                  className="input-deposit"
                  min={0}
                  max={100}
                  value={depositPercent}
                  onChange={(e) => setDepositPercent(Number(e.target.value) || 0)}
                />
              </div>
            </td>
            <td style={{ textAlign: 'right' }}>{currency(depositAmount)}</td>
          </tr>
          <tr className="row-outstanding">
            <td colSpan={5} style={{ textAlign: 'right' }}>
              <strong>{data.jobType === 'installation' ? 'ยอดคงค้างที่ชำระหน้างาน' : 'ยอดที่ต้องชำระก่อนวันจัดส่ง'}</strong>
            </td>
            <td style={{ textAlign: 'right' }}><strong>{currency(outstanding)}</strong></td>
          </tr>
        </tfoot>
      </table>
      <div className="bottom-container">
        <div className="bottom-left">
          {data.qr?.image && (
            <div className="qr-install-row">
              <div className="qr-thumb">
                <QRImage src={data.qr.image} alt="QR Payment" />
              </div>
              <div className="installation-block">
                <h4 className="installation-title">ข้อมูลการติดตั้ง / จัดส่ง</h4>
                <div className="installation-date"><strong>วันที่นัดหมายติดตั้ง / จัดส่งสินค้า:</strong> {data.installation?.appointmentDate}</div>
                <div className="installation-contacts">
                  <div className="contact-title">Contact หน้างาน:</div>
                  <div className="onsite-list">
                    {data.installation?.onsiteContacts?.map((c, idx) => (
                      <div className="onsite-item" key={idx}>
                        <span className="onsite-idx">{idx + 1}.</span>
                        <span className="onsite-name">{c.name}</span>
                        <span className="onsite-phone">— {c.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bottom-right">
          {/* Totals moved to table footer */}
        </div>
      </div>

      <section className="q-terms">
        <h4>เงื่อนไข (แก้ไขได้)</h4>
        <textarea
          className="w-full border border-gray-200 rounded p-2 text-xs"
          rows={4}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
        />
      </section>

      <section className="q-note">
        <h4>หมายเหตุ / Note</h4>
        <textarea
          placeholder="พิมพ์หมายเหตุเพิ่มเติมที่นี่..."
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      <section className="q-signature">
        <div className="q-sign-grid">
          <div className="sig-block">
            <div>ลงชื่อ (ลูกค้า) __________________________</div>
            <div style={{ marginTop: 8 }}>ชื่อ: ________________________</div>
            <div>ตำแหน่ง: ________________________</div>
            <div>วันที่: __________________________</div>
          </div>
          <div className="sig-block">
            <div>ลงชื่อ (พนักงาน) __________________________</div>
            <div style={{ marginTop: 8 }}>ชื่อ: ________________________</div>
            <div>ตำแหน่ง: ________________________</div>
            <div>วันที่: __________________________</div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Layout optimized for A4 printing (readable default) */
        .quotation{width:170mm;max-width:100%;margin:0 auto;border:1px solid #e6e6e6;padding:24px;background:#fff;box-sizing:border-box;font-size:13px;line-height:1.4; font-family: 'Sarabun', sans-serif;}
        .print-controls{display:flex;justify-content:flex-end;margin-bottom:12px}
        .btn-primary{background:#0070f3;color:#fff;padding:8px 16px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500}
        .btn-primary:active{transform:translateY(1px)}
        
        .q-header{display:flex;justify-content:space-between;border-bottom:2px solid #eee;padding-bottom:16px;margin-bottom:20px;align-items:flex-start}
        .q-header h2{margin:0 0 4px 0;font-size:20px;font-weight:700;color:#000}
        .q-header > div:first-child{flex:1 1 60%}
        .q-meta{flex:0 0 35%;text-align:right;font-size:13px;line-height:1.6}
        
        .q-customer{margin-bottom:20px;font-size:13px;line-height:1.6;background:#f9f9f9;padding:12px;border-radius:8px;border:1px solid #eee}
        .q-customer h4{margin:0 0 8px 0;font-size:14px;font-weight:700;text-decoration:underline}
        
        .q-table{width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px}
        .q-table th{border:1px solid #ddd;padding:10px;font-size:13px;background:#f5f5f5;font-weight:600;color:#333}
        .q-table td{border:1px solid #ddd;padding:10px;font-size:13px;vertical-align:top}
        
        /* Footer inputs & controls */
        .table-footer-label-group{display:flex;justify-content:flex-end;align-items:center;gap:12px}
        .table-discount-controls{display:inline-flex;align-items:center;gap:4px}
        .table-discount-controls select{padding:4px;border:1px solid #ccc;border-radius:4px;font-size:12px;background:#fff;cursor:pointer}
        .table-discount-controls input{width:60px;padding:4px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:right}
        .input-deposit{width:60px;padding:4px 8px;border:1px solid #ccc;border-radius:4px;font-size:12px;text-align:right}
        
        .q-table tfoot td{padding:8px 10px;border:1px solid #ddd;}
        .row-total td{background:#fafafa;border-top:2px solid #ddd;border-bottom:2px solid #ddd}
        .row-outstanding td{background:#f0f7ff;border:1px solid #cce5ff;color:#004085}
        
        .q-terms{font-size:12px;margin-bottom:20px;color:#444}
        .q-terms p{margin:4px 0;text-align:justify;line-height:1.5}
        
        .q-signature{margin-top:32px;page-break-inside:avoid}
        .q-note{margin-top:20px}
        .q-note textarea{width:100%;border:1px solid #ddd;padding:12px;border-radius:6px;font-size:13px;line-height:1.5;box-sizing:border-box;resize:vertical;font-family:inherit;min-height:80px}
        
        .q-sign-grid{display:flex;gap:32px;justify-content:space-between;flex-wrap:wrap;margin-top:20px}
        .sig-block{width:45%;min-width:220px;text-align:center}
        .sig-line{border-bottom:1px solid #000;display:inline-block;width:100%;margin-bottom:4px}

        /* Bottom Section Layout */
        .bottom-container {
          width: 100%;
          margin: 0 0 24px 0;
          display: flex;
          justify-content: flex-start; /* Left align since right block is gone */
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .bottom-left {
          flex: 0 0 auto;
          width: 100%;
          max-width: 500px; /* Limit width of QR block */
        }
        .bottom-right {
          display: none; /* Hidden as requested */
        }

        /* QR + installation row layout */
        .qr-install-row{display:flex;gap:24px;justify-content:flex-start;align-items:flex-start;margin:0;padding-left:0;background:#fff;border:1px solid #eee;border-radius:8px;padding:16px}
        .qr-thumb{width:110px;text-align:center;flex-shrink:0}
        .qr-thumb img{max-width:100%;height:auto;border-radius:4px;border:1px solid #eee}
        .installation-block{flex:1;text-align:left;font-size:13px;color:#333}
        .installation-title{margin:0 0 8px 0;font-size:14px;font-weight:700;color:#000}
        .installation-date{margin-bottom:12px;font-weight:600}
        .contact-title{margin-bottom:6px;font-weight:700}
        .onsite-list{margin-top:6px;border-top:1px solid #eee;padding-top:6px}
        .onsite-item{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:13px}
        .onsite-idx{font-weight:600;color:#0070f3;margin-right:8px}
        .onsite-name{color:#222;flex:1}
        .onsite-phone{color:#555;text-align:right}

        @media (max-width:700px){
          .qr-install-row{flex-direction:column;align-items:center;text-align:center}
          .installation-block{text-align:center;width:100%}
          .onsite-item{text-align:left}
          .table-footer-label-group{flex-direction:column;align-items:flex-end;gap:4px}
        }

        @media print {
          .qr-wrapper{display:none}
          body, html {background: #fff}
          .print-controls {display: none}
          .quotation {border: none; box-shadow: none; margin: 0; padding: 0; width: 100%; max-width: none;}
          .q-table th,.q-table td{padding:6px;font-size:11px}
          .q-header h2{font-size:18px}
          .q-note textarea{border:1px solid #eee;font-size:11px;padding:4px;resize:none}
          .sig-block{width:40%}
          .bottom-container { page-break-inside: avoid; }
          @page { size: A4; margin: 15mm }
        }
      `}</style>
    </div >
  )
}
