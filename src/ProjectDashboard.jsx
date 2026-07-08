import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  ExternalLink,
  Eye,
  Layers,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';

const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbz0GXwaDtENIML_Cjd8msndf4b_82fDep9Bbn069MfHcyYHVz-N7JKQwj-QsZMGYc_L/exec';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'jobs', label: 'Pekerjaan', icon: ListTodo },
  { key: 'team', label: 'Tim', icon: Users },
];

async function parseResponse(response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const normalized = text.trim().toLowerCase();

  const isHtml =
    contentType.includes('text/html') ||
    normalized.startsWith('<!doctype html') ||
    normalized.startsWith('<html');

  if (isHtml) {
    throw new Error(
      'Endpoint Apps Script mengembalikan halaman HTML, bukan JSON. ' +
        'Pastikan URL menggunakan deployment Web App yang berakhir /exec, ' +
        'akses deployment disetel ke Anyone, dan deployment sudah diperbarui.',
    );
  }

  let result;

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Respons Apps Script tidak valid: ${text.slice(0, 200) || '(kosong)'}`,
    );
  }

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error || `Request gagal dengan status ${response.status}`,
    );
  }

  return result.data;
}

async function apiGet(action = 'bootstrap') {
  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  url.searchParams.set('action', action);

  const response = await fetch(url.toString(), {
    method: 'GET',
    cache: 'no-store',
    redirect: 'follow',
    headers: { Accept: 'application/json' },
  });

  return parseResponse(response);
}

async function apiPost(action, payload) {
  const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      Accept: 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  return parseResponse(response);
}

const emptyJob = projectId => ({
  projectId: projectId || '',
  title: '',
  year: new Date().getFullYear(),
  status: 'To Do',
  urgency: 'Medium',
  assignees: [],
  timeline: '',
  komitmen: '',
  description: '',
  link: '',
});

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';

function FieldInput({ column, value, onChange, members }) {
  const options = String(column.options || '')
    .split('|')
    .map(option => option.trim())
    .filter(Boolean);

  if (column.type === 'textarea') {
    return (
      <textarea
        className={`${inputClass} min-h-28 resize-y`}
        value={value || ''}
        onChange={event => onChange(event.target.value)}
      />
    );
  }

  if (column.type === 'select') {
    return (
      <select
        className={inputClass}
        value={value || ''}
        onChange={event => onChange(event.target.value)}
      >
        <option value="">Pilih opsi...</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === 'members') {
    const selectedIds = Array.isArray(value) ? value : [];

    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {members.map(member => {
          const selected = selectedIds.includes(member.id);

          return (
            <button
              key={member.id}
              type="button"
              onClick={() =>
                onChange(
                  selected
                    ? selectedIds.filter(id => id !== member.id)
                    : [...selectedIds, member.id],
                )
              }
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                selected
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <img
                src={member.avatar}
                alt={member.name}
                className="h-9 w-9 rounded-full bg-slate-100 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {member.name}
                </p>
                <p className="text-xs text-slate-400">
                  {selected ? 'Dipilih' : 'Klik untuk memilih'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      className={inputClass}
      type={
        column.type === 'number'
          ? 'number'
          : column.type === 'url'
            ? 'url'
            : 'text'
      }
      value={value ?? ''}
      onChange={event =>
        onChange(
          column.type === 'number'
            ? Number(event.target.value)
            : event.target.value,
        )
      }
    />
  );
}

function StatusBadge({ value }) {
  const styles = {
    Done: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
    'In Progress': 'bg-blue-50 text-blue-700 ring-blue-600/10',
    'To Do': 'bg-slate-100 text-slate-700 ring-slate-500/10',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[value] || styles['To Do']
      }`}
    >
      {value || '-'}
    </span>
  );
}

