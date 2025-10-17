import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings2, 
  TrendingUp, 
  Activity, 
  Shield, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Strategy', href: '/strategy', icon: Settings2 },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Monitoring', href: '/monitoring', icon: Activity },
  { name: 'Risk Management', href: '/risk', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card/50 backdrop-blur-sm">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          AlpacaTrader
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4 border border-orange-500/20">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
            ⚠️ LIVE TRADING ENABLED
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Real money is being used
          </p>
        </div>
      </div>
    </div>
  );
}