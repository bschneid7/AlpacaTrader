import { useEffect, useState, useCallback } from 'react';
import { AccountOverview } from '@/components/dashboard/AccountOverview';
import { AutoTradingToggle } from '@/components/dashboard/AutoTradingToggle';
import { CurrentPositions } from '@/components/dashboard/CurrentPositions';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { StrategyPerformance } from '@/components/dashboard/StrategyPerformance';
import { useToast } from '@/hooks/useToast';
import {
  getAccountOverview,
  getCurrentPositions,
  getRecentTrades,
  getAutoTradingStatus,
  getStrategyPerformance,
} from '@/api/alpaca';
import { Skeleton } from '@/components/ui/skeleton';
import type { AccountData, Position, RecentTrade, StrategyPerformance as StrategyPerformanceType } from '@/types/dashboard';

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<RecentTrade[]>([]);
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);
  const [performance, setPerformance] = useState<StrategyPerformanceType | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [accountRes, positionsRes, tradesRes, statusRes, performanceRes] = await Promise.all([
        getAccountOverview().catch(() => null),
        getCurrentPositions().catch(() => ({ positions: [] })),
        getRecentTrades().catch(() => ({ trades: [] })),
        getAutoTradingStatus().catch(() => ({ enabled: false })),
        getStrategyPerformance().catch(() => null),
      ]);

      setAccountData(accountRes as AccountData | null);
      setPositions((positionsRes as { positions: Position[] })?.positions || []);
      setTrades((tradesRes as { trades: RecentTrade[] })?.trades || []);
      setAutoTradingEnabled((statusRes as { enabled: boolean })?.enabled || false);
      setPerformance(performanceRes as StrategyPerformanceType | null);
    } catch (error) {
      console.error('Dashboard error:', error);
      // Don't show error toast - just use default values
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('Dashboard: Fetching initial data');
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('Dashboard: Auto-refreshing data');
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your trading account and performance</p>
      </div>

      <AccountOverview data={accountData} />

      <AutoTradingToggle
        initialEnabled={autoTradingEnabled}
        onToggle={(enabled) => setAutoTradingEnabled(enabled)}
      />

      <CurrentPositions positions={positions} onPositionClosed={fetchData} />

      <div className="grid gap-6 md:grid-cols-2">
        <RecentTrades trades={trades} />
        <div className="space-y-6">
          <StrategyPerformance data={performance} />
        </div>
      </div>
    </div>
  );
}