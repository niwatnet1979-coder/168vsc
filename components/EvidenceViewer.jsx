import React from 'react'
import { X, Tag, ImageIcon, Clock, User } from 'lucide-react'

const EvidenceViewer = ({ item, onClose }) => {
    if (!item || !item.photos || item.photos.length === 0) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-secondary-100 flex items-center justify-between bg-secondary-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <ImageIcon className="text-primary-600" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-secondary-900">Evidence Gallery</h3>
                            <p className="text-xs text-secondary-500">LPN: {item.qr_code} • {item.photos.length} Photos</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 hover:bg-secondary-200 rounded-full flex items-center justify-center transition-colors"
                    >
                        <X size={24} className="text-secondary-500" />
                    </button>
                </div>

                {/* Content - Scrollable Gallery */}
                <div className="flex-1 overflow-y-auto p-6 bg-secondary-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {item.photos.map((photo, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-secondary-200 shadow-sm overflow-hidden flex flex-col group">
                                {/* Photo */}
                                <div className="aspect-video relative bg-black flex items-center justify-center overflow-hidden">
                                    <img
                                        src={photo.photo_url}
                                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                        alt={`Evidence ${idx + 1}`}
                                    />
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                        {(photo.tags || []).map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2 py-0.5 bg-black/60 text-white rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/20"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Photo Meta */}
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center justify-between text-[11px] text-secondary-400">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(photo.created_at).toLocaleString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <User size={12} />
                                            {photo.created_by || 'System'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-secondary-100 bg-white flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg font-medium transition-colors"
                    >
                        Close Gallery
                    </button>
                </div>
            </div>
        </div>
    )
}

export default EvidenceViewer
