/**
 * Universal Address Parser - Version 2.0
 * Complete rewrite for 95%+ accuracy
 * Handles both Thai and English text
 */

/**
 * Extract and REMOVE global tokens from text
 * Returns tokens and cleaned text
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

    let cleanedText = text;

    // 1. Tax ID (13 digits) - extract and remove
    const taxidMatch = cleanedText.match(/(\d{13})/);
    if (taxidMatch) {
        tokens.taxid = taxidMatch[1];
        cleanedText = cleanedText.replace(taxidMatch[0], ' ');
    }

    // 2. Phone (Thai format) - extract and remove
    const phoneMatch = cleanedText.match(/(โทร\.?|Tel\.?|Phone\.?)?\s*(0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4})/i);
    if (phoneMatch) {
        tokens.phone = phoneMatch[2].replace(/[-\s]/g, '');
        cleanedText = cleanedText.replace(phoneMatch[0], ' ');
    }

    // 3. Email - extract and remove
    const emailMatch = cleanedText.match(/(อีเมล\.?|Email\.?)?\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    if (emailMatch) {
        tokens.email = emailMatch[2];
        cleanedText = cleanedText.replace(emailMatch[0], ' ');
    }

    // 4. Google Maps - extract and remove
    const mapsMatch = cleanedText.match(/(https?:\/\/[^\s]+)/);
    if (mapsMatch) {
        tokens.maps = mapsMatch[0];
        cleanedText = cleanedText.replace(mapsMatch[0], ' ');
    }

    // 5. Branch - extract and remove
    if (cleanedText.match(/(\(?สำนักงานใหญ่\)?|Head Office)/i)) {
        tokens.branch = 'สำนักงานใหญ่';
        cleanedText = cleanedText.replace(/(\(?สำนักงานใหญ่\)?|Head Office)/gi, ' ');
    } else {
        const branchMatch = cleanedText.match(/(สาขา|Branch)[\s:]*(\d+|[a-zA-Z0-9]+)/i);
        if (branchMatch) {
            tokens.branch = branchMatch[2];
            cleanedText = cleanedText.replace(branchMatch[0], ' ');
        }
    }

    // 6. Zipcode (5 digits, prefer > 10000) - extract and remove LAST
    const zipcodeMatches = cleanedText.match(/(?<!\d)(\d{5})(?!\d)/g);
    if (zipcodeMatches) {
        const realZipcode = zipcodeMatches.find(z => parseInt(z) > 10000) || zipcodeMatches[zipcodeMatches.length - 1];
        tokens.zipcode = realZipcode;
        cleanedText = cleanedText.replace(realZipcode, ' ');
    }

    // Clean up multiple spaces
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

    return { tokens, cleanedText };
}

/**
 * Find split point between company name and address
 * New algorithm: Find "จำกัด" then find first number after it
 */
function findSplitPoint(text) {
    // For Thai: Find "บริษัท ... จำกัด"
    const thaiMatch = text.match(/บริษัท\s+.+?\s+จำกัด/i);
    if (thaiMatch) {
        const companyEnd = thaiMatch.index + thaiMatch[0].length;
        // Find first number pattern after company name
        const afterCompany = text.substring(companyEnd);
        const numberMatch = afterCompany.match(/\d+\/\d+/);
        if (numberMatch) {
            return companyEnd + numberMatch.index;
        }
        return companyEnd;
    }

    // For English: Find "Co., Ltd." or "Limited"
    const engMatch = text.match(/\b\w+(?:\s+\w+)*?\s+(?:Co\.,?\s*Ltd\.|Limited|Inc\.)/i);
    if (engMatch) {
        const companyEnd = engMatch.index + engMatch[0].length;
        const afterCompany = text.substring(companyEnd);
        const numberMatch = afterCompany.match(/\b\d+\/\d+\b/);
        if (numberMatch) {
            return companyEnd + numberMatch.index;
        }
        return companyEnd;
    }

    // Fallback: Find first number pattern
    const numberMatch = text.match(/\d+\/\d+/);
    return numberMatch ? numberMatch.index : text.length;
}

