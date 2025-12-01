import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function OrdersListPage() {
    const router = useRouter()
    const [orders, setOrders] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Load data from LocalStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('orders_data')
        if (savedData) {
            setOrders(JSON.parse(savedData))
        }
    }, [])

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase()

        return matchesSearch && matchesStatus
    })

    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        processing: orders.filter(o => o.status === 'Processing').length,
        completed: orders.filter(o => o.status === 'Completed').length
    }

    const handleDeleteOrder = (orderId) => {
        if (confirm('คุณต้องการลบคำสั่งซื้อนี้ใช่หรือไม่?')) {
            const updatedOrders = orders.filter(o => o.id !== orderId)
            setOrders(updatedOrders)
            localStorage.setItem('orders_data', JSON.stringify(updatedOrders))
        }
    }

    // Icons
    const SearchIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    )

    const BackIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
    )

    const EyeIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    )

    return (
        <>
            <Head>
                <title>รายการคำสั่งซื้อ - Orders List</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="page-container">
                <header className="page-header">
                    <div className="header-left">
                        <Link href="/" className="btn-back-circle">
                            <BackIcon />
                        </Link>
                        <h1>รายการคำสั่งซื้อ (Orders)</h1>
                    </div>
                    <button className="btn-primary" onClick={() => router.push('/order')}>+ สร้างคำสั่งซื้อใหม่</button>
                </header>

                <main className="main-content">
                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className={`stat-card ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">ทั้งหมด</div>
                        </div>
                        <div className={`stat-card pending ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>
                            <div className="stat-value">{stats.pending}</div>
                            <div className="stat-label">รอดำเนินการ</div>
                        </div>
                        <div className={`stat-card processing ${statusFilter === 'processing' ? 'active' : ''}`} onClick={() => setStatusFilter('processing')}>
                            <div className="stat-value">{stats.processing}</div>
                            <div className="stat-label">กำลังดำเนินการ</div>
                        </div>
                        <div className={`stat-card completed ${statusFilter === 'completed' ? 'active' : ''}`} onClick={() => setStatusFilter('completed')}>
                            <div className="stat-value">{stats.completed}</div>
                            <div className="stat-label">เสร็จสิ้น</div>
                        </div>
                    </div>

                    <div className="search-container">
                        <div className="search-wrapper">
                            <div className="search-icon">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหา Order ID หรือชื่อลูกค้า..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="table-card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>วันที่</th>
                                    <th>ลูกค้า</th>
                                    <th style={{ textAlign: 'center' }}>รายการ</th>
                                    <th style={{ textAlign: 'right' }}>ยอดรวม</th>
                                    <th style={{ textAlign: 'right' }}>มัดจำ</th>
                                    <th style={{ textAlign: 'center' }}>ประเภทงาน</th>
                                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                                    <th style={{ textAlign: 'right' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map(order => (
                                        <tr key={order.id}>
                                            <td style={{ fontWeight: 500 }}>
                                                <Link href={`/order?id=${order.id}`} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                                                    {order.id}
                                                </Link>
                                            </td>
                                            <td>{order.date}</td>
                                            <td><strong>{order.customer}</strong></td>
                                            <td style={{ textAlign: 'center' }}>
                                                {Array.isArray(order.items) ? order.items.length : order.items}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                                                ฿{(order.total || 0).toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>฿{(order.deposit || 0).toLocaleString()}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`badge job-${order.jobType === 'ติดตั้ง' ? 'install' : order.jobType === 'ส่งของ' ? 'delivery' : 'other'}`}>
                                                    {order.jobType}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`badge status-${order.status.toLowerCase()}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDeleteOrder(order.id)}
                                                    title="ลบคำสั่งซื้อ"
                                                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"></polyline>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="empty-state">
                                            ไม่พบข้อมูลคำสั่งซื้อ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>

                <style jsx>{`
                    .page-container {
                        min-height: 100vh;
                        background-color: #f8f9fa;
                        font-family: 'Sarabun', sans-serif;
                        padding: 24px 40px;
                    }
                    .page-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 24px;
                    }
                    .header-left {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                    }
                    .btn-back-circle {
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: white;
                        border: 1px solid #e2e8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #4a5568;
                        transition: all 0.2s;
                    }
                    .btn-back-circle:hover {
                        background: #f7fafc;
                        border-color: #cbd5e0;
                    }
                    .page-header h1 {
                        font-size: 24px;
                        color: #1a202c;
                        margin: 0;
                        font-weight: 600;
                    }
                    .view-btn:hover {
                        background: #eff6ff;
                        color: #2563eb;
                    }
                    .delete-btn:hover {
                        background: #fef2f2 !important;
                        color: #dc2626 !important;
                    }
                    .btn-primary {
                        background: #2563eb;
                        color: white;
                        border: none;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                        text-decoration: none;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
                        font-family: 'Sarabun', sans-serif;
                    }
                    .btn-primary:hover {
                        background: #1d4ed8;
                        box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
                    }

                    /* Stats */
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 16px;
                        margin-bottom: 24px;
                    }
                    .stat-card {
                        background: white;
                        padding: 20px;
                        border-radius: 12px;
                        border: 2px solid #e2e8f0;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .stat-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    }
                    .stat-card.active {
                        border-color: #2563eb;
                        background: #eff6ff;
                    }
                    .stat-card.pending {
                        border-color: #fecaca;
                    }
                    .stat-card.pending.active {
                        background: #fef2f2;
                        border-color: #ef4444;
                    }
                    .stat-card.processing {
                        border-color: #fed7aa;
                    }
                    .stat-card.processing.active {
                        background: #fffbeb;
                        border-color: #f59e0b;
                    }
                    .stat-card.completed {
                        border-color: #bbf7d0;
                    }
                    .stat-card.completed.active {
                        background: #f0fdf4;
                        border-color: #22c55e;
                    }
                    .stat-value {
                        font-size: 28px;
                        font-weight: 700;
                        color: #1a202c;
                        line-height: 1.2;
                        margin-bottom: 4px;
                    }
                    .stat-label {
                        font-size: 14px;
                        color: #64748b;
                    }

                    /* Search */
                    .search-container {
                        margin-bottom: 24px;
                    }
                    .search-wrapper {
                        position: relative;
                        width: 100%;
                    }
                    .search-icon {
                        position: absolute;
                        left: 16px;
                        top: 50%;
                        transform: translateY(-50%);
                        color: #9ca3af;
                        display: flex;
                    }
                    .search-input {
                        width: 100%;
                        padding: 14px 16px 14px 48px;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        font-size: 15px;
                        background: white;
                        transition: all 0.2s;
                    }
                    .search-input:focus {
                        outline: none;
                        border-color: #2563eb;
                        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    }

                    /* Table */
                    .table-card {
                        background: white;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                        overflow: hidden;
                    }
                    .data-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .data-table th {
                        background: white;
                        padding: 16px 24px;
                        text-align: left;
                        font-size: 12px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .data-table td {
                        padding: 20px 24px;
                        border-bottom: 1px solid #f1f5f9;
                        font-size: 14px;
                        color: #334155;
                        vertical-align: middle;
                    }
                    .data-table tr:last-child td {
                        border-bottom: none;
                    }
                    .data-table tbody tr:hover {
                        background: #f8fafc;
                    }
                    
                    .order-id-link {
                        font-family: monospace;
                        color: #2563eb;
                        font-weight: 600;
                        text-decoration: none;
                    }
                    .order-id-link:hover {
                        text-decoration: underline;
                    }

                    /* Badges */
                    .badge {
                        padding: 4px 10px;
                        border-radius: 99px;
                        font-size: 12px;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .badge.job-install { background: #fee2e2; color: #991b1b; }
                    .badge.job-delivery { background: #fef3c7; color: #92400e; }
                    .badge.job-other { background: #e0e7ff; color: #3730a3; }
                    
                    .badge.status-pending { background: #f1f5f9; color: #475569; }
                    .badge.status-processing { background: #dbeafe; color: #1e40af; }
                    .badge.status-completed { background: #dcfce7; color: #166534; }

                    .action-buttons {
                        display: flex;
                        gap: 12px;
                        justify-content: flex-end;
                    }
                    .btn-icon {
                        background: none;
                        border: none;
                        cursor: pointer;
                        padding: 4px;
                        border-radius: 4px;
                        transition: background 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: inherit;
                    }
                    .btn-icon:hover {
                        background: #f1f5f9;
                    }
                    .empty-state {
                        padding: 60px;
                        text-align: center;
                        color: #94a3b8;
                    }
                `}</style>
            </div>
        </>
    )
}
