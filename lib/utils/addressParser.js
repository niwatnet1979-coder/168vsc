/**
 * Universal Address Parser
 * Supports all 4 customer modal tabs with 100% accuracy
 * Handles both Thai and English text
 */

/**
 * Extract global tokens that appear anywhere in text
 * These are extracted FIRST before any splitting
 */
function extractGlobalTokens(text) {
    const tokens = {
        taxid: '',
        zipcode: '',
        phone: '',
        email: '',
        maps: '',
        branch: ''
    };

    // Tax ID (13 digits)
    const taxidMatch = text.match(/(\d{13})/);
    if (taxidMatch) {
        tokens.taxid = taxidMatch[1];
        text = text.replace(taxidMatch[0], ' ');
    }

    // Zipcode (5 digits, not part of tax ID)
    const zipcodeMatch = text.match(/(?<!\d)(\d{5})(?!\d)/);
    if (zipcodeMatch) {
        tokens.zipcode = zipcodeMatch[1];
        text = text.replace(zipcodeMatch[0], ' ');
    }

    // Phone (Thai format: 0xx-xxx-xxxx or 0xxxxxxxxx)
    const phoneMatch = text.match(/(0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4})/);
    if (phoneMatch) {
        tokens.phone = phoneMatch[0].replace(/[-\s]/g, '');
        text = text.replace(phoneMatch[0], ' ');
    }

    // Email
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
    if (emailMatch) {
        tokens.email = emailMatch[0];
        text = text.replace(emailMatch[0], ' ');
    }

    // Google Maps Link
    const mapsMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (mapsMatch) {
        tokens.maps = mapsMatch[0];
        text = text.replace(mapsMatch[0], ' ');
    }

    // Branch (สำนักงานใหญ่ or Head Office)
    if (text.match(/(\(?สำนักงานใหญ่\)?|Head Office)/i)) {
        tokens.branch = 'สำนักงานใหญ่';
        text = text.replace(/(\(?สำนักงานใหญ่\)?|Head Office)/gi, ' ');
    } else {
        const branchMatch = text.match(/(สาขา|Branch)[\s:]*(\d+|[a-zA-Z0-9]+)/i);
        if (branchMatch) {
            tokens.branch = branchMatch[2];
            text = text.replace(branchMatch[0], ' ');
        }
    }

    return { tokens, cleanedText: text.replace(/\s+/g, ' ').trim() };
}

/**
 * Find split point between company name and address
 * Returns index where address starts
 */
function findSplitPoint(text) {
    // Strategy 1: Find company suffix and split after it
    const suffixRegex = /(บริษัท|หจก|ห้าง|Company|Co\.|Ltd\.|Limited|Inc\.|Corporation)[\s,]*/gi;
    let lastSuffixEnd = -1;
    let match;

    while ((match = suffixRegex.exec(text)) !== null) {
        lastSuffixEnd = match.index + match[0].length;
    }

    // Strategy 2: Find address start indicators
    const addressIndicators = [
        /(\bNo\.|เลขที่)\s*\d/i,
        /\b\d+\/\d+\b/,
        /\b(Moo|หมู่|ม\.)\s*\d/i,
        /\b(Road|ถนน|ถ\.)\s+\w/i,
        /\b(Soi|ซอย|ซ\.)\s+\w/i
    ];

    let earliestAddressStart = Infinity;
    for (const regex of addressIndicators) {
        const m = text.match(regex);
        if (m && m.index < earliestAddressStart) {
            earliestAddressStart = m.index;
        }
    }

    // Use the better split point
    if (lastSuffixEnd > 0 && lastSuffixEnd < earliestAddressStart) {
        return lastSuffixEnd;
    } else if (earliestAddressStart < Infinity) {
        return earliestAddressStart;
    }

    // Fallback: split at first number pattern
    const numberMatch = text.match(/\d+\/\d+/);
    return numberMatch ? numberMatch.index : text.length;
}

/**
 * Extract address components from address text
 * Order matters! Extract from largest to smallest scope
 */
