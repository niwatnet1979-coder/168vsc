import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { parseUniversalAddress } from '../lib/utils/addressParser';

export default function TaxAddressParserModal({ isOpen, onClose, onParse }) {
    const [text, setText] = useState('');

    if (!isOpen) return null;

    const handleParse = () => {
        if (!text) return;

        // Use new universal parser
        const result = parseUniversalAddress(text);

        // Send result to parent
        onParse(result);
        onClose();
        setText('');
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-primary-50">
                    <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-primary-600" />
                        ระบบกรอกข้อมูลอัตโนมัติ
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                </div>

                <div className="p-4">
                    <p className="text-sm text-gray-500 mb-2">วางข้อความที่อยู่/ข้อมูลใบกำกับภาษีที่นี่ ระบบจะแยกข้อมูลให้โดยอัตโนมัติ</p>
                    <textarea
                        className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                        placeholder="ตัวอย่าง: บริษัท ตัวอย่าง จำกัด 123 หมู่ 4 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพ 10110 เลขผู้เสียภาษี 1234567890123"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white text-sm font-medium">ยกเลิก</button>
                    <button onClick={handleParse} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium flex items-center gap-2">
                        <Sparkles size={16} />
                        แยกข้อมูลอัตโนมัติ
                    </button>
                </div>
            </div>
        </div>
    );
}
