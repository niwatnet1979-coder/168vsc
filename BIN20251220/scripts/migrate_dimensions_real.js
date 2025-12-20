
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mxsngjscyawiqbtocugp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c25nanNjeWF3aXFidG9jdWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzYxNjQsImV4cCI6MjA4MDkxMjE2NH0.Fn4nljZtKOkxRWmxQ-DOGt-eNzKsArSWAFNrDyMaY4Q';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
    console.log('--- STARTING MIGRATION (REAL) ---');

    // Fetch all products
    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products to check.`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const p of products) {
        const code = p.product_code || '';
        const pid = p.uuid || p.id;

        if (!code) continue;

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
            const dMatch = part.match(/D(\d+)/i);

            // Check for WxLxH format (e.g. 100x200x300 or 100*200)
            const xMatch = part.match(/(\d+)[xX*](\d+)([xX*](\d+))?/);

            if (lMatch || wMatch || hMatch || dMatch || xMatch) {
                // Check if it's NOT a color like GD or SL (usually they are 2 chars)
                // But dimensions usually have numbers.

                dimsFound = {
                    length: lMatch ? parseInt(lMatch[1]) : '',
                    width: wMatch ? parseInt(wMatch[1]) : '',
                    height: hMatch ? parseInt(hMatch[1]) : '',
                };

                if (xMatch) {
                    const numbers = part.split(/[xX*]/).map(n => parseInt(n.replace(/\D/g, '')));
                    if (numbers.length >= 2) {
                        dimsFound.width = numbers[0];
                        dimsFound.length = numbers[1];
                        if (numbers.length >= 3) dimsFound.height = numbers[2];
                    }
                }

                if (dMatch && !dimsFound.width) {
                    dimsFound.width = parseInt(dMatch[1]);
                    dimsFound.length = parseInt(dMatch[1]);
                }

                if (dimsFound.length || dimsFound.width || dimsFound.height) {
                    dimPartIndex = i;
                    break;
                }
            }
        }

        if (dimsFound && dimPartIndex > 0) { // Safety: Don't remove first part
            // Construct new clean code
            const newParts = [...parts];
            newParts.splice(dimPartIndex, 1);
            const cleanCode = newParts.join('-');

            console.log(`[MIGRATING] ${code} -> ${cleanCode} | Dims: ${JSON.stringify(dimsFound)}`);

            // Update Variants if they exist
            let updatedVariants = p.variants;
            if (updatedVariants && Array.isArray(updatedVariants) && updatedVariants.length > 0) {
                updatedVariants = updatedVariants.map(v => ({
                    ...v,
                    dimensions: {
                        length: dimsFound.length || v.dimensions?.length || '',
                        width: dimsFound.width || v.dimensions?.width || '',
                        height: dimsFound.height || v.dimensions?.height || ''
                    }
                }));
            } else {
                // If no variants, we might want to create a default one? 
                // Or just leave it. The requirement implies moving TO variant structure.
                // But if product has no variants, adding them now is a bigger change.
                // Let's just update the product_code for now.
                // Or maybe we shouldn't touch products without variants if the goal is to move dims to variants?
                // But cleaning product_code is good anyway.
            }

            // Perform Update
            const updatePayload = {
                product_code: cleanCode,
                variants: updatedVariants
            };

            const { error: updateError } = await supabase
                .from('products')
                .update(updatePayload)
                .eq(p.uuid ? 'uuid' : 'id', pid);

            if (updateError) {
                console.error(`FAILED to update ${code}:`, updateError);
                errorCount++;
            } else {
                console.log(`SUCCESS updated ${code}`);
                updatedCount++;
            }
        }
    }

    console.log(`\nMigration Complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
}

runMigration();
