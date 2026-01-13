import { Metadata } from 'next';
import BillSplitterFeature from '@/features/bill-splitter/components/BillSplitterFeature';

export const metadata: Metadata = {
    title: 'Pago Compartido | SaaS Factory',
    description: 'Divide tus cuentas de restaurante fácilmente con IA.',
};

export default function BillSplitterPage() {
    return (
        <main className="min-h-screen bg-gray-100 py-8">
            <BillSplitterFeature />
        </main>
    );
}