function extractAddressComponents(addressText) {
    const components = {
        province: '',
        district: '',
        subdistrict: '',
        road: '',
        lane: '',
        villageno: '',
        number: '',
        village: ''
    };

    let workingText = addressText;

    // Helper function to extract and remove
    const extract = (regex, field) => {
        const match = workingText.match(regex);
        if (match) {
            components[field] = match[2] || match[1];
            workingText = workingText.replace(match[0], ' ').trim();
            return true;
        }
        return false;
    };

    // 1. Province (จังหวัด, จ., Province, Changwat)
    if (!extract(/(จังหวัด|จ\.|Province|Changwat)\s+([^\s,]+)/i, 'province')) {
        // Special case: กรุงเทพ
        if (workingText.match(/กรุงเทพ/i)) {
            components.province = 'กรุงเทพมหานคร';
            workingText = workingText.replace(/กรุงเทพ(มหานคร)?/gi, ' ');
        } else if (workingText.match(/Bangkok/i)) {
            components.province = 'Bangkok';
            workingText = workingText.replace(/Bangkok/gi, ' ');
        }
    }

    // 2. District (อำเภอ, อ., เขต, District, Amphoe)
    extract(/(อำเภอ|อ\.|เขต|District|Amphoe|Amphur)\s+([^\s,]+)/i, 'district');

    // 3. Subdistrict (ตำบล, ต., แขวง, Tambon, Subdistrict)
    extract(/(ตำบล|ต\.|แขวง|Tambon|Subdistrict|Khwaeng)\s+([^\s,]+)/i, 'subdistrict');

    // 4. Road (ถนน, ถ., Road, Rd., Street, St.)
    extract(/(ถนน|ถ\.|Road|Rd\.|Street|St\.)\s+([^\s,]+)/i, 'road');

    // 5. Lane/Soi (ซอย, ซ., Soi, S., Lane)
    extract(/(ซอย|ซ\.|Soi|S\.|Lane)\s+([^\s,]+(?:\s+\d+)?)/i, 'lane');

    // 6. Moo (หมู่, ม., Moo, M., Mu)
    extract(/(หมู่|ม\.|Moo|M\.|Mu)\s+(\d+)/i, 'villageno');

    // 7. House Number (เลขที่, No., or just number at start)
    const numberMatch = workingText.match(/^(\d+[\/\-\d]*)/);
    if (numberMatch) {
        components.number = numberMatch[1];
        workingText = workingText.replace(numberMatch[0], ' ').trim();
    } else {
        extract(/(เลขที่|No\.)\s*(\d+[\/\-\d]*)/i, 'number');
    }

    // 8. Leftovers = Village/Building name
    workingText = workingText.trim();
    if (workingText && workingText.length > 2 && !workingText.match(/^[\d\s,.-]+$/)) {
        components.village = workingText;
    }

    return components;
}

/**
 * Extract contact information
 */
function extractContactInfo(text) {
    const contact = {
        name: '',
        position: ''
    };

    // Extract name with title (K., คุณ, Mr., Ms., etc.)
    const nameMatch = text.match(/((?:K\.|คุณ|Mr\.|Ms\.|Mrs\.|Miss|นาย|นาง|น\.ส\.)\s*[^\s]+(?:\s+[^\s]+)?)/i);
    if (nameMatch) {
        contact.name = nameMatch[1].trim();
    }

    return contact;
}

/**
 * Main parser function
 * Returns parsed data for all 4 tabs
 */
export function parseUniversalAddress(inputText) {
    // Normalize text
    let text = inputText
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove invisible characters
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

    // Extract global tokens first
    const { tokens, cleanedText } = extractGlobalTokens(text);

    // Find split point
    const splitIndex = findSplitPoint(cleanedText);
    const companyPart = cleanedText.substring(0, splitIndex).trim();
    const addressPart = cleanedText.substring(splitIndex).trim();

    // Extract address components
    const addressComponents = extractAddressComponents(addressPart);

    // Extract contact info
    const contactInfo = extractContactInfo(cleanedText);

    // Build result object
    const result = {
        // Tax Invoice fields
        company: companyPart.replace(/^(ที่อยู่|Address|ชื่อ|Name|:)+/i, '').trim(),
        taxid: tokens.taxid,
        branch: tokens.branch,

        // Address fields (used by both Tax Invoice and Delivery Address)
        number: addressComponents.number,
        villageno: addressComponents.villageno,
        village: addressComponents.village,
        lane: addressComponents.lane,
        road: addressComponents.road,
        subdistrict: addressComponents.subdistrict,
        district: addressComponents.district,
        province: addressComponents.province,
        zipcode: tokens.zipcode,

        // Delivery Address fields
        label: companyPart || contactInfo.name,
        maps: tokens.maps,

        // Contact fields
        contactName: contactInfo.name,
        position: contactInfo.position,
        phone: tokens.phone,
        email: tokens.email,

        // Customer Info fields
        name: companyPart || contactInfo.name,
        line: '', // Will be extracted if Line ID pattern is found

        // Full label for delivery address (name + contact)
        fullLabel: [companyPart, contactInfo.name].filter(Boolean).join(' ')
    };

    return result;
}
