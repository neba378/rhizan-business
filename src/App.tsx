import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { AppLayout } from '@/components/layout/app-layout';
import { LoginPage } from '@/features/auth/login-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { FinanceOverviewPage } from '@/features/finance/finance-overview-page';
import { TransactionsPage } from '@/features/finance/transactions-page';
import { InvoicesPage } from '@/features/finance/invoices-page';
import { BudgetsPage } from '@/features/finance/budgets-page';
import { ProspectsPage } from '@/features/clients/prospects-page';
import { PipelinePage } from '@/features/clients/pipeline-page';
import { MarketingOverviewPage } from '@/features/marketing/marketing-overview-page';
import { ContentCalendarPage } from '@/features/marketing/content-calendar-page';
import { TasksPage } from '@/features/tasks/tasks-page';
import { MeetingsPage } from '@/features/calendar/meetings-page';
import { ReportsPage } from '@/features/reports/reports-page';
import { SettingsPage } from '@/features/settings/settings-page';
import { useEffect } from 'react';
import { clearDatabase, ensureDefaultExpensePresets, ensureDefaultCategories } from '@/lib/db/database';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    const HAS_CLEARED = 'rhizan_fresh_db_auto_purged_v1';
    if (!localStorage.getItem(HAS_CLEARED)) {
      clearDatabase().then(() => {
        localStorage.setItem(HAS_CLEARED, 'true');
        ensureDefaultExpensePresets();
        ensureDefaultCategories();
      });
    } else {
      ensureDefaultExpensePresets();
      ensureDefaultCategories();
    }
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/finance" element={<FinanceOverviewPage />} />
                <Route path="/finance/transactions" element={<TransactionsPage />} />
                <Route path="/finance/invoices" element={<InvoicesPage />} />
                <Route path="/finance/budgets" element={<BudgetsPage />} />
                <Route path="/clients" element={<ProspectsPage />} />
                <Route path="/clients/pipeline" element={<PipelinePage />} />
                <Route path="/marketing" element={<MarketingOverviewPage />} />
                <Route path="/marketing/calendar" element={<ContentCalendarPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/meetings" element={<MeetingsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
