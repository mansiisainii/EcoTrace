import React, { useEffect, useState } from 'react';
import { Globe, Flame, Zap, Truck } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getSummary, getRecommendations } from '../api';
import StatCard from '../components/StatCard';
import AIChat from '../components/AIChat';
import RecommendationCard from '../components/RecommendationCard';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] p-3 rounded-lg shadow-xl">
        <p className="text-[var(--text-primary)] font-medium mb-1">{label || payload[0]?.name}</p>
        <p className="text-green-500 font-bold">
          {payload[0]?.value?.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO2e
        </p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes, recsRes] = await Promise.all([
        getSummary(),
        getRecommendations()
      ]);
      setSummary(summaryRes.data.summary);
      setRecs(recsRes.data.recommendations || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fix chart data mapping
  const barData = (summary?.byCategory || []).map(item => ({
    name: item._id
      ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
      : 'Unknown',
    co2e: parseFloat((item.total || 0).toFixed(1))
  }));

  const pieData = (summary?.byCategory || []).map(item => ({
    name: item._id
      ? item._id.charAt(0).toUpperCase() + item._id.slice(1)
      : 'Unknown',
    total: parseFloat((item.total || 0).toFixed(1))
  }));

  const lineData = (summary?.monthlyTrend || []).map(item => ({
    month: item._id || '',
    co2e: parseFloat((item.total || 0).toFixed(1))
  }));

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Welcome back, {user?.companyName || user?.company || user?.name} 
          </h1>
          <p className="text-[var(--text-muted)] mt-1">Here's your emission summary</p>
        </div>

        {/* Stats Row */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card h-32 bg-[var(--border)] opacity-20"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total CO2e" value={summary?.totalCO2e || 0} unit="kg CO2e" icon={Globe} />
            <StatCard title="Scope 1 Total" value={summary?.scope1 || 0} unit="kg CO2e" icon={Flame} />
            <StatCard title="Scope 2 Total" value={summary?.scope2 || 0} unit="kg CO2e" icon={Zap} />
            <StatCard title="Scope 3 Total" value={summary?.scope3 || 0} unit="kg CO2e" icon={Truck} />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bar Chart */}
          <div className="card flex flex-col h-[340px]">
            <h3 className="font-bold text-[var(--text-primary)] mb-1">Emissions by Category</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">CO2e in kg per category</p>
            {loading ? (
              <div className="flex-1 bg-[var(--border)] opacity-20 rounded-xl animate-pulse"></div>
            ) : (
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border)', opacity: 0.2 }} />
                    <Bar dataKey="co2e" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="card flex flex-col h-[340px]">
            <h3 className="font-bold text-[var(--text-primary)] mb-1">Category Distribution</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">Percentage breakdown</p>
            {loading ? (
              <div className="flex-1 bg-[var(--border)] opacity-20 rounded-xl animate-pulse"></div>
            ) : (
              <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="name"
                      stroke="none"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      wrapperStyle={{ fontSize: '12px', color: 'var(--text-muted)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Line Chart */}
          <div className="card flex flex-col h-[340px]">
            <h3 className="font-bold text-[var(--text-primary)] mb-1">Monthly Trend</h3>
            <p className="text-[var(--text-muted)] text-sm mb-4">CO2e over time</p>
            {loading ? (
              <div className="flex-1 bg-[var(--border)] opacity-20 rounded-xl animate-pulse"></div>
            ) : (
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)' }} />
                    <Line
                      type="monotone"
                      dataKey="co2e"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-2 mb-6">
            <button
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 
                ${activeTab === 'chat'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                  : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                }`}
              onClick={() => setActiveTab('chat')}
            >
              AI Chat
            </button>
            <button
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 
                ${activeTab === 'recs'
                  ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                  : 'bg-[var(--card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                }`}
              onClick={() => setActiveTab('recs')}
            >
              Recommendations
            </button>
          </div>

          <div className="fade-in">
            {activeTab === 'chat' ? (
              <AIChat onNewLog={fetchData} />
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card h-48 bg-[var(--border)] opacity-20"></div>
                ))}
              </div>
            ) : recs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recs.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
              </div>
            ) : (
              <div className="card text-center py-12">
                <p className="text-[var(--text-muted)] text-lg">
                  Log some emissions first to get AI recommendations.
                </p>
                <button
                  onClick={() => setActiveTab('chat')}
                  className="btn-outline mt-4"
                >
                  Start Logging
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;