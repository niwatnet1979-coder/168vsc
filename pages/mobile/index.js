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
    Menu,
    Users,
    CheckCircle,
    UserCheck,
    Map,
    FileText
} from 'lucide-react'
import { DataManager } from '../../lib/dataManager'
import AppLayout from '../../components/AppLayout'
import { useJobs } from '../../hooks/useJobs'

// Helper to format date
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

    let time = ''
    if (timeString) {
        time = timeString.substring(0, 5)
    } else if (dateString.includes('T') || dateString.includes(' ')) {
        // Try to extract time from ISO string or timestamp
        const h = date.getHours().toString().padStart(2, '0')
        const m = date.getMinutes().toString().padStart(2, '0')
        // Only show time if it's not 00:00 (unless it's explicit)
        if (h !== '00' || m !== '00') {
            time = `${h}:${m}`
        }
    }

    if (isToday) return `วันนี้ ${time ? `เวลา ${time}` : ''}`
    return `${day}/${month}/${year}${time ? ` ${time}` : ''}`
}

// Helper to calculate distance
const getDistance = (address) => {
    // TODO: Implement actual distance calculation
    return Math.floor(Math.random() * 30) + 5
}

// Helper to extract location parts
const getLocation = (address) => {
    if (!address) return { tambon: '-', district: '-', province: '-' }

    let tambon = '-'
    let district = '-'
    let province = '-'

    // Tambon/Khwaeng - Match 'ตำบล', 'แขวง', 'ต.' followed by text
    const tMatch = address.match(/(?:ตำบล|แขวง|ต\.)\s*([^\s]+)/)
    if (tMatch) tambon = tMatch[1]

    // District/Amphoe/Khet - Match 'อำเภอ', 'เขต', 'อ.' followed by text
    const aMatch = address.match(/(?:อำเภอ|เขต|อ\.)\s*([^\s]+)/)
    if (aMatch) district = aMatch[1]

    // Province/Changwat - Match 'จังหวัด', 'จ.' followed by text
    const pMatch = address.match(/(?:จังหวัด|จ\.)\s*([^\s]+)/)
    if (pMatch) province = pMatch[1]
    else if (address.includes('กรุงเทพ')) province = 'กรุงเทพฯ'

    return { tambon, district, province }
}

export default function MobilePage() {
    const router = useRouter()
    const { data: session } = useSession()
    const { jobs: allJobs, loading } = useJobs() // Hook
    const [activeTab, setActiveTab] = useState('installation') // 'previous', 'installation', 'delivery'
    const [jobs, setJobs] = useState([])

    const [selectedTeam, setSelectedTeam] = useState('ทั้งหมด')
    const [availableTeams, setAvailableTeams] = useState([])

    // Get user role and team
    const userRole = session?.user?.role
    const userTeam = session?.user?.team

    // Update available teams when allJobs changes
    useEffect(() => {
        if (allJobs.length > 0) {
            const teams = [...new Set(allJobs.map(j => j.assignedTeam).filter(t => t && t !== '-'))].sort()
            setAvailableTeams(['ทั้งหมด', ...teams])
        }
    }, [allJobs])

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


    // Load/Filter Data
    useEffect(() => {
        filterJobs()
    }, [activeTab, selectedTeam, allJobs]) // Re-run when realtime update or filter changes

    const filterJobs = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Extract teams logic moved to its own effect, but we need team list for normalization below if needed
        const teams = [...new Set(allJobs.map(j => j.assignedTeam).filter(t => t && t !== '-'))].sort()

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
                // We just use string matching here
                return thaiName
            }
            return t
        }

        // Logic to handle Fallback to All if team not found
        // We use the derived teams list from allJobs
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
            <Link href={`/mobile/${job.id}`} className="block bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden active:scale-[0.98] transition-transform">
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
                    <div className="flex-1 p-3 flex flex-col gap-2">
                        {/* Row 1: Team, Dates, Inspector */}
                        <div className="flex items-center gap-2 text-xs text-secondary-900 flex-wrap">
                            {/* Team Name */}
                            <div className="flex items-center gap-1 font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100">
                                <Icon size={12} />
                                <span>{job.assignedTeam || 'ไม่ระบุทีม'}</span>
                            </div>

                            {/* Appointment Date */}
                            <div className="flex items-center gap-1" title="วันที่นัดหมาย">
                                <Calendar size={12} />
                                <span>{formatDate(job.jobDate, job.jobTime)}</span>
                            </div>



                            {/* Inspector Info (Moved back to Row 1, Icon + Phone only) */}
                            {(() => {
                                const inspector = job.order?.job_info?.inspector1
                                if (inspector?.phone) {
                                    return (
                                        <div className="flex items-center gap-1 border-l border-secondary-300 pl-2 ml-1 text-secondary-600">
                                            <UserCheck size={12} />
                                            <a href={`tel:${inspector.phone}`} className="p-1 bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 border border-primary-200" onClick={(e) => e.stopPropagation()}>
                                                <Phone size={10} fill="currentColor" />
                                            </a>
                                        </div>
                                    )
                                }
                                return null
                            })()}
                        </div>



                        {/* Row 2: Location (Distance Link, Place Name, Address) */}
                        <div className="flex items-center gap-2 text-xs">
                            {/* Clickable Distance Badge */}
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100 active:scale-95 transition-transform flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Map size={12} />
                                <span className="font-medium">{getDistance(job.address)} กม.</span>
                            </a>

                            {/* Place & Address */}
                            <div className="text-secondary-600 truncate flex-1 flex items-center gap-1">
                                {job.order?.job_info?.installLocationName && (
                                    <span className="font-medium text-secondary-900 truncate">
                                        {job.order.job_info.installLocationName}
                                    </span>
                                )}
                                <span className="text-secondary-500 truncate">
                                    {(() => {
                                        const { district, province } = getLocation(job.address)
                                        return `อ.${district} จ.${province}`
                                    })()}
                                </span>
                            </div>
                        </div>


                        {/* Row 3: Product Details (Consolidated) */}
                        <div className="text-xs text-secondary-700 leading-tight">
                            <span className="inline-flex items-center gap-1 flex-wrap">
                                <span className="font-mono text-[10px] text-secondary-500 bg-secondary-100 px-1.5 py-0.5 rounded border border-secondary-200">
                                    {job.productId}
                                </span>
                                <span className="font-bold text-secondary-900 mr-1">{job.productName}</span>
                                {(job.product?.width || job.product?.length || job.product?.height) && (
                                    <span className="text-secondary-500">
                                        {job.product?.width || '-'}x{job.product?.length || '-'}x{job.product?.height || '-'} cm
                                    </span>
                                )}


                            </span>
                        </div>


                    </div>
                </div>

                {/* Row 4: Installation Details (Full Width) */}
                {job.notes && (
                    <div className="px-3 pb-3">
                        <div className="text-xs text-secondary-600 bg-secondary-50 px-2 py-1.5 rounded border border-secondary-100 flex items-start gap-1">
                            <FileText size={14} className="text-secondary-400 flex-shrink-0 mt-0.5" />
                            <span className="italic leading-relaxed">{job.notes}</span>
                        </div>
                    </div>
                )}
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
