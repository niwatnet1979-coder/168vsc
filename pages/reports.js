import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function ReportsPage() {
    const [period, setPeriod] = useState('month') // day, week, month, year

    // Mock Data
    const salesData = {
        today: { revenue: 83745, orders: 3, items: 12 },
        week: { revenue: 245000, orders: 8, items: 35 },
        month: { revenue: 1250000, orders: 42, items: 156 },
        year: { revenue: 8500000, orders: 385, items: 1420 }
    }

    const currentData = salesData[period]

    const topProducts = [
        { name: 'กล้องวงจรปิด HD', sold: 45, revenue: 157500 },
        { name: 'โคมไฟระย้าคริสตัล', sold: 12, revenue: 180000 },
        { name: 'หลอดไฟ LED 9W', sold: 200, revenue: 30000 },
        { name: 'รางไฟ Track Light', sold: 35, revenue: 15750 },
        { name: 'ไฟเส้น LED Strip RGB', sold: 28, revenue: 23800 }
    ]

    const topCustomers = [
        { name: 'บริษัท เทคโนโลยี จำกัด', orders: 15, revenue: 850000 },
        { name: 'โรงแรม Grand Plaza', orders: 8, revenue: 450000 },
        { name: 'ร้านค้าปลีก ABC', orders: 12, revenue: 280000 },
        { name: 'คุณวิชัย มั่งคั่ง', orders: 6, revenue: 125000 }
    ]

    const recentOrders = [
        { id: 'ORD-001', date: '2024-11-25', customer: 'บริษัท เทคโนโลยี จำกัด', total: 83745, status: 'Pending' },
        { id: 'ORD-002', date: '2024-11-24', customer: 'ร้านค้าปลีก ABC', total: 15000, status: 'Processing' },
        { id: 'ORD-003', date: '2024-11-23', customer: 'คุณวิชัย มั่งคั่ง', total: 3500, status: 'Completed' }
    ]

    return (
        <>
            <Head>
                <title>รายงานและสถิติ - Reports & Analytics</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="reports-page">
                <header className="page-header">
                    <div className="header-content">
                        <h1>📊 รายงานและสถิติ</h1>
                        <p className="subtitle">Reports & Analytics Dashboard</p>
                    </div>
                    <Link href="/" className="btn-back">← กลับหน้าหลัก</Link>
                </header>

                {/* Period Selector */}
                <div className="period-selector">
                    <button
                        className={period === 'today' ? 'active' : ''}
                        onClick={() => setPeriod('today')}
                    >
                        วันนี้
                    </button>
                    <button
                        className={period === 'week' ? 'active' : ''}
                        onClick={() => setPeriod('week')}
                    >
                        สัปดาห์นี้
                    </button>
                    <button
                        className={period === 'month' ? 'active' : ''}
                        onClick={() => setPeriod('month')}
                    >
                        เดือนนี้
                    </button>
                    <button
                        className={period === 'year' ? 'active' : ''}
                        onClick={() => setPeriod('year')}
                    >
                        ปีนี้
                    </button>
                </div>

                {/* Main Stats */}
                <div className="stats-grid">
                    <div className="stat-card revenue">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">ยอดขายรวม</div>
                            <div className="stat-value">฿{currentData.revenue.toLocaleString()}</div>
                        </div>
                    </div>
                    <div className="stat-card orders">
                        <div className="stat-icon">📦</div>
                        <div className="stat-content">
                            <div className="stat-label">จำนวนออเดอร์</div>
                            <div className="stat-value">{currentData.orders}</div>
                        </div>
                    </div>
                    <div className="stat-card items">
                        <div className="stat-icon">📋</div>
                        <div className="stat-content">
                            <div className="stat-label">รายการสินค้า</div>
                            <div className="stat-value">{currentData.items}</div>
                        </div>
                    </div>
                    <div className="stat-card average">
                        <div className="stat-icon">📈</div>
                        <div className="stat-content">
                            <div className="stat-label">ค่าเฉลี่ยต่อออเดอร์</div>
                            <div className="stat-value">฿{Math.round(currentData.revenue / currentData.orders).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="charts-grid">
                    {/* Top Products */}
                    <div className="card">
                        <h2>🏆 สินค้าขายดี</h2>
                        <div className="table-simple">
                            <table>
                                <thead>
                                    <tr>
                                        <th>สินค้า</th>
                                        <th className="text-center">ขายได้</th>
                                        <th className="text-right">รายได้</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProducts.map((product, i) => (
                                        <tr key={i}>
                                            <td>{product.name}</td>
                                            <td className="text-center">{product.sold}</td>
                                            <td className="text-right price">฿{product.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Top Customers */}
                    <div className="card">
                        <h2>👥 ลูกค้าประจำ</h2>
                        <div className="table-simple">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ลูกค้า</th>
                                        <th className="text-center">ออเดอร์</th>
                                        <th className="text-right">รายได้</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topCustomers.map((customer, i) => (
                                        <tr key={i}>
                                            <td>{customer.name}</td>
                                            <td className="text-center">{customer.orders}</td>
                                            <td className="text-right price">฿{customer.revenue.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="card">
                    <h2>📝 ออเดอร์ล่าสุด</h2>
                    <div className="table-simple">
                        <table>
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>วันที่</th>
                                    <th>ลูกค้า</th>
                                    <th className="text-right">ยอดรวม</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map(order => (
                                    <tr key={order.id}>
                                        <td>
                                            <Link href={`/orders/${order.id}`} className="order-link">
                                                {order.id}
                                            </Link>
                                        </td>
                                        <td>{order.date}</td>
                                        <td>{order.customer}</td>
                                        <td className="text-right price">฿{order.total.toLocaleString()}</td>
                                        <td>
                                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <style jsx>{`
                    .reports-page {
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
                    .period-selector {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 24px;
                        background: white;
                        padding: 16px;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }
                    .period-selector button {
                        flex: 1;
                        padding: 12px 24px;
                        border: 2px solid #e2e8f0;
                        background: white;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 600;
                        color: #4a5568;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-family: 'Sarabun', sans-serif;
                    }
                    .period-selector button:hover {
                        border-color: #0070f3;
                        color: #0070f3;
                    }
                    .period-selector button.active {
                        background: #0070f3;
                        border-color: #0070f3;
                        color: white;
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
                    .stat-card.revenue .stat-icon { background: #f0fff4; }
                    .stat-card.orders .stat-icon { background: #f0f7ff; }
                    .stat-card.items .stat-icon { background: #fffaf0; }
                    .stat-card.average .stat-icon { background: #fef5ff; }
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
                    .charts-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                        gap: 24px;
                        margin-bottom: 24px;
                    }
                    .card {
                        background: white;
                        padding: 24px;
                        border-radius: 12px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                    }
                    .card h2 {
                        margin: 0 0 20px 0;
                        font-size: 20px;
                        color: #1a202c;
                        border-bottom: 2px solid #edf2f7;
                        padding-bottom: 12px;
                    }
                    .table-simple {
                        overflow-x: auto;
                    }
                    .table-simple table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .table-simple th {
                        padding: 12px 8px;
                        text-align: left;
                        font-size: 13px;
                        font-weight: 600;
                        color: #4a5568;
                        border-bottom: 2px solid #edf2f7;
                    }
                    .table-simple td {
                        padding: 12px 8px;
                        border-bottom: 1px solid #edf2f7;
                        color: #2d3748;
                        font-size: 14px;
                    }
                    .table-simple tr:hover {
                        background: #f7fafc;
                    }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .price {
                        font-weight: 700;
                        color: #0070f3;
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
                    .status-badge {
                        padding: 4px 12px;
                        border-radius: 99px;
                        font-size: 12px;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .status-badge.pending {
                        background: #fed7d7;
                        color: #742a2a;
                    }
                    .status-badge.processing {
                        background: #feebc8;
                        color: #744210;
                    }
                    .status-badge.completed {
                        background: #c6f6d5;
                        color: #22543d;
                    }
                    @media (max-width: 768px) {
                        .charts-grid {
                            grid-template-columns: 1fr;
                        }
                        .period-selector {
                            flex-wrap: wrap;
                        }
                    }
                `}</style>
            </div>
        </>
    )
}
