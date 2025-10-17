import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { toggleAutoTrading } from '@/api/alpaca';

interface AutoTradingToggleProps {
  initialEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function AutoTradingToggle({ initialEnabled, onToggle }: AutoTradingToggleProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const response = await toggleAutoTrading({ enabled: checked }) as { success: boolean; enabled: boolean };
      if (response.success) {
        setEnabled(response.enabled);
        onToggle(response.enabled);
        toast({
          title: response.enabled ? 'Auto-Trading Enabled' : 'Auto-Trading Disabled',
          description: response.enabled 
            ? 'Automated trading is now active' 
            : 'Switched to manual mode',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle auto-trading',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle>Auto-Trading Status</CardTitle>
        <CardDescription>Control automated trading execution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Switch
              id="auto-trading"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading}
            />
            <Label htmlFor="auto-trading" className="cursor-pointer">
              <div className="flex items-center gap-2">
                {enabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-600">Automated Trading Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-orange-600">Manual Mode - No Automated Trades</span>
                  </>
                )}
              </div>
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}