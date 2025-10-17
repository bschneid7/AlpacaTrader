import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/useToast';
import { getStrategyConfig, updateStrategyConfig, resetStrategyToDefaults } from '@/api/strategy';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RotateCcw, Save } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { StrategyConfig } from '@/types/strategy';

const SECTORS = ['Technology', 'Healthcare', 'Finance', 'Consumer', 'Industrial', 'Energy', 'Utilities', 'Materials', 'Real Estate', 'Communication'];
const MARKET_CAPS = ['Large', 'Mid', 'Small'];

export function Strategy() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const { toast } = useToast();

  const [config, setConfig] = useState<StrategyConfig>({
    maxPositionSize: 15,
    maxConcurrentPositions: 8,
    stopLoss: 5,
    takeProfit: 12,
    targetMonthlyReturn: 9,
    preMarket: false,
    afterHours: false,
    minStockPrice: 10,
    minDailyVolume: 1000000,
    marketCaps: ['Large', 'Mid'],
    sectors: ['Technology', 'Healthcare', 'Finance'],
  });

  const fetchConfig = useCallback(async () => {
    try {
      const response = await getStrategyConfig();
      const data = response.config;

      // Map backend data structure to frontend structure
      setConfig({
        maxPositionSize: data.maxPositionSize,
        maxConcurrentPositions: data.maxConcurrentPositions,
        stopLoss: data.stopLossPercentage,
        takeProfit: data.takeProfitTarget,
        targetMonthlyReturn: (data.monthlyReturnTarget.min + data.monthlyReturnTarget.max) / 2,
        preMarket: data.enablePreMarket,
        afterHours: data.enableAfterHours,
        minStockPrice: data.minStockPrice,
        minDailyVolume: data.minDailyVolume,
        marketCaps: data.marketCapPreferences.map((cap: string) => cap.charAt(0).toUpperCase() + cap.slice(1)),
        sectors: data.sectorPreferences.map((sector: string) => {
          // Convert backend format (snake_case) to frontend format (Title Case)
          return sector.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }),
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch strategy configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    console.log('Strategy: Fetching configuration');
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Map frontend data structure to backend structure
      const updateData = {
        maxPositionSize: config.maxPositionSize,
        maxConcurrentPositions: config.maxConcurrentPositions,
        stopLossPercentage: config.stopLoss,
        takeProfitTarget: config.takeProfit,
        monthlyReturnTarget: {
          min: Math.floor(config.targetMonthlyReturn - 1),
          max: Math.ceil(config.targetMonthlyReturn + 1),
        },
        enablePreMarket: config.preMarket,
        enableAfterHours: config.afterHours,
        marketHoursOnly: !config.preMarket && !config.afterHours,
        minStockPrice: config.minStockPrice,
        minDailyVolume: config.minDailyVolume,
        marketCapPreferences: config.marketCaps.map(cap => cap.toLowerCase()),
        sectorPreferences: config.sectors.map(sector => sector.toLowerCase().replace(/ /g, '_')),
      };

      const response = await updateStrategyConfig(updateData);
      toast({
        title: 'Success',
        description: response.message,
      });
      setShowConfirm(false);
      // Refresh config to show updated values
      await fetchConfig();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      const response = await resetStrategyToDefaults();
      toast({
        title: 'Success',
        description: response.message,
      });
      setShowReset(false);
      // Refresh config to show reset values
      await fetchConfig();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reset configuration',
        variant: 'destructive',
      });
    }
  };

  const toggleMarketCap = (cap: string) => {
    setConfig((prev) => ({
      ...prev,
      marketCaps: prev.marketCaps.includes(cap)
        ? prev.marketCaps.filter((c) => c !== cap)
        : [...prev.marketCaps, cap],
    }));
  };

  const toggleSector = (sector: string) => {
    setConfig((prev) => ({
      ...prev,
      sectors: prev.sectors.includes(sector)
        ? prev.sectors.filter((s) => s !== sector)
        : [...prev.sectors, sector],
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Strategy Configuration</h1>
            <p className="text-muted-foreground">Configure your aggressive trading strategy</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowReset(true)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button onClick={() => setShowConfirm(true)}>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-600">Live Trading Configuration</p>
                <p className="text-sm text-muted-foreground">
                  Changes to these settings will affect real trading with real money. Please review carefully before saving.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Risk Tolerance Settings</CardTitle>
            <CardDescription>Configure position sizing and risk parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Maximum Position Size</Label>
                <span className="text-sm font-semibold">{config.maxPositionSize}%</span>
              </div>
              <Slider
                value={[config.maxPositionSize]}
                onValueChange={([value]) => setConfig({ ...config, maxPositionSize: value })}
                min={5}
                max={25}
                step={1}
              />
              <p className="text-xs text-muted-foreground">Maximum percentage of portfolio per trade</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Maximum Concurrent Positions</Label>
                <span className="text-sm font-semibold">{config.maxConcurrentPositions}</span>
              </div>
              <Slider
                value={[config.maxConcurrentPositions]}
                onValueChange={([value]) => setConfig({ ...config, maxConcurrentPositions: value })}
                min={3}
                max={15}
                step={1}
              />
              <p className="text-xs text-muted-foreground">Maximum number of open positions at once</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Stop-Loss Percentage</Label>
                <span className="text-sm font-semibold">{config.stopLoss}%</span>
              </div>
              <Slider
                value={[config.stopLoss]}
                onValueChange={([value]) => setConfig({ ...config, stopLoss: value })}
                min={1}
                max={10}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">Automatic exit when position loses this percentage</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Take-Profit Target</Label>
                <span className="text-sm font-semibold">{config.takeProfit}%</span>
              </div>
              <Slider
                value={[config.takeProfit]}
                onValueChange={([value]) => setConfig({ ...config, takeProfit: value })}
                min={5}
                max={20}
                step={1}
              />
              <p className="text-xs text-muted-foreground">Automatic exit when position gains this percentage</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Monthly Target Settings</CardTitle>
            <CardDescription>Set your monthly return objectives</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Target Monthly Return</Label>
                <span className="text-sm font-semibold">{config.targetMonthlyReturn}%</span>
              </div>
              <Slider
                value={[config.targetMonthlyReturn]}
                onValueChange={([value]) => setConfig({ ...config, targetMonthlyReturn: value })}
                min={5}
                max={15}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">Target monthly growth rate (8-10% recommended for aggressive strategy)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Trading Hours Configuration</CardTitle>
            <CardDescription>Control when automated trading is active</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pre-Market Trading</Label>
                <p className="text-xs text-muted-foreground">Trade before 9:30 AM ET</p>
              </div>
              <Switch
                checked={config.preMarket}
                onCheckedChange={(checked) => setConfig({ ...config, preMarket: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>After-Hours Trading</Label>
                <p className="text-xs text-muted-foreground">Trade after 4:00 PM ET</p>
              </div>
              <Switch
                checked={config.afterHours}
                onCheckedChange={(checked) => setConfig({ ...config, afterHours: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Stock Universe Filters</CardTitle>
            <CardDescription>Define which stocks the algorithm can trade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Stock Price</Label>
                <span className="text-sm font-semibold">${config.minStockPrice}</span>
              </div>
              <Slider
                value={[config.minStockPrice]}
                onValueChange={([value]) => setConfig({ ...config, minStockPrice: value })}
                min={1}
                max={50}
                step={1}
              />
              <p className="text-xs text-muted-foreground">Avoid penny stocks below this price</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Minimum Daily Volume</Label>
                <span className="text-sm font-semibold">{(config.minDailyVolume / 1000000).toFixed(1)}M</span>
              </div>
              <Slider
                value={[config.minDailyVolume / 1000000]}
                onValueChange={([value]) => setConfig({ ...config, minDailyVolume: value * 1000000 })}
                min={0.5}
                max={10}
                step={0.5}
              />
              <p className="text-xs text-muted-foreground">Minimum average daily trading volume</p>
            </div>

            <div className="space-y-3">
              <Label>Market Cap Requirements</Label>
              <div className="flex flex-wrap gap-4">
                {MARKET_CAPS.map((cap) => (
                  <div key={cap} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cap-${cap}`}
                      checked={config.marketCaps.includes(cap)}
                      onCheckedChange={() => toggleMarketCap(cap)}
                    />
                    <label
                      htmlFor={`cap-${cap}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {cap} Cap
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Sector Preferences</Label>
              <div className="grid grid-cols-2 gap-4">
                {SECTORS.map((sector) => (
                  <div key={sector} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={config.sectors.includes(sector)}
                      onCheckedChange={() => toggleSector(sector)}
                    />
                    <label
                      htmlFor={`sector-${sector}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {sector}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-white dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Configuration Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to update your live trading strategy configuration. These changes will affect real trades with real money. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Confirm & Save'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReset} onOpenChange={setShowReset}>
        <AlertDialogContent className="bg-white dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to Aggressive Defaults</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all strategy settings to the recommended aggressive defaults. Any custom configurations will be lost. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>Reset Configuration</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}