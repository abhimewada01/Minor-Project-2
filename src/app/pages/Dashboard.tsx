import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  CalendarDays,
  FileText,
  Pill,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const statsCards = [
  {
    title: "Today's Revenue",
    value: "₹4,48,460",
    change: "+8.4%",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/25",
    mini: [18, 22, 20, 28, 25, 34],
  },
  {
    title: "Total Patients",
    value: "1,248",
    change: "+12.2%",
    icon: Users,
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/25",
    mini: [15, 18, 23, 20, 28, 31],
  },
  {
    title: "Low Stock Alerts",
    value: "23",
    change: "Urgent",
    icon: AlertTriangle,
    gradient: "from-orange-500 to-rose-600",
    glow: "shadow-orange-500/25",
    mini: [28, 25, 26, 21, 18, 16],
  },
  {
    title: "Total Sales",
    value: "₹40,08,070",
    change: "+15.1%",
    icon: Receipt,
    gradient: "from-violet-500 to-fuchsia-600",
    glow: "shadow-violet-500/25",
    mini: [20, 24, 22, 30, 32, 38],
  },
];

const revenueData = [
  { day: "Mon", revenue: 285000, patients: 96 },
  { day: "Tue", revenue: 342000, patients: 118 },
  { day: "Wed", revenue: 318000, patients: 109 },
  { day: "Thu", revenue: 426000, patients: 146 },
  { day: "Fri", revenue: 448460, patients: 158 },
  { day: "Sat", revenue: 391000, patients: 132 },
  { day: "Sun", revenue: 354000, patients: 121 },
];

const medicineCategories = [
  { name: "Antibiotics", value: 35, color: "#2563EB" },
  { name: "Pain Relief", value: 25, color: "#10B981" },
  { name: "Vitamins", value: 20, color: "#7C3AED" },
  { name: "Others", value: 20, color: "#F59E0B" },
];

const recentBills = [
  { name: "Abhishek Mewada", id: "INV-797424", amount: "₹228.25", time: "5 min ago" },
  { name: "Sarah Wilson", id: "INV-797301", amount: "₹1,244.00", time: "18 min ago" },
  { name: "Mike Johnson", id: "INV-797255", amount: "₹640.75", time: "42 min ago" },
];

const activity = [
  { title: "Patient checked in", meta: "Sarah Wilson · General checkup", icon: Users },
  { title: "Bill generated", meta: "INV-797424 · Paracetamol 500mg", icon: Receipt },
  { title: "AI insight created", meta: "Cold symptoms mapped to 3 medicines", icon: Brain },
  { title: "Stock alert", meta: "Amoxicillin below minimum level", icon: AlertTriangle },
];

const lowStockMedicines = [
  { name: "Paracetamol 500mg", stock: 45, minStock: 100 },
  { name: "Amoxicillin 250mg", stock: 20, minStock: 50 },
  { name: "Ibuprofen 400mg", stock: 30, minStock: 80 },
];

const cardClass =
  "rounded-2xl border border-white/70 bg-white/75 shadow-xl shadow-slate-200/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-200/50 dark:border-white/10 dark:bg-white/10 dark:shadow-black/20";

const miniChartData = (values: number[]) =>
  values.map((value, index) => ({ index, value }));

