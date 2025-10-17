import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { getRiskMetrics, getRiskLimits, updateRiskLimits, emergencyStopAll } from '@/api/risk';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Shield, AlertOctagon } from 'lucide-react';
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function Risk() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [limits, setLimits] = useState<any>(null);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [emergencyStopping, setEmergencyStopping] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, limitsRes] = await Promise.all([
        getRiskMetrics(),
        getRiskLimits(),
      ]);

      setMetrics(metricsRes.metrics);
      setLimits(limitsRes.limits);
    } catch (error) {
      console.error("Risk data fetch error:", error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch risk data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    console.log('Risk: Fetching data');
    fetchData();
  }, [fetchData]);

  const handleSaveLimits = async () => {
    if (!limits) return;

    setSaving(true);
    try {
      const response = await updateRiskLimits(limits);
      toast({
        title: 'Success',
        description: response.message || 'Risk limits updated successfully',
      });
      // Refresh limits
      const limitsRes = await getRiskLimits();
      setLimits(limitsRes.limits);
    } catch (error) {
      console.error("Update risk limits error:", error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update risk limits',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEmergencyStop = async () => {
    if (confirmText !== 'CONFIRM') {
      toast({
        title: 'Invalid Confirmation',
        description: 'Please type CONFIRM to proceed',
        variant: 'destructive',
      });
      return;
    }

    setEmergencyStopping(true);
    try {
      const response = await emergencyStopAll(confirmText);
      if (response.success) {
        toast({
          title: 'Emergency Stop Executed',
          description: `${response.closedPositions} positions closed. Trading halted.`,
        });
        setShowEmergencyDialog(false);
        setConfirmText('');
        // Refresh data
        fetchData();
      }
    } catch (error) {
      console.error("Emergency stop error:", error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute emergency stop',
        variant: 'destructive',
      });
    } finally {
      setEmergencyStopping(false);
    }
  };

  if (loading || !metrics || !limits) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Transform sector concentration data
  const sectorData = metrics.sectorConcentration?.map((sector: any) => ({
    name: sector.sector,
    value: sector.percentage,
  })) || [];

  const positionData = metrics.positionConcentration || [];

  // Check if user has no Alpaca account or portfolio value
  const hasNoAccount = metrics.portfolioValue === 0 && metrics.cashAvailable === 0;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Risk Management</h1>
            <p className="text-muted-foreground">Monitor and control portfolio risk</p>
          </div>
          <Button
            variant="destructive"
            size="lg"
            onClick={() => setShowEmergencyDialog(true)}
            className="bg-red-600 hover:bg-red-700"
            disabled={hasNoAccount}
          >
            <AlertOctagon className="mr-2 h-5 w-5" />
            EMERGENCY STOP
          </Button>
        </div>

        {hasNoAccount && (
          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">No Alpaca Account Connected</h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Connect your Alpaca trading account in the Settings page to view real-time risk metrics and portfolio data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Risk Exposure</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.currentRiskExposure?.toFixed(2) || 0}%</div>
              <Progress value={metrics.currentRiskExposure || 0} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">Portfolio at risk</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily P&L</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${metrics.dailyPnL < 0 ? 'text-red-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.dailyPnL < 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${Math.abs(metrics.dailyPnL || 0).toFixed(2)}
              </div>
              <p className={`text-xs ${metrics.dailyPnL < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(metrics.dailyPnLPercentage || 0).toFixed(2)}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio Drawdown</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{(metrics.currentDrawdown || 0).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">From peak value</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Sector Concentration</CardTitle>
              <CardDescription>Portfolio allocation by sector</CardDescription>
            </CardHeader>
            <CardContent>
              {sectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No sector data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>Position Concentration</CardTitle>
              <CardDescription>Largest positions by portfolio percentage</CardDescription>
            </CardHeader>
            <CardContent>
              {positionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={positionData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="symbol" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="percentage" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No position data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Risk Controls & Limits</CardTitle>
            <CardDescription>Set automatic risk management thresholds</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Daily Loss Limit (%)</Label>
                <span className="text-sm font-semibold">{limits.dailyLossLimit?.value || 0}%</span>
              </div>
              <Slider
                value={[limits.dailyLossLimit?.value || 5]}
                onValueChange={([value]) => setLimits({
                  ...limits,
                  dailyLossLimit: { ...limits.dailyLossLimit, value }
                })}
                min={1}
                max={20}
                step={0.5}
              />
              <div className="flex items-center justify-between mt-2">
                <Label className="text-xs text-muted-foreground">Enable Daily Loss Limit</Label>
                <Switch
                  checked={limits.dailyLossLimit?.enabled || false}
                  onCheckedChange={(checked) => setLimits({
                    ...limits,
                    dailyLossLimit: { ...limits.dailyLossLimit, enabled: checked }
                  })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Halt Trading on Daily Limit</Label>
                <p className="text-xs text-muted-foreground">Automatically stop trading if daily loss limit is reached</p>
              </div>
              <Switch
                checked={limits.haltTradingOnDailyLimit || false}
                onCheckedChange={(checked) => setLimits({ ...limits, haltTradingOnDailyLimit: checked })}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Portfolio Drawdown Limit (%)</Label>
                <span className="text-sm font-semibold">{limits.portfolioDrawdownLimit?.value || 0}%</span>
              </div>
              <Slider
                value={[limits.portfolioDrawdownLimit?.value || 15]}
                onValueChange={([value]) => setLimits({
                  ...limits,
                  portfolioDrawdownLimit: { ...limits.portfolioDrawdownLimit, value }
                })}
                min={5}
                max={30}
                step={1}
              />
              <div className="flex items-center justify-between mt-2">
                <Label className="text-xs text-muted-foreground">Enable Drawdown Limit</Label>
                <Switch
                  checked={limits.portfolioDrawdownLimit?.enabled || false}
                  onCheckedChange={(checked) => setLimits({
                    ...limits,
                    portfolioDrawdownLimit: { ...limits.portfolioDrawdownLimit, enabled: checked }
                  })}
                />
              </div>
              <p className="text-xs text-muted-foreground">Auto-pause trading if drawdown exceeds this threshold</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Halt Trading on Drawdown</Label>
                <p className="text-xs text-muted-foreground">Automatically stop trading if drawdown limit is reached</p>
              </div>
              <Switch
                checked={limits.haltTradingOnDrawdown || false}
                onCheckedChange={(checked) => setLimits({ ...limits, haltTradingOnDrawdown: checked })}
              />
            </div>

            <Button onClick={handleSaveLimits} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Risk Limits'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <AlertDialogContent className="bg-white dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertOctagon className="h-5 w-5" />
              EMERGENCY STOP - CLOSE ALL POSITIONS
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately submit market orders to close ALL open positions and halt automated trading. This action cannot be undone.
              <br /><br />
              Type <strong>CONFIRM</strong> to proceed:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CONFIRM"
            className="mt-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={emergencyStopping} onClick={() => setConfirmText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmergencyStop}
              disabled={emergencyStopping || confirmText !== 'CONFIRM'}
              className="bg-red-600 hover:bg-red-700"
            >
              {emergencyStopping ? 'Executing...' : 'EXECUTE EMERGENCY STOP'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
