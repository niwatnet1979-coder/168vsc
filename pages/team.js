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
    UserX
} from 'lucide-react'

export default function TeamPage() {
    const [activeTab, setActiveTab] = useState('current') // current, resigned
    const [activeModalTab, setActiveModalTab] = useState('general') // general, contact, work, personal
    const [teamMembers, setTeamMembers] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
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
    useEffect(() => {
        const savedData = localStorage.getItem('team_data')
        if (savedData) {
            setTeamMembers(JSON.parse(savedData))
        } else {
            // Initial mock data if empty
            const mockData = [
                {
                    id: 1,
                    eid: 'EID0000',
                    nickname: 'สาเล็ง',
                    fullname: 'สาเล็ง',
                    team: 'ทีมบริหาร',
                    teamType: 'บริหาร',
                    job: 'Manager',
                    level: 'L5',
                    userType: 'Admin',
                    email: 'saseng1981@gmail.com',
                    phone1: '081-111-1111',
                    status: 'current'
                },
                {
                    id: 2,
                    eid: 'EID0001',
                    nickname: 'สา',
                    fullname: 'วันวิสาข์ สุขสอาด',
                    team: 'ทีมบริหาร',
                    teamType: 'บริหาร',
                    job: 'HR',
                    level: 'L4',
                    userType: 'User',
                    email: 'katoon2444@gmail.com',
                    phone1: '082-222-2222',
                    status: 'current'
                }
            ]
            setTeamMembers(mockData)
            localStorage.setItem('team_data', JSON.stringify(mockData))
        }
    }, [])

    // Save data
    useEffect(() => {
        if (teamMembers.length > 0) {
            localStorage.setItem('team_data', JSON.stringify(teamMembers))
        }
    }, [teamMembers])

    const handleAdd = () => {
        setEditingMember(null)
        setFormData({
            ...initialFormState,
            eid: `EID${String(teamMembers.length).padStart(4, '0')}`,
        })
        setActiveModalTab('general')
        setShowModal(true)
    }

    const handleEdit = (member) => {
        setEditingMember(member)
        setFormData({ ...initialFormState, ...member })
        setActiveModalTab('general')
        setShowModal(true)
    }

    const handleDelete = (id) => {
        if (confirm('คุณต้องการลบข้อมูลทีมงานนี้หรือไม่?')) {
            setTeamMembers(teamMembers.filter(m => m.id !== id))
        }
    }

    const handleSave = () => {
        if (!formData.nickname) {
            alert('กรุณากรอกชื่อเล่น')
            return
        }

        const fullName = `${formData.firstname || ''} ${formData.lastname || ''}`.trim() || formData.nickname
        const dataToSave = { ...formData, fullname: fullName }

        if (editingMember) {
            setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? { ...dataToSave, id: m.id } : m))
        } else {
            const newId = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1
            setTeamMembers([...teamMembers, { ...dataToSave, id: newId }])
        }
        setShowModal(false)
    }

    const filteredMembers = teamMembers.filter(m =>
        m.status === activeTab &&
        (m.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.fullname && m.fullname.toLowerCase().includes(searchTerm.toLowerCase())) ||
            m.eid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.team && m.team.toLowerCase().includes(searchTerm.toLowerCase())))
    )

    return (
        <AppLayout>
            <Head>
                <title>จัดการทีม (Team) - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <Users className="text-primary-600" size={32} />
                            จัดการทีม (Team)
                        </h1>
                        <p className="text-secondary-500 mt-1">จัดการข้อมูลพนักงานและทีมงานทั้งหมด</p>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                    >
                        <Plus size={18} />
                        เพิ่มทีมงานใหม่
                    </button>
                </div>

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
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
                            <h3 className="text-xl font-bold text-secondary-900">
                                {editingMember ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-200 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="px-6 pt-4 border-b border-secondary-200 flex gap-6 overflow-x-auto">
                            {[
                                { id: 'general', label: 'ข้อมูลทั่วไป', icon: User },
                                { id: 'contact', label: 'ข้อมูลติดต่อ', icon: Phone },
                                { id: 'work', label: 'ข้อมูลการทำงาน', icon: Briefcase },
                                { id: 'personal', label: 'ข้อมูลส่วนตัว', icon: CreditCard }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveModalTab(tab.id)}
                                    className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeModalTab === tab.id
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-secondary-500 hover:text-secondary-700'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1">
                            {activeModalTab === 'general' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">รหัสพนักงาน (EID)</label>
                                        <input
                                            type="text"
                                            value={formData.eid}
                                            disabled
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg bg-secondary-100 text-secondary-500 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ชื่อเล่น <span className="text-danger-500">*</span></label>
                                        <input
                                            type="text"
                                            value={formData.nickname}
                                            onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ชื่อจริง</label>
                                        <input
                                            type="text"
                                            value={formData.firstname}
                                            onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">นามสกุล</label>
                                        <input
                                            type="text"
                                            value={formData.lastname}
                                            onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ชื่อทีม</label>
                                        <input
                                            type="text"
                                            value={formData.team}
                                            onChange={e => setFormData({ ...formData, team: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภททีม</label>
                                        <input
                                            type="text"
                                            value={formData.teamType}
                                            onChange={e => setFormData({ ...formData, teamType: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ตำแหน่ง (Job)</label>
                                        <input
                                            type="text"
                                            value={formData.job}
                                            onChange={e => setFormData({ ...formData, job: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ระดับ (Level)</label>
                                        <input
                                            type="text"
                                            value={formData.level}
                                            onChange={e => setFormData({ ...formData, level: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">User Type</label>
                                        <select
                                            value={formData.userType}
                                            onChange={e => setFormData({ ...formData, userType: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="User">User</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Manager">Manager</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeModalTab === 'contact' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">เบอร์โทร 1</label>
                                        <input
                                            type="text"
                                            value={formData.phone1}
                                            onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">เบอร์โทร 2</label>
                                        <input
                                            type="text"
                                            value={formData.phone2}
                                            onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ที่อยู่</label>
                                        <textarea
                                            rows="3"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        ></textarea>
                                    </div>
                                </div>
                            )}

                            {activeModalTab === 'work' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">วันเริ่มงาน</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">วันสิ้นสุด</label>
                                        <input
                                            type="date"
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภทการทำงาน</label>
                                        <input
                                            type="text"
                                            value={formData.workType}
                                            onChange={e => setFormData({ ...formData, workType: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภทการจ่าย</label>
                                        <input
                                            type="text"
                                            value={formData.payType}
                                            onChange={e => setFormData({ ...formData, payType: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">อัตราค่าจ้าง</label>
                                        <input
                                            type="text"
                                            value={formData.payRate}
                                            onChange={e => setFormData({ ...formData, payRate: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">อัตราค่าคอมมิชชั่น</label>
                                        <input
                                            type="text"
                                            value={formData.incentiveRate}
                                            onChange={e => setFormData({ ...formData, incentiveRate: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeModalTab === 'personal' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">เลขบัตรประชาชน</label>
                                        <input
                                            type="text"
                                            value={formData.citizenId}
                                            onChange={e => setFormData({ ...formData, citizenId: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">วันเกิด</label>
                                        <input
                                            type="date"
                                            value={formData.birthDay}
                                            onChange={e => setFormData({ ...formData, birthDay: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">ธนาคาร</label>
                                        <select
                                            value={formData.bank}
                                            onChange={e => setFormData({ ...formData, bank: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">-- เลือก --</option>
                                            <option value="KBANK">กสิกรไทย</option>
                                            <option value="SCB">ไทยพาณิชย์</option>
                                            <option value="BBL">กรุงเทพ</option>
                                            <option value="KTB">กรุงไทย</option>
                                            <option value="TTB">ทหารไทยธนชาต</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-secondary-700 mb-1">เลขบัญชี</label>
                                        <input
                                            type="text"
                                            value={formData.acNumber}
                                            onChange={e => setFormData({ ...formData, acNumber: e.target.value })}
                                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Upload Section */}
                                    <div className="md:col-span-2 space-y-4 pt-4 border-t border-secondary-200">
                                        <h4 className="font-medium text-secondary-900">เอกสารแนบ</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {['รูปถ่ายหน้าตรง', 'รูปบัตรประชาชน', 'รูปทะเบียนบ้าน'].map((label, i) => (
                                                <div key={i} className="border border-dashed border-secondary-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-secondary-50 transition-colors cursor-pointer">
                                                    <div className="p-2 bg-secondary-100 rounded-full text-secondary-500">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                    <span className="text-sm text-secondary-600 text-center">{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3 bg-secondary-50">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-white transition-colors font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                            >
                                บันทึกข้อมูล
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
