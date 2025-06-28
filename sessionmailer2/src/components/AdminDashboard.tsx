"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  Crown,
  Shield,
  Activity,
  FolderOpen,
  Share2,
  Eye,
  TrendingUp,
  Calendar,
  MoreVertical,
  RefreshCw,
  Key,
  Trash2,
  AlertCircle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  profile: any;
  project_count: number;
  is_premium: boolean;
  is_admin: boolean;
}

interface Analytics {
  overview: {
    totalUsers: number;
    premiumUsers: number;
    adminUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalShares: number;
    totalViews: number;
    newUsers30Days: number;
    newUsers7Days: number;
    newProjects30Days: number;
    newProjects7Days: number;
  };
  trends: {
    userRegistrationTrend: Array<{ date: string; count: number }>;
    projectCreationTrend: Array<{ date: string; count: number }>;
  };
  insights: {
    topDomains: Array<{ domain: string; count: number }>;
    activityDistribution: {
      no_projects: number;
      one_project: number;
      two_to_five: number;
      six_to_ten: number;
      more_than_ten: number;
    };
    premiumConversionRate: string;
    averageProjectsPerUser: string;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  // Mock data for demonstration - replace with real API calls
  const mockUsers: User[] = [
    {
      id: "1",
      email: "walterjonesjr@gmail.com",
      created_at: "2024-01-15T10:30:00Z",
      last_sign_in_at: "2024-01-20T14:22:00Z",
      email_confirmed_at: "2024-01-15T10:35:00Z",
      profile: { full_name: "Walter Jones Jr" },
      project_count: 12,
      is_premium: true,
      is_admin: true,
    },
    {
      id: "2",
      email: "user@example.com",
      created_at: "2024-01-18T09:15:00Z",
      last_sign_in_at: "2024-01-19T16:45:00Z",
      email_confirmed_at: "2024-01-18T09:20:00Z",
      profile: { full_name: "John Doe" },
      project_count: 3,
      is_premium: false,
      is_admin: false,
    },
    {
      id: "3",
      email: "premium.user@example.com",
      created_at: "2024-01-10T11:00:00Z",
      last_sign_in_at: "2024-01-20T08:30:00Z",
      email_confirmed_at: "2024-01-10T11:05:00Z",
      profile: { full_name: "Jane Smith" },
      project_count: 8,
      is_premium: true,
      is_admin: false,
    },
  ];

  const mockAnalytics: Analytics = {
    overview: {
      totalUsers: 156,
      premiumUsers: 23,
      adminUsers: 2,
      activeUsers: 89,
      totalProjects: 342,
      totalShares: 45,
      totalViews: 1247,
      newUsers30Days: 34,
      newUsers7Days: 8,
      newProjects30Days: 67,
      newProjects7Days: 15,
    },
    trends: {
      userRegistrationTrend: [
        { date: "2024-01-14", count: 2 },
        { date: "2024-01-15", count: 5 },
        { date: "2024-01-16", count: 3 },
        { date: "2024-01-17", count: 7 },
        { date: "2024-01-18", count: 4 },
        { date: "2024-01-19", count: 6 },
        { date: "2024-01-20", count: 8 },
      ],
      projectCreationTrend: [
        { date: "2024-01-14", count: 8 },
        { date: "2024-01-15", count: 12 },
        { date: "2024-01-16", count: 6 },
        { date: "2024-01-17", count: 15 },
        { date: "2024-01-18", count: 9 },
        { date: "2024-01-19", count: 11 },
        { date: "2024-01-20", count: 18 },
      ],
    },
    insights: {
      topDomains: [
        { domain: "book.usesession.com", count: 45 },
        { domain: "example.com", count: 32 },
        { domain: "github.com", count: 28 },
        { domain: "docs.google.com", count: 23 },
        { domain: "notion.so", count: 19 },
      ],
      activityDistribution: {
        no_projects: 67,
        one_project: 34,
        two_to_five: 28,
        six_to_ten: 18,
        more_than_ten: 9,
      },
      premiumConversionRate: "14.7",
      averageProjectsPerUser: "3.8",
    },
  };

  useEffect(() => {
    // Load mock data immediately
    setUsers(mockUsers);
    setAnalytics(mockAnalytics);
    setLoading(false);
  }, []);

  const handleUserAction = async (userId: string, action: string, additionalData: any = {}) => {
    setActionLoading(userId);
    setError("");
    setSuccess("");

    // Remove artificial delay for instant actions
    // await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Mock actions
      switch (action) {
        case 'reset_password':
          setSuccess('Password reset link sent to user');
          break;
        case 'toggle_premium':
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, is_premium: !u.is_premium } : u
          ));
          setSuccess(`Premium status ${additionalData.is_premium ? 'enabled' : 'disabled'}`);
          break;
        case 'toggle_admin':
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, is_admin: !u.is_admin } : u
          ));
          setSuccess(`Admin status ${additionalData.is_admin ? 'enabled' : 'disabled'}`);
          break;
        case 'delete_user':
          setUsers(prev => prev.filter(u => u.id !== userId));
          setSuccess('User deleted successfully');
          break;
        default:
          throw new Error('Invalid action');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = (user: User) => {
    handleUserAction(user.id, "reset_password", { email: user.email });
  };

  const handleTogglePremium = (user: User) => {
    handleUserAction(user.id, "toggle_premium", { is_premium: !user.is_premium });
  };

  const handleToggleAdmin = (user: User) => {
    handleUserAction(user.id, "toggle_admin", { is_admin: !user.is_admin });
  };

  const handleDeleteUser = (user: User) => {
    setDeleteDialog({ open: true, user });
  };

  const confirmDeleteUser = () => {
    if (deleteDialog.user) {
      handleUserAction(deleteDialog.user.id, "delete_user");
      setDeleteDialog({ open: false, user: null });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Admin Dashboard
          <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full font-normal">
            v2.0 - Latest
          </span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage users, view analytics, and oversee SessionMailer operations
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analytics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.overview.newUsers7Days} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                  <Crown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.premiumUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.insights.premiumConversionRate}% conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    +{analytics.overview.newProjects7Days} this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.overview.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.insights.averageProjectsPerUser} avg projects/user
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest user registrations and project creations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New users this month</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.overview.newUsers30Days} registrations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">New projects this month</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.overview.newProjects30Days} projects created
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Total template views</p>
                      <p className="text-xs text-muted-foreground">
                        {analytics?.overview.totalViews} views on shared templates
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Platform health and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Status</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Admin Users</span>
                    <Badge variant="outline">{analytics?.overview.adminUsers}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Shared Templates</span>
                    <Badge variant="outline">{analytics?.overview.totalShares}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">User Management</h2>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.profile?.full_name || "No name"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.is_admin && (
                            <Badge variant="destructive" className="text-xs">
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                          {user.is_premium && (
                            <Badge variant="secondary" className="text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                          {!user.email_confirmed_at && (
                            <Badge variant="outline" className="text-xs">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.project_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(user.created_at)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : "Never"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" disabled={actionLoading === user.id}>
                              {actionLoading === user.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreVertical className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTogglePremium(user)}>
                              <Crown className="h-4 w-4 mr-2" />
                              {user.is_premium ? "Remove Premium" : "Make Premium"}
                            </DropdownMenuItem>
                            {user.email !== "walterjonesjr@gmail.com" && (
                              <DropdownMenuItem onClick={() => handleToggleAdmin(user)}>
                                <Shield className="h-4 w-4 mr-2" />
                                {user.is_admin ? "Remove Admin" : "Make Admin"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user)}
                              className="text-red-600"
                              disabled={user.email === "walterjonesjr@gmail.com"}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-bold">Analytics & Trends</h2>
          
          {analytics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    User Registration Trend
                  </CardTitle>
                  <CardDescription>New user signups over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    Total new users this month: {analytics.overview.newUsers30Days}
                  </div>
                  <div className="space-y-1">
                    {analytics.trends.userRegistrationTrend.map((day) => (
                      <div key={day.date} className="flex items-center gap-2 text-xs">
                        <span className="w-16">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${Math.max(day.count * 10, 2)}%` }}
                          ></div>
                        </div>
                        <span className="w-6">{day.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Project Creation Trend
                  </CardTitle>
                  <CardDescription>New projects created over the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">
                    Total new projects this month: {analytics.overview.newProjects30Days}
                  </div>
                  <div className="space-y-1">
                    {analytics.trends.projectCreationTrend.map((day) => (
                      <div key={day.date} className="flex items-center gap-2 text-xs">
                        <span className="w-16">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.max(day.count * 5, 2)}%` }}
                          ></div>
                        </div>
                        <span className="w-6">{day.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <h2 className="text-2xl font-bold">Business Insights</h2>
          
          {analytics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    User Activity Distribution
                  </CardTitle>
                  <CardDescription>How active are your users?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">No projects</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-400 h-2 rounded-full" 
                            style={{ width: `${(analytics.insights.activityDistribution.no_projects / analytics.overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm w-8">{analytics.insights.activityDistribution.no_projects}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">1 project</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full" 
                            style={{ width: `${(analytics.insights.activityDistribution.one_project / analytics.overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm w-8">{analytics.insights.activityDistribution.one_project}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">2-5 projects</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{ width: `${(analytics.insights.activityDistribution.two_to_five / analytics.overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm w-8">{analytics.insights.activityDistribution.two_to_five}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">6-10 projects</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full" 
                            style={{ width: `${(analytics.insights.activityDistribution.six_to_ten / analytics.overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm w-8">{analytics.insights.activityDistribution.six_to_ten}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">10+ projects</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-400 h-2 rounded-full" 
                            style={{ width: `${(analytics.insights.activityDistribution.more_than_ten / analytics.overview.totalUsers) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm w-8">{analytics.insights.activityDistribution.more_than_ten}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Domains</CardTitle>
                  <CardDescription>Most popular websites being processed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analytics.insights.topDomains.map((domain, index) => (
                      <div key={domain.domain} className="flex justify-between items-center">
                        <span className="text-sm truncate">{domain.domain}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full" 
                              style={{ width: `${(domain.count / analytics.insights.topDomains[0]?.count || 1) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm w-6">{domain.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialog.user?.email}? This action cannot be undone.
              All their projects and data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 