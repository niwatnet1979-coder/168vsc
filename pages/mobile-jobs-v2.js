import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'

import AppLayout from '../components/AppLayout'
import { DataManager } from '../lib/dataManager'
import { useJobs } from '../hooks/useJobs'
import {
    Wrench,
    Truck,
    MapPin,
    Calendar,
    Clock,
    User,
    Phone,
    UserCheck,
    Menu
} from 'lucide-react'


export default function MobileJobsV2() {
    const router = useRouter()
    const { data: session } = useSession()
    const { jobs: allJobs, loading } = useJobs() // Use Hook
    const [selectedTeam, setSelectedTeam] = useState('ทั้งหมด')
    const [jobs, setJobs] = useState([]) // filtered jobs

    // Get user role and team
    const userRole = session?.user?.role
    const userTeam = session?.user?.team

    const [availableTeams, setAvailableTeams] = useState([])

    // Update available teams when allJobs changes
    useEffect(() => {
        if (allJobs.length > 0) {
            const teams = [...new Set(allJobs.map(j => j.assignedTeam).filter(t => t && t !== '-'))].sort()
            setAvailableTeams(['ทั้งหมด', ...teams])
        }
    }, [allJobs])

    useEffect(() => {
        if (userTeam) {
            // Enhanced Normalization for Session Team Name
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
            console.log(`MobileJobs: Session Team '${userTeam}' normalized to '${normalizedTeam}'`)
            setSelectedTeam(normalizedTeam)
        }
    }, [userTeam])

    useEffect(() => {
        filterJobs()
    }, [selectedTeam, userRole, allJobs]) // Re-run when jobs (realtime), filter, or role changes

    const filterJobs = () => {
        // Relaxed: Show all jobs even if orderId is missing, to prevent data disappearance
        // If we strictly filter `orderIds.has(job.orderId)`, jobs with broken links vanish.
        const validJobs = allJobs

        // Filter by role/selection
        let filteredJobs = validJobs

        // If logged in as non-admin, restrict to their team (unless they are admin, who can see all)
        // But if NOT logged in (session is null), allow selecting any team
        // Admin or Public User (or V2 Logged In): Filter by selectedTeam
        // We removed strict userRole enforcement for V2 to prevent data disappearing if team doesn't match
        // Verify selectedTeam exists in available teams, otherwise fallback or normalize
        let effectiveTeam = selectedTeam

        // Normalize "Team X" to "ทีม X" if needed for matching
        const normalizeTeam = (t) => {
            if (!t) return 'ทั้งหมด'
            if (t.toLowerCase() === 'team a') return 'ทีม A'
            if (t.toLowerCase() === 'team b') return 'ทีม B'
            if (t.toLowerCase() === 'team c') return 'ทีม C'
            // Add logic to check if 'Team X' exists in availableTeams as 'ทีม X'
            if (t.startsWith('Team ')) {
                const thaiName = 'ทีม ' + t.substring(5)
                // We access availableTeams state here, but better to recalc or trust logic
                // For simplicity, we just use string matching logic
                return thaiName
            }
            return t
        }

        const teams = [...new Set(allJobs.map(j => j.assignedTeam).filter(t => t && t !== '-'))].sort()

        // If selectedTeam isn't in the list (and isn't All), try to normalize
        if (effectiveTeam !== 'ทั้งหมด' && !teams.includes(effectiveTeam)) {
            const normalized = normalizeTeam(effectiveTeam)
            if (teams.includes(normalized)) {
                effectiveTeam = normalized
                // Update state so dropdown matches too (optional but good UI)
                if (effectiveTeam !== selectedTeam) setSelectedTeam(effectiveTeam)
            } else {
                // Fallback: Team not found even after normalization? Default to ALL
                effectiveTeam = 'ทั้งหมด'
                if (selectedTeam !== 'ทั้งหมด') setSelectedTeam('ทั้งหมด')
            }
        }

        // If not "All", filter by team
        if (effectiveTeam !== 'ทั้งหมด') {
            const teamFiltered = validJobs.filter(job => job.assignedTeam === effectiveTeam)
            filteredJobs = teamFiltered
        } else {
            filteredJobs = validJobs
        }

        // Sort by date (nearest first)
        filteredJobs.sort((a, b) => {
            const dateA = new Date(`${a.jobDate}T${a.jobTime}`)
            const dateB = new Date(`${b.jobDate}T${b.jobTime}`)
            return dateA - dateB
        })

        setJobs(filteredJobs)
    }

    // Determine card color based on completion status
    const getCardColor = (job) => {
        const hasCompletionDate = job.completionDate != null
        const hasSignature = job.signatureImage != null

        if (hasCompletionDate && hasSignature) {
            return 'bg-green-50 border-green-200'
        }
        return 'bg-white border-secondary-200'
    }

    // Get job type icon
    const getJobIcon = (jobType) => {
        if (jobType === 'ติดตั้ง' || jobType === 'installation') {
            return <Wrench size={20} className="text-primary-600" />
        }
        return <Truck size={20} className="text-warning-600" />
    }

    // Format date/time
    const formatDateTime = (date, time) => {
        if (!date) return '-'
        const d = new Date(date)
        const day = d.getDate().toString().padStart(2, '0')
        const month = (d.getMonth() + 1).toString().padStart(2, '0')
        const year = d.getFullYear()
        return `${day}/${month}/${year} ${time || ''}`
    }

    // Calculate distance (placeholder - will use actual calculation)
    const getDistance = (address) => {
        // TODO: Implement actual distance calculation using SHOP_LAT, SHOP_LON
        return Math.floor(Math.random() * 30) + 5 // Mock: 5-35 km
    }

    // Extract district and province from address
    const getLocation = (address) => {
        // Simple extraction - can be improved
        const parts = address.split(' ')
        const province = parts.find(p => p.includes('จังหวัด'))?.replace('จังหวัด', '') || 'กรุงเทพฯ'
        const district = parts.find(p => p.includes('อำเภอ'))?.replace('อำเภอ', '') || parts.find(p => p.includes('เขต'))?.replace('เขต', '') || '-'
        return { district, province }
    }

    // Header logic needs update too
    const showTeamSelector = true // Always allow filtering in V2

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-secondary-600">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white border-b border-secondary-200 px-4 py-3 sticky top-0 z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <button
                                className="p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-secondary-900">Mobile Jobs</h1>
                                <p className="text-xs text-secondary-500">
                                    {loading ? '...' : `${jobs.length} งาน`}
                                </p>
                            </div>
                        </div>

                        {/* Team Selector for Public/Admin */}
                        {showTeamSelector && (
                            <select
                                value={selectedTeam}
                                onChange={(e) => setSelectedTeam(e.target.value)}
                                className="text-sm border-secondary-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 py-1.5 pl-2 pr-8"
                            >
                                {availableTeams.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </header>
            )}
        >
            <Head>
                <title>Mobile Jobs - 168VSC System</title>
            </Head>

            <div className="space-y-4 pb-20 pt-4 px-4 bg-secondary-50 min-h-screen">

                {/* Job Cards */}
                <div className="space-y-3">
                    {jobs.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center justify-center">
                            <p className="text-secondary-500 mb-4">ไม่มีงานในขณะนี้</p>
                        </div>
                    ) : (
                        jobs.map((job) => {
                            const displayAddress = job.address ||
                                job.order?.address ||
                                job.customer?.address ||
                                (job.customer?.addresses?.[0]?.address) ||
                                '-'
                            const location = getLocation(displayAddress)
                            const distance = getDistance(displayAddress)

                            return (
                                <Link
                                    key={job.id}
                                    href={`/mobile-jobs-v2/${job.id}`}
                                    className={`block p-3 rounded-lg border-2 transition-all hover:shadow-md ${getCardColor(job)}`}
                                >
                                    <div className="flex gap-3">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0">
                                            <img
                                                src={job.productImage || 'https://images.unsplash.com/photo-1513506003013-d5316327a3d8?auto=format&fit=crop&q=80&w=60&h=60'}
                                                alt={job.productName}
                                                className="w-20 h-20 rounded object-cover border border-secondary-200"
                                                style={{ width: '2cm', height: '2cm' }}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Row 1: Job Type, Date, Customer, Inspector */}
                                            <div className="flex items-center gap-2 text-xs text-secondary-900 mb-1 flex-wrap">
                                                {/* Job Icon */}
                                                {getJobIcon(job.jobType)}

                                                {/* Date */}
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    <span className="font-medium">{formatDateTime(job.jobDate, job.jobTime)}</span>
                                                </div>

                                                {/* Customer Phone */}
                                                {job.customer?.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={12} />
                                                        <a href={`tel:${job.customer.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{job.customer.phone}</a>
                                                    </div>
                                                )}

                                                {/* Customer Name */}
                                                <div className="flex items-center gap-1">
                                                    <User size={12} />
                                                    <span className="truncate max-w-[100px]">{job.customerName}</span>
                                                </div>

                                                {/* Inspector (Try to find) */}
                                                {(() => {
                                                    // Only get from Order specific Job Info as requested
                                                    const inspector = job.order?.job_info?.inspector1

                                                    if (inspector?.name) {
                                                        return (
                                                            <div className="flex items-center gap-1 text-secondary-600 border-l border-secondary-300 pl-2 ml-1">
                                                                <Phone size={12} />
                                                                {inspector.phone && (
                                                                    <a href={`tel:${inspector.phone}`} className="hover:underline mr-1" onClick={(e) => e.stopPropagation()}>{inspector.phone}</a>
                                                                )}
                                                                <UserCheck size={12} />
                                                                <span>{inspector.name}</span>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })()}

                                                <span className="flex-shrink-0 text-primary-600 font-medium whitespace-nowrap">
                                                    {distance} กม.
                                                </span>
                                            </div>

                                            {/* Row 2: Location (Restored) */}
                                            <div className="flex items-center gap-2 text-xs text-secondary-600 mb-1">
                                                <MapPin size={12} className="flex-shrink-0" />
                                                <span className="truncate">{displayAddress}</span>
                                            </div>

                                            {/* Row 3: Product Details */}
                                            <div className="text-xs text-secondary-700 leading-tight mt-1">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                    <span className="font-bold text-secondary-900">{job.productName}</span>
                                                    <span className="text-[10px] font-mono text-secondary-500 bg-secondary-100 px-1.5 py-0.5 rounded border border-secondary-200 flex-shrink-0">
                                                        {job.productId}
                                                    </span>
                                                    <span className="text-secondary-600">
                                                        {job.product?.category || '-'}
                                                        {(job.product?.width || job.product?.length || job.product?.height) && (
                                                            <span> • {job.product.width || '-'}x{job.product.length || '-'}x{job.product.height || '-'} cm</span>
                                                        )}
                                                        {job.product?.material && <span> • {job.product.material}</span>}
                                                        {job.product?.color && <span> • {job.product.color}</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </div>
            </div>
        </AppLayout>
    )
}


