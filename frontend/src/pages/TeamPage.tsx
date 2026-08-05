import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { teamsApi } from '../services/api';
import Modal from '../components/Modal';
import { PageSkeleton } from '../components';
import type { Team, TeamMember } from '../types';

interface MemberDisplay {
  id: string;
  name: string;
  email: string;
  role: string;
  roleType: 'owner' | 'admin' | 'manager' | 'analyst' | 'viewer';
  status: string;
  joinedAt: string;
}

export default function TeamPage() {
  const user = useAppStore((s) => s.user);
  const addToast = useAppStore((s) => s.addToast);
  const credits = user?.credits ?? 0;

  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<MemberDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const teamsData = await teamsApi.list();
      const teamsList = Array.isArray(teamsData) ? teamsData : (teamsData as { results?: Team[] })?.results || [];
      if (teamsList.length > 0) {
        const firstTeam = teamsList[0];
        setTeam(firstTeam);
        const membersData = await teamsApi.members(String(firstTeam.id));
        const membersList = Array.isArray(membersData) ? membersData : [];
        setMembers(membersList.map((m: TeamMember) => ({
          id: String(m.id),
          name: m.name || m.email || 'Unknown',
          email: m.email || '',
          role: m.role?.charAt(0).toUpperCase() + m.role?.slice(1) || 'Viewer',
          roleType: m.role || 'viewer',
          status: m.status || 'active',
          joinedAt: m.joined_at || '',
        })));
      } else {
        setTeam(null);
        setMembers([]);
      }
    } catch (err) {
      setTeam(null);
      setMembers([]);
      setLoadError(err instanceof Error ? err.message : 'Failed to load team');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !team) return;
    setInviting(true);
    try {
      await teamsApi.invite(String(team.id), { email: inviteEmail, role: inviteRole });
      addToast('success', `Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('viewer');
      setShowAddMember(false);
      loadData();
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!team) return;
    try {
      await teamsApi.removeMember(String(team.id), memberId);
      addToast('success', 'Member removed');
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  if (loading) return <PageSkeleton />;

  const activeCount = members.filter((m) => m.status === 'active').length;

  return (
    <>
      <div className="header">
        <h1 className="page-title"><i className="fas fa-users"></i> Team Management</h1>
        <div className="user-menu">
          <div className="credit-balance">Credits: <span>{credits.toLocaleString()}</span></div>
          <div className="user-profile"><i className="fas fa-user-circle" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}></i></div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-number">{members.length}</div><div className="stat-label">Team Members</div></div>
        <div className="stat-card"><div className="stat-number">{activeCount}</div><div className="stat-label">Active</div></div>
        <div className="stat-card"><div className="stat-number">{members.length - activeCount}</div><div className="stat-label">Invited</div></div>
        <div className="stat-card"><div className="stat-number">{team?.name ? '1' : '0'}</div><div className="stat-label">Teams</div></div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{team?.name || 'Team Members'}</h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setShowRoleManagement(true)}><i className="fas fa-user-shield"></i> Manage Roles</button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)} disabled={!team || !!loadError}><i className="fas fa-plus"></i> Add Member</button>
          </div>
        </div>
        <div className="team-grid">
          {loadError ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block', color: 'var(--danger)' }}></i>
              <p style={{ marginBottom: '1rem' }}>{loadError}</p>
              <button className="btn btn-outline btn-sm" onClick={loadData}>Retry</button>
            </div>
          ) : members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <i className="fas fa-users" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
              <p>{team ? 'No team members found.' : 'No team found.'}</p>
            </div>
          ) : members.map((member) => (
            <div key={member.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontSize: '1.5rem' }}>
                    <i className="fas fa-user"></i>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>{member.name}</h4>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{member.role}</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{member.email}</p>
                  </div>
                </div>
                <span className={`badge badge-${member.roleType === 'owner' ? 'critical' : member.roleType === 'admin' ? 'high' : member.roleType === 'manager' ? 'medium' : 'low'}`}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {member.roleType}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {member.roleType !== 'owner' && (
                  <>
                    <button className="btn btn-outline btn-sm">Edit</button>
                    <button className="btn btn-sm" style={{ background: 'var(--danger)', color: 'var(--bg-primary)' }} onClick={() => handleRemoveMember(member.id)}>Remove</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      <Modal isOpen={showAddMember} onClose={() => setShowAddMember(false)} title="Add Team Member" maxWidth="600px">
        <form onSubmit={handleInvite}>
          <div className="form-group"><label>Email Address</label>
            <input type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required disabled={inviting} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} disabled={inviting}>
              <option value="viewer">Viewer</option>
              <option value="analyst">Analyst</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={inviting}>{inviting ? 'Sending...' : 'Send Invitation'}</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowAddMember(false)} style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Role Management Modal */}
      <Modal isOpen={showRoleManagement} onClose={() => setShowRoleManagement(false)} title="Role Management" maxWidth="700px">
        {[
          { role: 'Owner', color: 'var(--danger)', perms: ['Full system access', 'Manage team members', 'Billing access', 'API management', 'All monitoring features'] },
          { role: 'Admin', color: 'var(--warning)', perms: ['View dashboard', 'Run searches', 'Manage monitors', 'View reports', 'Manage alerts'] },
          { role: 'Analyst', color: 'var(--info)', perms: ['View dashboard', 'Run searches', 'View monitors', 'View reports', 'View alerts'] },
          { role: 'Viewer', color: 'var(--success)', perms: ['View dashboard', 'View reports only'] },
        ].map((r) => (
          <div key={r.role} style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: r.color, marginBottom: '0.5rem' }}>{r.role}</h4>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {r.perms.map((p) => <li key={p} style={{ padding: '0.25rem 0', color: 'var(--text-secondary)' }}>✓ {p}</li>)}
            </ul>
          </div>
        ))}
      </Modal>
    </>
  );
}
