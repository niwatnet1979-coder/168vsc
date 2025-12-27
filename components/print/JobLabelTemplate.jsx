
import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function JobLabelTemplate({ job, customer, boxNumber, totalBoxes }) {
    // Standard Shipping Label Size: 4x6 inches
    // Using simple styling for print
    const containerStyle = {
        width: '4in',
        height: '6in',
        padding: '0.2in',
        boxSizing: 'border-box',
        border: '1px solid #ccc', // Visible border for cutting or simple frame
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        overflow: 'hidden',
        position: 'relative'
    }

    if (!job) return null

    // Extract Address
    const address = job.installAddress || job.address || 'No Address'
    const contactName = customer?.name || job.customerName || 'No Name'
    const contactPhone = customer?.phone || job.customerPhone || '-'

    return (
        <div className="job-label" style={containerStyle}>
            {/* Header: Box Count */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>JOB ID: {job.id}</div>
                {totalBoxes && (
                    <div style={{ fontSize: '18px', fontWeight: 'bold', border: '2px solid black', padding: '2px 8px', borderRadius: '4px' }}>
                        BOX {boxNumber} / {totalBoxes}
                    </div>
                )}
            </div>

            {/* Customer & Address */}
            <div style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Ship To:</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '5px' }}>
                    {contactName}
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                    {address}
                </div>
                <div style={{ fontSize: '14px', marginTop: '5px', fontWeight: 'bold' }}>
                    Tel: {contactPhone}
                </div>
            </div>

            {/* Product Info */}
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>Product:</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {job.productName || 'Unknown Product'}
                </div>
                {job.product?.product_code && (
                    <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                        SKU: {job.product.product_code}
                    </div>
                )}
                {job.notes && job.notes !== '-' && (
                    <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic', border: '1px dashed #ccc', padding: '5px' }}>
                        Note: {job.notes}
                    </div>
                )}
            </div>

            {/* Footer: Team & QR */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '10px', borderTop: '2px solid black', paddingTop: '10px' }}>
                <div>
                    <div style={{ fontSize: '10px', color: '#666' }}>Assigned Team</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {job.assignedTeam || job.team || 'N/A'}
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '5px' }}>
                        {new Date().toLocaleDateString('th-TH')}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <QRCodeSVG value={job.id} size={96} level="M" />
                    <div style={{ fontSize: '9px', marginTop: '2px' }}>SCAN FOR JOB</div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: 4in 6in;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                    .job-label {
                        border: none !important; /* Remove guide border on print */
                    }
                }
            `}</style>
        </div>
    )
}
