import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
    Wrench,
    Truck,
    History,
    Calendar,
    MapPin,
    User,
    Phone,
    ChevronRight,
    Search,
    Menu
} from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import AppLayout from '../components/AppLayout'

// Helper to format date
const formatDate = (dateString, timeString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear() + 543 // Buddhist Era

    const time = timeString ? timeString.substring(0, 5) : ''

    if (isToday) return `วันนี้ ${time ? `เวลา ${time}` : ''}`
    return `${day}/${month}/${year} ${time}`
}

export default function MobilePage() {
    const router = useRouter()
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState('installation') // 'previous', 'installation', 'delivery'
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)

    const [selectedTeam, setSelectedTeam] = useState('ทั้งหมด')
    const [availableTeams, setAvailableTeams] = useState([])

    // Get user role and team
    const userRole = session?.user?.role
    const userTeam = session?.user?.team

    // Auto-select team with Normalization
    useEffect(() => {
        if (userTeam) {
            let normalizedTeam = userTeam
            if (userTeam.toLowerCase().includes('team')) {
                // Try to map "Team A" -> "ทีม A"
                const parts = userTeam.split(' ')
                if (parts.length > 1) {
                    const suffix = parts.slice(1).join(' ')
                    // Check if it's a single letter like A, B, C or numeric
                    if (/^[A-Z0-9]+$/i.test(suffix)) {
                        normalizedTeam = `ทีม ${suffix}`
                    }
                }
            }
            setSelectedTeam(normalizedTeam)
        }
    }, [userTeam])



    // Load Data
    useEffect(() => {
        loadJobs()
    }, [activeTab, selectedTeam])

    const loadJobs = async () => {
        setLoading(true)
        try {
            // Get all jobs from DataManager
            const allJobs = await DataManager.getJobs()

            // Extract unique teams
            const teams = [...new Set(allJobs.map(j => j.assignedTeam).filter(t => t && t !== '-'))].sort()
            setAvailableTeams(['ทั้งหมด', ...teams])

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            let filteredJobs = allJobs.filter(job => {
                // Type Filter
                const jobDate = new Date(job.jobDate)
                const isCompleted = job.status === 'completed'
                const isInstallation = job.jobType === 'ติดตั้ง' || job.jobType === 'installation'
                const isDelivery = job.jobType === 'ขนส่ง' || job.jobType === 'delivery' || job.jobType === 'delivery_installation'

                // Tab Logic
                let matchesTab = false
                if (activeTab === 'previous') {
                    matchesTab = isCompleted || jobDate < today
                } else if (activeTab === 'installation') {
                    // SHOW ALL pending installations regardless of date for now to ensure visibility
                    // or stick to >= today? User said "Real data", implying they want to see what's in V2.
                    // V2 shows EVERYTHING. Let's show everything pending.
                    matchesTab = !isCompleted && isInstallation
                } else if (activeTab === 'delivery') {
                    matchesTab = !isCompleted && isDelivery
                }

                return matchesTab
            })

            // Team Filter Logic with Fallback
            let effectiveTeam = selectedTeam

            // Normalize "Team X" to "ทีม X" if needed for matching
            const normalizeTeam = (t) => {
                if (!t) return 'ทั้งหมด'
                if (t.toLowerCase() === 'team a') return 'ทีม A'
                if (t.toLowerCase() === 'team b') return 'ทีม B'
                if (t.toLowerCase() === 'team c') return 'ทีม C'
                if (t.startsWith('Team ')) {
                    const thaiName = 'ทีม ' + t.substring(5)
                    if (teams.includes(thaiName)) return thaiName
                }
                return t
            }

            // Logic to handle Fallback to All if team not found
            if (effectiveTeam !== 'ทั้งหมด' && !teams.includes(effectiveTeam)) {
                const normalized = normalizeTeam(effectiveTeam)
                if (teams.includes(normalized)) {
                    effectiveTeam = normalized
                    if (effectiveTeam !== selectedTeam) setSelectedTeam(effectiveTeam)
                } else {
                    // Fallback to ALL
                    effectiveTeam = 'ทั้งหมด'
                    if (selectedTeam !== 'ทั้งหมด') setSelectedTeam('ทั้งหมด')
                }
            }

            if (effectiveTeam !== 'ทั้งหมด') {
                filteredJobs = filteredJobs.filter(job => job.assignedTeam === effectiveTeam)
            }

            // Sort
            filteredJobs.sort((a, b) => {
                const dateA = new Date(`${a.jobDate}T${a.jobTime}`)
                const dateB = new Date(`${b.jobDate}T${b.jobTime}`)
                return activeTab === 'previous' ? dateB - dateA : dateA - dateB
            })

            setJobs(filteredJobs)
            setLoading(false)
        } catch (error) {
            console.error('Error loading jobs:', error)
            setJobs([])
            setLoading(false)
        }
    }

    // Tab Button Component
    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center w-full py-3 space-y-1 transition-colors ${activeTab === id
                ? 'text-primary-600 bg-primary-50 border-t-2 border-primary-600'
                : 'text-secondary-500 hover:bg-secondary-50 border-t-2 border-transparent'
                }`}
        >
            <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
            <span className="text-xs font-medium">{label}</span>
        </button>
    )

    // Job Card Component
    const JobCard = ({ job }) => {
        const isInstallation = job.jobType === 'ติดตั้ง' || job.jobType === 'installation'
        const Icon = isInstallation ? Wrench : Truck
        const iconColor = isInstallation ? 'text-blue-600' : 'text-orange-600'
        const bgColor = isInstallation ? 'bg-blue-50' : 'bg-orange-50'

        return (
            <Link href={`/mobile-jobs-v2/${job.id}`} className="block bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden active:scale-[0.98] transition-transform">
                <div className="flex">
                    {/* Left: Image */}
                    <div className="w-24 h-24 bg-secondary-100 flex-shrink-0 relative">
                        {job.productImage ? (
                            <img src={job.productImage} alt="Product" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-secondary-400">
                                <Icon size={24} />
                            </div>
                        )}
                        {/* Type Badge */}
                        <div className={`absolute top-0 left-0 px-2 py-1 text-[10px] font-bold text-white rounded-br-lg ${isInstallation ? 'bg-blue-600' : 'bg-orange-600'}`}>
                            {isInstallation ? 'ติดตั้ง' : 'จัดส่ง'}
                        </div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between">
                        {/* Row 1: Title & Time */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-sm font-bold text-secondary-900 line-clamp-1">
                                    {job.customerName || 'ลูกค้าทั่วไป'}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-secondary-500 mt-0.5">
                                    <ClockIcon time={job.jobTime} />
                                    <span>{formatDate(job.jobDate, job.jobTime)}</span>
                                </div>
                            </div>
                            {/* Price or Status could go here, for now using chevron */}
                            <ChevronRight size={18} className="text-secondary-400" />
                        </div>

                        {/* Row 2: Location */}
                        <div className="flex items-start gap-1.5 mt-2 text-xs text-secondary-600">
                            <MapPin size={14} className="flex-shrink-0 mt-0.5 text-secondary-400" />
                            <span className="line-clamp-2 leading-tight">
                                {job.address || 'ไม่ระบุที่อยู่'}
                            </span>
                        </div>


                        {/* Row 3: Product Details */}
                        <div className="text-xs text-secondary-700 leading-tight space-y-1 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-secondary-900 truncate">{job.productName}</span>
                                <span className="text-[10px] font-mono text-secondary-500 bg-secondary-100 px-1.5 py-0.5 rounded border border-secondary-200 flex-shrink-0">
                                    {job.productId}
                                </span>
                            </div>

                            {/* Specs Combined Line */}
                            <div className="text-secondary-600 truncate">
                                <span>{job.product?.category || '-'}</span>
                                {(job.product?.width || job.product?.length || job.product?.height) && (
                                    <span> • {job.product.width || '-'}x{job.product.length || '-'}x{job.product.height || '-'} cm</span>
                                )}
                                {job.product?.material && <span> • {job.product.material}</span>}
                                {job.product?.color && <span> • {job.product.color}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        )
    }

    const ClockIcon = ({ time }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white shadow-sm px-4 py-3 pb-4 z-10 relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="text-secondary-600 hover:bg-secondary-100 p-1 rounded-lg"
                            >
                                <Menu size={24} />
                            </button>
                            <h1 className="text-xl font-bold text-secondary-900">คิวงานของฉัน</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Team Selector */}
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="text-xs border-secondary-300 rounded-lg py-1 pl-2 pr-6 shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-white"
                                dir="rtl"
                            >
                                {availableTeams.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Search Bar (Visual Only) */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                        <input
                            type="text"
                            placeholder="ค้นหางาน, ลูกค้า..."
                            className="w-full bg-secondary-50 border border-secondary-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                    </div>
                </header>
            )}
            renderBottomNav={() => (
                <nav className="bg-white border-t border-secondary-200 safe-area-bottom pb-safe z-20">
                    <div className="flex justify-around items-center h-16">
                        <TabButton id="previous" label="งานก่อนหน้า" icon={History} />
                        <TabButton id="installation" label="งานติดตั้ง" icon={Wrench} />
                        <TabButton id="delivery" label="งานจัดส่ง" icon={Truck} />
                    </div>
                </nav>
            )}
        >
            <Head>
                <title>คิวงานช่าง - 168VSC</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>

            {/* Content Body - No padding bottom needed as nav is outside scroll area */}
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-secondary-700">
                        {activeTab === 'previous' && 'งานที่ทำเสร็จแล้ว'}
                        {activeTab === 'installation' && 'งานติดตั้งที่ต้องทำ'}
                        {activeTab === 'delivery' && 'งานจัดส่งที่ต้องทำ'}
                    </h2>
                    <span className="text-xs text-secondary-500 bg-secondary-100 px-2 py-0.5 rounded-full">
                        {jobs.length} งาน
                    </span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                        <p className="text-sm text-secondary-500">กำลังโหลด...</p>
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-secondary-400">
                        <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
                            {activeTab === 'previous' ? <History size={32} /> : activeTab === 'installation' ? <Wrench size={32} /> : <Truck size={32} />}
                        </div>
                        <p>ไม่มีงานในหมวดหมู่นี้</p>


                    </div>
                ) : (
                    <div className="space-y-3">
                        {jobs.map(job => (
                            <JobCard key={job.id} job={job} />
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .safe-area-bottom {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>
        </AppLayout>
    )
}
