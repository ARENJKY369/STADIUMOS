import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Settings() {
  const [notifications, setNotifications] = useState({ email: true, push: true, sms: false, emergency: true });
  const [language, setLanguage] = useState('en');

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1><p className="text-sm text-slate-500">System configuration • Preferences • Integrations</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card title="General" subtitle="Platform preferences">
            <div className="space-y-4">
              <div><label className="text-sm font-medium">Default Stadium</label><select className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"><option>MetLife Stadium</option><option>SoFi Stadium</option><option>AT&T Stadium</option></select></div>
              <div><label className="text-sm font-medium">Language</label><select value={language} onChange={e => setLanguage(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm"><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option><option value="ar">العربية</option><option value="ja">日本語</option></select><p className="text-xs text-slate-500 mt-1">Supports 50+ languages via GenAI translation</p></div>
              <div><label className="text-sm font-medium">Timezone</label><select className="w-full mt-1 px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-sm"><option>America/New_York (EST)</option><option>America/Los_Angeles (PST)</option><option>America/Chicago (CST)</option></select></div>
            </div>
          </Card>
          <Card title="Appearance" subtitle="Theme and display">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-sm">Dark Mode</span><button className="w-10 h-6 rounded-full bg-blue-600 relative"><span className="absolute w-4 h-4 bg-white rounded-full top-1 right-1"></span></button></div>
              <div className="flex items-center justify-between"><span className="text-sm">Compact View</span><button className="w-10 h-6 rounded-full bg-slate-300 dark:bg-slate-700 relative"><span className="absolute w-4 h-4 bg-white rounded-full top-1 left-1"></span></button></div>
              <div className="flex items-center justify-between"><span className="text-sm">Animations</span><button className="w-10 h-6 rounded-full bg-blue-600 relative"><span className="absolute w-4 h-4 bg-white rounded-full top-1 right-1"></span></button></div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card title="Notifications" subtitle="Manage alert preferences">
            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser and mobile push' },
                { key: 'sms', label: 'SMS Alerts', desc: 'Critical alerts via SMS' },
                { key: 'emergency', label: 'Emergency Broadcasts', desc: 'Always notify for emergencies (cannot disable for admin)' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div><p className="font-medium text-sm">{n.label}</p><p className="text-xs text-slate-500">{n.desc}</p></div>
                  <button onClick={() => n.key!=='emergency' && setNotifications(prev => ({ ...prev, [n.key]: !prev[n.key] }))} className={`w-10 h-6 rounded-full relative transition ${notifications[n.key] ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}><span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition ${notifications[n.key] ? 'right-1' : 'left-1'}`}></span></button>
                </div>
              ))}
            </div>
          </Card>

          <Card title="API Integrations" subtitle="External services status">
            <div className="space-y-3">
              {[
                { name: 'Claude AI (Anthropic)', status: 'connected', desc: 'GenAI chatbot & translation', key: 'CLAUDE_API_KEY' },
                { name: 'Google Maps', status: 'connected', desc: 'Navigation & geolocation', key: 'GOOGLE_MAPS_API_KEY' },
                { name: 'Twilio', status: 'connected', desc: 'SMS & voice notifications', key: 'TWILIO' },
                { name: 'ML Prediction Service', status: 'connected', desc: 'FastAPI crowd forecasting', key: 'ML_SERVICE' },
                { name: 'AWS S3 + CloudFront', status: 'warning', desc: 'Asset storage & CDN', key: 'AWS' },
              ].map(svc => (
                <div key={svc.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border">
                  <div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${svc.status==='connected' ? 'bg-green-500' : svc.status==='warning' ? 'bg-amber-500' : 'bg-red-500'}`}></div><div><p className="font-medium text-sm">{svc.name}</p><p className="text-xs text-slate-500">{svc.desc}</p></div></div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${svc.status==='connected' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>{svc.status}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Security & Privacy" subtitle="Data protection and compliance">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"><p className="text-sm font-medium text-blue-700 dark:text-blue-300">🔒 Security Status: Excellent</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">JWT auth • Rate limiting • Helmet headers • CORS • XSS protection • 0 vulnerabilities</p></div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" size="sm">Change Password</Button>
                <Button variant="secondary" size="sm">Enable 2FA</Button>
                <Button variant="secondary" size="sm">View Audit Logs</Button>
                <Button variant="secondary" size="sm">Download My Data</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
