import BillSplitterFeature from '@/features/bill-splitter/components/BillSplitterFeature';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <BillSplitterFeature />
    </main>
  );
}