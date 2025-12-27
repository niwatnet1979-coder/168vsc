import Swal from 'sweetalert2'

// Base configuration to match the centralized design
const baseConfig = {
    customClass: {
        popup: 'rounded-2xl shadow-xl border border-secondary-100',
        confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-lg shadow-primary-500/30',
        cancelButton: 'rounded-lg px-6 py-2.5 font-medium',
        title: 'text-secondary-900',
        htmlContainer: 'text-secondary-600'
    },
    buttonsStyling: true, // Use SweetAlert2's styling but applied via classes
    heightAuto: false, // Fix blinking/jumping issue
    scrollbarPadding: false // Fix double padding issue with other modals
}

/**
 * Show a confirmation dialog
 * @param {Object} options
 * @param {string} options.title - The title of the modal
 * @param {string} options.text - The message body
 * @param {string} options.confirmButtonText - Text for the confirm button
 * @param {string} options.cancelButtonText - Text for the cancel button
 * @param {string} options.confirmButtonColor - Hex color for confirm button
 * @param {string} options.cancelButtonColor - Hex color for cancel button
 * @param {string} options.icon - 'warning', 'error', 'success', 'info', 'question'
 * @returns {Promise<{isConfirmed: boolean}>}
 */
export const showConfirm = async ({
    title = 'ยืนยันการดำเนินการ',
    text = 'คุณต้องการดำเนินการต่อหรือไม่?',
    confirmButtonText = 'ยืนยัน',
    cancelButtonText = 'ยกเลิก',
    confirmButtonColor = '#3085d6', // Default blue
    cancelButtonColor = '#d33',     // Default red
    icon = 'warning'
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor,
        cancelButtonColor,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: false // Default SwAl position
    })
}

/**
 * Show a success message (auto-close)
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.text
 * @param {number} options.timer - Duration in ms (default 1500)
 */
export const showSuccess = async ({
    title = 'สำเร็จ',
    text = 'ดำเนินการเสร็จสิ้น',
    timer = 1500,
    showConfirmButton = false
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        icon: 'success',
        title,
        text,
        timer,
        showConfirmButton
    })
}

/**
 * Show an error message
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.text
 * @param {string} options.confirmButtonText
 */
export const showError = async ({
    title = 'เกิดข้อผิดพลาด',
    text = 'ไม่สามารถดำเนินการได้',
    confirmButtonText = 'ตกลง'
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        icon: 'error',
        title,
        text,
        confirmButtonText
    })
}

/**
 * Show a loading spinner (blocking)
 * @param {string} title
 * @param {string} text
 */
export const showLoading = (title = 'กำลังดำเนินการ...', text = 'กรุณารอสักครู่') => {
    Swal.fire({
        ...baseConfig,
        title,
        text,
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    })
}

/**
 * Close the currently open SweetAlert2 popup
 */
export const closeSwal = () => {
    Swal.close()
}

/**
 * Show a simple toast notification
 * @param {Object} options
 */
export const showToast = async ({
    icon = 'success',
    title = '',
    position = 'top-end',
    timer = 3000
} = {}) => {
    const Toast = Swal.mixin({
        toast: true,
        position,
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    return Toast.fire({
        icon,
        title
    })
}

/**
 * Show an input dialog
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.inputLabel
 * @param {string} options.inputPlaceholder
 * @param {string} options.confirmButtonText
 * @param {string} options.cancelButtonText
 * @param {Function} options.inputValidator
 */
export const showInput = async ({
    title = 'กรอกข้อมูล',
    inputLabel = '',
    inputPlaceholder = '',
    confirmButtonText = 'ตกลง',
    cancelButtonText = 'ยกเลิก',
    inputValue = '',
    inputValidator = null
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        title,
        input: 'text',
        inputLabel,
        inputPlaceholder,
        inputValue,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        inputValidator
    })
}

export default {
    showConfirm,
    showSuccess,
    showError,
    showLoading,
    closeSwal,
    showToast,
    showInput
}
