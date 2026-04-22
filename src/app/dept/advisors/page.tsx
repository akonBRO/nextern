import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
  Tag,
} from '@/components/dashboard/DashboardContent';
import AdvisorProvisionClient from '@/components/academic/AdvisorProvisionClient';
import { getDeptDashboardData } from '@/lib/role-dashboard';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

export default async function DeptAdvisorsPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'dept_head') {
    redirect('/login');
  }

  const data = await getDeptDashboardData({
    userId: session.user.id,
    email: session.user.email ?? undefined,
  });

  const institutionName = data.department.institutionName ?? 'your university';

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Advisor management"
          title="Create and manage advisors"
          subtitle={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag label={institutionName} tone="info" />
              {data.department.advisoryDepartment ? (
                <Tag label={data.department.advisoryDepartment} tone="neutral" />
              ) : null}
            </div>
          }
          description="Department heads provision advisor accounts for their own university. Each advisor receives credentials by email and must replace the one-time password on first login."
          actions={<div />}
          aside={
            <Panel
              title="University scope"
              description="Advisor accounts created from this page are automatically locked to your university."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ color: '#E2E8F0', fontSize: 14, lineHeight: 1.7 }}>
                  University: <strong>{institutionName}</strong>
                </div>
                <div style={{ color: '#9FB4D0', fontSize: 13, lineHeight: 1.7 }}>
                  Advisors cannot change this university later from profile settings.
                </div>
              </div>
            </Panel>
          }
        />

        <DashboardSection
          title="Advisor provisioning"
          description="Add advisor accounts without exposing public signup for academic roles."
        >
          <AdvisorProvisionClient institutionName={institutionName} />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