export function Dashboard() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 p-6 text-white shadow-2xl shadow-blue-950/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-blue-100 backdrop-blur">
              <CalendarDays className="h-4 w-4" />
              {today}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Welcome back Dr. Sarah
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
              Here's your hospital analytics today with revenue, patient flow,
              inventory risk, and AI-powered recommendations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-blue-100">Today's Revenue</p>
              <p className="mt-1 text-2xl font-semibold">₹4.48L</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs text-blue-100">Hospital Status</p>
              <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.18)]" />
                Online
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className={`overflow-hidden border-0 bg-gradient-to-br ${stat.gradient} p-5 text-white shadow-xl ${stat.glow} transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01]`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-white/75">{stat.title}</p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="mt-2 flex items-center gap-1 text-sm text-white/85">
                    <ArrowUpRight className="h-4 w-4" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className="rounded-2xl bg-white/18 p-3 backdrop-blur">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 h-12 opacity-75">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniChartData(stat.mini)}>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="rgba(255,255,255,0.9)"
                      fill="rgba(255,255,255,0.18)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className={`${cardClass} p-5 xl:col-span-8`}>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Revenue Analytics
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Weekly revenue with smooth trend analysis
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  border: "1px solid rgba(255,255,255,0.7)",
                  borderRadius: "16px",
                  boxShadow: "0 18px 45px rgba(15,23,42,0.16)",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563EB"
                fill="url(#revenueFill)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className={`${cardClass} p-5 xl:col-span-4`}>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Patient Activity
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Live weekly visits
            </p>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={revenueData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  borderRadius: "16px",
                  boxShadow: "0 18px 45px rgba(15,23,42,0.14)",
                }}
              />
              <Bar dataKey="patients" fill="#10B981" radius={[12, 12, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <p className="text-sm font-medium">Peak patient load</p>
            <p className="text-2xl font-semibold">158 visits</p>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className={`${cardClass} p-5 xl:col-span-4`}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
            Recent Bills
          </h2>
          <div className="space-y-3">
            {recentBills.map((bill) => (
              <div
                key={bill.id}
                className="rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {bill.name}
                    </p>
                    <p className="text-sm text-slate-500">{bill.id}</p>
                  </div>
                  <p className="font-semibold text-blue-600">{bill.amount}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">{bill.time}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className={`${cardClass} p-5 xl:col-span-4`}>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Low Stock
            </h2>
          </div>
          <div className="space-y-3">
            {lowStockMedicines.map((medicine) => {
              const level = (medicine.stock / medicine.minStock) * 100;
              return (
                <div
                  key={medicine.name}
                  className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4 dark:border-orange-500/20 dark:bg-orange-500/10"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {medicine.name}
                    </span>
                    <span className="text-orange-600">{medicine.stock} left</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-orange-200/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500"
                      style={{ width: `${level}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className={`${cardClass} p-5 xl:col-span-4`}>
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
            Medicine Mix
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={medicineCategories}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
              >
                {medicineCategories.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className={`${cardClass} p-5 xl:col-span-7`}>
          <h2 className="mb-5 text-xl font-semibold text-slate-900 dark:text-white">
            Today's Activity
          </h2>
          <div className="space-y-4">
            {activity.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    {index < activity.length - 1 && (
                      <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.meta}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-500 p-5 text-white shadow-2xl shadow-blue-500/25 xl:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">AI Insights</h2>
                <p className="text-sm text-white/75">Smart recommendations</p>
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-cyan-100" />
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur">
              <p className="text-sm text-white/75">Recommendation</p>
              <p className="mt-1 font-semibold">
                Paracetamol sales increased 18%. Restock suggested in 3 days.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur">
              <p className="text-sm text-white/75">Prediction</p>
              <p className="mt-1 font-semibold">
                Cold and fever cases may rise this week based on recent visits.
              </p>
            </div>
          </div>
        </Card>
      </section>

      <div className="fixed bottom-6 right-6 z-20 flex flex-col gap-3">
        {[
          { label: "Add Patient", icon: Users },
          { label: "Generate Bill", icon: FileText },
          { label: "Add Medicine", icon: Pill },
          { label: "View Reports", icon: Zap },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              className="group h-12 justify-start rounded-2xl bg-slate-950 px-4 text-white shadow-xl shadow-slate-900/20 transition-all hover:-translate-y-1 hover:bg-blue-600"
            >
              <Icon className="h-4 w-4" />
              <span className="hidden text-sm sm:inline">{action.label}</span>
              <Plus className="h-4 w-4 opacity-60 transition-transform group-hover:rotate-90" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
