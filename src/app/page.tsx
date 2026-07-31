import HotDashboard from '@/components/HotDashboard';
import { isLocalStatsEnabled } from '@/lib/features';

export const dynamic = 'force-dynamic';

export default function Home() {
  return <HotDashboard enableVisitStats={isLocalStatsEnabled()} />;
}
