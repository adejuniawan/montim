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

  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(
      `Respons Apps Script bukan JSON: ${text.slice(0, 200)}`,
    );
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || `HTTP ${response.status}`);
  }

  return result.data;
}

async function apiGet(action = 'bootstrap') {
  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  url.searchParams.set('action', action);

  return parseResponse(
    await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      headers: { Accept: 'application/json' },
    }),
  );
}

async function apiPost(action, payload) {
  return parseResponse(
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        Accept: 'application/json',
      },
      body: JSON.stringify({ action, payload }),
    }),
  );
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

function FieldInput({ column, value, onChange, members }) {
  const options = String(column.options || '')
    .split('|')
    .map(option => option.trim())
    .filter(Boolean);

  const common =
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10';

  if (column.type === 'textarea') {
    return (
      <textarea
        className={`${common} min-h-28 resize-y`}
        value={value || ''}
        onChange={event => onChange(event.target.value)}
      />
    );
  }

  if (column.type === 'select') {
    return (
      <select
        className={common}
        value={value || ''}
        onChange={event => onChange(event.target.value)}
      >
        <option value="">Pilih...</option>
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
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
              className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                selected
                  ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <img
                src={member.avatar}
                className="h-8 w-8 rounded-full bg-slate-100 object-cover"
                alt={member.name}
              />
              <span className="truncate text-sm font-medium text-slate-700">
                {member.name}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <input
      className={common}
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
    Done: 'bg-emerald-100 text-emerald-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'To Do': 'bg-slate-100 text-slate-700',
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
        styles[value] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {value || '-'}
    </span>
  );
}

function UrgencyBadge({ value }) {
  const styles = {
    High: 'border-red-200 bg-red-50 text-red-700',
    Medium: 'border-amber-200 bg-amber-50 text-amber-700',
    Low: 'border-slate-200 bg-slate-50 text-slate-600',
  };

  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${
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
      return <span className="text-slate-400">-</span>;
    }

    return (
      <div className="flex -space-x-2">
        {selected.map(member => (
          <img
            key={member.id}
            src={member.avatar}
            title={member.name}
            className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 object-cover"
            alt={member.name}
          />
        ))}
      </div>
    );
  }

  if (column.type === 'url' && value) {
    return (
      <a
        className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline"
        href={value}
        target="_blank"
        rel="noreferrer"
      >
        Buka
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  if (column.key === 'status') {
    return <StatusBadge value={value} />;
  }

  if (column.key === 'urgency') {
    return <UrgencyBadge value={value} />;
  }

  return <span>{String(value ?? '-')}</span>;
}

function StatCard({ label, value, description, icon: Icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
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
      const responseData = await apiGet();
      setData(responseData);
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
      const projectName =
        data.projects.find(project => project.id === job.projectId)?.title || '';
      const memberNames = data.teamMembers
        .filter(member => (job.assignees || []).includes(member.id))
        .map(member => member.name)
        .join(' ');

      return `${projectName} ${memberNames} ${Object.values(job).join(' ')}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [data.jobs, data.projects, data.teamMembers, search]);

  const dashboardStats = useMemo(() => {
    const totalJobs = data.jobs.length;
    const completedJobs = data.jobs.filter(job => job.status === 'Done').length;
    const activeJobs = data.jobs.filter(job => job.status !== 'Done').length;
    const completionRate = totalJobs
      ? Math.round((completedJobs / totalJobs) * 100)
      : 0;

    const overloadedMembers = data.teamMembers.filter(member => {
      const activeCount = data.jobs.filter(
        job =>
          (job.assignees || []).includes(member.id) && job.status !== 'Done',
      ).length;
      return activeCount >= Number(member.maxJobs || 5);
    }).length;

    return {
      totalJobs,
      completedJobs,
      activeJobs,
      completionRate,
      overloadedMembers,
    };
  }, [data.jobs, data.teamMembers]);

  const projectProgress = useMemo(
    () =>
      data.projects.map(project => {
        const projectJobs = data.jobs.filter(job => job.projectId === project.id);
        const completed = projectJobs.filter(job => job.status === 'Done').length;
        const percentage = projectJobs.length
          ? Math.round((completed / projectJobs.length) * 100)
          : 0;

        return {
          ...project,
          totalJobs: projectJobs.length,
          completed,
          percentage,
        };
      }),
    [data.jobs, data.projects],
  );

  const saveJob = async () => {
    if (!form) return;

    if (!String(form.title || '').trim()) {
      setError('Judul pekerjaan wajib diisi.');
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
    if (!window.confirm(`Hapus job “${job.title}”?`)) return;

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
    <div className="min-h-screen bg-slate-50 p-4 text-slate-800 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-extrabold text-slate-900">
              <span className="rounded-xl bg-indigo-600 p-2 text-white shadow-sm">
                <Briefcase className="h-6 w-6" />
              </span>
              {settings.appTitle || 'Dashboard Kerja'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {settings.appSubtitle ||
                'Monitoring pekerjaan, proyek, dan kapasitas tim'}
            </p>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Navigasi utama">
            <button
              type="button"
              onClick={() => changeTab('dashboard')}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="mr-2 inline h-4 w-4" />
              Dashboard Monitoring
            </button>

            <button
              type="button"
              onClick={() => changeTab('jobs')}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'jobs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ListTodo className="mr-2 inline h-4 w-4" />
              {settings.jobsTabLabel || 'List Job'}
            </button>

            <button
              type="button"
              onClick={() => changeTab('team')}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                tab === 'team'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="mr-2 inline h-4 w-4" />
              {settings.teamTabLabel || 'Team Member'}
            </button>
          </nav>
        </header>

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memuat data dashboard...
          </div>
        )}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="rounded p-1 hover:bg-red-100"
              aria-label="Tutup pesan kesalahan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {!loading && tab === 'dashboard' && (
          <section className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Ringkasan Operasional
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Kondisi pekerjaan, project, dan kapasitas tim saat ini.
                </p>
              </div>
              <button
                type="button"
                onClick={reload}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total Project"
                value={data.projects.length}
                description="Project yang terdaftar"
                icon={Layers}
                iconClass="bg-indigo-50 text-indigo-600"
              />
              <StatCard
                label="Pekerjaan Aktif"
                value={dashboardStats.activeJobs}
                description={`${dashboardStats.totalJobs} total pekerjaan`}
                icon={ListTodo}
                iconClass="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Tingkat Penyelesaian"
                value={`${dashboardStats.completionRate}%`}
                description={`${dashboardStats.completedJobs} pekerjaan selesai`}
                icon={CheckCircle2}
                iconClass="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                label="Kapasitas Penuh"
                value={dashboardStats.overloadedMembers}
                description={`Dari ${data.teamMembers.length} member`}
                icon={Users}
                iconClass="bg-amber-50 text-amber-600"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    Status Pekerjaan
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Distribusi pekerjaan berdasarkan status.
                  </p>
                </div>

                <div className="space-y-5">
                  {['To Do', 'In Progress', 'Done'].map(status => {
                    const total = data.jobs.filter(
                      job => job.status === status,
                    ).length;
                    const percentage = data.jobs.length
                      ? Math.round((total / data.jobs.length) * 100)
                      : 0;

                    const barClass =
                      status === 'Done'
                        ? 'bg-emerald-500'
                        : status === 'In Progress'
                          ? 'bg-blue-500'
                          : 'bg-slate-400';

                    return (
                      <div key={status}>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <CircleDot
                              className={`h-4 w-4 ${
                                status === 'Done'
                                  ? 'text-emerald-500'
                                  : status === 'In Progress'
                                    ? 'text-blue-500'
                                    : 'text-slate-400'
                              }`}
                            />
                            <span className="text-sm font-semibold text-slate-700">
                              {status}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">
                            {total} pekerjaan · {percentage}%
                          </span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-slate-900">
                    Kapasitas Team Member
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Beban pekerjaan aktif setiap anggota tim.
                  </p>
                </div>

                <div className="space-y-4">
                  {data.teamMembers.length ? (
                    data.teamMembers.map(member => {
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
                      const barClass =
                        percentage >= 80
                          ? 'bg-red-500'
                          : percentage >= 50
                            ? 'bg-amber-500'
                            : 'bg-emerald-500';

                      return (
                        <div
                          key={member.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="h-10 w-10 rounded-full bg-slate-100 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <p className="truncate font-semibold text-slate-900">
                                  {member.name}
                                </p>
                                <span className="whitespace-nowrap text-sm text-slate-500">
                                  {activeJobs}/{maxJobs} job
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      Belum ada data member.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Progress Project
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Persentase penyelesaian pekerjaan pada setiap project.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projectProgress.length ? (
                  projectProgress.map(project => (
                    <div
                      key={project.id}
                      className="rounded-xl border border-slate-200 p-5"
                    >
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-900">
                            {project.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {project.completed}/{project.totalJobs} pekerjaan selesai
                          </p>
                        </div>
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-sm font-bold text-indigo-700">
                          {project.percentage}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${project.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Belum ada project.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {!loading && tab === 'jobs' && !selectedJob && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  placeholder="Cari project, pekerjaan, status, atau member..."
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                disabled={!data.projects.length}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                title={
                  data.projects.length
                    ? 'Tambah pekerjaan baru'
                    : 'Buat project terlebih dahulu'
                }
              >
                <Plus className="mr-2 inline h-4 w-4" />
                {settings.addButtonLabel || 'Tambah Baru'}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 font-semibold">Project</th>
                    {visibleColumns.map(column => (
                      <th
                        key={column.key}
                        className={`p-4 font-semibold ${column.width || ''}`}
                      >
                        {column.label}
                      </th>
                    ))}
                    <th className="p-4 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.length ? (
                    filteredJobs.map(job => (
                      <tr key={job.id} className="hover:bg-slate-50">
                        <td className="p-4 font-semibold text-slate-900">
                          <Layers className="mr-2 inline h-4 w-4 text-indigo-500" />
                          {data.projects.find(
                            project => project.id === job.projectId,
                          )?.title || '-'}
                        </td>
                        {visibleColumns.map(column => (
                          <td key={column.key} className="p-4 text-slate-700">
                            <CellValue
                              column={column}
                              value={job[column.key]}
                              members={data.teamMembers}
                            />
                          </td>
                        ))}
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedJob(job)}
                            className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50"
                            aria-label={`Lihat detail ${job.title}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 2}
                        className="p-10 text-center text-slate-500"
                      >
                        Tidak ada pekerjaan yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!loading && tab === 'jobs' && selectedJob && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke List Job
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(selectedJob)}
                  className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Pencil className="mr-2 inline h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => deleteJob(selectedJob)}
                  className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="mr-2 inline h-4 w-4" />
                  Hapus
                </button>
              </div>
            </div>

            <div className="mb-6 border-b border-slate-100 pb-6">
              <p className="text-sm font-semibold text-indigo-600">
                {data.projects.find(
                  project => project.id === selectedJob.projectId,
                )?.title || 'Project tidak diketahui'}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {selectedJob.title}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {data.columns.map(column => (
                <div
                  key={column.key}
                  className={
                    column.type === 'textarea' || column.type === 'members'
                      ? 'md:col-span-2'
                      : ''
                  }
                >
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {column.label}
                  </p>
                  <div className="min-h-12 rounded-xl bg-slate-50 p-4 text-slate-700">
                    <CellValue
                      column={column}
                      value={selectedJob[column.key]}
                      members={data.teamMembers}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && tab === 'team' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Monitoring Team Member
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Pantau pekerjaan aktif dan kapasitas setiap anggota tim.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {data.teamMembers.length ? (
                data.teamMembers.map(member => {
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
                  const capacityLabel =
                    percentage >= 80
                      ? 'Kapasitas tinggi'
                      : percentage >= 50
                        ? 'Kapasitas sedang'
                        : 'Kapasitas tersedia';
                  const barClass =
                    percentage >= 80
                      ? 'bg-red-500'
                      : percentage >= 50
                        ? 'bg-amber-500'
                        : 'bg-emerald-500';

                  return (
                    <article
                      key={member.id}
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start gap-4">
                        <img
                          src={member.avatar}
                          className="h-14 w-14 rounded-full bg-slate-100 object-cover"
                          alt={member.name}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <h3 className="font-bold text-slate-900">
                                {member.name}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {activeJobs.length} pekerjaan aktif ·{' '}
                                {memberJobs.length} total
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                              {capacityLabel}
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="mb-2 flex justify-between text-xs text-slate-500">
                              <span>Kapasitas</span>
                              <span>
                                {activeJobs.length}/{maxJobs} job
                              </span>
                            </div>
                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
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
                                className="flex w-full items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-left transition hover:bg-indigo-50"
                              >
                                <span className="truncate text-sm font-medium text-slate-700">
                                  {job.title}
                                </span>
                                <StatusBadge value={job.status} />
                              </button>
                            ))
                          ) : (
                            <p className="text-sm italic text-slate-400">
                              Tidak ada pekerjaan aktif.
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-slate-500">Belum ada data member.</p>
              )}
            </div>
          </section>
        )}
      </div>

      {modal && form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {form.id ? 'Edit Job' : 'Tambah Job'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Lengkapi informasi pekerjaan di bawah ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModal(false);
                  setForm(null);
                }}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-bold text-slate-700">
                  Project Induk
                </label>
                <select
                  value={form.projectId}
                  onChange={event =>
                    setForm({ ...form, projectId: event.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
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
                  <label className="mb-1 block text-sm font-bold text-slate-700">
                    {column.label}
                    {String(column.required).toLowerCase() === 'true' && ' *'}
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

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-100 bg-white p-5">
              <button
                type="button"
                onClick={() => {
                  setModal(false);
                  setForm(null);
                }}
                className="rounded-xl px-4 py-2 font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving || !form.projectId}
                onClick={saveJob}
                className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 inline h-4 w-4" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