/**
 * Extract address components in correct order
 * Remove each component immediately after extraction
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

    let working = addressText;

    // Helper: extract and remove
    const extract = (regex, field) => {
        const match = working.match(regex);
        if (match) {
            components[field] = (match[2] || match[1]).trim();
            working = working.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
            return true;
        }
        return false;
    };

    // 1. Province (จังหวัด/จ./Province + name)
    if (!extract(/(จังหวัด|จ\.|Province)\s+([^\s,]+)/i, 'province')) {
        if (working.match(/กรุงเทพ/i)) {
            components.province = 'กรุงเทพมหานคร';
            working = working.replace(/กรุงเทพ(มหานคร)?/gi, ' ');
        } else if (working.match(/Bangkok/i)) {
            components.province = 'Bangkok';
            working = working.replace(/Bangkok/gi, ' ');
        }
    }

    // 2. District (อำเภอ/อ./เขต/District + name)
    extract(/(อำเภอ|อ\.|เขต|District|Amphoe)\s+([^\s,]+)/i, 'district');

    // 3. Subdistrict (ตำบล/ต./แขวง/Tambon + name)
    extract(/(ตำบล|ต\.|แขวง|Tambon|Subdistrict)\s+([^\s,]+)/i, 'subdistrict');

    // 4. Road (ถนน/ถ./Road/Rd. + name)
    extract(/(ถนน|ถ\.|Road|Rd\.)\s+([^\s,]+)/i, 'road');

    // 5. Soi/Lane (ซอย/ซ./Soi/S. + name + optional number)
    extract(/(ซอย|ซ\.|Soi|S\.)\s+([^\s,]+(?:\s+\d+)?)/i, 'lane');

    // 6. Moo (หมู่/ม./Moo/M. + number)
    extract(/(หมู่|ม\.|Moo|M\.)\s+(\d+)/i, 'villageno');

    // 7. House number (at start or with เลขที่/No.)
    const numMatch = working.match(/^(\d+\/\d+)/);
    if (numMatch) {
        components.number = numMatch[1];
        working = working.replace(numMatch[0], ' ').trim();
    } else {
        extract(/(เลขที่|No\.)\s*(\d+\/\d+)/i, 'number');
    }

    // 8. Building/Village (clean leftovers)
    working = working.trim();
    if (working && working.length > 2 && !working.match(/^[\d\s,.-]+$/)) {
        // Remove common prefixes
        working = working.replace(/^(อาคาร|หมู่บ้าน|Building)\s*/i, '');
        components.village = working.trim();
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

    // Extract name with title
    const nameMatch = text.match(/((?:K\.|คุณ|Mr\.|Ms\.|Mrs\.|Miss|นาย|นาง|น\.ส\.)\s*[^\s]+(?:\s+[^\s]+)?)/i);
    if (nameMatch) {
        contact.name = nameMatch[1].trim();
    }

    return contact;
}

/**
 * Main parser function
 */
export function parseUniversalAddress(inputText) {
    // 1. Normalize
    let text = inputText
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 2. Extract global tokens (and remove them!)
    const { tokens, cleanedText } = extractGlobalTokens(text);

    // 3. Find split point
    const splitIndex = findSplitPoint(cleanedText);
    const companyPart = cleanedText.substring(0, splitIndex).trim();
    const addressPart = cleanedText.substring(splitIndex).trim();

    // 4. Extract address components
    const addressComponents = extractAddressComponents(addressPart);

    // 5. Extract contact info (from original text)
    const contactInfo = extractContactInfo(text);

    // 6. Build result
    const result = {
        // Tax Invoice
        company: companyPart.replace(/^(ที่อยู่|Address|ชื่อ|Name|:)+/i, '').trim(),
        taxid: tokens.taxid,
        branch: tokens.branch,

        // Address
        number: addressComponents.number,
        villageno: addressComponents.villageno,
        village: addressComponents.village,
        lane: addressComponents.lane,
        road: addressComponents.road,
        subdistrict: addressComponents.subdistrict,
        district: addressComponents.district,
        province: addressComponents.province,
        zipcode: tokens.zipcode,

        // Delivery
        label: companyPart || contactInfo.name,
        maps: tokens.maps,

        // Contact
        contactName: contactInfo.name,
        position: contactInfo.position,
        phone: tokens.phone,
        email: tokens.email,

        // Customer
        name: companyPart || contactInfo.name,
        line: '',

        fullLabel: [companyPart, contactInfo.name].filter(Boolean).join(' ')
    };

    return result;
}
