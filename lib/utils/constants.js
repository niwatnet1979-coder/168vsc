/**
 * Constants
 * Shared constants used throughout the application
 */

// Shop location (for distance calculation)
export const SHOP_LAT = 13.7563 // Bangkok
export const SHOP_LON = 100.5018

// Order statuses
export const ORDER_STATUS = {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled'
}

// Job statuses (Thai)
export const JOB_STATUS = {
    PENDING: 'รอดำเนินการ',
    PROCESSING: 'กำลังดำเนินการ',
    COMPLETED: 'เสร็จสิ้น',
    CANCELLED: 'ยกเลิก'
}

// Job types
export const JOB_TYPES = {
    INSTALLATION: 'installation',
    DELIVERY: 'delivery',
    REPAIR: 'repair',
    MAINTENANCE: 'maintenance',
    INSPECTION: 'inspection'
}

// Payment methods
export const PAYMENT_METHODS = {
    CASH: 'เงินสด',
    TRANSFER: 'โอนเงิน',
    CREDIT_CARD: 'บัตรเครดิต',
    CHEQUE: 'เช็ค'
}

// Discount modes
export const DISCOUNT_MODES = {
    PERCENT: 'percent',
    FIXED: 'fixed'
}

// VAT rates
export const VAT_RATES = {
    STANDARD: 7,
    ZERO: 0
}

// Date formats
export const DATE_FORMATS = {
    SHORT: 'DD/MM/YYYY',
    LONG: 'DD MMMM YYYY',
    TIME: 'HH:mm',
    DATETIME: 'DD/MM/YYYY HH:mm'
}

// Pagination
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100
}

// File upload
export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
}

// Regex patterns
export const REGEX = {
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_TH: /^0\d{9}$/,
    POSTAL_CODE_TH: /^\d{5}$/
}

// Error messages
export const ERROR_MESSAGES = {
    REQUIRED_FIELD: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    INVALID_EMAIL: 'รูปแบบอีเมลไม่ถูกต้อง',
    INVALID_PHONE: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
    NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
    UNKNOWN_ERROR: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
}

// Success messages
export const SUCCESS_MESSAGES = {
    SAVE_SUCCESS: 'บันทึกข้อมูลสำเร็จ',
    DELETE_SUCCESS: 'ลบข้อมูลสำเร็จ',
    UPDATE_SUCCESS: 'อัปเดตข้อมูลสำเร็จ'
}
