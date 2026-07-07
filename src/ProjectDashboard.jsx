import React, { useState } from 'react';
import {
  Briefcase,
  BarChart3,
  ListTodo,
  Eye,
  ArrowLeft,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  User,
  Calendar,
  AlertCircle,
  Pencil,
  Save,
  X,
  Layers,
  Plus,
  Target,
  CalendarDays,
  FolderPlus,
  CornerDownRight,
  Search
} from 'lucide-react';

const initialTeamMembers = [
  { id: 'm1', name: 'Budi Santoso', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Budi&backgroundColor=ffdfbf' },
  { id: 'm2', name: 'Siti Aminah', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Siti&backgroundColor=c0aede' },
  { id: 'm3', name: 'Andi Wijaya', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Andi&backgroundColor=b6e3f4' },
  { id: 'm4', name: 'Rina Kusuma', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Rina&backgroundColor=ffd5dc' },
];

// Proyek Induk
const initialProjects = [
  { id: 'p1', title: 'Redesign Landing Page', year: 2026, urgency: 'High', status: 'In Progress' },
  { id: 'p2', title: 'API Authentication', year: 2026, urgency: 'High', status: 'To Do' },
  { id: 'p3', title: 'User Research Q3', year: 2025, urgency: 'Medium', status: 'Done' },
];

// Jobs / Enhancement dari Proyek Induk
const initialJobs = [
  { id: 'j1', projectId: 'p1', title: 'Wireframe Homepage', year: 2026, status: 'Done', assignees: ['m3'], urgency: 'High', description: 'Membuat rancangan tata letak dasar (low-fidelity dan high-fidelity) untuk halaman utama website baru.', link: 'https://figma.com/file/example-wireframe', timeline: '1 - 10 Agustus 2026', komitmen: '20 Jam/Minggu' },
  { id: 'j2', projectId: 'p1', title: 'Implement Hero Section', year: 2026, status: 'In Progress', assignees: ['m1', 'm2'], urgency: 'High', description: 'Melakukan slicing desain Figma ke dalam bentuk komponen React dengan Tailwind CSS untuk bagian atas halaman.', link: 'https://github.com/example/repo/pull/1', timeline: '12 - 25 Agustus 2026', komitmen: 'Full-time' },
  { id: 'j5', projectId: 'p1', title: 'A/B Testing Setup', year: 2026, status: 'In Progress', assignees: ['m1'], urgency: 'Medium', description: 'Menyiapkan alat analitik (Google Optimize / VWO) untuk membandingkan performa tombol CTA lama vs baru.', link: 'https://analytics.google.com/example', timeline: '1 - 5 September 2026', komitmen: '5 Jam/Minggu' },
  { id: 'j3', projectId: 'p2', title: 'Database Schema', year: 2026, status: 'Done', assignees: ['m2'], urgency: 'High', description: 'Merancang struktur tabel untuk penyimpanan kredensial pengguna, token sesi, dan riwayat login.', link: 'https://dbdiagram.io/d/example', timeline: 'Q1 2026', komitmen: '10 Jam/Minggu' },
  { id: 'j4', projectId: 'p3', title: 'Data Analysis', year: 2025, status: 'To Do', assignees: ['m3', 'm4'], urgency: 'Medium', description: 'Menganalisis hasil dari 50+ wawancara pengguna dan mengelompokkan keluhan utama (pain points) ke dalam laporan akhir.', link: 'https://docs.google.com/spreadsheets/example', timeline: 'September - Oktober 2025', komitmen: 'Dedikasi Tinggi (Prioritas)' },
];

const emptyJobForm = {
  title: '', projectId: 'p1', year: new Date().getFullYear(), status: 'To Do', 
  assignees: [], urgency: 'Medium', description: '', link: '', 
  timeline: '', komitmen: ''
};

const emptyProjectForm = {
  title: '', year: new Date().getFullYear(), urgency: 'Medium', status: 'To Do'
};

export default function ProjectDashboard() {
  const [activeTab, setActiveTab] = useState('jobs'); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);

  const [projects, setProjects] = useState(initialProjects);
  const [jobs, setJobs] = useState(initialJobs);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editJobForm, setEditJobForm] = useState(null);

  // Modals State
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState(emptyJobForm);

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState(emptyProjectForm);

  // Filtering logic: Projects are shown if their title matches OR if they have jobs that match
  const filteredProjects = projects.filter(project => {
    const projectMatchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Check if any job in this project matches all filters
    const hasMatchingJobs = jobs.some(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesYear = filterYear === 'All' || job.year.toString() === filterYear;
      const matchesStatus = filterStatus === 'All' || job.status === filterStatus;
      return job.projectId === project.id && matchesSearch && matchesYear && matchesStatus;
    });

    // If searching, show project if its name matches OR its jobs match
    if (searchTerm) return projectMatchesSearch || hasMatchingJobs;
    
    // If only filtering by year/status, show project if it has matching jobs
    if (filterYear !== 'All' || filterStatus !== 'All') return hasMatchingJobs;
    
    return true; // Show all by default
  });

  const handleViewJobDetail = (job) => {
    setSelectedJob(job);
    setIsEditingJob(false);
    setActiveTab('jobDetail');
  };

  const handleBackToList = () => {
    setSelectedJob(null);
    setIsEditingJob(false);
    setActiveTab('jobs');
  };

  const handleSaveJobEdit = () => {
    setJobs(jobs.map(j => j.id === editJobForm.id ? editJobForm : j));
    setSelectedJob(editJobForm);
    setIsEditingJob(false);
  };

  const handleSaveNewJob = (e) => {
    e.preventDefault();
    if (!newJobForm.title.trim()) return;
    const newJob = { ...newJobForm, id: `j${Date.now()}` };
    setJobs([newJob, ...jobs]);
    setIsAddJobModalOpen(false);
    setNewJobForm({ ...emptyJobForm, projectId: projects.length > 0 ? projects[0].id : '' });
  };

  const handleSaveNewProject = (e) => {
    e.preventDefault();
    if (!newProjectForm.title.trim()) return;
    const newProject = { ...newProjectForm, id: `p${Date.now()}` };
    setProjects([newProject, ...projects]);
    
    // Automatically select this new project in the job form
    setNewJobForm(prev => ({ ...prev, projectId: newProject.id }));
    
    setIsAddProjectModalOpen(false);
    setNewProjectForm(emptyProjectForm);
  };

  const toggleAssignee = (memberId, isNewJob = false) => {
    if (isNewJob) {
      setNewJobForm(prev => {
        const isAssigned = prev.assignees.includes(memberId);
        return { ...prev, assignees: isAssigned ? prev.assignees.filter(id => id !== memberId) : [...prev.assignees, memberId] };
      });
    } else {
      setEditJobForm(prev => {
        const isAssigned = prev.assignees.includes(memberId);
        return { ...prev, assignees: isAssigned ? prev.assignees.filter(id => id !== memberId) : [...prev.assignees, memberId] };
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 relative">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><Briefcase className="w-6 h-6" /></div>
            Dashboard Kerja
          </h1>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={handleBackToList} 
              className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'jobs' || activeTab === 'jobDetail' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <ListTodo className="w-4 h-4" /> List Job
            </button>
            <button 
              onClick={() => setActiveTab('team')} 
              className={`px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'team' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <BarChart3 className="w-4 h-4" /> Work load
            </button>
          </div>
        </header>

        {/* LIST JOB VIEW */}
        {activeTab === 'jobs' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* --- INI FILTER & ACTION BAR BARU --- */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                <div className="relative group">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500" />
                  <input 
                    type="text" 
                    placeholder="Cari..." 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64 transition-all" 
                  />
                </div>
                <div className="flex gap-3">
                  <select onChange={(e) => setFilterYear(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 bg-white cursor-pointer">
                    <option value="All">Semua Tahun</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                  <select onChange={(e) => setFilterStatus(e.target.value)} className="border border-slate-300 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 bg-white cursor-pointer">
                    <option value="All">Semua Status</option>
                    <option value="Done">Done</option>
                    <option value="In Progress">In Progress</option>
                    <option value="To Do">To Do</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsAddProjectModalOpen(true)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2">
                  <FolderPlus className="w-4 h-4" /> Proyek Baru
                </button>
                <button onClick={() => setIsAddJobModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm">
                  <Plus className="w-4 h-4" /> Tambah Job
                </button>
              </div>
            </div>
            {/* --- AKHIR FILTER --- */}
              
                {/* KELOMPOK AKSI (Kanan) */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAddProjectModalOpen(true)}
                    className="flex-1 sm:flex-none bg-white border border-slate-300 text-slate-700 hover:border-indigo-500 hover:text-indigo-600 px-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" /> Proyek Baru
                  </button>
                  <button 
                    onClick={() => setIsAddJobModalOpen(true)}
                    className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-sm shadow-indigo-200"
                  >
                    <Plus className="w-4 h-4" /> Tambah Job
                  </button>
                </div>
              </div>
                  <FolderPlus className="w-4 h-4" /> Proyek Induk Baru
                </button>
                <button 
                  onClick={() => setIsAddJobModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Tambah Job
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-semibold w-1/3">List Proyek & Job</th>
                    <th className="p-4 font-semibold">Tahun</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Urgensi</th>
                    <th className="p-4 font-semibold">Member</th>
                    <th className="p-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map(project => {
                      // Filter jobs for this specific project based on global filters
                      const projectJobs = jobs.filter(job => {
                        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesYear = filterYear === 'All' || job.year.toString() === filterYear;
                        const matchesStatus = filterStatus === 'All' || job.status === filterStatus;
                        return job.projectId === project.id && 
                               (searchTerm === '' || matchesSearch || project.title.toLowerCase().includes(searchTerm.toLowerCase())) && 
                               matchesYear && matchesStatus;
                      });

                      return (
                        <React.Fragment key={`project-${project.id}`}>
                          {/* PROJECT HEADER ROW */}
                          <tr className="bg-slate-50 border-y border-slate-200">
                            <td colSpan="6" className="p-3 pl-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-700">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-slate-800">{project.title}</span>
                              </div>
                            </td>
                          </tr>

                          {/* JOBS / ENHANCEMENTS ROWS */}
                          {projectJobs.length > 0 ? projectJobs.map(job => {
                            const assigneesInfo = initialTeamMembers.filter(m => job.assignees.includes(m.id));
                            return (
                              <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-4 pl-10">
                                  <div className="flex items-center gap-2">
                                    <CornerDownRight className="w-4 h-4 text-slate-300" />
                                    <span className="font-medium text-slate-900">{job.title}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-600">{job.year}</td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block
                                    ${job.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 
                                      job.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                                      'bg-slate-100 text-slate-700'}`}>
                                    {job.status}
                                  </span>
                                </td>
                                <td className="p-4">
                                   <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block
                                    ${job.urgency === 'High' ? 'bg-red-50 text-red-600 border-red-200' : 
                                      job.urgency === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                      'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    {job.urgency}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex -space-x-2 overflow-hidden">
                                    {assigneesInfo.length > 0 ? assigneesInfo.map(member => (
                                      <img key={member.id} src={member.avatar} alt={member.name} title={member.name} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white shadow-sm" />
                                    )) : (
                                      <span className="text-slate-400 text-sm italic">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={() => handleViewJobDetail(job)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center justify-center gap-1 text-sm font-medium"
                                    title="Lihat Detail"
                                  >
                                    <Eye className="w-4 h-4" /> Detail
                                  </button>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan="6" className="p-4 pl-12 text-slate-400 text-sm italic">
                                Belum ada job/tugas untuk proyek ini yang sesuai dengan filter.
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500">
                        Tidak ada Proyek atau Job yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JOB DETAIL VIEW */}
        {activeTab === 'jobDetail' && selectedJob && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-right-8 duration-300">
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={handleBackToList}
                className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors text-sm bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-lg w-fit"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali ke List Job
              </button>
              
              {!isEditingJob && (
                <button
                  onClick={() => { setEditJobForm(selectedJob); setIsEditingJob(true); }}
                  className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white font-medium transition-colors text-sm px-4 py-2 rounded-lg"
                >
                  <Pencil className="w-4 h-4" /> Edit Job
                </button>
              )}
            </div>

            {isEditingJob ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Judul Pekerjaan (Job)</label>
                    <input type="text" value={editJobForm.title} onChange={e => setEditJobForm({...editJobForm, title: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Proyek Induk</label>
                    <select value={editJobForm.projectId} onChange={e => setEditJobForm({...editJobForm, projectId: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                    <select value={editJobForm.status} onChange={e => setEditJobForm({...editJobForm, status: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Urgensi</label>
                    <select value={editJobForm.urgency} onChange={e => setEditJobForm({...editJobForm, urgency: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tahun Pelaksanaan</label>
                    <input type="number" value={editJobForm.year} onChange={e => setEditJobForm({...editJobForm, year: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                  </div>
                  
                  {/* Timeline & Komitmen */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Timeline</label>
                    <input type="text" placeholder="Misal: 12-20 Agustus 2026" value={editJobForm.timeline || ''} onChange={e => setEditJobForm({...editJobForm, timeline: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Komitmen (Beban/Waktu)</label>
                    <input type="text" placeholder="Misal: 10 Jam/Minggu, Full-time" value={editJobForm.komitmen || ''} onChange={e => setEditJobForm({...editJobForm, komitmen: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Assignees (Pilih anggota tim)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {initialTeamMembers.map(member => (
                        <div 
                          key={member.id}
                          onClick={() => toggleAssignee(member.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            editJobForm.assignees.includes(member.id) 
                              ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' 
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <img src={member.avatar} alt="" className="w-6 h-6 rounded-full bg-slate-100" />
                          <span className="text-sm font-medium text-slate-700 truncate">{member.name.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi</label>
                    <textarea value={editJobForm.description} onChange={e => setEditJobForm({...editJobForm, description: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 min-h-[100px] resize-y" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tautan Terkait</label>
                    <input type="url" value={editJobForm.link} onChange={e => setEditJobForm({...editJobForm, link: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setIsEditingJob(false)} className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                    <X className="w-4 h-4" /> Batal
                  </button>
                  <button onClick={handleSaveJobEdit} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors">
                    <Save className="w-4 h-4" /> Simpan Perubahan
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-6 mb-6 animate-in fade-in duration-300">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">{selectedJob.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className={`px-3 py-1.5 rounded-full font-bold
                        ${selectedJob.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 
                          selectedJob.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                          'bg-slate-100 text-slate-700'}`}>
                        {selectedJob.status}
                      </span>
                      <span className={`px-3 py-1.5 rounded-md font-bold border
                        ${selectedJob.urgency === 'High' ? 'bg-red-50 text-red-600 border-red-200' : 
                          selectedJob.urgency === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        Urgensi: {selectedJob.urgency}
                      </span>
                    </div>
                  </div>

                  {/* Assignee Card (Multi) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-w-[200px]">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><User className="w-4 h-4"/> Dikerjakan Oleh:</p>
                    <div className="flex flex-col gap-3">
                      {selectedJob.assignees.length > 0 ? (
                        selectedJob.assignees.map(memberId => {
                          const member = initialTeamMembers.find(m => m.id === memberId);
                          return member ? (
                            <div key={member.id} className="flex items-center gap-3">
                              <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full border border-slate-200 bg-white shadow-sm" />
                              <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                            </div>
                          ) : null;
                        })
                      ) : (
                        <div className="text-slate-500 text-sm italic">Belum di-assign</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column: Descriptions */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-indigo-500" /> Deskripsi Pekerjaan
                      </h3>
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-slate-700 leading-relaxed">
                        {selectedJob.description || <span className="italic text-slate-400">Tidak ada deskripsi yang tersedia untuk pekerjaan ini.</span>}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                        <LinkIcon className="w-4 h-4 text-indigo-500" /> Tautan Terkait (Referensi / Hasil)
                      </h3>
                      {selectedJob.link ? (
                        <a 
                          href={selectedJob.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:text-indigo-600 rounded-xl transition-all font-medium text-slate-700 break-all"
                        >
                          {selectedJob.link}
                          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                        </a>
                      ) : (
                        <p className="text-slate-500 italic text-sm">Belum ada tautan yang disematkan.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Metadata */}
                  <div className="space-y-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                      
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Proyek Induk</p>
                        <p className="font-bold text-slate-900 text-lg">
                          {projects.find(p => p.id === selectedJob.projectId)?.title || 'Tidak diketahui'}
                        </p>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tahun Pelaksanaan</p>
                        <p className="font-semibold text-slate-900">{selectedJob.year}</p>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> Timeline</p>
                        <p className="font-semibold text-slate-900">{selectedJob.timeline || '-'}</p>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Komitmen</p>
                        <p className="font-semibold text-slate-900">{selectedJob.komitmen || '-'}</p>
                      </div>

                      {/* Related Jobs List */}
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Job Lain di Proyek Ini</p>
                        <ul className="space-y-3">
                          {jobs.filter(j => j.projectId === selectedJob.projectId).map(relatedJob => (
                            <li 
                              key={relatedJob.id} 
                              className={`text-sm flex flex-col gap-1 ${relatedJob.id === selectedJob.id ? 'bg-indigo-50 p-2 rounded-lg -mx-2' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`font-medium line-clamp-2 ${relatedJob.id === selectedJob.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                  {relatedJob.title}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap
                                  ${relatedJob.status === 'Done' ? 'bg-emerald-100 text-emerald-700' : 
                                  relatedJob.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                                >
                                  {relatedJob.status}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* WORKLOAD VIEW */}
        {activeTab === 'team' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Monitoring Work load Tim
              </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-semibold w-1/3">Nama</th>
                    <th className="p-4 font-semibold w-2/3">Work load (Job Aktif)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {initialTeamMembers.map(m => {
                    const activeJobsCount = jobs.filter(j => j.assignees.includes(m.id) && j.status !== 'Done').length;
                    const maxJobs = 5; 
                    const loadPercentage = Math.min((activeJobsCount / maxJobs) * 100, 100);
                    
                    let barColor = 'bg-emerald-400';
                    if (activeJobsCount >= 4) barColor = 'bg-red-500';
                    else if (activeJobsCount >= 2) barColor = 'bg-amber-400';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <img src={m.avatar} className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm" alt={m.name} /> 
                          <span className="font-semibold text-slate-900">{m.name}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-4 w-full max-w-md">
                            <span className="text-sm font-bold w-12 text-slate-700">{activeJobsCount} Job</span>
                            <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-700 rounded-full ${barColor}`} 
                                style={{ width: `${loadPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ADD JOB MODAL */}
      {isAddJobModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Tambah Job Baru
              </h2>
              <button onClick={() => setIsAddJobModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveNewJob} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Judul Pekerjaan (Job) *</label>
                  <input type="text" required value={newJobForm.title} onChange={e => setNewJobForm({...newJobForm, title: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Masukkan judul pekerjaan..." />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Proyek Induk</label>
                  <select value={newJobForm.projectId} onChange={e => setNewJobForm({...newJobForm, projectId: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                  <select value={newJobForm.status} onChange={e => setNewJobForm({...newJobForm, status: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Urgensi</label>
                  <select value={newJobForm.urgency} onChange={e => setNewJobForm({...newJobForm, urgency: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tahun Pelaksanaan</label>
                  <input type="number" value={newJobForm.year} onChange={e => setNewJobForm({...newJobForm, year: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Timeline</label>
                  <input type="text" placeholder="Misal: 12-20 Agustus 2026" value={newJobForm.timeline} onChange={e => setNewJobForm({...newJobForm, timeline: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Komitmen (Beban/Waktu)</label>
                  <input type="text" placeholder="Misal: 10 Jam/Minggu, Full-time" value={newJobForm.komitmen} onChange={e => setNewJobForm({...newJobForm, komitmen: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Assignees (Pilih anggota tim)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {initialTeamMembers.map(member => (
                      <div 
                        key={member.id}
                        onClick={() => toggleAssignee(member.id, true)}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          newJobForm.assignees.includes(member.id) 
                            ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <img src={member.avatar} alt="" className="w-6 h-6 rounded-full bg-slate-100" />
                        <span className="text-sm font-medium text-slate-700 truncate">{member.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Deskripsi</label>
                  <textarea value={newJobForm.description} onChange={e => setNewJobForm({...newJobForm, description: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 min-h-[100px] resize-y" placeholder="Masukkan rincian singkat..." />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setIsAddJobModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors shadow-sm">
                  Simpan Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {isAddProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" /> Tambah Proyek Induk Baru
              </h2>
              <button onClick={() => setIsAddProjectModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveNewProject} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nama Proyek Induk *</label>
                <input type="text" required value={newProjectForm.title} onChange={e => setNewProjectForm({...newProjectForm, title: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" placeholder="Misal: Pengembangan Sistem HR..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tahun</label>
                  <input type="number" required value={newProjectForm.year} onChange={e => setNewProjectForm({...newProjectForm, year: parseInt(e.target.value)})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Urgensi Proyek</label>
                  <select value={newProjectForm.urgency} onChange={e => setNewProjectForm({...newProjectForm, urgency: e.target.value})} className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-indigo-500">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddProjectModalOpen(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-medium transition-colors shadow-sm">
                  Buat Proyek
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
