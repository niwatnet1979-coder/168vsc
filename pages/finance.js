import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Mock Finance Data
const MOCK_PAYMENTS = [
    {
        id: 'ORD-001',
        date: '2024-11-25',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        total: 83745,
        deposit: 41872.50,
        paid: 41872.50,
        outstanding: 41872.50,
        status: 'Partial',
        dueDate: '2024-12-10'
    },
    {
        id: 'ORD-002',
        date: '2024-11-24',
        customer: 'ร้านค้าปลีก ABC',
        total: 15000,
        deposit: 7500,
        paid: 15000,
        outstanding: 0,
        status: 'Paid',
        dueDate: '2024-12-05'
    },
    {
        id: 'ORD-003',
        date: '2024-11-23',
        customer: 'คุณวิชัย มั่งคั่ง',
        total: 3500,
        deposit: 3500,
        paid: 3500,
        outstanding: 0,
        status: 'Paid',
        dueDate: '2024-11-30'
    },
    {
        id: 'ORD-004',
        date: '2024-11-20',
        customer: 'โรงแรม Grand Plaza',
        total: 125000,
        deposit: 62500,
        paid: 62500,
        outstanding: 62500,
        status: 'Partial',
        dueDate: '2024-12-15'
    },
    {
        id: 'ORD-005',
        date: '2024-11-18',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        total: 45000,
        deposit: 22500,
        paid: 0,
        outstanding: 45000,
        status: 'Unpaid',
        dueDate: '2024-12-01'
    }
]

