import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    FileText,
    Settings,
    Menu,
    X,
    LogOut,
    ChevronRight,
    BarChart3,
    Briefcase,
    Smartphone,
    UserCog
} from 'lucide-react';

const AppLayout = ({ children }) => {
    const router = useRouter();
    const { data: session } = useSession();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Check if user is disabled
    useEffect(() => {
        if (session?.user?.email) {
            const teamData = JSON.parse(localStorage.getItem('team_data') || '[]')
            const userRecord = teamData.find(member => member.email === session.user.email)

            if (userRecord && userRecord.userType === 'Disabled') {
                alert('บัญชีของคุณถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ')
                signOut({ callbackUrl: '/auth/signin' })
            }
        }
    }, [session])

    const handleLogout = async () => {
        if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
            await signOut({ callbackUrl: '/auth/signin' });
        }
    };

    const handleSwitchAccount = async () => {
        if (confirm('คุณต้องการสลับบัญชีหรือไม่?')) {
            await signOut({ callbackUrl: '/auth/signin?autoTrigger=true' });
        }
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
        { name: 'Order Entry', icon: ShoppingCart, path: '/order' },
        { name: 'Orders List', icon: FileText, path: '/orders' },
        { name: 'Products', icon: Package, path: '/products' },
        { name: 'Customers', icon: Users, path: '/customers' },
        { name: 'Team', icon: UserCog, path: '/team' },
        { name: 'Jobs', icon: Briefcase, path: '/jobs' },
        { name: 'Reports', icon: BarChart3, path: '/reports' },
        { name: 'Settings', icon: Settings, path: '/settings' },
    ];

    const isActive = (path) => {
        if (path === '/' && router.pathname !== '/') return false;
        return router.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-secondary-50 flex font-sans text-secondary-900">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 
          transform transition-transform duration-200 ease-in-out shadow-xl lg:shadow-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-secondary-100">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo-192.png"
                                alt="168VSC Logo"
                                className="w-8 h-8 rounded-lg shadow-lg shadow-primary-500/30"
                            />
                            <span className="font-bold text-xl text-secondary-900 tracking-tight">VSC System</span>
                            <span className="ml-2 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] font-bold rounded-full">v3.1.1</span>
                        </div>
                        <button
                            className="ml-auto lg:hidden text-secondary-500 hover:text-secondary-900"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        {menuItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                    ${active
                                            ? 'bg-primary-50 text-primary-700 font-medium shadow-sm ring-1 ring-primary-100'
                                            : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                                        }
                  `}
                                    onClick={() => setIsSidebarOpen(false)}
                                >
                                    <item.icon
                                        size={20}
                                        className={`
                      transition-colors
                      ${active ? 'text-primary-600' : 'text-secondary-400 group-hover:text-secondary-600'}
                    `}
                                    />
                                    <span className="flex-1">{item.name}</span>
                                    {active && <ChevronRight size={16} className="text-primary-500" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Profile (Bottom) */}
                    <div className="p-4 border-t border-secondary-100">
                        <div className="flex flex-col gap-2">
                            {/* User Info */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary-50 border border-secondary-100">
                                {session?.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || 'User'}
                                        className="w-10 h-10 rounded-full"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                        {session?.user?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-secondary-900 truncate">
                                        {session?.user?.name || 'User'}
                                    </p>
                                    <p className="text-xs text-secondary-500 truncate">
                                        {session?.user?.email || ''}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSwitchAccount}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                                    title="สลับบัญชี"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                    <span>สลับบัญชี</span>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center px-3 py-2 text-secondary-400 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"
                                    title="ออกจากระบบ"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-64">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-semibold text-secondary-900 hidden sm:block">
                            {menuItems.find(i => isActive(i.path))?.name || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-sm text-secondary-500 hidden sm:block">
                            {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-full mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AppLayout;
