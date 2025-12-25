/**
 * Modal Utilities for Order Component
 * Factory functions to create modal opener handlers
 */

/**
 * Creates modal opener functions for customer modal
 * @param {Function} setModalTab - Function to set the active modal tab
 * @param {Function} setShowModal - Function to show/hide the modal
 * @param {Function} setAddingContactFor - Function to set contact type being added
 * @returns {Object} Object containing modal opener functions
 */
export function createCustomerModalOpeners(setModalTab, setShowModal, setAddingContactFor = null) {
    return {
        /**
         * Opens customer modal on tax invoices tab
         */
        openTaxInvoiceTab: () => {
            setModalTab('taxInvoices')
            setShowModal(true)
        },

        /**
         * Opens customer modal on addresses tab
         */
        openAddressTab: () => {
            setModalTab('addresses')
            setShowModal(true)
        },

        /**
         * Opens customer modal on contacts tab
         * @param {string} type - Type of contact being added (e.g., 'receiverContact', 'purchaserContact')
         */
        openContactTab: (type = null) => {
            if (setAddingContactFor && type) {
                setAddingContactFor(type)
            }
            setModalTab('contacts')
            setShowModal(true)
        }
    }
}