function UrgencyBadge({ value }) {
  const styles = {
    High: 'bg-rose-50 text-rose-700 ring-rose-600/10',
    Medium: 'bg-amber-50 text-amber-700 ring-amber-600/10',
    Low: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[value] || styles.Low
      }`}
    >
      {value || '-'}
    </span>
  );
}

function CellValue({ column, value, members }) {
  if (column.type === 'members') {
    const selected = members.filter(member =>
      (Array.isArray(value) ? value : []).includes(member.id),
    );

    if (!selected.length) {
      return <span className="text-slate-400">Belum ada</span>;
    }

    return (
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {selected.slice(0, 4).map(member => (
            <img
              key={member.id}
              src={member.avatar}
              title={member.name}
              alt={member.name}
              className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 object-cover"
            />
          ))}
        </div>
        {selected.length > 4 && (
          <span className="ml-2 text-xs font-semibold text-slate-500">
            +{selected.length - 4}
          </span>
        )}
      </div>
    );
  }

  if (column.type === 'url' && value) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-700"
      >
        Buka tautan
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    );
  }

  if (column.key === 'status') return <StatusBadge value={value} />;
  if (column.key === 'urgency') return <UrgencyBadge value={value} />;

  return <span className="text-slate-700">{String(value ?? '-')}</span>;
}

function StatCard({ label, value, description, icon: Icon, tone }) {
  const tones = {
    indigo: 'bg-indigo-50 text-indigo-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </article>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center">
      <div className="rounded-2xl bg-white p-4 text-slate-400 shadow-sm ring-1 ring-slate-200">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState({
    settings: {},
    columns: [],
    projects: [],
    jobs: [],
    teamMembers: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(null);
  const [modal, setModal] = useState(false);

  const reload = async () => {
    try {
      setLoading(true);
      setError('');
      setData(await apiGet());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const visibleColumns = useMemo(
    () =>
      data.columns.filter(
        column => String(column.visible).toLowerCase() === 'true',
      ),
    [data.columns],
  );

  const editableColumns = useMemo(
    () =>
      data.columns.filter(
        column => String(column.editable).toLowerCase() === 'true',
      ),
    [data.columns],
  );

  const filteredJobs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return data.jobs;

    return data.jobs.filter(job => {
      const project =
        data.projects.find(item => item.id === job.projectId)?.title || '';
      const members = data.teamMembers
        .filter(member => (job.assignees || []).includes(member.id))
        .map(member => member.name)
        .join(' ');

      return `${project} ${members} ${Object.values(job).join(' ')}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [data.jobs, data.projects, data.teamMembers, search]);

  const metrics = useMemo(() => {
    const total = data.jobs.length;
    const done = data.jobs.filter(job => job.status === 'Done').length;
    const active = total - done;
    const completion = total ? Math.round((done / total) * 100) : 0;

    const highLoadMembers = data.teamMembers.filter(member => {
      const activeCount = data.jobs.filter(
        job =>
          (job.assignees || []).includes(member.id) && job.status !== 'Done',
      ).length;
      return activeCount >= Number(member.maxJobs || 5);
    }).length;

    return { total, done, active, completion, highLoadMembers };
  }, [data.jobs, data.teamMembers]);

  const projectProgress = useMemo(
    () =>
      data.projects
        .map(project => {
          const jobs = data.jobs.filter(job => job.projectId === project.id);
          const done = jobs.filter(job => job.status === 'Done').length;
          return {
            ...project,
            totalJobs: jobs.length,
            completedJobs: done,
            percentage: jobs.length ? Math.round((done / jobs.length) * 100) : 0,
          };
        })
        .sort((a, b) => b.percentage - a.percentage),
    [data.jobs, data.projects],
  );

  const recentJobs = useMemo(
    () => [...data.jobs].slice(0, 5),
    [data.jobs],
  );

  const saveJob = async () => {
    if (!form) return;

    if (!String(form.title || '').trim()) {
      setError('Judul pekerjaan wajib diisi.');
      return;
    }

    if (!form.projectId) {
      setError('Project induk wajib dipilih.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const saved = await apiPost(
        form.id ? 'updateJob' : 'createJob',
        form,
      );

      setData(previous => ({
        ...previous,
        jobs: form.id
          ? previous.jobs.map(job => (job.id === saved.id ? saved : job))
          : [saved, ...previous.jobs],
      }));

      setSelectedJob(saved);
      setForm(null);
      setModal(false);
      setTab('jobs');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteJob = async job => {
    if (!window.confirm(`Hapus pekerjaan “${job.title}”?`)) return;

    try {
      setSaving(true);
      setError('');
      await apiPost('deleteJob', { id: job.id });

      setData(previous => ({
        ...previous,
        jobs: previous.jobs.filter(item => item.id !== job.id),
      }));

      setSelectedJob(null);
      setTab('jobs');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openCreateModal = () => {
    setForm(emptyJob(data.projects[0]?.id || ''));
    setModal(true);
  };

  const openEditModal = job => {
    setForm({
      ...job,
      assignees: Array.isArray(job.assignees) ? job.assignees : [],
    });
    setModal(true);
  };

  const changeTab = nextTab => {
    setTab(nextTab);
    setSelectedJob(null);
  };

  const settings = data.settings || {};

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 rounded-3xl border border-white/70 bg-white/95 px-5 py-4 shadow-lg shadow-slate-200/50 backdrop-blur md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
                  {settings.appTitle || 'Dashboard Kerja'}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {settings.appSubtitle ||
                    'Monitoring project, pekerjaan, dan kapasitas tim'}
                </p>
              </div>
            </div>

            <nav
              className="flex w-full gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 xl:w-auto"
              aria-label="Navigasi utama"
            >
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = tab === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => changeTab(item.key)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-white text-indigo-700 shadow-sm'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.key === 'jobs'
                      ? settings.jobsTabLabel || item.label
                      : item.key === 'team'
                        ? settings.teamTabLabel || item.label
                        : item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          {loading && (
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat data dashboard...
            </div>
          )}

          {error && (
            <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">Terjadi masalah</p>
                  <p className="mt-1 text-sm">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="rounded-lg p-1.5 hover:bg-rose-100"
                aria-label="Tutup pesan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {!loading && tab === 'dashboard' && (
            <section className="space-y-6">
              <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl shadow-slate-300/50 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-200">
                    Ringkasan operasional
                  </p>
                  <h2 className="mt-2 max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Pantau progres pekerjaan dan kapasitas tim dalam satu tempat.
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                    Data diperbarui langsung dari sistem kerja Anda untuk membantu pengambilan keputusan yang lebih cepat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={reload}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Perbarui data
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total project"
                  value={data.projects.length}
                  description="Project yang sedang dipantau"
                  icon={Layers}
                  tone="indigo"
                />
                <StatCard
                  label="Pekerjaan aktif"
                  value={metrics.active}
                  description={`${metrics.total} total pekerjaan`}
                  icon={Clock3}
                  tone="blue"
                />
                <StatCard
                  label="Penyelesaian"
                  value={`${metrics.completion}%`}
                  description={`${metrics.done} pekerjaan selesai`}
                  icon={CheckCircle2}
                  tone="emerald"
                />
                <StatCard
                  label="Kapasitas penuh"
                  value={metrics.highLoadMembers}
                  description={`Dari ${data.teamMembers.length} anggota tim`}
                  icon={Users}
                  tone="amber"
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">
                        Progres project
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Project berdasarkan tingkat penyelesaian.
                      </p>
                    </div>
                    <Layers className="h-5 w-5 text-slate-400" />
                  </div>

                  {projectProgress.length ? (
                    <div className="space-y-5">
                      {projectProgress.slice(0, 6).map(project => (
                        <div key={project.id}>
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">
                                {project.title}
                              </p>
                              <p className="text-xs text-slate-400">
                                {project.completedJobs}/{project.totalJobs} selesai
                              </p>
                            </div>
                            <span className="text-sm font-bold text-slate-700">
                              {project.percentage}%
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                              style={{ width: `${project.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Layers}
                      title="Belum ada project"
                      description="Tambahkan project agar progres dapat ditampilkan di dashboard."
                    />
                  )}
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">
                        Pekerjaan terbaru
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Aktivitas terakhir dari seluruh project.
                      </p>
                    </div>
                    <ListTodo className="h-5 w-5 text-slate-400" />
                  </div>

                  {recentJobs.length ? (
                    <div className="divide-y divide-slate-100">
                      {recentJobs.map(job => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            setSelectedJob(job);
                            setTab('jobs');
                          }}
                          className="flex w-full items-center gap-3 py-3 text-left transition first:pt-0 last:pb-0 hover:translate-x-0.5"
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {job.title}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {data.projects.find(project => project.id === job.projectId)?.title || 'Tanpa project'}
                            </p>
                          </div>
                          <StatusBadge value={job.status} />
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={ListTodo}
                      title="Belum ada pekerjaan"
                      description="Pekerjaan terbaru akan muncul di sini."
                    />
                  )}
                </article>
              </div>

              <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      Kapasitas tim
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Perbandingan pekerjaan aktif dengan batas kapasitas.
                    </p>
                  </div>
                  <Users className="h-5 w-5 text-slate-400" />
                </div>

                {data.teamMembers.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.teamMembers.map(member => {
                      const activeJobs = data.jobs.filter(
                        job =>
                          (job.assignees || []).includes(member.id) &&
                          job.status !== 'Done',
                      ).length;
                      const maxJobs = Math.max(Number(member.maxJobs || 5), 1);
                      const percentage = Math.min(
                        Math.round((activeJobs / maxJobs) * 100),
                        100,
                      );
                      const tone =
                        percentage >= 80
                          ? 'bg-rose-500'
                          : percentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';

                      return (
                        <div
                          key={member.id}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-11 w-11 rounded-full bg-slate-100 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <p className="truncate text-sm font-bold text-slate-900">
                                  {member.name}
                                </p>
                                <span className="text-xs font-semibold text-slate-500">
                                  {activeJobs}/{maxJobs}
                                </span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${tone}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="Belum ada anggota tim"
                    description="Data kapasitas akan muncul setelah anggota tim ditambahkan."
                  />
                )}
              </article>
            </section>
          )}

          {!loading && tab === 'jobs' && !selectedJob && (
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      Daftar pekerjaan
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Kelola seluruh pekerjaan dari berbagai project.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    disabled={!data.projects.length}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    {settings.addButtonLabel || 'Tambah pekerjaan'}
                  </button>
                </div>

                <div className="relative mt-5">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Cari project, pekerjaan, status, atau anggota tim..."
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Project</th>
                      {visibleColumns.map(column => (
                        <th
                          key={column.key}
                          className={`px-5 py-4 font-semibold ${column.width || ''}`}
                        >
                          {column.label}
                        </th>
                      ))}
                      <th className="px-5 py-4 text-center font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJobs.length ? (
                      filteredJobs.map(job => (
                        <tr
                          key={job.id}
                          className="group transition hover:bg-indigo-50/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Layers className="h-4 w-4" />
                              </div>
                              <span className="max-w-[220px] truncate font-semibold text-slate-900">
                                {data.projects.find(
                                  project => project.id === job.projectId,
                                )?.title || '-'}
                              </span>
                            </div>
                          </td>
                          {visibleColumns.map(column => (
                            <td key={column.key} className="px-5 py-4">
                              <CellValue
                                column={column}
                                value={job[column.key]}
                                members={data.teamMembers}
                              />
                            </td>
                          ))}
                          <td className="px-5 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedJob(job)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-indigo-600 transition hover:bg-indigo-100"
                              aria-label={`Lihat detail ${job.title}`}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={visibleColumns.length + 2} className="p-8">
                          <EmptyState
                            icon={Search}
                            title="Data tidak ditemukan"
                            description="Ubah kata kunci pencarian atau tambahkan pekerjaan baru."
                          />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {!loading && tab === 'jobs' && selectedJob && (
            <section className="space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke daftar
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedJob)}
                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => deleteJob(selectedJob)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                </div>
              </div>

              <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-br from-slate-950 to-indigo-950 p-6 text-white sm:p-8">
                  <p className="text-sm font-semibold text-indigo-200">
                    {data.projects.find(
                      project => project.id === selectedJob.projectId,
                    )?.title || 'Project tidak diketahui'}
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">
                    {selectedJob.title}
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge value={selectedJob.status} />
                    <UrgencyBadge value={selectedJob.urgency} />
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
                  {data.columns.map(column => (
                    <div
                      key={column.key}
                      className={
                        column.type === 'textarea' || column.type === 'members'
                          ? 'md:col-span-2'
                          : ''
                      }
                    >
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                        {column.label}
                      </p>
                      <div className="min-h-14 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <CellValue
                          column={column}
                          value={selectedJob[column.key]}
                          members={data.teamMembers}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          )}

          {!loading && tab === 'team' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Monitoring tim
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Pantau beban kerja dan pekerjaan aktif setiap anggota.
                </p>
              </div>

              {data.teamMembers.length ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {data.teamMembers.map(member => {
                    const memberJobs = data.jobs.filter(job =>
                      (job.assignees || []).includes(member.id),
                    );
                    const activeJobs = memberJobs.filter(
                      job => job.status !== 'Done',
                    );
                    const maxJobs = Math.max(Number(member.maxJobs || 5), 1);
                    const percentage = Math.min(
                      Math.round((activeJobs.length / maxJobs) * 100),
                      100,
                    );
                    const tone =
                      percentage >= 80
                        ? 'bg-rose-500'
                        : percentage >= 50
                          ? 'bg-amber-500'
                          : 'bg-emerald-500';
                    const label =
                      percentage >= 80
                        ? 'Beban tinggi'
                        : percentage >= 50
                          ? 'Beban sedang'
                          : 'Kapasitas tersedia';

                    return (
                      <article
                        key={member.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="h-14 w-14 rounded-2xl bg-slate-100 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <h3 className="font-bold text-slate-950">
                                  {member.name}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                  {activeJobs.length} aktif · {memberJobs.length} total
                                </p>
                              </div>
                              <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {label}
                              </span>
                            </div>

                            <div className="mt-4">
                              <div className="mb-2 flex justify-between text-xs text-slate-500">
                                <span>Kapasitas</span>
                                <span>{activeJobs.length}/{maxJobs} pekerjaan</span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${tone}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 border-t border-slate-100 pt-5">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                            Pekerjaan aktif
                          </p>
                          <div className="space-y-2">
                            {activeJobs.length ? (
                              activeJobs.slice(0, 4).map(job => (
                                <button
                                  key={job.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedJob(job);
                                    setTab('jobs');
                                  }}
                                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-left transition hover:border-indigo-200 hover:bg-indigo-50"
                                >
                                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm">
                                    <Briefcase className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                                    {job.title}
                                  </span>
                                  <StatusBadge value={job.status} />
                                </button>
                              ))
                            ) : (
                              <p className="rounded-xl bg-slate-50 p-3 text-sm italic text-slate-400">
                                Tidak ada pekerjaan aktif.
                              </p>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Belum ada data tim"
                  description="Tambahkan anggota tim agar kapasitas dan beban kerja dapat dipantau."
                />
              )}
            </section>
          )}
        </main>
      </div>

      {modal && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {form.id ? 'Edit pekerjaan' : 'Tambah pekerjaan'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lengkapi informasi pekerjaan dengan jelas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModal(false);
                  setForm(null);
                }}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-145px)] overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Project induk
                  </label>
                  <select
                    value={form.projectId}
                    onChange={event =>
                      setForm(previous => ({
                        ...previous,
                        projectId: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Pilih project...</option>
                    {data.projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                {editableColumns.map(column => (
                  <div
                    key={column.key}
                    className={
                      column.type === 'textarea' || column.type === 'members'
                        ? 'md:col-span-2'
                        : ''
                    }
                  >
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      {column.label}
                      {String(column.required).toLowerCase() === 'true' && (
                        <span className="ml-1 text-rose-500">*</span>
                      )}
                    </label>
                    <FieldInput
                      column={column}
                      value={form[column.key]}
                      members={data.teamMembers}
                      onChange={value =>
                        setForm(previous => ({
                          ...previous,
                          [column.key]: value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => {
                  setModal(false);
                  setForm(null);
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving || !form.projectId}
                onClick={saveJob}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
