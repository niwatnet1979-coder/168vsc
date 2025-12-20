
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxsngjscyawiqbtocugp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c25nanNjeWF3aXFidG9jdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzYxNjQsImV4cCI6MjA4MDkxMjE2NH0.Fn4nljZtKOkxRWmxQ-DOGt-eNzKsArSWAFNrDyMaY4Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigrationDryRun() {
    console.log('--- STARTING DRY RUN MIGRATION ---');

    // Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products to check.`);
    products.forEach(p => console.log(`- ${p.product_code} (ID: ${p.id})`));

    let productsToUpdate = [];

    for (const p of products) {
        const code = p.product_code || '';

        // Regex to find dimensions
        // Patterns to match:
        // - L100xW20xH30
        // - 100x20x30
        // - D100
        // - W100

        // Strategy: Look for the dimension segment usually between hyphens
        // e.g. AA001-L100xW20-GD

        const parts = code.split('-');
        let dimsFound = null;
        let dimPartIndex = -1;

        // Iterate parts to find dimension-like string
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];

            // Check for explicit L/W/H format (e.g. L100W20H30, or L100xW20)
            const lMatch = part.match(/L(\d+)/i);
            const wMatch = part.match(/W(\d+)/i);
            const hMatch = part.match(/H(\d+)/i);
            const dMatch = part.match(/D(\d+)/i); // Diameter?

            // Check for WxLxH format (e.g. 100x200x300 or 100*200)
            const xMatch = part.match(/(\d+)[xX*](\d+)([xX*](\d+))?/);

            if (lMatch || wMatch || hMatch || dMatch || xMatch) {
                // Ignore if it looks like a color code or model number (too short?)
                // Usually dimensions are at least 2 digits?

                dimsFound = {
                    length: lMatch ? parseInt(lMatch[1]) : '',
                    width: wMatch ? parseInt(wMatch[1]) : '',
                    height: hMatch ? parseInt(hMatch[1]) : '',
                };

                // If xMatch found, try to map to L/W/H
                // Assumption: L x W x H or W x L x H? 
                // Usually W x L x H or L x W x H. 
                // Let's assume W x L x H for 168VSC (common in lighting? actually typically W x L x H or Dia x H)
                // Let's just create a 'raw' parsing for now.
                if (xMatch) {
                    // 100x200 -> W=100 L=200?
                    // 100x200x300 -> W=100 L=200 H=300?
                    // Let's populate based on array order
                    const numbers = part.split(/[xX*]/).map(n => parseInt(n.replace(/\D/g, '')));
                    if (numbers.length >= 2) {
                        dimsFound.width = numbers[0];
                        dimsFound.length = numbers[1];
                        if (numbers.length >= 3) dimsFound.height = numbers[2];
                    }
                }

                // If we found something meaningful
                if (dimsFound.length || dimsFound.width || dimsFound.height || dMatch) {
                    if (dMatch && !dimsFound.width && !dimsFound.length) {
                        // Treat D as Width and Length? Or just put in W/L
                        dimsFound.width = parseInt(dMatch[1]);
                        dimsFound.length = parseInt(dMatch[1]);
                    }

                    dimPartIndex = i;
                    break;
                }
            }
        }

        if (dimsFound) {
            // Construct new clean code (remove the dim part)
            const newParts = [...parts];
            // Only remove if we are sure it's the dimension part. 
            // Avoid removing the product ID itself if it looks like 100x200 (unlikely)
            if (dimPartIndex > 0) { // Don't remove the first part (Model ID)
                newParts.splice(dimPartIndex, 1);
            }
            const cleanCode = newParts.join('-');

            // Prepare update object
            const updateInfo = {
                id: p.id,
                originalCode: code,
                cleanCode: cleanCode,
                extractedDims: dimsFound,
                variantCount: (p.variants || []).length
            };

            // Only log if dimensions are NEW (not already in variant if possible, checking just in case)
            productsToUpdate.push(updateInfo);
        }
    }

    console.log(`\nIdentified ${productsToUpdate.length} products with embedded dimensions:`);
    productsToUpdate.forEach(p => {
        console.log(`[${p.id}] "${p.originalCode}" -> "${p.cleanCode}" | Dims: ${JSON.stringify(p.extractedDims)}`);
    });
}

runMigrationDryRun();
