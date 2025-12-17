import dynamic from 'next/dynamic'

const OrderForm = dynamic(() => import('../components/Order'), { ssr: false })

export default function OrderEntryPage() {
    return (
        <OrderForm />
    )
}
