import { getDictionary, hasLocale } from './dictionaries';
import { notFound } from 'next/navigation';
import ClientPage from './ClientPage';

export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  if (!hasLocale(lang)) {
    notFound();
  }

  const dict = await getDictionary(lang);
  
  return <ClientPage dict={dict} />;
}
