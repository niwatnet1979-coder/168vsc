import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import AppLayout from '../components/AppLayout'
import {
    Settings,
    Store,
    Users,
    Database,
    Save,
    RefreshCw,
    Trash2,
    Shield,
    Bell,
    Globe
} from 'lucide-react'

import TeamMemberModal from '../components/TeamMemberModal'

export default function SettingsPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState('general')
    const [users, setUsers] = useState([])
    const [shopSettings, setShopSettings] = useState({
        name: '168 อินทีเรีย ไลท์ติ้ง',
        address: '168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
        phone: '084-282-9465',
        email: 'contact@168lighting.com',
        taxId: '0135566027619',
        vatRegistered: true,
        vatRate: 7
    })
    const [isSaved, setIsSaved] = useState(false)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [formData, setFormData] = useState(null)

    // Load settings and users
    useEffect(() => {
        const savedSettings = localStorage.getItem('shop_settings')
        if (savedSettings) {
            setShopSettings(JSON.parse(savedSettings))
        }

        // Load users from team_data (same as Team page)
        const savedUsers = localStorage.getItem('team_data')
        if (savedUsers) {
            const teamData = JSON.parse(savedUsers)
            // Convert team data to users format
            const usersData = teamData.map(member => ({
                id: member.id,
                image: member.image || null,
                nickname: member.nickname,
                email: member.email,
                phone: member.phone1 || member.phone,
                teamType: member.teamType || member.team,
                teamName: member.team || member.teamName,
                role: member.userType?.toLowerCase() === 'admin' ? 'admin' : 'user'
            }))
            setUsers(usersData)
        } else {
            // Default users - will also be saved to team_data
            const defaultUsers = [
                {
                    id: 1,
                    eid: 'EID0000',
                    image: '/logo-192.png',
                    nickname: 'Admin',
                    firstname: '',
                    lastname: '',
                    fullname: 'Admin',
                    email: 'niwatnet1979@gmail.com',
                    phone: '084-282-9465',
                    phone1: '084-282-9465',
                    teamType: 'ผู้ดูแลระบบ',
                    team: 'All Teams',
                    teamName: 'All Teams',
                    job: 'Manager',
                    userType: 'Admin',
                    role: 'admin',
                    status: 'current'
                },
                {
                    id: 2,
                    eid: 'EID0001',
                    image: null,
                    nickname: 'ช่างเอ',
                    firstname: '',
                    lastname: '',
                    fullname: 'ช่างเอ',
                    email: 'technician.a@168vsc.com',
                    phone: '081-234-5678',
                    phone1: '081-234-5678',
                    teamType: 'ช่างติดตั้ง',
                    team: 'ทีม A',
                    teamName: 'ทีม A',
                    job: 'Technician',
                    userType: 'User',
                    role: 'user',
                    status: 'current'
                },
                {
                    id: 3,
                    eid: 'EID0002',
                    image: null,
                    nickname: 'ช่างบี',
                    firstname: '',
                    lastname: '',
                    fullname: 'ช่างบี',
                    email: 'technician.b@168vsc.com',
                    phone: '082-345-6789',
                    phone1: '082-345-6789',
                    teamType: 'ช่างติดตั้ง',
                    team: 'ทีม B',
                    teamName: 'ทีม B',
                    job: 'Technician',
                    userType: 'User',
                    role: 'user',
                    status: 'current'
                },
                {
                    id: 4,
                    eid: 'EID0003',
                    image: null,
                    nickname: 'QC1',
                    firstname: '',
                    lastname: '',
                    fullname: 'QC1',
                    email: 'qc1@168vsc.com',
                    phone: '083-456-7890',
                    phone1: '083-456-7890',
                    teamType: 'QC',
                    team: 'ทีม QC',
                    teamName: 'ทีม QC',
                    job: 'QC',
                    userType: 'User',
                    role: 'user',
                    status: 'current'
                }
            ]
            localStorage.setItem('team_data', JSON.stringify(defaultUsers))

            // Convert to users format for display
            const usersData = defaultUsers.map(member => ({
                id: member.id,
                image: member.image,
                nickname: member.nickname,
                email: member.email,
                phone: member.phone,
                teamType: member.teamType,
                teamName: member.teamName,
                role: member.role
            }))
            setUsers(usersData)
        }
    }, [])

    const handleSave = () => {
        localStorage.setItem('shop_settings', JSON.stringify(shopSettings))
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
    }

    const handleEditUser = (user) => {
        // Load full team data to get all fields
        const teamData = JSON.parse(localStorage.getItem('team_data') || '[]')
        const member = teamData.find(m => m.id === user.id)

        if (member) {
            setEditingMember(member)
            setFormData(member)
            setShowModal(true)
        }
    }

    const handleSaveUser = (data) => {
        // Update team_data in localStorage
        const teamData = JSON.parse(localStorage.getItem('team_data') || '[]')
        const updatedTeamData = teamData.map(m => m.id === data.id ? data : m)
        localStorage.setItem('team_data', JSON.stringify(updatedTeamData))

        // Update local users state
        const usersData = updatedTeamData.map(member => ({
            id: member.id,
            image: member.image || null,
            nickname: member.nickname,
            email: member.email,
            phone: member.phone1 || member.phone,
            teamType: member.teamType || member.team,
            teamName: member.team || member.teamName,
            role: member.userType?.toLowerCase() === 'admin' ? 'admin' : 'user'
        }))
        setUsers(usersData)

        setShowModal(false)
    }

    const handleDeleteUser = (userId) => {
        if (confirm('คุณต้องการลบผู้ใช้งานนี้หรือไม่?')) {
            // Load team_data
            const teamData = JSON.parse(localStorage.getItem('team_data') || '[]')
            // Remove user from team_data
            const updatedTeamData = teamData.filter(member => member.id !== userId)
            // Save back to team_data
            localStorage.setItem('team_data', JSON.stringify(updatedTeamData))

            // Update local users state
            const updatedUsers = users.filter(user => user.id !== userId)
            setUsers(updatedUsers)

            alert('ลบผู้ใช้งานเรียบร้อยแล้ว')
        }
    }

    const handleClearData = () => {
        if (confirm('คำเตือน: การกระทำนี้จะลบข้อมูล Orders, Products และ Customers ทั้งหมดออกจากระบบ\n\n(ใช้สำหรับเริ่มระบบใหม่ หรือล้างข้อมูลเก่าเพื่อรองรับ Format ID แบบใหม่)')) {
            if (confirm('ยืนยันอีกครั้ง: ข้อมูลจะหายไปถาวร! คุณแน่ใจหรือไม่?')) {
                // Remove specific data keys but keep settings
                localStorage.removeItem('orders_data')
                localStorage.removeItem('products_data')
                localStorage.removeItem('customers_data')

                // Optional: Clear other temporary keys if any
                // localStorage.removeItem('temp_key')

                alert('ล้างข้อมูลเรียบร้อยแล้ว ระบบพร้อมสำหรับเริ่มใช้งานใหม่')
                window.location.reload()
            }
        }
    }

    return (
        <AppLayout>
            <Head>
                <title>ตั้งค่าระบบ (Settings) - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <Settings className="text-primary-600" size={32} />
                            ตั้งค่าระบบ (Settings)
                        </h1>
                        <p className="text-secondary-500 mt-1">จัดการข้อมูลร้านค้าและการตั้งค่าทั่วไป</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                    >
                        <Save size={18} />
                        {isSaved ? 'บันทึกแล้ว!' : 'บันทึกการตั้งค่า'}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                            <nav className="flex flex-col p-2 gap-1">
                                {[
                                    { id: 'general', label: 'ข้อมูลร้านค้า', icon: Store },
                                    { id: 'users', label: 'ผู้ใช้งาน & สิทธิ์', icon: Users },
                                    { id: 'system', label: 'การตั้งค่าระบบ', icon: Globe },
                                    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
                                    { id: 'database', label: 'จัดการฐานข้อมูล', icon: Database, danger: true }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? tab.danger
                                                ? 'bg-danger-50 text-danger-700'
                                                : 'bg-primary-50 text-primary-700'
                                            : 'text-secondary-600 hover:bg-secondary-50'
                                            }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 min-h-[500px]">
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">ข้อมูลร้านค้า</h2>
                                        <p className="text-secondary-500 text-sm mt-1">ข้อมูลนี้จะถูกนำไปแสดงในใบเสนอราคาและใบเสร็จรับเงิน</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">ชื่อร้าน / บริษัท</label>
                                            <input
                                                type="text"
                                                value={shopSettings.name}
                                                onChange={e => setShopSettings({ ...shopSettings, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">ที่อยู่</label>
                                            <textarea
                                                rows="3"
                                                value={shopSettings.address}
                                                onChange={e => setShopSettings({ ...shopSettings, address: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">เบอร์โทรศัพท์</label>
                                            <input
                                                type="text"
                                                value={shopSettings.phone}
                                                onChange={e => setShopSettings({ ...shopSettings, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">อีเมล</label>
                                            <input
                                                type="email"
                                                value={shopSettings.email}
                                                onChange={e => setShopSettings({ ...shopSettings, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                                            <input
                                                type="text"
                                                value={shopSettings.taxId}
                                                onChange={e => setShopSettings({ ...shopSettings, taxId: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">ผู้ใช้งาน & สิทธิ์</h2>
                                        <p className="text-secondary-500 text-sm mt-1">จัดการสิทธิ์การเข้าถึงระบบ (เข้าถึงได้ทุกคน)</p>
                                    </div>

                                    {/* User Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-secondary-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">รูป</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">ชื่อเล่น</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">Email</th>

                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">Team Type</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">Team Name</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">สิทธิ์</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-secondary-700">จัดการ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {users.map((user) => (
                                                    <tr key={user.id} className="border-b border-secondary-100 hover:bg-secondary-50 transition-colors">
                                                        <td className="py-3 px-4">
                                                            {user.image ? (
                                                                <img
                                                                    src={user.image}
                                                                    alt={user.nickname}
                                                                    className="w-10 h-10 rounded-full"
                                                                />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                                                                    {user.nickname.charAt(0)}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-3 px-4 text-sm font-medium text-secondary-900">{user.nickname}</td>
                                                        <td className="py-3 px-4 text-sm text-secondary-600">{user.email}</td>

                                                        <td className="py-3 px-4 text-sm text-secondary-600">{user.teamType}</td>
                                                        <td className="py-3 px-4 text-sm text-secondary-600">{user.teamName}</td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                    user.role === 'disabled' ? 'bg-gray-100 text-gray-600' :
                                                                        'bg-green-100 text-green-800'
                                                                }`}>
                                                                {user.role === 'admin' ? 'Admin' : user.role === 'disabled' ? 'Disabled' : 'User'}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <button
                                                                onClick={() => handleEditUser(user)}
                                                                className="text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
                                                            >
                                                                แก้ไข
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Info Box */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                        <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">หมายเหตุ</p>
                                            <p className="text-sm text-blue-700 mt-1">
                                                คลิก "แก้ไข" เพื่อไปยังหน้าจัดการทีมของผู้ใช้งานแต่ละคน
                                                สามารถเปลี่ยนสิทธิ์ ทีม และข้อมูลส่วนตัวได้ที่นั่น
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'system' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">การตั้งค่าระบบ</h2>
                                        <p className="text-secondary-500 text-sm mt-1">ตั้งค่าภาษี สกุลเงิน และอื่นๆ</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium text-secondary-900">จดทะเบียนภาษีมูลค่าเพิ่ม (VAT)</h3>
                                                    <p className="text-sm text-secondary-500">เปิดใช้งานหากร้านค้าของคุณจดทะเบียน VAT</p>
                                                </div>
                                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                    <input
                                                        type="checkbox"
                                                        name="vatRegistered"
                                                        id="vatRegistered"
                                                        checked={shopSettings.vatRegistered}
                                                        onChange={e => setShopSettings({ ...shopSettings, vatRegistered: e.target.checked })}
                                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                        style={{ right: shopSettings.vatRegistered ? '0' : 'auto', left: shopSettings.vatRegistered ? 'auto' : '0' }}
                                                    />
                                                    <label
                                                        htmlFor="vatRegistered"
                                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${shopSettings.vatRegistered ? 'bg-primary-500' : 'bg-secondary-300'}`}
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">อัตราภาษีมูลค่าเพิ่ม (%)</label>
                                            <input
                                                type="number"
                                                value={shopSettings.vatRate}
                                                onChange={e => setShopSettings({ ...shopSettings, vatRate: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">การแจ้งเตือน</h2>
                                        <p className="text-secondary-500 text-sm mt-1">ตั้งค่าการแจ้งเตือนผ่าน LINE Notify และ Email</p>
                                    </div>

                                    <div className="p-8 text-center border-2 border-dashed border-secondary-200 rounded-xl">
                                        <Bell className="mx-auto h-12 w-12 text-secondary-300 mb-4" />
                                        <h3 className="text-lg font-medium text-secondary-900">ยังไม่เปิดให้บริการ</h3>
                                        <p className="text-secondary-500 mt-1">ฟีเจอร์นี้จะเปิดให้ใช้งานในเวอร์ชันถัดไป</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'database' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-danger-700">จัดการฐานข้อมูล</h2>
                                        <p className="text-secondary-500 text-sm mt-1">จัดการข้อมูลในระบบ (พื้นที่อันตราย)</p>
                                    </div>

                                    <div className="bg-danger-50 border border-danger-200 rounded-xl p-6">
                                        <h3 className="text-lg font-bold text-danger-800 mb-2">ล้างข้อมูลระบบ (Factory Reset)</h3>
                                        <p className="text-danger-700 mb-6">
                                            การกระทำนี้จะลบข้อมูล Orders, Products และ Customers ทั้งหมดออกจากระบบ
                                            แต่จะเก็บการตั้งค่าร้านค้าและผู้ใช้งานไว้
                                            <br /><br />
                                            <strong>คำเตือน:</strong> ข้อมูลที่ลบไปแล้วจะไม่สามารถกู้คืนได้!
                                        </p>
                                        <button
                                            onClick={handleClearData}
                                            className="px-6 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-danger-500/30"
                                        >
                                            <RefreshCw size={18} />
                                            ล้างข้อมูลทั้งหมด
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <TeamMemberModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                member={editingMember}
                onSave={handleSaveUser}
            />
        </AppLayout >
    )
}