export default function FinancePage() {
    const [filter, setFilter] = useState('all') // all, paid, partial, unpaid, overdue
    const [searchTerm, setSearchTerm] = useState('')

    // Calculate totals
    const stats = {
        totalRevenue: MOCK_PAYMENTS.reduce((sum, p) => sum + p.total, 0),
        totalPaid: MOCK_PAYMENTS.reduce((sum, p) => sum + p.paid, 0),
        totalOutstanding: MOCK_PAYMENTS.reduce((sum, p) => sum + p.outstanding, 0),
        totalDeposit: MOCK_PAYMENTS.reduce((sum, p) => sum + p.deposit, 0)
    }

    // Filter payments
    const filteredPayments = MOCK_PAYMENTS.filter(payment => {
        const matchesSearch =
            payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.customer.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        const today = new Date()
        const dueDate = new Date(payment.dueDate)
        const isOverdue = payment.outstanding > 0 && dueDate < today

        switch (filter) {
            case 'paid':
                return payment.status === 'Paid'
            case 'partial':
                return payment.status === 'Partial'
            case 'unpaid':
                return payment.status === 'Unpaid'
            case 'overdue':
                return isOverdue
            default:
                return true
        }
    })

    const countByStatus = {
        paid: MOCK_PAYMENTS.filter(p => p.status === 'Paid').length,
        partial: MOCK_PAYMENTS.filter(p => p.status === 'Partial').length,
        unpaid: MOCK_PAYMENTS.filter(p => p.status === 'Unpaid').length,
        overdue: MOCK_PAYMENTS.filter(p => {
            const today = new Date()
            const dueDate = new Date(p.dueDate)
            return p.outstanding > 0 && dueDate < today
        }).length
    }

    return (
        <>
            <Head>
                <title>การเงิน - Finance Management</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="finance-page">
                <header className="page-header">
                    <div className="header-content">
                        <h1>💰 การเงิน</h1>
                        <p className="subtitle">Finance & Payment Management</p>
                    </div>
                    <Link href="/" className="btn-back">← กลับหน้าหลัก</Link>
                </header>

                {/* Summary Stats */}
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">💵</div>
                        <div className="stat-content">
                            <div className="stat-label">ยอดรวมทั้งหมด</div>
                            <div className="stat-value">฿{stats.totalRevenue.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="stat-card paid">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <div className="stat-label">รับชำระแล้ว</div>
                            <div className="stat-value">฿{stats.totalPaid.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="stat-card outstanding">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <div className="stat-label">ค้างชำระ</div>
                            <div className="stat-value">฿{stats.totalOutstanding.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="stat-card deposit">
                        <div className="stat-icon">🏦</div>
                        <div className="stat-content">
                            <div className="stat-label">มัดจำรวม</div>
                            <div className="stat-value">฿{stats.totalDeposit.toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        ทั้งหมด ({MOCK_PAYMENTS.length})
                    </button>
                    <button
                        className={filter === 'paid' ? 'active' : ''}
                        onClick={() => setFilter('paid')}
                    >
                        ชำระครบแล้ว ({countByStatus.paid})
                    </button>
                    <button
                        className={filter === 'partial' ? 'active' : ''}
                        onClick={() => setFilter('partial')}
                    >
                        ชำระบางส่วน ({countByStatus.partial})
                    </button>
                    <button
                        className={filter === 'unpaid' ? 'active' : ''}
                        onClick={() => setFilter('unpaid')}
                    >
                        ยังไม่ชำระ ({countByStatus.unpaid})
                    </button>
                    <button
                        className={`${filter === 'overdue' ? 'active' : ''} overdue-btn`}
                        onClick={() => setFilter('overdue')}
                    >
                        เกินกำหนด ({countByStatus.overdue})
                    </button>
                </div>

                {/* Search */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="🔍 ค้นหา Order ID หรือชื่อลูกค้า..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Payments Table */}
                <div className="table-container">
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>วันที่</th>
                                <th>ลูกค้า</th>
                                <th className="text-right">ยอดรวม</th>
                                <th className="text-right">มัดจำ</th>
                                <th className="text-right">ชำระแล้ว</th>
                                <th className="text-right">คงค้าง</th>
                                <th>กำหนดชำระ</th>
                                <th>สถานะ</th>
                                <th className="text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.length > 0 ? (
                                filteredPayments.map(payment => {
                                    const today = new Date()
                                    const dueDate = new Date(payment.dueDate)
                                    const isOverdue = payment.outstanding > 0 && dueDate < today

                                    return (
                                        <tr key={payment.id} className={isOverdue ? 'overdue-row' : ''}>
                                            <td>
                                                <Link href={`/orders/${payment.id}`} className="order-link">
                                                    {payment.id}
                                                </Link>
                                            </td>
                                            <td>{payment.date}</td>
                                            <td className="customer-name">{payment.customer}</td>
                                            <td className="text-right">฿{payment.total.toLocaleString()}</td>
                                            <td className="text-right">฿{payment.deposit.toLocaleString()}</td>
                                            <td className="text-right paid-amount">฿{payment.paid.toLocaleString()}</td>
                                            <td className="text-right outstanding-amount">
                                                {payment.outstanding > 0 ? `฿${payment.outstanding.toLocaleString()}` : '-'}
                                            </td>
                                            <td className={isOverdue ? 'overdue-date' : ''}>
                                                {payment.dueDate}
                                                {isOverdue && ' ⚠️'}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${payment.status.toLowerCase()}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn-payment">บันทึกการชำระ</button>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan="10" className="text-center empty-state">
                                        ไม่พบข้อมูลการเงิน
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <style jsx>{`
                    .finance-page {
                        min-height: 100vh;
                        background: #f5f7fa;
                        padding: 24px;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .page-header {
                        background: white;
                        padding: 32px;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        margin-bottom: 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .header-content h1 {
                        margin: 0 0 8px 0;
                        font-size: 32px;
                        color: #1a202c;
                    }
                    .subtitle {
                        margin: 0;
                        color: #718096;
                        font-size: 16px;
                    }
                    .btn-back {
                        background: white;
                        color: #4a5568;
                        border: 1px solid #e2e8f0;
                        text-decoration: none;
                        font-size: 14px;
                        font-weight: 600;
                        padding: 10px 20px;
                        border-radius: 6px;
                        transition: all 0.2s;
                        display: inline-block;
                    }
                    .btn-back:hover {
                        background: #f7fafc;
                        border-color: #cbd5e0;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .stat-card {
                        background: white;
                        padding: 24px;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .stat-icon {
                        font-size: 48px;
                        width: 72px;
                        height: 72px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 12px;
                    }
                    .stat-card.total .stat-icon { background: #f0f7ff; }
                    .stat-card.paid .stat-icon { background: #f0fff4; }
                    .stat-card.outstanding .stat-icon { background: #fffaf0; }
                    .stat-card.deposit .stat-icon { background: #fef5ff; }
                    .stat-content {
                        flex: 1;
                    }
                    .stat-label {
                        font-size: 14px;
                        color: #718096;
                        margin-bottom: 4px;
                    }
                    .stat-value {
                        font-size: 28px;
                        font-weight: 700;
                        color: #1a202c;
                    }
                    .filter-tabs {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 24px;
                        background: white;
                        padding: 16px;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        flex-wrap: wrap;
                    }
                    .filter-tabs button {
                        padding: 10px 20px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #4a5568;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .filter-tabs button:hover {
                        border-color: #0070f3;
                        color: #0070f3;
                    }
                    .filter-tabs button.active {
                        background: #0070f3;
                        border-color: #0070f3;
                        color: white;
                    }
                    .filter-tabs button.overdue-btn:hover {
                        border-color: #dc2626;
                        color: #dc2626;
                    }
                    .filter-tabs button.overdue-btn.active {
                        background: #dc2626;
                        border-color: #dc2626;
                    }
                    .search-bar {
                        margin-bottom: 24px;
                    }
                    .search-bar input {
                        width: 100%;
                        padding: 16px 20px;
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        font-size: 16px;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .search-bar input:focus {
                        outline: none;
                        border-color: #0070f3;
                        box-shadow: 0 0 0 3px rgba(0,112,243,0.1);
                    }
                    .table-container {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                        overflow-x: auto;
                    }
                    .finance-table {
                        width: 100%;
                        border-collapse: collapse;
                        min-width: 1200px;
                    }
                    .finance-table thead {
                        background: #f7fafc;
                    }
                    .finance-table th {
                        padding: 16px 12px;
                        text-align: left;
                        font-size: 13px;
                        font-weight: 600;
                        color: #4a5568;
                        border-bottom: 2px solid #edf2f7;
                    }
                    .finance-table td {
                        padding: 16px 12px;
                        border-bottom: 1px solid #edf2f7;
                        color: #2d3748;
                        font-size: 14px;
                    }
                    .finance-table tr:hover {
                        background: #f7fafc;
                    }
                    .overdue-row {
                        background: #fff5f5 !important;
                    }
                    .overdue-row:hover {
                        background: #fed7d7 !important;
                    }
                    .order-link {
                        color: #0070f3;
                        text-decoration: none;
                        font-weight: 600;
                        font-family: monospace;
                    }
                    .order-link:hover {
                        text-decoration: underline;
                    }
                    .customer-name {
                        font-weight: 500;
                    }
                    .paid-amount {
                        color: #22543d;
                        font-weight: 600;
                    }
                    .outstanding-amount {
                        color: #c53030;
                        font-weight: 700;
                    }
                    .overdue-date {
                        color: #c53030;
                        font-weight: 600;
                    }
                    .status-badge {
                        padding: 4px 12px;
                        border-radius: 99px;
                        font-size: 12px;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .status-badge.paid {
                        background: #c6f6d5;
                        color: #22543d;
                    }
                    .status-badge.partial {
                        background: #feebc8;
                        color: #744210;
                    }
                    .status-badge.unpaid {
                        background: #fed7d7;
                        color: #742a2a;
                    }
                    .btn-payment {
                        padding: 6px 12px;
                        background: #10b981;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .btn-payment:hover {
                        background: #059669;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .empty-state {
                        padding: 48px;
                        color: #a0aec0;
                        font-size: 16px;
                    }
                `}</style>
            </div>
        </>
    )
}
