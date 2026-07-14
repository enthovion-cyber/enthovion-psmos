import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '../../../..');
const repoRoot = resolve(webRoot, '../..');

const detailPage = read('apps/web/src/features/incidents/components/detail/IncidentDetailPage.tsx');
const service = read('apps/api/src/incidents/incident.service.ts');
const quickLinks = read('apps/web/src/features/incidents/components/overview/QuickLinksNavigationPanel.tsx');
const blockers = read('apps/web/src/features/incidents/components/overview/OpenBlockersNextStepsPanel.tsx');
const teamTab = read('apps/web/src/features/incidents/components/detail/InvestigationTeamTab.tsx');
const teamDrawer = read('apps/web/src/features/incidents/components/investigation-team/AddEditTeamMemberDrawer.tsx');
const permissionGuard = read('apps/api/src/common/guards/permissions.guard.ts');
const usersService = read('apps/api/src/users/users.service.ts');
const profilePage = read('apps/web/src/features/iam/components/ProfilePage.tsx');

const tabKeys = [
  'overview',
  'event-details',
  'potential-severity',
  'people',
  'asset-chemical',
  'timeline',
  'evidence',
  'immediate-actions',
  'investigation-team',
  'rca',
  'barrier-failure',
  'capa',
  'linked-records',
  'notifications',
  'review',
  'lessons-learned',
  'history',
  'final-report'
];

describe('Incident final integration shell', () => {
  it('keeps every PDF-required incident detail tab wired in the frontend and backend', () => {
    for (const tabKey of tabKeys) {
      expect(detailPage, `${tabKey} frontend branch`).toContain(`activeTab?.key === '${tabKey}'`);
      expect(service, `${tabKey} backend tab status`).toContain(`['${tabKey}'`);
    }
  });

  it('switches incident tabs without hard page navigation', () => {
    expect(detailPage).toContain("window.addEventListener('incident:select-tab'");
    expect(detailPage).toContain('window.history[historyMethod]');
    expect(detailPage).not.toContain('href={tab.href}');
    expect(detailPage).not.toContain('window.location.href = `/incidents/${id}?tab=');
    expect(quickLinks).toContain("new CustomEvent('incident:select-tab'");
    expect(blockers).toContain("new CustomEvent('incident:select-tab'");
  });

  it('does not expose stale unbuilt-tab statuses for completed incident tabs', () => {
    expect(service).not.toContain('Not Built Yet');
    expect(detailPage).not.toContain('intentionally not built');
  });

  it('keeps investigation team member selection connected to real IAM/RBAC user search', () => {
    expect(teamTab).toContain('mutations.searchUsers.mutateAsync({ search })');
    expect(teamDrawer).toContain('External / manual participant');
    expect(teamDrawer).toContain('searchUsersRef.current(searchText)');
    expect(teamDrawer).toContain("set('userId'");
    expect(teamDrawer).not.toContain('Profile status');
    expect(teamDrawer).not.toContain('Auto-detected profile reason');
    expect(teamDrawer).not.toContain('Site access / site');
    expect(service).toContain("this.db.from('User').select");
    expect(service).toContain('teamProfileFromUser');
    expect(service).toContain('createTeamAssignmentInvitation');
    expect(service).toContain('Pending Invitation');
    expect(permissionGuard).toContain("'incidents.team.edit': ['incidents.team.member.add'");
    expect(usersService).toContain('incident_team_notifications');
    expect(usersService).toContain('acceptIncidentProfileInvitation');
    expect(usersService).toContain('declineIncidentProfileInvitation');
    expect(profilePage).toContain('invitation.recordUrl');
  });
});

function read(path: string) {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}
