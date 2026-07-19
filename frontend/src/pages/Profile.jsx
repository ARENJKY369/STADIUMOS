import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Profile() {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || user?.first_name || 'System',
    lastName: user?.lastName || user?.last_name || 'Admin',
    email: user?.email || 'admin@fifa2026.com',
    phone: '+1 (555) 123-4567',
    language: 'en',
    role: user?.role || 'admin',
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1><p className="text-sm text-slate-500">Personal information and activity</p></div><Button onClick={() => setEditMode(!editMode)} variant={editMode ? 'secondary' : 'primary'}>{editMode ? 'Cancel' : 'Edit Profile'}</Button></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="text-center h-fit">
          <div className="flex flex-col items-center">
            <img src={`https://ui-avatars.com/api/?name=${form.firstName}+${form.lastName}&background=2563eb&color=fff&size=128`} alt="avatar" className="w-24 h-24 rounded-full" />
            <h2 className="font-bold text-lg mt-4">{form.firstName} {form.lastName}</h2>
            <p className="text-sm text-slate-500 capitalize">{form.role}</p>
            <span className="mt-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-xs">Verified • Active</span>
            <div className="mt-6 w-full space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Member since</span><span>Jan 2024</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Last login</span><span>Today 09:41</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Events managed</span><span>23</span></div>
            </div>
            <Button variant="secondary" className="w-full mt-6">Change Avatar</Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Personal Information" subtitle="Update your details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-slate-700 dark:text-slate-300">First Name</label><input disabled={!editMode} value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 text-sm" /></div>
              <div><label className="text-xs font-medium">Last Name</label><input disabled={!editMode} value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm disabled:bg-slate-50" /></div>
              <div><label className="text-xs font-medium">Email</label><input disabled={!editMode} value={form.email} className="w-full mt-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm disabled:bg-slate-50" /></div>
              <div><label className="text-xs font-medium">Phone</label><input disabled={!editMode} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm disabled:bg-slate-50" /></div>
              <div><label className="text-xs font-medium">Role</label><input disabled value={form.role} className="w-full mt-1 px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-800/50 text-sm capitalize" /></div>
              <div><label className="text-xs font-medium">Language</label><select disabled={!editMode} value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm disabled:bg-slate-50"><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option></select></div>
            </div>
            {editMode && <div className="mt-6 flex gap-2"><Button>Save Changes</Button><Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button></div>}
          </Card>

          <Card title="Activity & Achievements" subtitle="Your contributions to sustainability and safety">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"><p className="text-2xl font-bold text-blue-600">23</p><p className="text-xs text-slate-600 dark:text-slate-400">Events Managed</p></div>
              <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"><p className="text-2xl font-bold text-green-600">1,240</p><p className="text-xs text-slate-600">Eco Points</p></div>
              <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"><p className="text-2xl font-bold text-purple-600">47</p><p className="text-xs text-slate-600">Incidents Resolved</p></div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium mb-3">Recent Activity</p>
              <div className="space-y-2">
                {[
                  { action: 'Resolved incident', detail: 'Medical assistance at Gate A', time: '2 hours ago', icon: '✅' },
                  { action: 'Earned eco points', detail: '+50 points for bus transport', time: '5 hours ago', icon: '🌱' },
                  { action: 'Updated zone', detail: 'Changed occupancy at East Lower', time: 'Yesterday', icon: '📊' },
                ].map((a,i) => <div key={i} className="flex gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"><span className="text-lg">{a.icon}</span><div className="flex-1"><p className="text-sm font-medium">{a.action}</p><p className="text-xs text-slate-500">{a.detail} • {a.time}</p></div></div>)}
              </div>
            </div>
          </Card>

          <Card title="Security" subtitle="Manage authentication">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl border"><div><p className="text-sm font-medium">Password</p><p className="text-xs text-slate-500">Last changed 30 days ago</p></div><Button size="sm" variant="secondary">Change</Button></div>
              <div className="flex items-center justify-between p-3 rounded-xl border"><div><p className="text-sm font-medium">Two-Factor Authentication</p><p className="text-xs text-slate-500">Add extra security</p></div><Button size="sm">Enable 2FA</Button></div>
              <div className="flex items-center justify-between p-3 rounded-xl border"><div><p className="text-sm font-medium">Active Sessions</p><p className="text-xs text-slate-500">2 devices logged in</p></div><Button size="sm" variant="ghost">Manage</Button></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
