import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  DollarSign,
  Building,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "DJs", href: "/djs" },
  { icon: Building, label: "Produtores", href: "/producers" },
  { icon: Calendar, label: "Eventos", href: "/events" },
  { icon: ClipboardList, label: "Agenda Manager", href: "/agenda-manager" },
  { icon: DollarSign, label: "Financeiro", href: "/finances" },
  { icon: Settings, label: "Configurações", href: "/settings" },
];

const producerNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Users, label: "Meus DJs", href: "/my-djs" },
  { icon: Calendar, label: "Eventos", href: "/my-events" },
  { icon: DollarSign, label: "Pagamentos", href: "/my-payments" },
];

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = user?.role === 'admin' ? adminNavItems : producerNavItems;

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      setIsMobileMenuOpen(false);
      toast({
        title: "Sessão encerrada",
        description: "Você saiu do portal com sucesso.",
      });
      setLocation("/login");
    } catch (error: unknown) {
      console.error('Logout failed:', error);
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error instanceof Error ? error.message : "Não foi possível encerrar sua sessão.",
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-1.5 left-0 right-0 z-40 glass-card border-b border-primary/20 p-4 backdrop-blur-xl shadow-glow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F3d62991cf83740faa291d13d959ad05c%2Fc783b63f88704338ac16296d2ac24bd7?format=webp&width=800"
                alt="Disco de vinil Portal UNK"
                className="h-6 w-6 object-contain drop-shadow"
                draggable={false}
              />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">Portal UNK</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-muted-foreground hover:text-foreground glass-button hover-scale"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "glass-card flex flex-col border-r transition-all duration-500 ease-in-out",
        "fixed lg:sticky top-1.5 lg:top-2 z-50 h-screen",
        "lg:translate-x-0 shadow-2xl",
        isMobileMenuOpen ? "translate-x-0 animate-slide-in-right" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-16" : "w-64",
        className
      )}>
      {/* Header */}
      <div className="p-4 border-b border-border/50 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center space-x-3 transition-all duration-300", isCollapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center animate-glow shadow-glow">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F3d62991cf83740faa291d13d959ad05c%2Fc783b63f88704338ac16296d2ac24bd7?format=webp&width=800"
                alt="Disco de vinil Portal UNK"
                className="h-6 w-6 object-contain drop-shadow"
                draggable={false}
              />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-foreground gradient-text">Portal UNK</h1>
                <p className="text-xs text-muted-foreground">Assessoria Musical</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-300"
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border/50 backdrop-blur-xl animate-fade-in">
          <div className="flex items-center space-x-3 hover-lift cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse">
              <span className="text-sm font-medium text-white">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.username}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'admin' ? 'Administrador' : 'Produtor'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = location === item.href || 
            (item.href !== '/' && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={cn(
                  "w-full justify-start text-left font-normal transition-all duration-300",
                  "hover-lift animate-fade-in",
                  isCollapsed ? "px-2" : "px-3",
                  isActive
                    ? "bg-gradient-to-r from-neon-purple to-neon-blue text-white shadow-glow border-0 hover:shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border/50">
        <Button
          onClick={handleLogout}
          variant="ghost"
          disabled={isLoggingOut}
          className={cn(
            "w-full justify-start text-left font-normal text-muted-foreground hover:text-foreground hover:bg-destructive/20",
            isCollapsed ? "px-2" : "px-3",
            isLoggingOut && "opacity-70 cursor-not-allowed"
          )}
        >
          <LogOut className={cn("w-4 h-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>}
        </Button>
      </div>
    </div>
    </>
  );
}
