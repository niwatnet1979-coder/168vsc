import { X, HelpCircle, Box, LogOut, CheckCircle, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export default function InventoryHelpModal({ isOpen, onClose }) {
    const { t } = useLanguage()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                <div className="p-6 border-b border-secondary-200 flex items-center justify-between bg-secondary-50">
                    <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                        <HelpCircle className="text-primary-600" />
                        {t('Inventory System Guide')}
                    </h3>
                    <button onClick={onClose} className="text-secondary-400 hover:text-secondary-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8">
                    {/* Section 1: Check-in */}
                    <section>
                        <h4 className="text-lg font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <span className="bg-primary-100 text-primary-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                            {t('Receiving Items (Check-in)')}
                        </h4>
                        <div className="ml-10 space-y-2 text-secondary-600 text-sm">
                            <p>{t('Use this when new stock arrives.')}</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>{t('Scan a product or search by name.')}</li>
                                <li>{t('If product has Variants (Color/Size), select the correct one.')}</li>
                                <li>{t('Box Count: If an item comes in multiple boxes (e.g. 1 Chandelier = 2 Boxes), enter the number of boxes. The system will track them individually.')}</li>
                                <li>{t('Location: Specify where you are storing the item.')}</li>
                            </ul>
                        </div>
                    </section>

                    {/* Section 2: Box Tracking */}
                    <section>
                        <h4 className="text-lg font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <span className="bg-warning-100 text-warning-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                            {t('Multi-box Tracking')}
                        </h4>
                        <div className="ml-10 space-y-2 text-secondary-600 text-sm">
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-200">
                                <p className="font-semibold text-secondary-900 mb-1">{t('Example: Item A (2 Boxes)')}</p>
                                <p>{t('The system will generate 2 unique QR Codes:')}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className="bg-white border px-2 py-1 rounded text-xs font-mono">...-BOX-1</span>
                                    <span className="bg-white border px-2 py-1 rounded text-xs font-mono">...-BOX-2</span>
                                </div>
                            </div>
                            <p>{t('You must stick these labels on the respective boxes.')}</p>
                        </div>
                    </section>

                    {/* Section 3: Check-out */}
                    <section>
                        <h4 className="text-lg font-bold text-secondary-900 mb-3 flex items-center gap-2">
                            <span className="bg-danger-100 text-danger-700 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                            {t('Dispensing Items (Check-out)')}
                        </h4>
                        <div className="ml-10 space-y-2 text-secondary-600 text-sm">
                            <p>{t('To ensure nothing is missing, the system requires verification:')}</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>{t('For single-box items: Scan once to verify.')}</li>
                                <li>{t('For Multi-box items: You must scan ALL boxes belonging to that set.')}</li>
                            </ul>
                            <div className="flex items-center gap-2 mt-2 text-xs text-primary-600 font-medium">
                                <CheckCircle size={14} />
                                {t('Only when all boxes are green can you confirm the check-out.')}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="p-4 border-t border-secondary-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors"
                    >
                        {t('Understood')}
                    </button>
                </div>
            </div>
        </div>
    )
}
