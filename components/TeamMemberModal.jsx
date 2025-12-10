import { useState, useEffect } from 'react'
import {
    X,
    User,
    Phone,
    Briefcase,
    CreditCard,
    Image as ImageIcon
} from 'lucide-react'

export default function TeamMemberModal({
    isOpen,
    onClose,
    member,
    onSave
}) {
    const [activeTab, setActiveTab] = useState('general')

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

    const [formData, setFormData] = useState(member || initialFormState)

    // Option States
    const [teamNames, setTeamNames] = useState([])
    const [teamTypes, setTeamTypes] = useState([])
    const [jobPositions, setJobPositions] = useState([])
    const [jobLevels, setJobLevels] = useState([])
    const [employmentTypes, setEmploymentTypes] = useState([])
    const [paymentTypes, setPaymentTypes] = useState([])
    const [wageRates, setWageRates] = useState([])
    const [commissionRates, setCommissionRates] = useState([])

    // Defaults
    const defaultTeamNames = ['ทีมช่างกี', 'ทีมQC', 'ทีมSALE', 'ทีมบริหาร']
    const defaultTeamTypes = ['QC', 'SALE', 'บริหาร']
    const defaultJobPositions = ['พนักงาน', 'บริหาร']
    const defaultJobLevels = ['Executive', 'Director', 'Manager', 'Leader', 'Senior', 'Staff']
    const defaultEmploymentTypes = ['พนักงานประจำ', 'พนักงานชั่วคราว']
    const defaultPaymentTypes = ['รายวัน', 'รายเดือน', 'เหมาจ่าย']
    const defaultWageRates = ['500', '10000']
    const defaultCommissionRates = ['0%', '0.3%']

    useEffect(() => {
        const savedOptions = localStorage.getItem('product_options_data')
        if (savedOptions) {
            try {
                const options = JSON.parse(savedOptions)
                setTeamNames(options.teamNames && options.teamNames.length > 0 ? options.teamNames : defaultTeamNames)
                setTeamTypes(options.teamTypes && options.teamTypes.length > 0 ? options.teamTypes : defaultTeamTypes)
                setJobPositions(options.jobPositions && options.jobPositions.length > 0 ? options.jobPositions : defaultJobPositions)
                setJobLevels(options.jobLevels && options.jobLevels.length > 0 ? options.jobLevels : defaultJobLevels)
                setEmploymentTypes(options.employmentTypes && options.employmentTypes.length > 0 ? options.employmentTypes : defaultEmploymentTypes)
                setPaymentTypes(options.paymentTypes && options.paymentTypes.length > 0 ? options.paymentTypes : defaultPaymentTypes)
                setWageRates(options.wageRates && options.wageRates.length > 0 ? options.wageRates : defaultWageRates)
                setCommissionRates(options.commissionRates && options.commissionRates.length > 0 ? options.commissionRates : defaultCommissionRates)
                return
            } catch (e) {
                console.error('Error loading options', e)
            }
        }
        // Fallback
        setTeamNames(defaultTeamNames)
        setTeamTypes(defaultTeamTypes)
        setJobPositions(defaultJobPositions)
        setJobLevels(defaultJobLevels)
        setEmploymentTypes(defaultEmploymentTypes)
        setPaymentTypes(defaultPaymentTypes)
        setWageRates(defaultWageRates)
        setCommissionRates(defaultCommissionRates)
    }, [])

    // Update form data when member prop changes
    useEffect(() => {
        if (member) {
            setFormData(member)
        } else {
            setFormData(initialFormState)
        }
    }, [member])

    const handleSave = () => {
        if (!formData.nickname) {
            alert('กรุณากรอกชื่อเล่น')
            return
        }

        const fullName = `${formData.firstname || ''} ${formData.lastname || ''}`.trim() || formData.nickname
        const dataToSave = { ...formData, fullname: fullName }

        onSave(dataToSave)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
                    <h3 className="text-xl font-bold text-secondary-900">
                        {member ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
                    </h3>
                    <button
                        onClick={onClose}
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
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
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
                    {activeTab === 'general' && (
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
                                <select
                                    value={formData.team}
                                    onChange={e => setFormData({ ...formData, team: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกชื่อทีม</option>
                                    {teamNames.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภททีม</label>
                                <select
                                    value={formData.teamType}
                                    onChange={e => setFormData({ ...formData, teamType: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกประเภททีม</option>
                                    {teamTypes.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">ตำแหน่ง (Job)</label>
                                <select
                                    value={formData.job}
                                    onChange={e => setFormData({ ...formData, job: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกตำแหน่ง</option>
                                    {jobPositions.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">ระดับ (Level)</label>
                                <select
                                    value={formData.level}
                                    onChange={e => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกระดับ</option>
                                    {jobLevels.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-secondary-700 mb-1">User Type / สิทธิ์</label>
                                <select
                                    value={formData.userType}
                                    onChange={e => setFormData({ ...formData, userType: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Disabled">Disabled (ไม่สามารถเข้าสู่ระบบได้)</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contact' && (
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

                    {activeTab === 'work' && (
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
                                <select
                                    value={formData.workType}
                                    onChange={e => setFormData({ ...formData, workType: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกประเภทการทำงาน</option>
                                    {employmentTypes.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภทการจ่าย</label>
                                <select
                                    value={formData.payType}
                                    onChange={e => setFormData({ ...formData, payType: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกประเภทการจ่าย</option>
                                    {paymentTypes.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">อัตราค่าจ้าง</label>
                                <select
                                    value={formData.payRate}
                                    onChange={e => setFormData({ ...formData, payRate: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกอัตราค่าจ้าง</option>
                                    {wageRates.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">อัตราค่าคอมมิชชั่น</label>
                                <select
                                    value={formData.incentiveRate}
                                    onChange={e => setFormData({ ...formData, incentiveRate: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                >
                                    <option value="">เลือกอัตราค่าคอมมิชชั่น</option>
                                    {commissionRates.map((opt, i) => (
                                        <option key={i} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'personal' && (
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
                                    {[
                                        { key: 'profile', label: 'รูปถ่ายหน้าตรง' },
                                        { key: 'id_card', label: 'รูปบัตรประชาชน' },
                                        { key: 'house_reg', label: 'รูปทะเบียนบ้าน' }
                                    ].map((item) => (
                                        <div
                                            key={item.key}
                                            className="relative border border-dashed border-secondary-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 hover:bg-secondary-50 transition-colors cursor-pointer overflow-hidden group"
                                            onClick={() => document.getElementById(`file-${item.key}`).click()}
                                        >
                                            <input
                                                type="file"
                                                id={`file-${item.key}`}
                                                className="hidden"
                                                accept="image/*,application/pdf"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0]
                                                    if (!file) return

                                                    // Upload immediately
                                                    const url = await import('../lib/dataManager').then(m => m.DataManager.uploadFile(file, 'employees'))
                                                    if (url) {
                                                        const newPhotos = { ...(formData.photos || {}), [item.key]: url }
                                                        setFormData({ ...formData, photos: newPhotos })
                                                    } else {
                                                        alert('Upload failed. Please check if "employee-documents" bucket exists.')
                                                    }
                                                }}
                                            />

                                            {formData.photos?.[item.key] ? (
                                                <div className="relative w-full h-32 flex items-center justify-center bg-gray-100 rounded-md">
                                                    {formData.photos[item.key].toLowerCase().endsWith('.pdf') ? (
                                                        <span className="text-sm font-medium text-gray-600">PDF File</span>
                                                    ) : (
                                                        <img
                                                            src={formData.photos[item.key]}
                                                            alt={item.label}
                                                            className="max-h-full max-w-full object-contain"
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-white text-xs">คลิกเพื่อเปลี่ยน</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-2 bg-secondary-100 rounded-full text-secondary-500">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                    <span className="text-sm text-secondary-600 text-center">{item.label}</span>
                                                </>
                                            )}
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
                        onClick={onClose}
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
    )
}
