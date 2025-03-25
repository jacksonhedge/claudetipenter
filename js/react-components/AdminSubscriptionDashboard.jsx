import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Activity, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';

// Get Recharts components from global scope
const {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} = Recharts;

const AdminSubscriptionDashboard = (props) => {
  const [stats, setStats] = useState(props.stats || null);
  const [monthlyData, setMonthlyData] = useState(props.monthlyData || []);
  const [loading, setLoading] = useState(!props.stats || !props.monthlyData || props.monthlyData.length === 0);
  const [selectedReport, setSelectedReport] = useState('overview');

  // Get data service from props or global context
  const dataService = props.dataService || (window.AdminContext ? window.AdminContext.dataService : null);

  // Fetch stats if not provided in props
  useEffect(() => {
    const fetchStats = async () => {
      if (props.stats && props.monthlyData && props.monthlyData.length > 0) {
        setStats(props.stats);
        setMonthlyData(props.monthlyData);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (dataService) {
          // Fetch subscription stats
          const fetchedStats = await dataService.getSubscriptionStats();
          setStats(fetchedStats);
          
          // Fetch monthly data
          const fetchedMonthlyData = await dataService.getMonthlyStats();
          setMonthlyData(fetchedMonthlyData);
        } else {
          console.error('No data service available');
        }
      } catch (error) {
        console.error('Error fetching subscription stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Set up auto-refresh (every 5 minutes)
    const intervalId = setInterval(fetchStats, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [props.stats, props.monthlyData, dataService]);

  // Calculate month-over-month growth
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  const usersGrowth = monthlyData.length >= 2 
    ? calculateGrowth(
        monthlyData[monthlyData.length - 1].users, 
        monthlyData[monthlyData.length - 2].users
      )
    : 0;
    
  const mrrGrowth = monthlyData.length >= 2 
    ? calculateGrowth(
        monthlyData[monthlyData.length - 1].mrr, 
        monthlyData[monthlyData.length - 2].mrr
      )
    : 0;
    
  const scansGrowth = monthlyData.length >= 2 
    ? calculateGrowth(
        monthlyData[monthlyData.length - 1].scans, 
        monthlyData[monthlyData.length - 2].scans
      )
    : 0;

  if (loading || !stats) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Loading subscription dashboard...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Subscription Analytics</h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedReport('overview')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              selectedReport === 'overview' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedReport('users')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              selectedReport === 'users' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setSelectedReport('revenue')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              selectedReport === 'revenue' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setSelectedReport('usage')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${
              selectedReport === 'usage' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Usage
          </button>
        </div>
        
        <button className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200">
          <Download className="w-4 h-4 mr-1" />
          Export Data
        </button>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-700 text-sm font-medium mb-1">Total Users</p>
              <h3 className="text-3xl font-bold text-blue-900">
                {stats.user_stats.total_users}
              </h3>
              
              <div className={`mt-2 text-sm flex items-center ${
                usersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {usersGrowth >= 0 
                  ? <ArrowUpRight className="w-4 h-4 mr-1" /> 
                  : <ArrowDownRight className="w-4 h-4 mr-1" />
                }
                {Math.abs(usersGrowth).toFixed(1)}% from last month
              </div>
            </div>
            
            <div className="bg-blue-200 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white bg-opacity-50 p-2 rounded">
              <div className="text-xs text-gray-500">Free</div>
              <div className="font-bold text-gray-800">{stats.user_stats.free_users}</div>
            </div>
            <div className="bg-white bg-opacity-50 p-2 rounded">
              <div className="text-xs text-gray-500">Premium</div>
              <div className="font-bold text-gray-800">{stats.user_stats.premium_users}</div>
            </div>
            <div className="bg-white bg-opacity-50 p-2 rounded">
              <div className="text-xs text-gray-500">Team</div>
              <div className="font-bold text-gray-800">{stats.user_stats.team_users}</div>
            </div>
          </div>
        </div>
        
        {/* Monthly Recurring Revenue */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-green-700 text-sm font-medium mb-1">Monthly Revenue</p>
              <h3 className="text-3xl font-bold text-green-900">
                ${stats.financial_stats.mrr}
              </h3>
              
              <div className={`mt-2 text-sm flex items-center ${
                mrrGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {mrrGrowth >= 0 
                  ? <ArrowUpRight className="w-4 h-4 mr-1" /> 
                  : <ArrowDownRight className="w-4 h-4 mr-1" />
                }
                {Math.abs(mrrGrowth).toFixed(1)}% from last month
              </div>
            </div>
            
            <div className="bg-green-200 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-green-700" />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="bg-white bg-opacity-50 p-2 rounded">
              <div className="text-xs text-gray-500">Paying Users</div>
              <div className="font-bold text-gray-800">{stats.user_stats.premium_users + stats.user_stats.team_users}</div>
            </div>
            <div className="bg-white bg-opacity-50 p-2 rounded">
              <div className="text-xs text-gray-500">Avg Revenue/User</div>
              <div className="font-bold text-gray-800">${stats.financial_stats.average_revenue_per_user}</div>
            </div>
          </div>
        </div>
        
        {/* Usage Stats */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-700 text-sm font-medium mb-1">Total Scans This Month</p>
              <h3 className="text-3xl font-bold text-purple-900">
                {stats.usage_stats.total_scans_this_month}
              </h3>
              
              <div className={`mt-2 text-sm flex items-center ${
                scansGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {scansGrowth >= 0 
                  ? <ArrowUpRight className="w-4 h-4 mr-1" /> 
                  : <ArrowDownRight className="w-4 h-4 mr-1" />
                }
                {Math.abs(scansGrowth).toFixed(1)}% from last month
              </div>
            </div>
            
            <div className="bg-purple-200 p-3 rounded-full">
              <Activity className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="bg-white bg-opacity-50 p-2 rounded">
              <div className="text-xs text-gray-500">Avg Scans/User</div>
              <div className="font-bold text-gray-800">{stats.usage_stats.average_scans_per_user}</div>
            </div>
            <div className="bg-white bg-opacity-50 p-2 rounded">
              <div className="text-xs text-gray-500">Utilization</div>
              <div className="font-bold text-gray-800">
                {Math.round((stats.usage_stats.total_scans_this_month / (stats.user_stats.free_users * 15 + (stats.user_stats.premium_users + stats.user_stats.team_users) * 100)) * 100)}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      {selectedReport === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Users by Plan */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Users by Plan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[{
                  name: 'Plans',
                  Free: stats.user_stats.free_users,
                  Premium: stats.user_stats.premium_users,
                  Team: stats.user_stats.team_users
                }]}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Free" fill="#93C5FD" />
                <Bar dataKey="Premium" fill="#8B5CF6" />
                <Bar dataKey="Team" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Monthly Trends */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="users" stroke="#3B82F6" name="Users" />
                <Line yAxisId="right" type="monotone" dataKey="mrr" stroke="#10B981" name="MRR ($)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {selectedReport === 'users' && (
        <div className="grid grid-cols-1 gap-6">
          {/* User Growth */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3B82F6" name="Total Users" strokeWidth={2} />
                <Line type="monotone" dataKey="free_users" stroke="#93C5FD" name="Free Users" />
                <Line type="monotone" dataKey="paying_users" stroke="#4F46E5" name="Paying Users" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* User Conversion Rate */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-2">User Conversion Rate</h3>
            <p className="text-gray-500 text-sm mb-4">Percentage of users on paid plans</p>
            
            <div className="flex items-center mb-3">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
                  style={{ 
                    width: `${Math.round(((stats.user_stats.premium_users + stats.user_stats.team_users) / stats.user_stats.total_users) * 100)}%` 
                  }}
                ></div>
              </div>
              <span className="ml-3 font-bold text-lg">
                {Math.round(((stats.user_stats.premium_users + stats.user_stats.team_users) / stats.user_stats.total_users) * 100)}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="text-sm text-gray-500 mb-1">Free to Premium</h4>
                <p className="text-2xl font-bold text-gray-800">5.2%</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <h4 className="text-sm text-gray-500 mb-1">Premium to Team</h4>
                <p className="text-2xl font-bold text-gray-800">8.7%</p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedReport === 'revenue' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Revenue Trends */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue Trends</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}`, 'Revenue']} />
                <Legend />
                <Line type="monotone" dataKey="mrr" stroke="#10B981" name="Monthly Revenue" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Revenue Breakdown */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Revenue Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { plan: 'Premium', value: stats.user_stats.premium_users * 9.99 },
                      { plan: 'Team', value: stats.user_stats.team_users * 19.99 }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="plan" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="value" fill="#10B981" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-col justify-center">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Premium Plan Revenue</h4>
                  <p className="text-2xl font-bold text-gray-800">${(stats.user_stats.premium_users * 9.99).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.user_stats.premium_users} users × $9.99</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Team Plan Revenue</h4>
                  <p className="text-2xl font-bold text-gray-800">${(stats.user_stats.team_users * 19.99).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.user_stats.team_users} users × $19.99</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {selectedReport === 'usage' && (
        <div className="grid grid-cols-1 gap-6">
          {/* API Cost Tracking */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">API Cost Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total API Cost */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="text-sm font-medium text-amber-700 mb-2">Total API Cost</h4>
                <p className="text-2xl font-bold text-amber-900">
                  ${stats.api_stats.total_api_cost}
                </p>
                <p className="text-xs text-amber-700 mt-1">This month</p>
              </div>
              
              {/* Average Cost Per Scan */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="text-sm font-medium text-amber-700 mb-2">Avg Cost Per Scan</h4>
                <p className="text-2xl font-bold text-amber-900">
                  ${stats.api_stats.average_cost_per_scan}
                </p>
                <p className="text-xs text-amber-700 mt-1">Per image processed</p>
              </div>
              
              {/* Total Processing Time */}
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h4 className="text-sm font-medium text-amber-700 mb-2">Total Processing Time</h4>
                <p className="text-2xl font-bold text-amber-900">
                  {Math.floor(parseFloat(stats.api_stats.total_processing_time) / 60)}h {Math.round(parseFloat(stats.api_stats.total_processing_time) % 60)}m
                </p>
                <p className="text-xs text-amber-700 mt-1">This month</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">API Usage Log</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Images Rendered</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time to Render</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Sample log entries */}
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-03-23</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">john.smith@example.com</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">42</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">3m 12s</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">$3.57</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-03-22</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">sarah.jones@example.com</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">78</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">6m 45s</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">$6.63</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-03-22</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">mike.wilson@example.com</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">35</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2m 58s</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">$2.98</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-03-21</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">lisa.brown@example.com</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">120</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">10m 22s</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">$10.20</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">2025-03-21</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">david.miller@example.com</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">67</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">5m 43s</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">$5.70</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Usage Trends */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Scan Usage Trends</h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="scans" stroke="#8B5CF6" name="Total Scans" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Usage by Plan */}
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Usage by Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free Users */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Free Users</h4>
                <p className="text-2xl font-bold text-blue-900">
                  {Math.round(stats.usage_stats.total_scans_this_month * 0.4)}
                </p>
                <p className="text-xs text-blue-700 mt-1">Estimated scans</p>
                
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-blue-700 mb-1">Average per user</h5>
                  <p className="text-lg font-bold text-blue-900">
                    {(Math.round(stats.usage_stats.total_scans_this_month * 0.4) / stats.user_stats.free_users).toFixed(1)}
                  </p>
                </div>
                
                <div className="mt-2">
                  <div className="text-xs text-blue-700 mb-1">Limit utilization</div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ 
                        width: `${Math.min(100, Math.round(((Math.round(stats.usage_stats.total_scans_this_month * 0.4) / stats.user_stats.free_users) / 15) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">
                    {Math.min(100, Math.round(((Math.round(stats.usage_stats.total_scans_this_month * 0.4) / stats.user_stats.free_users) / 15) * 100))}% of limit
                  </p>
                </div>
              </div>
              
              {/* Premium Users */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h4 className="text-sm font-medium text-purple-700 mb-2">Premium Users</h4>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(stats.usage_stats.total_scans_this_month * 0.5)}
                </p>
                <p className="text-xs text-purple-700 mt-1">Estimated scans</p>
                
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-purple-700 mb-1">Average per user</h5>
                  <p className="text-lg font-bold text-purple-900">
                    {(Math.round(stats.usage_stats.total_scans_this_month * 0.5) / stats.user_stats.premium_users).toFixed(1)}
                  </p>
                </div>
                
                <div className="mt-2">
                  <div className="text-xs text-purple-700 mb-1">Unlimited usage</div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-purple-500 mr-1" />
                    <p className="text-xs text-purple-700">
                      No scan limits
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Team Users */}
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h4 className="text-sm font-medium text-indigo-700 mb-2">Team Users</h4>
                <p className="text-2xl font-bold text-indigo-900">
                  {Math.round(stats.usage_stats.total_scans_this_month * 0.1)}
                </p>
                <p className="text-xs text-indigo-700 mt-1">Estimated scans</p>
                
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-indigo-700 mb-1">Average per user</h5>
                  <p className="text-lg font-bold text-indigo-900">
                    {(Math.round(stats.usage_stats.total_scans_this_month * 0.1) / stats.user_stats.team_users).toFixed(1)}
                  </p>
                </div>
                
                <div className="mt-2">
                  <div className="text-xs text-indigo-700 mb-1">Unlimited usage</div>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-indigo-500 mr-1" />
                    <p className="text-xs text-indigo-700">
                      No scan limits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionDashboard;
