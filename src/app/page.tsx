import HomeFeedPage from '@/components/HomeFeedPage';
import { Suspense } from 'react';

export default function Home() {
  return (
    <Suspense>
      <HomeFeedPage />
    </Suspense>
  );
}
