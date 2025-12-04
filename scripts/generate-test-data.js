// Script to generate NORMALIZED test data
// Run this in browser console on localhost:3000

function generateTestData() {
    console.log('🚀 Starting Normalized Test Data Generation...')

    // 1. Generate Customers (Master Data)
    const customers = [
        { id: 1, name: 'บริษัท แสนสิริ จำกัด (มหาชน)', phone: '02-201-3905', address: '59 ซอยริมคลองพระโขนง แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพฯ 10110' },
        { id: 2, name: 'โรงแรม แมนดาริน โอเรียนเต็ล', phone: '02-659-9000', address: '48 ซอยบูรพา แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500' },
        { id: 3, name: 'คุณธนินท์ เจียรวนนท์', phone: '081-999-9999', address: '123 ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330' },
        { id: 4, name: 'บริษัท ปตท. น้ำมันและการค้าปลีก จำกัด (มหาชน)', phone: '1365', address: '555/2 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 12 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900' },
        { id: 5, name: 'โรงพยาบาลกรุงเทพ', phone: '1719', address: '2 ซอยศูนย์วิจัย 7 ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพฯ 10310' },
        { id: 6, name: 'ร้านอาหาร เจ๊ไฝ (Michelin Star)', phone: '092-724-9633', address: '327 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพฯ 10200' },
        { id: 7, name: 'บริษัท เอสซีจี แพคเกจจิ้ง จำกัด (มหาชน)', phone: '02-586-3333', address: '1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10800' },
        { id: 8, name: 'โรงเรียนนานาชาติ ISB', phone: '02-963-5800', address: '39/7 ซอยนิชดาธานี ถนนสามัคคี อำเภอปากเกร็ด นนทบุรี 11120' },
        { id: 9, name: 'คอนโด Ideo Q Chula-Samyan', phone: '02-316-2222', address: '660 ถนนพระรามที่ 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพฯ 10500' },
        { id: 10, name: 'วัดพระธรรมกาย', phone: '02-831-1000', address: '23/2 หมู่ 7 ตำบลคลองสาม อำเภอคลองหลวง ปทุมธานี 12120' }
    ]

    // 2. Generate Products (Master Data)
    const products = [
        { id: 'OT022-GRY-00-23-00', name: 'โคมไฟกริ่งคริสตัล', price: 43400, category: 'โคมไฟระย้า', images: ['https://images.unsplash.com/photo-1513506003013-d5316327a3d8?auto=format&fit=crop&q=80&w=300&h=300'] },
        { id: 'AA002-SLV-00-60-00', name: 'โคมไฟสปาร์คบอล', price: 21900, category: 'โคมไฟโมเดิร์น', images: ['https://images.unsplash.com/photo-1540932296774-3ed6d23f9b58?auto=format&fit=crop&q=80&w=300&h=300'] },
        { id: 'BB005-GLD-00-45-00', name: 'โคมไฟตั้งโต๊ะทองเหลือง', price: 12500, category: 'โคมไฟตั้งโต๊ะ', images: ['https://images.unsplash.com/photo-1507473888900-52e1ad14596d?auto=format&fit=crop&q=80&w=300&h=300'] },
        { id: 'CC010-BLK-00-30-00', name: 'โคมไฟผนังลอฟท์', price: 5900, category: 'โคมไฟผนัง', images: ['https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&q=80&w=300&h=300'] },
        { id: 'DD015-WHT-00-50-00', name: 'โคมไฟเพดานมินิมอล', price: 8900, category: 'โคมไฟเพดาน', images: ['https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?auto=format&fit=crop&q=80&w=300&h=300'] }
    ]

    // 3. Generate Orders (Transaction Data)
    const orders = []
    const jobs = []
    let jobCounter = 1

    for (let i = 1; i <= 10; i++) {
        const customer = customers[i - 1]
        const orderId = `ORD-2024-12-${String(i).padStart(3, '0')}`
        const orderDate = new Date(2024, 11, i).toISOString().split('T')[0]

        // Random products for this order
        const numItems = Math.floor(Math.random() * 3) + 1 // 1-3 items
        const orderItems = []

        for (let j = 0; j < numItems; j++) {
            const product = products[Math.floor(Math.random() * products.length)]
            const quantity = Math.floor(Math.random() * 2) + 1

            orderItems.push({
                productId: product.id,
                quantity: quantity,
                price: product.price,
                subtotal: product.price * quantity
            })

            // Generate Job for each item (Simplified: 1 item = 1 job for now)
            const jobId = `JOB-${String(jobCounter).padStart(4, '0')}`
            jobCounter++

            jobs.push({
                id: jobId,
                orderId: orderId,
                customerId: customer.id, // Reference ID
                productId: product.id,   // Reference ID
                jobType: Math.random() > 0.5 ? 'ติดตั้ง' : 'ส่งของ',
                jobDate: new Date(2024, 11, i + 7).toISOString().split('T')[0], // 7 days after order
                jobTime: '10:00',
                address: customer.address, // Snapshot address (in real app)
                assignedTeam: Math.random() > 0.5 ? 'ทีม A' : 'ทีม B',
                status: ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น'][Math.floor(Math.random() * 3)],
                notes: `งานสำหรับออเดอร์ ${orderId}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        }

        orders.push({
            id: orderId,
            customerId: customer.id, // Reference ID
            orderDate: orderDate,
            deliveryDate: new Date(2024, 11, i + 7).toISOString().split('T')[0],
            deliveryAddress: customer.address,
            items: orderItems,
            totalAmount: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
            status: 'กำลังดำเนินการ',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })
    }

    // 4. Save to localStorage
    console.log('💾 Saving to localStorage...')
    localStorage.setItem('customers_data', JSON.stringify(customers))
    localStorage.setItem('products_data_v3', JSON.stringify(products))
    localStorage.setItem('orders_data', JSON.stringify(orders))
    localStorage.setItem('jobs_data', JSON.stringify(jobs))

    // Also save team data if missing
    if (!localStorage.getItem('team_data')) {
        const teams = [
            { id: 1, name: 'ทีม A', members: ['ช่างหนึ่ง', 'ช่างสอง'] },
            { id: 2, name: 'ทีม B', members: ['ช่างสาม', 'ช่างสี่'] }
        ]
        localStorage.setItem('team_data', JSON.stringify(teams))
    }

    console.log('✅ Data Generation Complete!')
    console.log(`- ${customers.length} Customers`)
    console.log(`- ${products.length} Products`)
    console.log(`- ${orders.length} Orders`)
    console.log(`- ${jobs.length} Jobs`)

    alert('สร้างข้อมูลทดสอบเรียบร้อยแล้ว! (Normalized Structure)')
    window.location.reload()
}

// Auto-run if called
// generateTestData()
