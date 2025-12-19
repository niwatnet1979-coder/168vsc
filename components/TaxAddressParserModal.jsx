import React, { useState } from 'react';
import { X, Sparkles, Clipboard } from 'lucide-react';

export default function TaxAddressParserModal({ isOpen, onClose, onParse }) {
    const [text, setText] = useState('');

    if (!isOpen) return null;

    const handleParse = () => {
        if (!text) return;

        let workingText = text.replace(/\s+/g, ' ').trim();

        const result = {
            companyName: '',
            taxId: '',
            branch: '',
            addrNumber: '',
            addrMoo: '',
            addrVillage: '',
            addrSoi: '',
            addrRoad: '',
            addrTambon: '',
            addrAmphoe: '',
            addrProvince: '',
            addrZipcode: '',
            phone: '',
            email: ''
        };

        // 1. Extract Global Unique Tokens (Tax ID, Zip, Province, Amphoe, Tambon)
        const extract = (regex, key) => {
            const match = workingText.match(regex);
            if (match) {
                if (key) result[key] = match[2] || match[1];
                workingText = workingText.replace(match[0], ' ').trim();
                return true;
            }
            return false;
        };

        extract(/(\d{13})/, 'taxId');

        // Extract/Remove Phone Number
        // Matches 0xx-xxx-xxxx, 0xx xxx xxxx, or 0xxxxxxxxx
        const phoneRegex = /(0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4})/;
        const phoneMatch = workingText.match(phoneRegex);
        if (phoneMatch) {
            result.phone = phoneMatch[0].replace(/[-\s]/g, ''); // Store plain numbers or keep format? Keeping matched format for now is often safer, but removing spaces/dashes is cleaner for DB. Let's keep a bit of formatting or strip? Let's strip standard separators for consistency if desired, or keep raw. The user usually wants to see it formatted. Let's store raw match for now.
            // Actually, let's keep it as is from the match to preserve user's format or normalize.
            // Let's normalize dashes:
            result.phone = phoneMatch[0];
            workingText = workingText.replace(phoneMatch[0], ' ').trim();
        }

        // Extract Email
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
        const emailMatch = workingText.match(emailRegex);
        if (emailMatch) {
            result.email = emailMatch[0];
            workingText = workingText.replace(emailMatch[0], ' ').trim();
        }

        if (workingText.match(/(\(?สำนักงานใหญ่\)?|Head Office)/i)) {
            result.branch = 'สำนักงานใหญ่';
            workingText = workingText.replace(/(\(?สำนักงานใหญ่\)?|Head Office)/i, ' ').trim();
        } else {
            extract(/(สาขา|Branch)[\s:]*(\d+|[a-zA-Z0-9]+)/i, 'branch');
        }



        extract(/(\d{5})(?!\d)/, 'addrZipcode');

        if (!extract(/(จังหวัด|จ\.)\s*([^\s]+)/, 'addrProvince')) {
            if (workingText.includes('กรุงเทพ')) {
                result.addrProvince = 'กรุงเทพมหานคร';
                workingText = workingText.replace(/กรุงเทพ(มหานคร)?/, ' ').trim();
            }
        }

        extract(/(อำเภอ|อ\.|เขต)\s*([^\s]+)/, 'addrAmphoe');
        extract(/(ตำบล|ต\.|แขวง)\s*([^\s]+)/, 'addrTambon');
        // Moo extraction moved to Address Part Processing

        // 2. Identify Split Point
        let splitIndex = -1;

        // Priority A: Company Suffix
        const companySuffixMatch = workingText.match(/\s+(จำกัด|Limited|Inc\.?|Co\.?)\b/i);
        if (companySuffixMatch) {
            splitIndex = companySuffixMatch.index + companySuffixMatch[0].length;
        } else {
            // Priority B: Address Start Indicators
            const indicators = [
                /(เลขที่|No\.|^)\s*[\d\/]+/,
                /(ถนน|ถ\.)/,
                /(ซอย|ซ\.)/,
                /\s\d+\/\d+\s/,
                // Look for: Space + Number + Space + AddressKeyword
                // Matches " 184 Moo" or " 64/44-45 Road"
                /(\s|^)[\d/\-]+\s+(?=หมู่|ม\.|ถนน|ถ\.|ซอย|ซ\.|ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.)/
            ];

            let earliestIndex = Infinity;

            indicators.forEach(regex => {
                const m = workingText.match(regex);
                if (m) {
                    if (m.index < earliestIndex) {
                        earliestIndex = m.index;
                    }
                }
            });

            if (earliestIndex !== Infinity) {
                splitIndex = earliestIndex;
            }
        }

        let namePart = '';
        let addressPart = '';

        if (splitIndex !== -1) {
            namePart = workingText.substring(0, splitIndex).trim();
            addressPart = workingText.substring(splitIndex).trim();
        } else {
            const slashMatch = workingText.match(/(\d+\/\d+)/);
            if (slashMatch) {
                const idx = workingText.indexOf(slashMatch[0]);
                namePart = workingText.substring(0, idx).trim();
                addressPart = workingText.substring(idx).trim();
            } else {
                namePart = workingText;
            }
        }

        // 3. Process Name
        result.companyName = namePart.replace(/^(ที่อยู่|Address|ชื่อ|Name|:)+/i, '').trim();
        let initialName = result.companyName; // Store original name part
        result.fullLabel = initialName;

        // 4. Process Address Part
        let addrText = addressPart;

        // Extract Moo
        const mooMatch = addrText.match(/(หมู่|ม\.)\s*(\d+)/);
        if (mooMatch) {
            result.addrMoo = mooMatch[2];
            addrText = addrText.replace(mooMatch[0], ' ').trim();
        }

        // Extract Soi
        const soiRegex = /(ซอย|ซ\.)\s*([^\s]+(?:\s+\d+)?)/;
        const soiMatch = addrText.match(soiRegex);
        if (soiMatch) {
            result.addrSoi = soiMatch[2];
            addrText = addrText.replace(soiMatch[0], ' ').trim();
        }

        // Extract Road
        const roadRegex = /(ถนน|ถ\.)\s*([^\s]+)/;
        const roadMatch = addrText.match(roadRegex);
        if (roadMatch) {
            result.addrRoad = roadMatch[2];
            addrText = addrText.replace(roadMatch[0], ' ').trim();
        }

        // Extract House Number
        // Priority: Start of string. Updated to support hyphen/slash (e.g. 64/44-45)
        const smartNoMatch = addrText.match(/^([\d/\-]+)/);
        if (smartNoMatch) {
            result.addrNumber = smartNoMatch[1];
            addrText = addrText.replace(smartNoMatch[0], ' ').trim();
        } else {
            const noRegex = /(?:เลขที่|No\.)?\s*([\d/\-]+)/;
            const noMatch = addrText.match(noRegex);
            if (noMatch) {
                result.addrNumber = noMatch[1];
                addrText = addrText.replace(noMatch[0], ' ').trim();
            }
        }

        // Capture remaining text as Village/Building OR Company Name if misplaced
        let leftovers = addrText.trim();
        if (leftovers && leftovers.length > 2 && !leftovers.match(/^[\d\-\s]+$/)) {
            // Check if it looks like a Company Name
            if (leftovers.match(/^(บริษัท|บ\.|หจก|ห้าง|ร้าน|โรง|คณะ|การ|The|Company)/i)) {
                // Found Company at end: Overwrite companyName for Tax purposes
                result.companyName = leftovers;
                // Set fullLabel for Delivery purposes
                result.fullLabel = (initialName + ' ' + leftovers).trim();
            } else {
                result.addrVillage = leftovers;
            }
        }

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
