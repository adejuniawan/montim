import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowLeft, BarChart3, Briefcase, ExternalLink,
  Eye, FileText, Layers, ListTodo, Loader2, Pencil, Plus,
  Save, Search, Sheet, Trash2, User, X
} from 'lucide-react';

// HARDCODE LINK DI SINI
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1kd3yNWR_vjxIAhxlF1eWxVHvn2fuOroEvWvDGpoZYLY/edit';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0GXwaDtENIML_Cjd8msndf4b_82fDep9Bbn069MfHcyYHVz-N7JKQwj-QsZMGYc_L/exec';

async function parseResponse(response) {
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); }
  catch { throw new Error(`Respons Apps Script bukan JSON: ${text.slice(0, 200)}`); }
  if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result.data;
}

async function apiGet(action = 'bootstrap') {
  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  url.searchParams.set('action', action);
  return parseResponse(await fetch(url, { cache: 'no-store' }));
}

async function apiPost(action, payload) {
  return parseResponse(await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, payload }),
  }));
}

const emptyJob = projectId => ({
  projectId: projectId || '', title: '', year: new Date().getFullYear(),
  status: 'To Do', urgency: 'Medium', assignees: [], timeline: '',
  komitmen: '', description: '', link: '',
});

function FieldInput({ column, value, onChange, members }) {
  const options = String(column.options || '').split('|').filter(Boolean);
  const common = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';

  if (column.type === 'textarea') return <textarea className={`${common} min-h-28`} value={value || ''} onChange={e => onChange(e.target.value)} />;
  if (column.type === 'select') return (
    <select className={common} value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">Pilih...</option>{options.map(option => <option key={option}>{option}</option>)}
    </select>
  );
  if (column.type === 'members') return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {members.map(member => {
        const selected = (value || []).includes(member.id);
        return <button key={member.id} type="button" onClick={() => onChange(selected ? value.filter(id => id !== member.id) : [...(value || []), member.id])}
          className={`flex items-center gap-2 rounded-xl border p-2 text-left ${selected ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
          <img src={member.avatar} className="h-7 w-7 rounded-full" alt="" />
          <span className="truncate text-sm font-medium">{member.name}</span>
        </button>;
      })}
    </div>
  );
  return <input className={common} type={column.type === 'number' ? 'number' : column.type === 'url' ? 'url' : 'text'} value={value ?? ''}
    onChange={e => onChange(column.type === 'number' ? Number(e.target.value) : e.target.value)} />;
}

function CellValue({ column, value, members }) {
  if (column.type === 'members') {
    const selected = members.filter(m => (value || []).includes(m.id));
    return <div className="flex -space-x-2">{selected.map(m => <img key={m.id} src={m.avatar} title={m.name} className="h-8 w-8 rounded-full border-2 border-white" alt={m.name} />)}</div>;
  }
  if (column.type === 'url' && value) return <a className="text-indigo-600 hover:underline" href={value} target="_blank" rel="noreferrer">Buka <ExternalLink className="inline h-3 w-3" /></a>;
  if (column.key === 'status') return <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{value || '-'}</span>;
  if (column.key === 'urgency') return <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">{value || '-'}</span>;
  return <span>{String(value ?? '-')}</span>;
}

export default function App() {
  const [data, setData] = useState({ settings: {}, columns: [], projects: [], jobs: [], teamMembers: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('jobs');
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(null);
  const [modal, setModal] = useState(false);

  const reload = async () => {
    try { setLoading(true); setError(''); setData(await apiGet()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const visibleColumns = useMemo(() => data.columns.filter(c => String(c.visible).toLowerCase() === 'true'), [data.columns]);
  const editableColumns = useMemo(() => data.columns.filter(c => String(c.editable).toLowerCase() === 'true'), [data.columns]);
  const filteredJobs = useMemo(() => data.jobs.filter(job => Object.values(job).join(' ').toLowerCase().includes(search.toLowerCase())), [data.jobs, search]);

  const saveJob = async () => {
    try {
      setSaving(true); setError('');
      const saved = await apiPost(form.id ? 'updateJob' : 'createJob', form);
      setData(prev => ({ ...prev, jobs: form.id ? prev.jobs.map(j => j.id === saved.id ? saved : j) : [saved, ...prev.jobs] }));
      setSelectedJob(saved); setForm(null); setModal(false);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const deleteJob = async job => {
    if (!confirm(`Hapus job “${job.title}”?`)) return;
    try {
      await apiPost('deleteJob', { id: job.id });
      setData(prev => ({ ...prev, jobs: prev.jobs.filter(j => j.id !== job.id) }));
      setSelectedJob(null); setTab('jobs');
    } catch (e) { setError(e.message); }
  };

  const settings = data.settings || {};

  return <div className="min-h-screen bg-slate-50 p-4 text-slate-800 md:p-8">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-extrabold"><span className="rounded-xl bg-indigo-600 p-2 text-white"><Briefcase /></span>{settings.appTitle || 'Dashboard Kerja'}</h1>
          <p className="mt-1 text-sm text-slate-500">{settings.appSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={GOOGLE_SHEET_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-slate-50"><Sheet className="h-4 w-4" /> Google Sheet</a>
          <button onClick={() => { setTab('jobs'); setSelectedJob(null); }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'jobs' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}><ListTodo className="mr-2 inline h-4 w-4" />{settings.jobsTabLabel || 'List Job'}</button>
          <button onClick={() => setTab('team')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === 'team' ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}><BarChart3 className="mr-2 inline h-4 w-4" />{settings.teamTabLabel || 'Workload'}</button>
        </div>
      </header>

      {loading && <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700"><Loader2 className="h-4 w-4 animate-spin" /> Memuat data Google Sheet...</div>}
      {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}

      {tab === 'jobs' && !selectedJob && <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari seluruh data..." className="w-full rounded-xl border py-2.5 pl-10 pr-3 outline-none focus:border-indigo-500" /></div>
          <button onClick={() => { setForm(emptyJob(data.projects[0]?.id)); setModal(true); }} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white"><Plus className="mr-2 inline h-4 w-4" />{settings.addButtonLabel || 'Tambah Baru'}</button>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>
            <th className="p-4">Proyek</th>{visibleColumns.map(c => <th key={c.key} className={`p-4 ${c.width || ''}`}>{c.label}</th>)}<th className="p-4 text-center">Aksi</th>
          </tr></thead><tbody className="divide-y">
            {filteredJobs.map(job => <tr key={job.id} className="hover:bg-slate-50">
              <td className="p-4 font-semibold"><Layers className="mr-2 inline h-4 w-4 text-indigo-500" />{data.projects.find(p => p.id === job.projectId)?.title || '-'}</td>
              {visibleColumns.map(c => <td key={c.key} className="p-4"><CellValue column={c} value={job[c.key]} members={data.teamMembers} /></td>)}
              <td className="p-4 text-center"><button onClick={() => setSelectedJob(job)} className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50"><Eye className="h-4 w-4" /></button></td>
            </tr>)}
          </tbody></table>
        </div>
      </section>}

      {tab === 'jobs' && selectedJob && <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between"><button onClick={() => setSelectedJob(null)} className="flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" />Kembali</button><div className="flex gap-2"><button onClick={() => { setForm(selectedJob); setModal(true); }} className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700"><Pencil className="mr-2 inline h-4 w-4" />Edit</button><button onClick={() => deleteJob(selectedJob)} className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"><Trash2 className="mr-2 inline h-4 w-4" />Hapus</button></div></div>
        <h2 className="mb-6 text-3xl font-bold">{selectedJob.title}</h2>
        <div className="grid gap-4 md:grid-cols-2">{data.columns.map(c => <div key={c.key} className={c.type === 'textarea' ? 'md:col-span-2' : ''}><p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">{c.label}</p><div className="rounded-xl bg-slate-50 p-4"><CellValue column={c} value={selectedJob[c.key]} members={data.teamMembers} /></div></div>)}</div>
      </section>}

      {tab === 'team' && <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="mb-5 text-lg font-bold">Monitoring Workload</h2><div className="space-y-4">{data.teamMembers.map(member => {
        const active = data.jobs.filter(j => (j.assignees || []).includes(member.id) && j.status !== 'Done').length;
        const max = Number(member.maxJobs || 5); const percentage = Math.min(active / max * 100, 100);
        return <div key={member.id} className="flex items-center gap-4 rounded-xl border p-4"><img src={member.avatar} className="h-11 w-11 rounded-full" alt="" /><div className="min-w-0 flex-1"><div className="mb-2 flex justify-between"><span className="font-semibold">{member.name}</span><span className="text-sm text-slate-500">{active}/{max} job aktif</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${percentage}%` }} /></div></div></div>;
      })}</div></section>}
    </div>

    {modal && form && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b bg-white p-5"><h2 className="text-xl font-bold">{form.id ? 'Edit Job' : 'Tambah Job'}</h2><button onClick={() => setModal(false)}><X /></button></div><div className="grid gap-5 p-6 md:grid-cols-2">
      <div><label className="mb-1 block text-sm font-bold">Proyek Induk</label><select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full rounded-xl border px-3 py-2.5">{data.projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
      {editableColumns.map(column => <div key={column.key} className={column.type === 'textarea' || column.type === 'members' ? 'md:col-span-2' : ''}><label className="mb-1 block text-sm font-bold">{column.label}{String(column.required).toLowerCase() === 'true' && ' *'}</label><FieldInput column={column} value={form[column.key]} members={data.teamMembers} onChange={value => setForm({ ...form, [column.key]: value })} /></div>)}
    </div><div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-5"><button onClick={() => setModal(false)} className="rounded-xl px-4 py-2 font-semibold">Batal</button><button disabled={saving} onClick={saveJob} className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white disabled:opacity-50"><Save className="mr-2 inline h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan'}</button></div></div></div>}
  </div>;
}

