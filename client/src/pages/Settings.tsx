import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { getAccountSettings, updateNotificationSettings, disconnectAlpacaAccount } from '@/api/settings';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Save } from 'lucide-react';
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
import type { AccountSettings } from '@/types/settings';

export function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountSettings | null>(null);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const { toast } = useToast();

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    email: '',
    alertFrequency: 'Immediate',
  });

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getAccountSettings() as AccountSettings;
      setAccountInfo(data);
      setNotificationSettings({
        emailNotifications: data.emailNotifications,
        email: data.email,
        alertFrequency: data.alertFrequency,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    console.log('Settings: Fetching account settings');
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const response = await updateNotificationSettings(notificationSettings) as { success: boolean; message: string };
      if (response.success) {
        toast({
          title: 'Success',
          description: response.message,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await disconnectAlpacaAccount() as { success: boolean; message: string };
      if (response.success) {
        toast({
          title: 'Account Disconnected',
          description: response.message,
        });
        setShowDisconnect(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to disconnect account',
        variant: 'destructive',
      });
    }
  };

  if (loading || !accountInfo) {
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings & Account</h1>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Alpaca Account Information</CardTitle>
            <CardDescription>Your connected brokerage account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input value={`****${accountInfo.accountNumber.slice(-4)}`} disabled />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Input value={accountInfo.accountType} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-sm font-medium text-green-600">{accountInfo.accountStatus}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Configure how you receive alerts and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive trading alerts via email</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                }
              />
            </div>

            {notificationSettings.emailNotifications && (
              <>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={notificationSettings.email}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, email: e.target.value })
                    }
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alert Frequency</Label>
                  <Select
                    value={notificationSettings.alertFrequency}
                    onValueChange={(value) =>
                      setNotificationSettings({ ...notificationSettings, alertFrequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate">Immediate</SelectItem>
                      <SelectItem value="Hourly">Hourly Digest</SelectItem>
                      <SelectItem value="Daily">Daily Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button onClick={handleSaveNotifications} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions that affect your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Disconnect Alpaca Account</Label>
              <p className="text-sm text-muted-foreground">
                This will disconnect your Alpaca brokerage account and stop all automated trading. You will need to reconnect to resume trading.
              </p>
              <Button variant="destructive" onClick={() => setShowDisconnect(true)}>
                Disconnect Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>Important Disclaimers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>⚠️ This application executes live trades with real money. Trading stocks involves substantial risk of loss.</p>
            <p>📊 Past performance does not guarantee future results.</p>
            <p>🎯 8-10% monthly returns are a target, not a guarantee. Losses are possible.</p>
            <p>⚖️ You are responsible for all trading decisions and outcomes.</p>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent className="bg-white dark:bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Alpaca Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your Alpaca account? This will stop all automated trading immediately. You will need to reconnect and reconfigure to resume trading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}