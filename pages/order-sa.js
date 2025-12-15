import dynamic from 'next/dynamic'

const OrderForm = dynamic(() => import('../components/OrderFormSA'), { ssr: false })

export default function OrderSaPage() {
    return (
        <OrderForm />
    )
}
