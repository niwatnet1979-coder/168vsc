import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

// Mock Job Queue Data
const MOCK_JOBS = [
    {
        id: 'ORD-001',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        jobType: 'ติดตั้ง (Installation)',
        appointmentDate: '2024-12-05',
        team: 'ทีม A',
        inspector: 'คุณวิศวะ',
        address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
        items: 'ติดตั้งกล้องวงจรปิด 4 จุด',
        status: 'Pending',
        priority: 'High'
    },
    {
        id: 'ORD-005',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        jobType: 'ติดตั้ง (Installation)',
        appointmentDate: '2024-12-08',
        team: 'ทีม A',
        inspector: 'คุณวิศวะ',
        address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
        items: 'ติดตั้งระบบไฟสวนหย่อม',
        status: 'Processing',
        priority: 'Medium'
    },
    {
        id: 'ORD-007',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        jobType: 'ติดตั้ง (Installation)',
        appointmentDate: '2024-12-10',
        team: 'ทีม C',
        inspector: 'คุณสมชาย',
        address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
        items: 'ติดตั้งไฟราง Track Light',
        status: 'Processing',
        priority: 'Low'
    },
    {
        id: 'ORD-004',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        jobType: 'ส่งของ (Delivery Only)',
        appointmentDate: '2024-12-06',
        team: 'ขนส่งเอกชน',
        inspector: '-',
        address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
        items: 'หลอดไฟ Downlight 50 ชุด',
        status: 'Pending',
        priority: 'High'
    },
    {
        id: 'ORD-008',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        jobType: 'ส่งของ (Delivery Only)',
        appointmentDate: '2024-12-12',
        team: 'ขนส่งบริษัท',
        inspector: '-',
        address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
        items: 'โคมไฟตั้งพื้น 10 ชุด',
        status: 'Shipped',
        priority: 'Medium'
    },
    {
        id: 'ORD-001-PAST',
        customer: 'ร้านค้าปลีก ABC',
        jobType: 'ติดตั้ง (Installation)',
        appointmentDate: '2023-11-15',
        team: 'ทีม B',
        inspector: 'คุณช่างใหญ่',
        address: '888 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310',
        items: 'ติดตั้งระบบไฟ LED',
        status: 'Completed',
        priority: 'Medium'
    },
    {
        id: 'ORD-002-PAST',
        customer: 'ร้านค้าปลีก ABC',
        jobType: 'ส่งของ (Delivery Only)',
        appointmentDate: '2023-10-20',
        team: 'ขนส่งเอกชน',
        inspector: '-',
        address: '888 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กทม. 10310',
        items: 'หลอดไฟ 100 ชุด',
        status: 'Completed',
        priority: 'Low'
    },
    {
        id: 'ORD-009',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        jobType: 'รื้อถอน (Demolition)',
        appointmentDate: '2023-09-15',
        team: 'ทีม A',
        inspector: 'คุณวิศวะ',
        address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
        items: 'รื้อถอนโคมไฟเก่า',
        status: 'Completed',
        priority: 'Medium'
    },
    {
        id: 'ORD-010',
        customer: 'บริษัท เทคโนโลยี จำกัด',
        jobType: 'ติดตั้ง (Installation)',
        appointmentDate: '2024-12-15',
        team: 'ทีม B',
        inspector: 'คุณช่างใหญ่',
        address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110',
        items: 'ติดตั้งไฟ LED Strip Light ห้องประชุม',
        status: 'Pending',
        priority: 'High'
    },
    {
        id: 'ORD-011',
        customer: 'โรงแรม Grand Plaza',
        jobType: 'ติดตั้ง (Installation)',
        appointmentDate: '2024-12-07',
        team: 'ทีม C',
        inspector: 'คุณสมชาย',
        address: '456 ถ.สาทร แขวงยานนาวา เขตสาทร กทม. 10120',
        items: 'ติดตั้งโคมไฟระย้าห้องโถง',
        status: 'Processing',
        priority: 'High'
    }
]

