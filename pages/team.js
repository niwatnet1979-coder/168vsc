import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function TeamPage() {
    const [activeTab, setActiveTab] = useState('current') // Main page tabs: 'current' or 'resigned'
    const [activeModalTab, setActiveModalTab] = useState('general') // Modal tabs: 'general', 'contact', 'work', 'personal'

    const [teamMembers, setTeamMembers] = useState([
        {
            id: 1,
            eid: 'EID0000',
            nickname: 'สาเล็ง',
            firstname: '',
            lastname: '',
            fullname: 'สาเล็ง', // For display in table
            team: 'ทีมบริหาร',
            teamType: 'บริหาร',
            job: 'Manager',
            level: 'L5',
            userType: 'Admin',
            email: 'saseng1981@gmail.com',
            phone1: '081-111-1111',
            phone2: '',
            address: '',
            startDate: '2020-01-01',
            endDate: '',
            workType: 'Full-time',
            payType: 'Monthly',
            payRate: '50000',
            incentiveRate: '0',
            citizenId: '',
            birthDay: '',
            bank: '',
            acNumber: '',
            status: 'current'
        },
        {
            id: 2,
            eid: 'EID0001',
            nickname: 'สา',
            firstname: 'วันวิสาข์',
            lastname: 'สุขสอาด',
            fullname: 'วันวิสาข์ สุขสอาด',
            team: 'ทีมบริหาร',
            teamType: 'บริหาร',
            job: 'HR',
            level: 'L4',
            userType: 'User',
            email: 'katoon2444@gmail.com',
            phone1: '082-222-2222',
            phone2: '',
            address: '',
            startDate: '2021-05-01',
            endDate: '',
            workType: 'Full-time',
            payType: 'Monthly',
            payRate: '35000',
            incentiveRate: '0',
            citizenId: '',
            birthDay: '',
            bank: '',
            acNumber: '',
            status: 'current'
        },
        // ... other mock data can be added here
    ])

    // Load data from LocalStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem('team_data')
        if (savedData) {
            setTeamMembers(JSON.parse(savedData))
        }
    }, [])

    // Save data to LocalStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('team_data', JSON.stringify(teamMembers))
    }, [teamMembers])

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
        setFormData({ ...member })
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

        const fullName = `${formData.firstname} ${formData.lastname}`.trim() || formData.nickname
        const dataToSave = { ...formData, fullname: fullName }

        if (editingMember) {
            setTeamMembers(teamMembers.map(m => m.id === editingMember.id ? { ...dataToSave, id: m.id } : m))
        } else {
            const newId = Math.max(...teamMembers.map(m => m.id), 0) + 1
            setTeamMembers([...teamMembers, { ...dataToSave, id: newId }])
        }
        setShowModal(false)
    }

    const filteredMembers = teamMembers.filter(m =>
        m.status === activeTab &&
        (m.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.eid.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.team.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Icons
    const EditIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    )

    const DeleteIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
    )

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

    const CameraIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
        </svg>
    )

    const ImageIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
    )

    return (
        <>
            <Head>
                <title>จัดการทีม (Team) - 168APP</title>
                <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            <div className="page-container">
                <header className="page-header">
                    <div className="header-left">
                        <Link href="/" className="btn-back-circle">
                            <BackIcon />
                        </Link>
                        <h1>จัดการทีม (Team)</h1>
                    </div>
                    <button className="btn-primary" onClick={handleAdd}>+ เพิ่มทีมงานใหม่</button>
                </header>

                <main className="main-content">
                    <div className="tabs-container">
                        <button
                            className={`tab-btn ${activeTab === 'current' ? 'active' : ''}`}
                            onClick={() => setActiveTab('current')}
                        >
                            พนักงานปัจจุบัน
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'resigned' ? 'active' : ''}`}
                            onClick={() => setActiveTab('resigned')}
                        >
                            พนักงานที่ลาออก
                        </button>
                    </div>

                    <div className="search-container">
                        <div className="search-wrapper">
                            <div className="search-icon">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="ค้นหาตาม STID, ชื่อ, ทีม..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    <div className="table-card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>EID</th>
                                    <th>ชื่อเล่น</th>
                                    <th>ชื่อ-นามสกุล</th>
                                    <th>ทีม</th>
                                    <th>ประเภท</th>
                                    <th>EMAIL</th>
                                    <th style={{ textAlign: 'right' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id}>
                                        <td><span className="text-eid">{member.eid}</span></td>
                                        <td><strong>{member.nickname}</strong></td>
                                        <td>{member.fullname}</td>
                                        <td>{member.team}</td>
                                        <td>{member.teamType}</td>
                                        <td>{member.email}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="btn-icon" onClick={() => handleEdit(member)} title="แก้ไข">
                                                    <EditIcon />
                                                </button>
                                                <button className="btn-icon" onClick={() => handleDelete(member.id)} title="ลบ">
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredMembers.length === 0 && (
                            <div className="empty-state">ไม่พบข้อมูล</div>
                        )}
                    </div>
                </main>

                {/* Modal */}
                {showModal && (
                    <div className="modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingMember ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h3>
                                <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                            </div>

                            <div className="modal-tabs">
                                <button
                                    className={`modal-tab-btn ${activeModalTab === 'general' ? 'active' : ''}`}
                                    onClick={() => setActiveModalTab('general')}
                                >
                                    ข้อมูลทั่วไป
                                </button>
                                <button
                                    className={`modal-tab-btn ${activeModalTab === 'contact' ? 'active' : ''}`}
                                    onClick={() => setActiveModalTab('contact')}
                                >
                                    ข้อมูลติดต่อ
                                </button>
                                <button
                                    className={`modal-tab-btn ${activeModalTab === 'work' ? 'active' : ''}`}
                                    onClick={() => setActiveModalTab('work')}
                                >
                                    ข้อมูลการทำงาน
                                </button>
                                <button
                                    className={`modal-tab-btn ${activeModalTab === 'personal' ? 'active' : ''}`}
                                    onClick={() => setActiveModalTab('personal')}
                                >
                                    ข้อมูลส่วนตัว
                                </button>
                            </div>

                            <div className="modal-body">
                                {/* Tab: ข้อมูลทั่วไป */}
                                {activeModalTab === 'general' && (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>รหัสพนักงาน (EID) *</label>
                                            <input
                                                type="text"
                                                value={formData.eid}
                                                disabled
                                                className="disabled"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ชื่อเล่น *</label>
                                            <input
                                                type="text"
                                                value={formData.nickname}
                                                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ชื่อจริง</label>
                                            <input
                                                type="text"
                                                value={formData.firstname}
                                                onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>นามสกุล</label>
                                            <input
                                                type="text"
                                                value={formData.lastname}
                                                onChange={e => setFormData({ ...formData, lastname: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ชื่อทีม</label>
                                            <input
                                                type="text"
                                                value={formData.team}
                                                onChange={e => setFormData({ ...formData, team: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ประเภททีม</label>
                                            <input
                                                type="text"
                                                value={formData.teamType}
                                                onChange={e => setFormData({ ...formData, teamType: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ตำแหน่ง (Job)</label>
                                            <input
                                                type="text"
                                                value={formData.job}
                                                onChange={e => setFormData({ ...formData, job: e.target.value })}
                                                placeholder="เลือกหรือพิมพ์ตำแหน่ง"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ระดับ (Level)</label>
                                            <input
                                                type="text"
                                                value={formData.level}
                                                onChange={e => setFormData({ ...formData, level: e.target.value })}
                                                placeholder="เลือกหรือพิมพ์ระดับ"
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>User Type</label>
                                            <select
                                                value={formData.userType}
                                                onChange={e => setFormData({ ...formData, userType: e.target.value })}
                                            >
                                                <option value="User">User</option>
                                                <option value="Admin">Admin</option>
                                                <option value="Manager">Manager</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Tab: ข้อมูลติดต่อ */}
                                {activeModalTab === 'contact' && (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>เบอร์โทร 1</label>
                                            <input
                                                type="text"
                                                value={formData.phone1}
                                                onChange={e => setFormData({ ...formData, phone1: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>เบอร์โทร 2</label>
                                            <input
                                                type="text"
                                                value={formData.phone2}
                                                onChange={e => setFormData({ ...formData, phone2: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>ที่อยู่</label>
                                            <textarea
                                                rows="3"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                className="form-textarea"
                                            ></textarea>
                                        </div>
                                    </div>
                                )}

                                {/* Tab: ข้อมูลการทำงาน */}
                                {activeModalTab === 'work' && (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>วันเริ่มงาน (StartDate)</label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>วันสิ้นสุด (EndDate)</label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ประเภทการทำงาน (WorkType)</label>
                                            <input
                                                type="text"
                                                value={formData.workType}
                                                onChange={e => setFormData({ ...formData, workType: e.target.value })}
                                                placeholder="เลือกหรือพิมพ์ประเภทการทำงาน"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ประเภทการจ่าย (PayType)</label>
                                            <input
                                                type="text"
                                                value={formData.payType}
                                                onChange={e => setFormData({ ...formData, payType: e.target.value })}
                                                placeholder="เลือกหรือพิมพ์ประเภทการจ่าย"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>อัตราค่าจ้าง (PayRate)</label>
                                            <input
                                                type="text"
                                                value={formData.payRate}
                                                onChange={e => setFormData({ ...formData, payRate: e.target.value })}
                                                placeholder="เลือกหรือพิมพ์อัตราค่าจ้าง"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>อัตราค่าคอมมิชชั่น (IncentiveRate)</label>
                                            <input
                                                type="text"
                                                value={formData.incentiveRate}
                                                onChange={e => setFormData({ ...formData, incentiveRate: e.target.value })}
                                                placeholder="เลือกหรือพิมพ์อัตราค่าคอมมิชชั่น"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Tab: ข้อมูลส่วนตัว */}
                                {activeModalTab === 'personal' && (
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>เลขบัตรประชาชน (CitizenID)</label>
                                            <input
                                                type="text"
                                                value={formData.citizenId}
                                                onChange={e => setFormData({ ...formData, citizenId: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>วันเกิด (BirthDay)</label>
                                            <input
                                                type="date"
                                                value={formData.birthDay}
                                                onChange={e => setFormData({ ...formData, birthDay: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>ธนาคาร (Bank)</label>
                                            <select
                                                value={formData.bank}
                                                onChange={e => setFormData({ ...formData, bank: e.target.value })}
                                            >
                                                <option value="">-- เลือก --</option>
                                                <option value="KBANK">กสิกรไทย</option>
                                                <option value="SCB">ไทยพาณิชย์</option>
                                                <option value="BBL">กรุงเทพ</option>
                                                <option value="KTB">กรุงไทย</option>
                                                <option value="TTB">ทหารไทยธนชาต</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>เลขบัญชี (ACNumber)</label>
                                            <input
                                                type="text"
                                                value={formData.acNumber}
                                                onChange={e => setFormData({ ...formData, acNumber: e.target.value })}
                                            />
                                        </div>

                                        {/* Image Upload Section */}
                                        <div className="upload-section full-width">
                                            <div className="upload-item">
                                                <label>รูปถ่ายหน้าตรง (Pic)</label>
                                                <div className="upload-box">
                                                    <div className="upload-btn">
                                                        <ImageIcon />
                                                        <span>เลือกรูป/PDF</span>
                                                    </div>
                                                    <div className="upload-divider"></div>
                                                    <div className="upload-btn">
                                                        <CameraIcon />
                                                        <span>ถ่ายรูป (กล้อง)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="upload-item">
                                                <label>รูปบัตรประชาชน (CitizenIDPic)</label>
                                                <div className="upload-box">
                                                    <div className="upload-btn">
                                                        <ImageIcon />
                                                        <span>เลือกรูป/PDF</span>
                                                    </div>
                                                    <div className="upload-divider"></div>
                                                    <div className="upload-btn">
                                                        <CameraIcon />
                                                        <span>ถ่ายรูป (กล้อง)</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="upload-item">
                                                <label>รูปทะเบียนบ้าน (HouseRegPic)</label>
                                                <div className="upload-box">
                                                    <div className="upload-btn">
                                                        <ImageIcon />
                                                        <span>เลือกรูป/PDF</span>
                                                    </div>
                                                    <div className="upload-divider"></div>
                                                    <div className="upload-btn">
                                                        <CameraIcon />
                                                        <span>ถ่ายรูป (กล้อง)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setShowModal(false)}>ยกเลิก</button>
                                <button className="btn-primary" onClick={handleSave}>บันทึกข้อมูล</button>
                            </div>
                        </div>
                    </div>
                )}

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
                        box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
                    }
                    .btn-primary:hover {
                        background: #1d4ed8;
                    }
                    
                    /* Tabs */
                    .tabs-container {
                        display: flex;
                        gap: 4px;
                        margin-bottom: 24px;
                    }
                    .tab-btn {
                        padding: 10px 24px;
                        border: 1px solid transparent;
                        background: transparent;
                        color: #64748b;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        border-radius: 8px;
                        transition: all 0.2s;
                    }
                    .tab-btn.active {
                        background: white;
                        color: #2563eb;
                        border-color: #2563eb;
                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    }
                    .tab-btn:hover:not(.active) {
                        background: #e2e8f0;
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
                    .data-table tr:hover {
                        background: #f8fafc;
                    }
                    .text-eid {
                        font-family: monospace;
                        color: #475569;
                        font-weight: 500;
                    }
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
                    }
                    .btn-icon:hover {
                        background: #f1f5f9;
                    }
                    .empty-state {
                        padding: 60px;
                        text-align: center;
                        color: #94a3b8;
                    }

                    /* Modal */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        backdrop-filter: blur(2px);
                    }
                    .modal-content {
                        background: white;
                        border-radius: 16px;
                        width: 800px;
                        max-width: 95%;
                        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
                        display: flex;
                        flex-direction: column;
                        max-height: 90vh;
                    }
                    .modal-header {
                        padding: 20px 32px;
                        border-bottom: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .modal-header h3 {
                        margin: 0;
                        font-size: 20px;
                        color: #1a202c;
                        font-weight: 600;
                    }
                    .btn-close {
                        background: none;
                        border: none;
                        font-size: 24px;
                        color: #94a3b8;
                        cursor: pointer;
                        padding: 0;
                        line-height: 1;
                    }
                    .modal-tabs {
                        display: flex;
                        border-bottom: 1px solid #e2e8f0;
                        padding: 0 32px;
                        background: #f8fafc;
                    }
                    .modal-tab-btn {
                        padding: 16px 24px;
                        background: none;
                        border: none;
                        border-bottom: 2px solid transparent;
                        font-size: 14px;
                        font-weight: 500;
                        color: #64748b;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .modal-tab-btn.active {
                        color: #2563eb;
                        border-bottom-color: #2563eb;
                        background: white;
                    }
                    .modal-tab-btn:hover:not(.active) {
                        color: #334155;
                        background: #f1f5f9;
                    }
                    .modal-body {
                        padding: 32px;
                        overflow-y: auto;
                        flex: 1;
                    }
                    .form-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 24px;
                    }
                    .form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }
                    .form-group.full-width {
                        grid-column: span 2;
                    }
                    .form-group label {
                        font-size: 13px;
                        font-weight: 500;
                        color: #475569;
                    }
                    .form-group input, .form-group select, .form-textarea {
                        padding: 10px 12px;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        font-size: 14px;
                        font-family: inherit;
                        transition: all 0.2s;
                        width: 100%;
                    }
                    .form-textarea {
                        resize: vertical;
                    }
                    .form-group input:focus, .form-group select:focus, .form-textarea:focus {
                        outline: none;
                        border-color: #2563eb;
                        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                    }
                    .form-group input.disabled {
                        background: #f1f5f9;
                        color: #64748b;
                    }
                    
                    /* Upload Section */
                    .upload-section {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 24px;
                        margin-top: 8px;
                    }
                    .upload-section.full-width {
                        grid-column: span 2;
                    }
                    .upload-item label {
                        display: block;
                        font-size: 13px;
                        font-weight: 500;
                        color: #475569;
                        margin-bottom: 8px;
                    }
                    .upload-box {
                        border: 1px dashed #cbd5e1;
                        border-radius: 12px;
                        padding: 24px 16px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 16px;
                        background: #f8fafc;
                    }
                    .upload-btn {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 8px;
                        cursor: pointer;
                        color: #64748b;
                        transition: color 0.2s;
                    }
                    .upload-btn:hover {
                        color: #2563eb;
                    }
                    .upload-btn span {
                        font-size: 11px;
                    }
                    .upload-divider {
                        width: 1px;
                        height: 40px;
                        background: #e2e8f0;
                    }

                    .modal-footer {
                        padding: 20px 32px;
                        border-top: 1px solid #e2e8f0;
                        display: flex;
                        justify-content: flex-end;
                        gap: 12px;
                        background: #f8fafc;
                        border-radius: 0 0 16px 16px;
                    }
                    .btn-secondary {
                        background: white;
                        border: 1px solid #e2e8f0;
                        color: #475569;
                        padding: 10px 24px;
                        border-radius: 8px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-secondary:hover {
                        background: #f1f5f9;
                        border-color: #cbd5e0;
                    }
                `}</style>
            </div>
        </>
    )
}
