// ===== PROJECT DETAIL VIEW =====
function ProjectDetailView({ project, onBack }) {
    const [tasks, setTasks]               = React.useState([]);
    const [files, setFiles]               = React.useState([]);
    const [projectNotes, setProjectNotes] = React.useState([]);
    const [loading, setLoading]           = React.useState(true);
    const [showNewTaskModal, setShowNewTaskModal] = React.useState(false);

    React.useEffect(() => { loadData(); }, [project.id]);

    const loadData = async () => {
        try {
            const [td, fd, nd] = await Promise.all([
                supabase.from('tasks').select('*').eq('project_id', project.id),
                supabase.from('file_uploads').select('*').eq('project_id', project.id),
                supabase.from('project_notes').select('note_date, note')
                    .eq('project_id', project.id)
                    .neq('note', '')
                    .order('note_date', { ascending: false })
            ]);
            setTasks(td.data || []);
            setFiles(fd.data || []);
            setProjectNotes(nd.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="loading"><div className="spinner"></div>Loading project…</div>;

    return (
        <>
            <button className="back-btn" onClick={onBack}>← Back to Projects</button>

            <div className="page-header">
                <div>
                    <div className="page-title">{project.name}</div>
                    {project.description && <div className="page-subtitle">{project.description}</div>}
                </div>
                <button className="btn-action btn-action-primary" onClick={() => setShowNewTaskModal(true)}>
                    + Add Task
                </button>
            </div>

            <div className="section-label">Tasks</div>

            {tasks.length === 0 ? (
                <div className="empty" style={{ padding: '28px 0' }}>
                    <div className="empty-icon">✅</div>
                    <div className="empty-title">No tasks yet</div>
                    <div className="empty-desc">Add a task to track progress</div>
                </div>
            ) : (
                <div style={{ marginBottom: '24px' }}>
                    {tasks.map(task => (
                        <TaskItem key={task.id} task={task}
                            onDelete={() => deleteTask(task.id)}
                            onStatusChange={(s) => updateTaskStatus(task.id, s)}
                            onRefresh={loadData}
                        />
                    ))}
                </div>
            )}

            <div className="divider"></div>
            <div className="section-label">Daily Notes</div>

            {projectNotes.length === 0 ? (
                <div style={{ color: 'var(--text-subtle)', fontSize: '13px', padding: '10px 0 20px' }}>
                    No notes yet — add updates via 📝 Daily Notes in the nav.
                </div>
            ) : (
                <div className="proj-notes-list">
                    {projectNotes.map(n => {
                        const d = new Date(n.note_date + 'T12:00:00');
                        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                        return (
                            <div key={n.note_date} className="proj-note-entry">
                                <div className="proj-note-date">{label}</div>
                                <div className="proj-note-text">{n.note}</div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="divider"></div>
            <div className="section-label">Files</div>
            <FileUpload projectId={project.id} onUploadSuccess={loadData} />

            {files.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                    {files.map(f => (
                        <div key={f.id} className="file-item">
                            <a href={f.file_url} target="_blank" rel="noopener noreferrer">📄 {f.file_name}</a>
                            <button className="btn-sm btn-sm-danger" onClick={() => deleteFile(f.id)}>Delete</button>
                        </div>
                    ))}
                </div>
            )}

            {showNewTaskModal && (
                <NewTaskModal projectId={project.id}
                    onClose={() => setShowNewTaskModal(false)}
                    onSuccess={() => { setShowNewTaskModal(false); loadData(); }}
                />
            )}
        </>
    );

    async function deleteTask(id) {
        if (window.confirm('Delete this task?')) {
            await supabase.from('tasks').delete().eq('id', id);
            loadData();
        }
    }
    async function updateTaskStatus(id, status) {
        await supabase.from('tasks').update({ status }).eq('id', id);
        loadData();
    }
    async function deleteFile(id) {
        if (window.confirm('Delete this file?')) {
            await supabase.from('file_uploads').delete().eq('id', id);
            loadData();
        }
    }
}

// ===== TASK ITEM =====
function TaskItem({ task, onDelete, onStatusChange, onRefresh }) {
    const [showEdit, setShowEdit] = React.useState(false);
    const isCompleted = task.status === 'completed';

    return (
        <>
            <div className={`task-card ${isCompleted ? 'done' : ''}`}>
                <div className="task-row">
                    <div style={{ flex: 1 }}>
                        <div className="task-title">{task.title}</div>
                        {task.description && <div className="task-desc">{task.description}</div>}
                        <div className="task-meta">
                            {task.due_date && <span>Due: {formatESTDate(new Date(task.due_date))}</span>}
                            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                            <span className={`badge badge-${task.status}`}>{task.status}</span>
                        </div>
                    </div>
                    <div className="task-controls">
                        <select className="status-select" value={task.status} onChange={(e) => onStatusChange(e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button className="btn-sm btn-sm-warning" onClick={() => setShowEdit(true)}>Edit</button>
                        <button className="btn-sm btn-sm-danger"  onClick={onDelete}>Delete</button>
                    </div>
                </div>
            </div>
            {showEdit && (
                <EditTaskModal task={task}
                    onClose={() => setShowEdit(false)}
                    onSuccess={() => { setShowEdit(false); onRefresh(); }}
                />
            )}
        </>
    );
}

// ===== FILE UPLOAD =====
function FileUpload({ projectId, onUploadSuccess }) {
    const [loading, setLoading] = React.useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const fileName = `${projectId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('project-files').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data } = supabase.storage.from('project-files').getPublicUrl(fileName);
            await supabase.from('file_uploads').insert({
                project_id: projectId,
                file_name: file.name,
                file_size: file.size,
                file_type: file.type,
                file_url: data.publicUrl
            });
            onUploadSuccess();
            e.target.value = '';
        } catch (err) {
            console.error(err);
            alert('Error uploading file: ' + err.message);
        } finally { setLoading(false); }
    };

    return (
        <div className="upload-zone">
            <label>{loading ? '⏳ Uploading…' : '📎 Click to attach a file'}</label>
            <input type="file" onChange={handleFileChange} disabled={loading}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                style={{ width: '100%' }} />
        </div>
    );
}
