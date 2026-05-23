import { Outlet, useLocation, useNavigate } from "react-router";
import {
  Bell,
  Brain,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Pill,
  Receipt,
  Search,
  Settings,
  Sun,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { useAuth } from "../../contexts/AuthContext";

const navigationGroups = [
  {
    label: "Dashboard",
    items: [{ path: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "Management",
    items: [
      { path: "/dashboard/patients", label: "Patients", icon: Users },
      { path: "/dashboard/medicines", label: "Medicines", icon: Pill },
    ],
  },
  {
    label: "Finance",
    items: [
      { path: "/dashboard/billing", label: "Billing", icon: Receipt },
      { path: "/dashboard/sales", label: "Sales & Records", icon: TrendingUp },
    ],
  },
  {
    label: "AI Tools",
    items: [
      {
        path: "/dashboard/ai-recommendations",
        label: "AI Recommendations",
        icon: Brain,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      { path: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { path: "/dashboard/profile", label: "Profile & Settings", icon: Settings },
    ],
  },
];

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(124,58,237,0.13),transparent_30%)]" />
      <div className="relative flex min-h-screen">
        <aside
          className={`${
            sidebarOpen ? "w-72" : "w-24"
          } sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/50 bg-white/70 shadow-xl shadow-slate-200/70 backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/30 lg:flex`}
        >
          <div className="flex h-20 items-center px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-600/25">
                <Pill className="h-6 w-6 text-white" />
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                    MediCare
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Hospital SaaS
                  </p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
            {navigationGroups.map((group) => (
              <div key={group.label}>
                {sidebarOpen && (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-300 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-600/25"
                            : "text-slate-600 hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-blue-600 hover:to-violet-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/25 focus-visible:bg-gradient-to-r focus-visible:from-blue-600 focus-visible:to-violet-600 focus-visible:text-white focus-visible:shadow-lg focus-visible:shadow-blue-600/25 dark:text-slate-300"
                        } ${sidebarOpen ? "" : "justify-center"}`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            isActive
                              ? "text-white"
                              : "text-slate-500 group-hover:text-white group-focus-visible:text-white dark:text-slate-400"
                          }`}
                        />
                        {sidebarOpen && (
                          <span className="text-sm font-medium">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/60 p-4 dark:border-white/10">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full rounded-2xl hover:bg-white/80 dark:hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
              {sidebarOpen && <span>Collapse</span>}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="relative max-w-2xl flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search patients, medicines, invoices..."
                  className="h-12 rounded-2xl border-white/70 bg-white/80 pl-12 shadow-inner transition-all focus:bg-white focus:shadow-lg dark:border-white/10 dark:bg-white/10 dark:focus:bg-white/15"
                />
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]" />
                Hospital Online
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDarkMode((value) => !value)}
                className="rounded-2xl bg-white/70 shadow-sm hover:-translate-y-0.5 hover:bg-white dark:bg-white/10 dark:hover:bg-white/15"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-amber-300" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-700" />
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative rounded-2xl bg-white/70 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-white/10 dark:hover:bg-white/15">
                    <Bell className="h-5 w-5 text-slate-600 dark:text-slate-200" />
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-2xl">
                  <DropdownMenuItem onClick={() => navigate("/dashboard/notifications")}>
                    <Bell className="mr-2 h-4 w-4" />
                    3 urgent stock alerts
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Building2 className="mr-2 h-4 w-4" />
                    Clinic load is normal today
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-2xl bg-white/70 p-2 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-white/10 dark:hover:bg-white/15">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden text-left lg:block">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {user?.name || "Loading..."}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user?.role || "User"}
                      </p>
                    </div>
                    <ChevronDown className="hidden h-4 w-4 text-slate-400 lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                  <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
