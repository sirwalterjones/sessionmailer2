import { Metadata } from 'next';
import AdminDashboard from '@/components/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard - SessionMailer',
  description: 'Manage users, view analytics, and oversee SessionMailer operations',
};

export default function AdminPage() {
  return <AdminDashboard />;
} 