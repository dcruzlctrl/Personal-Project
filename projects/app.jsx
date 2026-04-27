// ===== DAILY NOTES VIEW (full-screen overlay) =====
function DailyNotesView({ user, projects, onClose }) {
    const [viewDate, setViewDate] = React.useState(getNYCDate());
    const [notes, setNotes]       = React.useState({});
    const [saving, setSaving]     = React.useState({});

    React.useEffect(() => { loadNotes(); }, [viewDate, projects.length]);

    // Close on Escape
    React.useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const loadNotes = async () => {
        if (!projects.length) return;
        const { data } = await supabase
            .from('project_notes')
            .select('project_id, note')
            .eq('user_id', user.id)
            .eq('note_date', viewDate);
        const map = {};
        (data || []).forEach(r => { map[r.project_id] = r.note; });
        setNotes(map);
    };

    const saveNote = async (projectId, value) => {
        setNotes(prev => ({ ...prev, [projectId]: value }));
        setSaving(prev => ({ ...prev, [projectId]: true }));
        await supabase.from('project_notes').upsert({
            user_id: user.id,
            project_id: projectId,
            note_date: viewDate,
            note: value,
            updated_at: new Date().toISOString()
        }, { onConflict: 'project_id,note_date' });
        setSaving(prev => ({ ...prev, [projectId]: false }));
    };

    const shiftDate = (delta) => {
        const d = new Date(viewDate + 'T12:00:00');
        d.setDate(d.getDate() + delta);
        setViewDate([d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-'));
    };

    const isToday = viewDate === getNYCDate();

    const displayDate = (() => {
        const d = new Date(viewDate + 'T12:00:00');
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    })();

    return (
        <div className="dn-fullscreen">
            <div className="dn-fs-header">
                <div className="dn-fs-left">
                    <span className="dn-fs-title">📝 Daily Notes</span>
                    <button className="dn-nav-btn" onClick={() => shiftDate(-1)}>← Prev</button>
                    <span className="dn-date-label">{displayDate}</span>
                    {!isToday && (
                        <button className="dn-today-btn" onClick={() => setViewDate(getNYCDate())}>Today</button>
                    )}
                    <button className="dn-nav-btn" onClick={() => shiftDate(1)} disabled={isToday}>Next →</button>
                </div>
                <button className="dn-close-btn" onClick={onClose} title="Close (Esc)">✕ Close</button>
            </div>

            <div className="dn-fs-body">
                <div className="dn-table">
                    <div className="dn-table-head">
                        <div className="dn-col-project">Project</div>
                        <div className="dn-col-note">Notes / Updates</div>
                    </div>
                    <div className="dn-table-body">
                        {projects.map(p => (
                            <div key={p.id} className="dn-row">
                                <div className="dn-col-project">
                                    <span className={`dn-project-name ${p.status !== 'active' ? 'dn-inactive' : ''}`}>{p.name}</span>
                                    {p.status !== 'active' && <span className="dn-status-tag">{p.status}</span>}
                                </div>
                                <div className="dn-col-note">
                                    <textarea
                                        className="dn-textarea"
                                        value={notes[p.id] || ''}
                                        onChange={(e) => saveNote(p.id, e.target.value)}
                                        placeholder="Add update…"
                                    />
                                    {saving[p.id] && <span className="dn-saving">saving…</span>}
                                </div>
                            </div>
                        ))}
                        {projects.length === 0 && (
                            <div className="dn-empty">No projects yet. Add some projects first.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== ADD PROJECT INLINE ROW =====
function AddProjectRow({ user, onSuccess }) {
    const [name, setName] = React.useState('');
    const [saving, setSaving] = React.useState(false);

    const submit = async () => {
        const trimmed = name.trim();
        if (!trimmed || saving) return;
        setSaving(true);
        try {
            await supabase.from('projects').insert({
                user_id: user.id, name: trimmed,
                description: '', status: 'active'
            });
            setName('');
            onSuccess();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div className="list-add-row">
            <input
                className="list-add-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder="New project name…"
                disabled={saving}
                autoFocus
            />
            <span className="list-add-hint">↵ Enter to add</span>
        </div>
    );
}

// ===== MAIN APP =====
function App() {
    const [user, setUser]               = React.useState(null);
    const [loading, setLoading]         = React.useState(true);
    const [view, setView]               = React.useState('projects');
    const [selectedProject, setSelectedProject] = React.useState(null);
    const [allProjects, setAllProjects] = React.useState([]);
    const [showDailyNotes, setShowDailyNotes] = React.useState(false);

    React.useEffect(() => {
        checkUser();
        const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
            setUser(session?.user || null);
        });
        return () => authListener?.subscription?.unsubscribe();
    }, []);

    const checkUser = async () => {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
        setLoading(false);
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading…</div>;
    if (!user)   return <AuthPage onLogin={(u) => setUser(u)} icon="📊" appName="Project Dashboard" signInSub="Sign in to your workspace" signUpSub="Start tracking your projects" />;

    return (
        <div className="dashboard">
            <nav className="navbar">
                <div className="nav-brand">
                    <div className="nav-brand-icon">📊</div>
                    <span className="nav-brand-text">Dashboard</span>
                </div>
                <div className="nav-right">
                    {view !== 'projects' && (
                        <button className="nav-link" onClick={() => setView('projects')}>← Projects</button>
                    )}
                    <button
                        className={`nav-link ${showDailyNotes ? 'nav-link-active' : ''}`}
                        onClick={() => setShowDailyNotes(v => !v)}
                    >📝 Daily Notes</button>
                    <a href="habits.html" className="nav-link">🎯 Habits</a>
                    <a href="crossword.html" className="nav-link">🧩 Crossword</a>
                    <a href="dnd-crosswords/index.html" className="nav-link">🐉 D&D Crossword</a>
                    <button className="nav-link-danger" onClick={handleLogout}>Sign out</button>
                </div>
            </nav>
            <div className="content">
                {view === 'projects' && (
                    <ProjectsView user={user}
                        onSelectProject={(p) => { setSelectedProject(p); setView('project-detail'); }}
                        onProjectsLoaded={setAllProjects}
                    />
                )}
                {view === 'project-detail' && (
                    <ProjectDetailView project={selectedProject} onBack={() => setView('projects')} />
                )}
            </div>
            {showDailyNotes && (
                <DailyNotesView user={user} projects={allProjects} onClose={() => setShowDailyNotes(false)} />
            )}
        </div>
    );

    async function handleLogout() {
        await supabase.auth.signOut();
        setUser(null);
    }
}

// ===== PROJECTS VIEW =====
function ProjectsView({ user, onSelectProject, onProjectsLoaded }) {
    const [projects, setProjects]           = React.useState([]);
    const [loading, setLoading]             = React.useState(true);
    const [showNewModal, setShowNewModal]   = React.useState(false);
    const [viewMode, setViewMode]           = React.useState(() => localStorage.getItem('projectViewMode') || 'grid');
    const [projectSortBy, setProjectSortBy] = React.useState(() => {
        return localStorage.getItem('projectSortBy') || 'created';
    });
    const [stats, setStats] = React.useState({
        activeProjects: 0, totalTasks: 0,
        pendingTasks: 0, inProgressTasks: 0,
        completedTasks: 0, upcomingTasks: 0
    });

    React.useEffect(() => { loadProjects(); }, []);

    React.useEffect(() => {
        localStorage.setItem('projectSortBy', projectSortBy);
    }, [projectSortBy]);

    React.useEffect(() => {
        localStorage.setItem('projectViewMode', viewMode);
    }, [viewMode]);

    const loadProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects').select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setProjects(data || []);
            if (onProjectsLoaded) onProjectsLoaded(data || []);

            const ids = (data || []).map(p => p.id);
            if (ids.length > 0) {
                const { data: td, error: te } = await supabase
                    .from('tasks').select('status, due_date').in('project_id', ids);
                if (!te && td) {
                    const today = new Date();
                    const in7 = new Date(today.getTime() + 7 * 864e5);
                    setStats({
                        activeProjects: data.filter(p => p.status === 'active').length,
                        totalTasks: td.length,
                        pendingTasks: td.filter(t => t.status === 'pending').length,
                        inProgressTasks: td.filter(t => t.status === 'in-progress').length,
                        completedTasks: td.filter(t => t.status === 'completed').length,
                        upcomingTasks: td.filter(t => {
                            if (!t.due_date || t.status === 'completed') return false;
                            const d = new Date(t.due_date);
                            return d >= today && d <= in7;
                        }).length
                    });
                }
            } else {
                setStats({ activeProjects: 0, totalTasks: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, upcomingTasks: 0 });
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const getSortedProjects = () => {
        const sorted = [...projects];
        const taskCounts = {};
        projects.forEach(p => {
            taskCounts[p.id] = (p.tasks && p.tasks.length) || 0;
        });
        switch (projectSortBy) {
            case 'tasks':
                return sorted.sort((a, b) => (taskCounts[b.id] || 0) - (taskCounts[a.id] || 0));
            case 'name':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'created':
            default:
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading projects…</div>;

    return (
        <>
            <div className="page-header">
                <div>
                    <div className="page-title">Projects</div>
                    <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select
                        value={projectSortBy}
                        onChange={(e) => setProjectSortBy(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '13px', cursor: 'pointer' }}
                    >
                        <option value="created">Newest</option>
                        <option value="tasks">Most Tasks</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                    <div className="view-toggle">
                        <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">⊞</button>
                        <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title="List view">☰</button>
                    </div>
                    {viewMode === 'grid' && (
                        <button className="btn-action btn-action-primary" onClick={() => setShowNewModal(true)}>
                            + New Project
                        </button>
                    )}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card c-blue">  <div className="stat-num">{stats.activeProjects}</div>  <div className="stat-lbl">Active</div></div>
                <div className="stat-card">          <div className="stat-num">{stats.totalTasks}</div>      <div className="stat-lbl">Total Tasks</div></div>
                <div className="stat-card c-amber"> <div className="stat-num">{stats.pendingTasks}</div>    <div className="stat-lbl">Pending</div></div>
                <div className="stat-card c-sky">   <div className="stat-num">{stats.inProgressTasks}</div> <div className="stat-lbl">In Progress</div></div>
                <div className="stat-card c-green"> <div className="stat-num">{stats.completedTasks}</div>  <div className="stat-lbl">Completed</div></div>
                <div className="stat-card c-red">   <div className="stat-num">{stats.upcomingTasks}</div>   <div className="stat-lbl">Due in 7 Days</div></div>
            </div>

            {viewMode === 'grid' ? (
                projects.length === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No projects yet</div>
                        <div className="empty-desc">Create your first project to get started</div>
                    </div>
                ) : (
                    <div className="cards-grid">
                        {getSortedProjects().map(p => (
                            <ProjectCard key={p.id} project={p}
                                onSelect={() => onSelectProject(p)}
                                onDelete={() => deleteProject(p.id)}
                                onRefresh={loadProjects}
                            />
                        ))}
                    </div>
                )
            ) : (
                <div className="projects-list">
                    {getSortedProjects().map(p => (
                        <ProjectListItem key={p.id} project={p}
                            onSelect={() => onSelectProject(p)}
                            onDelete={() => deleteProject(p.id)}
                            onRefresh={loadProjects}
                        />
                    ))}
                    <AddProjectRow user={user} onSuccess={loadProjects} />
                </div>
            )}

            {showNewModal && (
                <NewProjectModal user={user}
                    onClose={() => setShowNewModal(false)}
                    onSuccess={() => { setShowNewModal(false); loadProjects(); }}
                />
            )}
        </>
    );

    async function deleteProject(id) {
        if (window.confirm('Delete this project?')) {
            await supabase.from('projects').delete().eq('id', id);
            loadProjects();
        }
    }
}

// ===== PROJECT LIST ITEM =====
function ProjectListItem({ project, onSelect, onDelete, onRefresh }) {
    const [taskCount, setTaskCount]         = React.useState(0);
    const [showEditModal, setShowEditModal] = React.useState(false);

    React.useEffect(() => {
        supabase.from('tasks').select('*', { count: 'exact' })
            .eq('project_id', project.id)
            .then(({ count }) => setTaskCount(count || 0));
    }, [project.id]);

    return (
        <>
            <div className="project-list-item" onClick={onSelect}>
                <div className="list-item-name">{project.name}</div>
                <div className="list-item-meta">
                    <span className={`badge badge-${project.status}`}>{project.status}</span>
                    <span className="card-meta-text">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                    {project.end_date && (
                        <span className="card-meta-text">· Due {formatESTDate(new Date(project.end_date))}</span>
                    )}
                </div>
                <div className="list-item-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-sm btn-sm-warning" onClick={() => setShowEditModal(true)}>Edit</button>
                    <button className="btn-sm btn-sm-danger"  onClick={onDelete}>Delete</button>
                </div>
            </div>
            {showEditModal && (
                <EditProjectModal project={project}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => { setShowEditModal(false); onRefresh(); }}
                />
            )}
        </>
    );
}

// ===== PROJECT CARD =====
function ProjectCard({ project, onSelect, onDelete, onRefresh }) {
    const [taskCount, setTaskCount]       = React.useState(0);
    const [showEditModal, setShowEditModal] = React.useState(false);

    React.useEffect(() => {
        supabase.from('tasks').select('*', { count: 'exact' })
            .eq('project_id', project.id)
            .then(({ count }) => setTaskCount(count || 0));
    }, [project.id]);

    return (
        <>
            <div className="project-card" onClick={onSelect}>
                <div className="card-title">{project.name}</div>
                <div className="card-desc">{project.description || 'No description'}</div>
                <div className="card-footer">
                    <div className="card-meta">
                        <span className={`badge badge-${project.status}`}>{project.status}</span>
                        <span className="card-meta-text">{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                        {project.end_date && (
                            <span className="card-meta-text">· Due {formatESTDate(new Date(project.end_date))}</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-sm btn-sm-warning" onClick={(e) => { e.stopPropagation(); setShowEditModal(true); }}>Edit</button>
                        <button className="btn-sm btn-sm-danger"  onClick={(e) => { e.stopPropagation(); onDelete(); }}>Delete</button>
                    </div>
                </div>
            </div>
            {showEditModal && (
                <EditProjectModal project={project}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => { setShowEditModal(false); onRefresh(); }}
                />
            )}
        </>
    );
}

// Render app
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