export default function JobQueuePage() {
    const [filter, setFilter] = useState('all') // all, pending-install, pending-delivery, completed
    const [searchTerm, setSearchTerm] = useState('')

    // Filter logic
    const filteredJobs = MOCK_JOBS.filter(job => {
        // Search filter
        const matchesSearch =
            job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.team.toLowerCase().includes(searchTerm.toLowerCase())

        if (!matchesSearch) return false

        // Status filter
        switch (filter) {
            case 'pending-install':
                return job.jobType.includes('ติดตั้ง') &&
                    (job.status === 'Pending' || job.status === 'Processing')
            case 'pending-delivery':
                return job.jobType.includes('ส่งของ') &&
                    (job.status === 'Pending' || job.status === 'Shipped')
            case 'completed':
                return job.status === 'Completed'
            case 'all':
            default:
                return true
        }
    })

    // Sort by appointment date (nearest first)
    const sortedJobs = [...filteredJobs].sort((a, b) => {
        return new Date(a.appointmentDate) - new Date(b.appointmentDate)
    })

    // Count statistics
    const stats = {
        pendingInstall: MOCK_JOBS.filter(j => j.jobType.includes('ติดตั้ง') && (j.status === 'Pending' || j.status === 'Processing')).length,
        pendingDelivery: MOCK_JOBS.filter(j => j.jobType.includes('ส่งของ') && (j.status === 'Pending' || j.status === 'Shipped')).length,
        completed: MOCK_JOBS.filter(j => j.status === 'Completed').length,
        total: MOCK_JOBS.length
    }

    return (
        <>
            <Head>
                <title>คิวงานติดตั้งและจัดส่ง - Job Queue</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="job-queue-page">
                {/* Header */}
                <header className="page-header">
                    <div>
                        <h1>📋 คิวงานติดตั้งและจัดส่ง</h1>
                        <p className="subtitle">Job Queue Management</p>
                    </div>
                    <Link href="/" className="btn-back-white">← กลับหน้าหลัก</Link>
                </header>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div
                        className={`stat-card ${filter === 'pending-install' ? 'active' : ''}`}
                        onClick={() => setFilter('pending-install')}
                    >
                        <div className="stat-icon install">🔧</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.pendingInstall}</div>
                            <div className="stat-label">คิวติดตั้งที่เหลือ</div>
                        </div>
                    </div>

                    <div
                        className={`stat-card ${filter === 'pending-delivery' ? 'active' : ''}`}
                        onClick={() => setFilter('pending-delivery')}
                    >
                        <div className="stat-icon delivery">🚚</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.pendingDelivery}</div>
                            <div className="stat-label">คิวจัดส่งที่เหลือ</div>
                        </div>
                    </div>

                    <div
                        className={`stat-card ${filter === 'completed' ? 'active' : ''}`}
                        onClick={() => setFilter('completed')}
                    >
                        <div className="stat-icon completed">✅</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.completed}</div>
                            <div className="stat-label">งานที่เสร็จแล้ว</div>
                        </div>
                    </div>

                    <div
                        className={`stat-card ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <div className="stat-icon all">📊</div>
                        <div className="stat-content">
                            <div className="stat-value">{stats.total}</div>
                            <div className="stat-label">งานทั้งหมด</div>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="🔍 ค้นหา Order ID, ลูกค้า, รายการ, ทีม..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Job Table */}
                <div className="table-container">
                    <table className="job-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>ลูกค้า</th>
                                <th>ประเภทงาน</th>
                                <th>วันที่นัดหมาย</th>
                                <th>ทีมช่าง</th>
                                <th>ผู้ตรวจงาน</th>
                                <th>รายการ</th>
                                <th>สถานะ</th>
                                <th>ความสำคัญ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedJobs.length > 0 ? (
                                sortedJobs.map((job, i) => (
                                    <tr key={i} className="hover-row">
                                        <td>
                                            <Link href={`/orders/${job.id}`} className="order-link">
                                                {job.id}
                                            </Link>
                                        </td>
                                        <td className="customer-name">{job.customer}</td>
                                        <td>
                                            <span className={`job-type-badge ${job.jobType.includes('ติดตั้ง') ? 'install' : job.jobType.includes('ส่งของ') ? 'delivery' : 'other'}`}>
                                                {job.jobType}
                                            </span>
                                        </td>
                                        <td className="date-cell">{job.appointmentDate}</td>
                                        <td>{job.team}</td>
                                        <td>{job.inspector}</td>
                                        <td className="items-cell">{job.items}</td>
                                        <td>
                                            <span className={`status-badge ${job.status.toLowerCase()}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`priority-badge ${job.priority.toLowerCase()}`}>
                                                {job.priority}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="text-center empty-state">
                                        ไม่พบข้อมูลคิวงาน
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <style jsx>{`
                    .job-queue-page {
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
                    .page-header h1 {
                        margin: 0 0 8px 0;
                        font-size: 32px;
                        color: #1a202c;
                    }
                    .subtitle {
                        margin: 0;
                        color: #718096;
                        font-size: 16px;
                    }
                    .btn-back-white {
                        background: white;
                        color: #4a5568;
                        border: 1px solid #e2e8f0;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 600;
                        text-decoration: none;
                        display: inline-block;
                        transition: all 0.2s;
                    }
                    .btn-back-white:hover {
                        background: #f7fafc;
                        border-color: #cbd5e0;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
                        cursor: pointer;
                        transition: all 0.3s;
                        border: 2px solid transparent;
                    }
                    .stat-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
                    }
                    .stat-card.active {
                        border-color: #0070f3;
                        background: #f0f7ff;
                    }
                    .stat-icon {
                        font-size: 48px;
                        width: 64px;
                        height: 64px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 12px;
                    }
                    .stat-icon.install {
                        background: #fff5f5;
                    }
                    .stat-icon.delivery {
                        background: #fffaf0;
                    }
                    .stat-icon.completed {
                        background: #f0fff4;
                    }
                    .stat-icon.all {
                        background: #f0f7ff;
                    }
                    .stat-content {
                        flex: 1;
                    }
                    .stat-value {
                        font-size: 32px;
                        font-weight: 700;
                        color: #1a202c;
                        line-height: 1;
                        margin-bottom: 4px;
                    }
                    .stat-label {
                        font-size: 14px;
                        color: #718096;
                        font-weight: 500;
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
                        transition: all 0.2s;
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
                        overflow: hidden;
                    }
                    .job-table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    .job-table thead {
                        background: #f7fafc;
                    }
                    .job-table th {
                        padding: 16px 12px;
                        text-align: left;
                        font-size: 13px;
                        font-weight: 600;
                        color: #4a5568;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 2px solid #edf2f7;
                    }
                    .job-table td {
                        padding: 16px 12px;
                        border-bottom: 1px solid #edf2f7;
                        color: #2d3748;
                        font-size: 14px;
                    }
                    .hover-row {
                        transition: background-color 0.2s;
                    }
                    .hover-row:hover {
                        background: #f7fafc;
                    }
                    .order-link {
                        color: #0070f3;
                        text-decoration: none;
                        font-weight: 600;
                    }
                    .order-link:hover {
                        text-decoration: underline;
                    }
                    .customer-name {
                        font-weight: 500;
                    }
                    .job-type-badge {
                        padding: 4px 12px;
                        border-radius: 99px;
                        font-size: 12px;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .job-type-badge.install {
                        background: #fed7d7;
                        color: #742a2a;
                    }
                    .job-type-badge.delivery {
                        background: #feebc8;
                        color: #744210;
                    }
                    .job-type-badge.other {
                        background: #e2e8f0;
                        color: #4a5568;
                    }
                    .date-cell {
                        font-family: monospace;
                        font-weight: 500;
                    }
                    .items-cell {
                        max-width: 200px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .status-badge {
                        padding: 4px 12px;
                        border-radius: 99px;
                        font-size: 12px;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .status-badge.completed {
                        background: #c6f6d5;
                        color: #22543d;
                    }
                    .status-badge.processing {
                        background: #feebc8;
                        color: #744210;
                    }
                    .status-badge.pending {
                        background: #fed7d7;
                        color: #742a2a;
                    }
                    .status-badge.shipped {
                        background: #bee3f8;
                        color: #2c5282;
                    }
                    .priority-badge {
                        padding: 4px 12px;
                        border-radius: 99px;
                        font-size: 12px;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .priority-badge.high {
                        background: #fed7d7;
                        color: #742a2a;
                    }
                    .priority-badge.medium {
                        background: #feebc8;
                        color: #744210;
                    }
                    .priority-badge.low {
                        background: #e2e8f0;
                        color: #4a5568;
                    }
                    .text-center {
                        text-align: center;
                    }
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
