import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Briefcase,
    CreditCard,
    Camera,
    Image as ImageIcon,
    X,
    Users,
    UserCheck,
    UserX,

    RotateCcw,
    Menu
} from 'lucide-react'

import TeamMemberModal from '../components/TeamMemberModal'
import TeamManagementModal from '../components/TeamManagementModal'
import { DataManager } from '../lib/dataManager'

export default function TeamPage() {
    const [activeTab, setActiveTab] = useState('current') // current, resigned
    const [teamMembers, setTeamMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showTeamModal, setShowTeamModal] = useState(false)
    const [editingMember, setEditingMember] = useState(null)

    // Initial Form State
    const initialFormState = {
        eid: '',
        nickname: '',
        firstname: '',
        lastname: '',
        team: '',
        teamType: '',
        job: '',
        level: '',
        userType: 'User',
        email: '',
        phone1: '',
        phone2: '',
        address: '',
        startDate: '',
        endDate: '',
        workType: '',
        payType: '',
        payRate: '',
        incentiveRate: '',
        citizenId: '',
        birthDay: '',
        bank: '',
        acNumber: '',
        status: 'current'
    }

    const [formData, setFormData] = useState(initialFormState)

    // Load data
    const loadTeams = async () => {
        const teams = await DataManager.getEmployees()
        setTeamMembers(teams)
    }

    useEffect(() => {
        loadTeams()
    }, [])

    const handleAdd = () => {
        setEditingMember(null)
        setFormData({
            ...initialFormState,
            eid: `EID${String(teamMembers.length + 1).padStart(4, '0')}`,
        })
        setShowModal(true)
    }

    const handleEdit = (member) => {
        setEditingMember(member)
        setFormData({ ...initialFormState, ...member })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (confirm('คุณต้องการลบข้อมูลทีมงานนี้หรือไม่?')) {
            const success = await DataManager.deleteEmployee(id)
            if (success) {
                await loadTeams()
            } else {
                alert('ลบข้อมูลไม่สำเร็จ')
            }
        }
    }

    const handleSave = async (data) => {
        let result = null

        // Ensure ID is passed if editing
        if (editingMember && editingMember.id) {
            data.id = editingMember.id
        }

        result = await DataManager.saveEmployee(data)

        if (result && result.success) {
            await loadTeams()
            setShowModal(false)
        } else {
            console.error(result)
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (result?.error || 'Unknown error'))
        }
    }

    const filteredMembers = teamMembers.filter(m =>
        m.status === activeTab &&
        (m.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.fullname && m.fullname.toLowerCase().includes(searchTerm.toLowerCase())) ||
            m.eid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.team?.toLowerCase().includes(searchTerm.toLowerCase())))
    )
    // handleResetData removed

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white border-b border-secondary-200 px-4 py-3 sm:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                    <Users className="text-primary-600" size={28} />
                                    จัดการทีม (Team)
                                </h1>
                                <p className="text-sm text-secondary-500 mt-1">จัดการข้อมูลพนักงานและทีมงานทั้งหมด</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setShowTeamModal(true)}
                                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white text-secondary-700 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2 font-medium"
                            >
                                <Briefcase size={18} />
                                ข้อมูลทีม
                            </button>

                            <button
                                onClick={handleAdd}
                                className="flex-1 sm:flex-none justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                            >
                                <Plus size={18} />
                                เพิ่มทีมงานใหม่
                            </button>
                        </div>
                    </div>
                </header>
            )}
        >
            <Head>
                <title>จัดการทีม (Team) - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6">

                {/* Tabs & Search */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex bg-secondary-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('current')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'current'
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-secondary-600 hover:text-secondary-900'
                                }`}
                        >
                            <UserCheck size={16} />
                            พนักงานปัจจุบัน
                        </button>
                        <button
                            onClick={() => setActiveTab('resigned')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'resigned'
                                ? 'bg-white text-secondary-600 shadow-sm'
                                : 'text-secondary-600 hover:text-secondary-900'
                                }`}
                        >
                            <UserX size={16} />
                            พนักงานที่ลาออก
                        </button>
                    </div>

                    <div className="relative w-full lg:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหาตาม EID, ชื่อ, ทีม..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-secondary-50 border-b border-secondary-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">EID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ชื่อเล่น</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ทีม</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">ตำแหน่ง</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {filteredMembers.length > 0 ? (
                                    filteredMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-secondary-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono text-sm font-medium text-secondary-600 bg-secondary-100 px-2 py-1 rounded">
                                                    {member.eid}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-secondary-900">{member.nickname}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-900">{member.fullname}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-600">{member.team || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-600">{member.job || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-secondary-600">{member.email || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(member)}
                                                        className="p-2 text-secondary-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="p-2 text-secondary-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-secondary-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Users size={48} className="text-secondary-300 mb-4" />
                                                <p className="text-lg font-medium text-secondary-900">ไม่พบข้อมูลพนักงาน</p>
                                                <p className="text-sm text-secondary-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเพิ่มพนักงานใหม่</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <TeamMemberModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                member={formData}
                onSave={handleSave}
            />

            {/* Team Management Modal */}
            <TeamManagementModal
                isOpen={showTeamModal}
                onClose={() => setShowTeamModal(false)}
            />
        </AppLayout>
    )
}
