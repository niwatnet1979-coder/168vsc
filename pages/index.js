import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const menuItems = [
    {
      title: 'จัดการงานขาย (Sale)',
      description: 'ออเดอร์, สถานะการขาย',
      icon: <ShoppingCartIcon />,
      color: 'blue',
      href: '/orders'
    },
    {
      title: 'จัดการสินค้า (Product)',
      description: 'สต็อก, ราคา, รายละเอียด',
      icon: <BoxIcon />,
      color: 'indigo',
      href: '/products'
    },
    {
      title: 'จัดการลูกค้า (Customer)',
      description: 'รายชื่อ, ประวัติ, ข้อมูลติดต่อ',
      icon: <UsersIcon />,
      color: 'orange',
      href: '/customers'
    },
    {
      title: 'จัดการทีม (Team)',
      description: 'พนักงาน, สิทธิ์การใช้งาน',
      icon: <UserBadgeIcon />,
      color: 'cyan',
      href: '/team'
    },
    {
      title: 'งานติดตั้ง (Jobs)',
      description: 'ตารางงาน, สถานะติดตั้ง',
      icon: <ToolsIcon />,
      color: 'teal',
      href: '/jobs'
    },
    {
      title: 'การเงิน/บิล (Finance)',
      description: 'แจ้งหนี้, ใบเสร็จ, ยอดขาย',
      icon: <BanknoteIcon />,
      color: 'green',
      href: '/finance'
    },
    {
      title: 'ใบเสนอราคา (Quotation)',
      description: 'สร้างและจัดการใบเสนอราคา',
      icon: <DocumentTextIcon />,
      color: 'purple',
      href: '/quotation'
    },
    {
      title: 'รายงาน (Reports)',
      description: 'สรุปยอดขาย, สถิติ',
      icon: <ChartBarIcon />,
      color: 'rose',
      href: '/reports'
    }
  ]

  return (
    <div className="dashboard-container">
      <Head>
        <title>168APP Admin Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main className="main-content">
        <div className="header-section">
          <h1>168APP Admin Dashboard</h1>
          <p>ระบบจัดการร้านค้าครบวงจร</p>
        </div>

        <div className="menu-grid">
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index} style={{ textDecoration: 'none' }}>
              <div className={`menu-card ${item.color}`}>
                <div className="icon-wrapper">
                  {item.icon}
                </div>
                <div className="card-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <div className="arrow-icon">
                  <ArrowRightIcon />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <style jsx>{`
                .dashboard-container {
                    min-height: 100vh;
                    background-color: #f8f9fa;
                    font-family: 'Sarabun', sans-serif;
                    padding: 60px 40px;
                }
                .main-content {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .header-section {
                    text-align: center;
                    margin-bottom: 60px;
                }
                .header-section h1 {
                    font-size: 36px;
                    color: #1a202c;
                    margin-bottom: 12px;
                    font-weight: 700;
                }
                .header-section p {
                    color: #718096;
                    font-size: 18px;
                }
                .menu-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 24px;
                }
                .menu-card {
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    transition: all 0.2s ease;
                    border: 1px solid #edf2f7;
                    height: 100%;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }
                .menu-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
                    border-color: transparent;
                }
                
                /* Color Themes */
                .menu-card.blue:hover { border-top: 4px solid #3b82f6; }
                .menu-card.indigo:hover { border-top: 4px solid #6366f1; }
                .menu-card.orange:hover { border-top: 4px solid #f97316; }
                .menu-card.cyan:hover { border-top: 4px solid #06b6d4; }
                .menu-card.teal:hover { border-top: 4px solid #14b8a6; }
                .menu-card.green:hover { border-top: 4px solid #22c55e; }
                .menu-card.purple:hover { border-top: 4px solid #a855f7; }
                .menu-card.rose:hover { border-top: 4px solid #f43f5e; }

                .icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 4px;
                }
                
                /* Icon Backgrounds */
                .menu-card.blue .icon-wrapper { background: #eff6ff; color: #3b82f6; }
                .menu-card.indigo .icon-wrapper { background: #eef2ff; color: #6366f1; }
                .menu-card.orange .icon-wrapper { background: #fff7ed; color: #f97316; }
                .menu-card.cyan .icon-wrapper { background: #ecfeff; color: #06b6d4; }
                .menu-card.teal .icon-wrapper { background: #f0fdfa; color: #14b8a6; }
                .menu-card.green .icon-wrapper { background: #f0fdf4; color: #22c55e; }
                .menu-card.purple .icon-wrapper { background: #faf5ff; color: #a855f7; }
                .menu-card.rose .icon-wrapper { background: #fff1f2; color: #f43f5e; }

                .card-content h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #1e293b;
                    font-weight: 600;
                    margin-bottom: 6px;
                }
                .card-content p {
                    margin: 0;
                    font-size: 14px;
                    color: #64748b;
                    line-height: 1.5;
                }
                .arrow-icon {
                    position: absolute;
                    bottom: 24px;
                    right: 24px;
                    color: #cbd5e1;
                    transition: transform 0.2s;
                }
                .menu-card:hover .arrow-icon {
                    transform: translateX(4px);
                    color: #94a3b8;
                }
            `}</style>
    </div>
  )
}

// Icons Components
const ShoppingCartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="21" r="1"></circle>
    <circle cx="20" cy="21" r="1"></circle>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
  </svg>
)

const BoxIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
)

const UsersIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const UserBadgeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
)

const ToolsIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
  </svg>
)

const BanknoteIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
    <line x1="2" y1="10" x2="22" y2="10"></line>
  </svg>
)

const DocumentTextIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
)

const ChartBarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
)

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)
