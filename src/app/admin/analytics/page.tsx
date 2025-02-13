'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts';

interface AnalyticsData {
  // User Stats
  total: number;
  admins: number;
  regularUsers: number;
  growth: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  dailyNewUsers: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
  }>;
  activityStats: {
    totalSellers: number;
    totalBuyers: number;
    activeSellers: number;
    activeBuyers: number;
  };
  topSellers: Array<{
    _id: string;
    name: string;
    email: string;
    listingCount: number;
  }>;

  // Payment Stats
  totalSales: number;
  totalRevenue: number;
  totalPlatformFees: number;
  totalSellerRevenue: number;
  paymentsPending: number;
  paymentsHeld: number;
  paymentsCompleted: number;
  paymentsRefunded: number;
  paymentsFailed: number;
  avgTransactionValue: number;
  monthlyRevenue: Array<{
    _id: { year: number; month: number };
    revenue: number;
    platformFees: number;
    sellerRevenue: number;
    transactions: number;
    avgValue: number;
  }>;
  dailyRevenue: Array<{
    _id: { year: number; month: number; day: number };
    revenue: number;
    transactions: number;
  }>;
  paymentCategoryStats: Array<{
    _id: string;
    revenue: number;
    transactions: number;
    avgValue: number;
  }>;

  // Listing Stats
  active: number;
  sold: number;
  pending: number;
  listingCategoryStats: Array<{
    _id: string;
    count: number;
    active: number;
    sold: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    totalValue: number;
  }>;
  conditionStats: Array<{
    _id: string;
    count: number;
    avgPrice: number;
  }>;
  priceRangeStats: Array<{
    range: string;
    count: number;
  }>;
  dailyNewListings: Array<{
    _id: { year: number; month: number; day: number };
    count: number;
    totalValue: number;
  }>;
  timeToSellStats: {
    avgTimeToSell: number;
    minTimeToSell: number;
    maxTimeToSell: number;
  };
  popularTags: Array<{
    _id: string;
    count: number;
  }>;
  priceStats: {
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    totalValue: number;
  };
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#45B7D1'
];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [paymentsRes, listingsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats/payments'),
          fetch('/api/admin/stats/listings'),
          fetch('/api/admin/stats/users')
        ]);

        const [paymentsData, listingsData, usersData] = await Promise.all([
          paymentsRes.json(),
          listingsRes.json(),
          usersRes.json()
        ]);

        setData({
          ...paymentsData,
          ...listingsData,
          ...usersData
        });
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-40 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  // Format revenue data
  const revenueData = data.monthlyRevenue.map((item) => ({
    name: months[item._id.month - 1],
    revenue: item.revenue,
    platformFees: item.platformFees,
    sellerRevenue: item.sellerRevenue,
    transactions: item.transactions
  }));

  // Format daily revenue data
  const dailyRevenueData = data.dailyRevenue.map((item) => ({
    name: `${item._id.month}/${item._id.day}`,
    revenue: item.revenue,
    transactions: item.transactions
  }));

  // Format category data for listings
  const categoryData = (data.listingCategoryStats || []).map((item) => ({
    name: item._id,
    value: item.count,
    totalValue: item.totalValue,
    avgPrice: item.avgPrice
  }));

  // Format category data for payments
  const paymentCategoryData = (data.paymentCategoryStats || []).map((item) => ({
    name: item._id,
    revenue: item.revenue,
    transactions: item.transactions,
    avgValue: item.avgValue
  }));

  // Format user growth data
  const userGrowthData = data.dailyNewUsers.map((item) => ({
    name: `${item._id.month}/${item._id.day}`,
    users: item.count
  }));

  // Format price range data
  const priceRangeData = data.priceRangeStats.map((item) => ({
    name: item.range,
    count: item.count
  }));

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
            <p className="text-3xl font-bold">₦{data.totalRevenue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Platform Fees: ₦{data.totalPlatformFees.toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <p className="text-sm text-muted-foreground mb-2">Total Users</p>
            <p className="text-3xl font-bold">{data.total?.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.growth?.lastMonth} new this month
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <p className="text-sm text-muted-foreground mb-2">Active Listings</p>
            <p className="text-3xl font-bold">{data.active?.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.sold} sold items
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <p className="text-sm text-muted-foreground mb-2">Avg Transaction</p>
            <p className="text-3xl font-bold">₦{Math.round(data.avgTransactionValue).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {data.totalSales} total sales
            </p>
          </div>
        </div>
      </section>

      {/* Revenue Charts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Revenue Analytics</h2>
        <div className="space-y-6">
          {/* Monthly Revenue Trend */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">Monthly Revenue Trend</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                  <Legend />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    fill="#8884d8"
                    stroke="#8884d8"
                    fillOpacity={0.3}
                    name="Total Revenue"
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="platformFees"
                    stroke="#82ca9d"
                    name="Platform Fees"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="transactions"
                    fill="#ffc658"
                    name="Transactions"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Revenue */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">Daily Revenue (Last 30 Days)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill="#8884d8"
                    stroke="#8884d8"
                    fillOpacity={0.3}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Category Analysis */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Category Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">Category Distribution</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString()} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Revenue */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">Category Revenue</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue">
                    {paymentCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* User Analytics */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">User Analytics</h2>
        <div className="space-y-6">
          {/* User Growth */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">User Growth (Last 30 Days)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="users"
                    fill="#8884d8"
                    stroke="#8884d8"
                    fillOpacity={0.3}
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card rounded-lg border p-6">
              <h4 className="text-sm text-muted-foreground mb-2">Total Sellers</h4>
              <p className="text-3xl font-bold">{data.activityStats.totalSellers}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {data.activityStats.activeSellers} active this month
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <h4 className="text-sm text-muted-foreground mb-2">Total Buyers</h4>
              <p className="text-3xl font-bold">{data.activityStats.totalBuyers}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {data.activityStats.activeBuyers} active this month
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <h4 className="text-sm text-muted-foreground mb-2">Avg Time to Sell</h4>
              <p className="text-3xl font-bold">{Math.round(data.timeToSellStats.avgTimeToSell)} days</p>
              <p className="text-sm text-muted-foreground mt-2">
                Range: {Math.round(data.timeToSellStats.minTimeToSell)} - {Math.round(data.timeToSellStats.maxTimeToSell)} days
              </p>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <h4 className="text-sm text-muted-foreground mb-2">Popular Tags</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.popularTags.slice(0, 5).map((tag) => (
                  <span
                    key={tag._id}
                    className="px-2 py-1 bg-secondary rounded-full text-xs"
                  >
                    {tag._id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Price Analysis */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Price Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Price Range Distribution */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">Price Range Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceRangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Listings">
                    {priceRangeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Condition Distribution */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">Condition Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.conditionStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="_id"
                  >
                    {data.conditionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Top Sellers */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Top Sellers</h2>
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 font-medium">
            <div>Name</div>
            <div>Email</div>
            <div>Listings</div>
          </div>
          <div className="divide-y">
            {data.topSellers.map((seller) => (
              <div key={seller._id} className="grid grid-cols-3 gap-4 p-4">
                <div>{seller.name}</div>
                <div className="text-muted-foreground">{seller.email}</div>
                <div>{seller.listingCount} listings</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Status */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Payment Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="font-medium">{data.paymentsPending}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Held</p>
              <p className="font-medium">{data.paymentsHeld}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="font-medium">{data.paymentsCompleted}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Refunded</p>
              <p className="font-medium">{data.paymentsRefunded}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="font-medium">{data.paymentsFailed}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnalyticsPage; 