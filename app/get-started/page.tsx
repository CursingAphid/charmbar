import GetStartedContent from '@/components/GetStartedContent';

export default async function GetStartedPage({ searchParams }: { searchParams?: Promise<{ next?: string }> }) {
    // In Next.js 15+, searchParams is a Promise
    const params = await searchParams;
    const next = params?.next || '/charms';
    
    return <GetStartedContent next={next} />;
}
