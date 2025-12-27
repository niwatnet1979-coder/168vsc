import { useState, useEffect } from 'react'
import { X, Save, MapPin, Package, Trash2 } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import { showSuccess, showError } from '../lib/sweetAlert'
import { useLanguage } from '../contexts/LanguageContext'

export default function InventoryEditModal({ isOpen, onClose, item, onSave, onDelete }) {
    const { t } = useLanguage()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [location, setLocation] = useState('')
    const [lotNumber, setLotNumber] = useState('')
    const [status, setStatus] = useState('in_stock')

    useEffect(() => {
        if (isOpen && item) {
            setLocation(item.current_location || 'Warehouse_Main')
            setLotNumber(item.lot_number || '')
            setStatus(item.status || 'in_stock')
        }
    }, [isOpen, item])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const updates = {
                current_location: location,
                lot_number: lotNumber,
                status: status
            }

            const updatedItem = await DataManager.updateInventoryItem(item.id, updates)

            if (updatedItem) {
                await showSuccess({
                    title: t('Success'),
                    text: t('Item updated successfully')
                })
                onSave()
                onClose()
            } else {
                throw new Error('Failed to update item')
            }
        } catch (error) {
            console.error(error)
            await showError({
                title: t('Error'),
                text: t('Failed to update item')
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen || !item) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
                    <h3 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                        <Package className="text-primary-600" size={20} />
                        {t('Edit Item Details')}
                    </h3>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-secondary-50 p-3 rounded-lg text-sm text-secondary-600 mb-4">
                        <p><span className="font-semibold">Product:</span> {item.product?.name}</p>
                        <p><span className="font-semibold">QR Code:</span> {item.qr_code}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">{t('Location')}</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                            <select
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                                <option value="Warehouse_Main">Main Warehouse</option>
                                <option value="Technician_Van">Technician Van</option>
                                <option value="Showroom">Showroom</option>
                                <option value="Defective_Area">Defective Area</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">{t('Lot Number')}</label>
                        <input
                            type="text"
                            value={lotNumber}
                            onChange={e => setLotNumber(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary-700">{t('Status')}</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="in_stock">In Stock</option>
                            <option value="sold">Sold</option>
                            <option value="lost">Lost</option>
                            <option value="reserved">Reserved</option>
                            <option value="defective">Defective</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                onClose()
                                if (onDelete) onDelete(item)
                            }}
                            className="px-4 py-2 border border-danger-200 text-danger-600 rounded-lg hover:bg-danger-50 font-medium flex items-center gap-2 mr-auto"
                            disabled={isSubmitting}
                        >
                            <Trash2 size={18} />
                            {t('Delete')}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 font-medium"
                            disabled={isSubmitting}
                        >
                            {t('Cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {isSubmitting ? t('Saving...') : t('Save Changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
