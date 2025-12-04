// Script to generate test data for Orders and Jobs
// Run this in browser console on localhost:3001

function generateTestData() {
    const customers = [
        { id: 1, name: 'บริษัท แสนสิริ จำกัด (มหาชน)' },
        { id: 2, name: 'โรงแรม แมนดาริน โอเรียนเต็ล' },
        { id: 3, name: 'คุณธนินท์ เจียรวนนท์' },
        { id: 4, name: 'บริษัท ปตท. น้ำมันและการค้าปลีก จำกัด (มหาชน)' },
        { id: 5, name: 'โรงพยาบาลกรุงเทพ' },
        { id: 6, name: 'ร้านอาหาร เจ๊ไฝ (Michelin Star)' },
        { id: 7, name: 'บริษัท เอสซีจี แพคเกจจิ้ง จำกัด (มหาชน)' },
        { id: 8, name: 'โรงเรียนนานาชาติ ISB' },
        { id: 9, name: 'คอนโด Ideo Q Chula-Samyan' },
        { id: 10, name: 'วัดพระธรรมกาย' }
    ]

    const products = [
        { id: 'OT022-GRY-00-23-00', name: 'โคมไฟกริ่งคริสตัล', price: 43400 },
        { id: 'OT03-GLD-00-20-00', name: 'โคมไฟกริ่งคาดสีทอง', price: 6000 },
        { id: 'AA002-SLV-00-60-00', name: 'โคมไฟสปาร์คบอล', price: 21900 },
        { id: 'AA018-BLK-00-50-00', name: 'โคมไฟระย้าคริสตัล สีดำ', price: 12900 },
        { id: 'AA020-GLD-00-60-00', name: 'โคมไฟระย้าแท่งแก้วใส', price: 25900 },
        { id: 'AA025-GLD-00-30-00', name: 'โคมไฟวงแหวนสแตนเลส', price: 28900 },
        { id: 'AA031-RGD-00-20-00', name: 'โคมไฟระย้าลูกบาศก์', price: 46900 },
        { id: 'AA035-RGD-00-18-00', name: 'โคมไฟระย้า LAVA', price: 22400 }
    ]

    const addresses = [
        '59 ซอยริมคลองพระโขนง แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพมหานคร 10110',
        '48 ซอยโอเรียนเต็ล อเวนิว ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพมหานคร 10500',
        '99 หมู่ 9 ถนนธนะรัชต์ ตำบลหมูสี อำเภอปากช่อง นครราชสีมา 30130',
        '555/2 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารบี ชั้น 1 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',
        '2 ซอยศูนย์วิจัย 7 ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพมหานคร 10310',
        '327 ถนนมหาไชย แขวงสำราญราษฎร์ เขตพระนคร กรุงเทพมหานคร 10200',
        '1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพมหานคร 10800',
        '39/7 Soi Nichada Thani, Samakee Road, Pakkret, Nonthaburi 11120',
        '660 ถนนพระรามที่ 4 แขวงมหาพฤฒาราม เขตบางรัก กรุงเทพมหานคร 10500',
        '23/2 หมู่ 7 ตำบลคลองสาม อำเภอคลองหลวง ปทุมธานี 12120'
    ]

    const teams = ['ทีมบริหาร', 'ทีม A', 'ทีม B', 'ทีม C']
    const statuses = ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น']

    // Generate 10 Orders
    const orders = []
    const jobs = []
    let jobId = 1

    for (let i = 1; i <= 10; i++) {
        const customer = customers[i - 1]
        const orderDate = new Date(2024, 11, i) // December 2024
        const deliveryDate = new Date(2024, 11, i + 7) // 7 days later

        // Random number of products (2-4 per order)
        const numProducts = Math.floor(Math.random() * 3) + 2
        const orderProducts = []
        let totalAmount = 0

        for (let p = 0; p < numProducts; p++) {
            const product = products[Math.floor(Math.random() * products.length)]
            const quantity = Math.floor(Math.random() * 3) + 1
            const subtotal = product.price * quantity
            totalAmount += subtotal

            orderProducts.push({
                productId: product.id,
                productName: product.name,
                quantity: quantity,
                price: product.price,
                subtotal: subtotal
            })
        }

        const order = {
            id: `ORD-2024-12-${String(i).padStart(3, '0')}`,
            customerId: customer.id,
            customerName: customer.name,
            orderDate: orderDate.toISOString().split('T')[0],
            deliveryDate: deliveryDate.toISOString().split('T')[0],
            deliveryAddress: addresses[i - 1],
            products: orderProducts,
            totalAmount: totalAmount,
            status: i <= 3 ? 'เสร็จสิ้น' : i <= 7 ? 'กำลังดำเนินการ' : 'รอดำเนินการ',
            notes: `คำสั่งซื้อทดสอบ #${i}`,
            createdAt: orderDate.toISOString(),
            updatedAt: new Date().toISOString()
        }

        orders.push(order)

        // Generate 3 jobs per order (30 jobs total)
        for (let j = 1; j <= 3; j++) {
            const jobDate = new Date(deliveryDate)
            jobDate.setDate(jobDate.getDate() + j - 1)

            const jobTypes = ['ติดตั้ง', 'ซ่อมแซม', 'ตรวจสอบ']
            const jobType = jobTypes[j - 1]

            const job = {
                id: `JOB-${String(jobId).padStart(4, '0')}`,
                orderId: order.id,
                customerId: customer.id,
                customerName: customer.name,
                jobType: jobType,
                jobDate: jobDate.toISOString().split('T')[0],
                jobTime: j === 1 ? '09:00' : j === 2 ? '13:00' : '15:00',
                address: addresses[i - 1],
                assignedTeam: teams[Math.floor(Math.random() * teams.length)],
                status: jobId <= 10 ? 'เสร็จสิ้น' : jobId <= 20 ? 'กำลังดำเนินการ' : 'รอดำเนินการ',
                notes: `งาน${jobType} สำหรับ ${order.customerName}`,
                products: orderProducts.map(p => ({
                    productId: p.productId,
                    productName: p.productName,
                    quantity: p.quantity
                })),
                createdAt: orderDate.toISOString(),
                updatedAt: new Date().toISOString()
            }

            jobs.push(job)
            jobId++
        }
    }

    // Save to localStorage
    localStorage.setItem('orders_data', JSON.stringify(orders))
    localStorage.setItem('jobs_data', JSON.stringify(jobs))

    console.log('✅ สร้างข้อมูลทดสอบเรียบร้อยแล้ว!')
    console.log(`📦 Orders: ${orders.length} รายการ`)
    console.log(`🔧 Jobs: ${jobs.length} รายการ`)
    console.log('\nตัวอย่าง Orders:')
    console.table(orders.slice(0, 3))
    console.log('\nตัวอย่าง Jobs:')
    console.table(jobs.slice(0, 5))

    return { orders, jobs }
}

// Run the function
generateTestData()
