// ===== NEW PROJECT MODAL =====
function NewProjectModal({ user, onClose, onSuccess }) {
    const [name, setName]               = React.useState('');
    const [description, setDescription] = React.useState('');
    const [startDate, setStartDate]     = React.useState('');
    const [endDate, setEndDate]         = React.useState('');
    const [loading, setLoading]         = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const { error } = await supabase.from('projects').insert({
                user_id: user.id, name, description,
                start_date: startDate || null,
                end_date: endDate || null,
                status: 'active'
            });
            if (error) throw error;
            onSuccess();
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-head">
                    <div className="modal-title">New Project</div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Project Name *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HVAC Installation – Block C" required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description…" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" style={{margin:0}} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating…' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== EDIT PROJECT MODAL =====
function EditProjectModal({ project, onClose, onSuccess }) {
    const [name, setName]               = React.useState(project.name);
    const [description, setDescription] = React.useState(project.description || '');
    const [startDate, setStartDate]     = React.useState(project.start_date || '');
    const [endDate, setEndDate]         = React.useState(project.end_date || '');
    const [status, setStatus]           = React.useState(project.status);
    const [loading, setLoading]         = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const { error } = await supabase.from('projects')
                .update({ name, description, start_date: startDate || null, end_date: endDate || null, status })
                .eq('id', project.id);
            if (error) throw error;
            onSuccess();
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-head">
                    <div className="modal-title">Edit Project</div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Project Name *</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" style={{margin:0}} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Updating…' : 'Update Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== NEW TASK MODAL =====
function NewTaskModal({ projectId, onClose, onSuccess }) {
    const [title, setTitle]             = React.useState('');
    const [description, setDescription] = React.useState('');
    const [dueDate, setDueDate]         = React.useState('');
    const [priority, setPriority]       = React.useState('medium');
    const [loading, setLoading]         = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const { error } = await supabase.from('tasks').insert({
                project_id: projectId, title, description,
                due_date: dueDate || null, priority, status: 'pending'
            });
            if (error) throw error;
            onSuccess();
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-head">
                    <div className="modal-title">New Task</div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Task Title *</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Additional details…" />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Due Date</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" style={{margin:0}} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating…' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ===== EDIT TASK MODAL =====
function EditTaskModal({ task, onClose, onSuccess }) {
    const [title, setTitle]             = React.useState(task.title);
    const [description, setDescription] = React.useState(task.description || '');
    const [dueDate, setDueDate]         = React.useState(task.due_date || '');
    const [priority, setPriority]       = React.useState(task.priority);
    const [status, setStatus]           = React.useState(task.status);
    const [loading, setLoading]         = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true);
        try {
            const { error } = await supabase.from('tasks')
                .update({ title, description, due_date: dueDate || null, priority, status })
                .eq('id', task.id);
            if (error) throw error;
            onSuccess();
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-box">
                <div className="modal-head">
                    <div className="modal-title">Edit Task</div>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Task Title *</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Due Date</label>
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Status</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-ghost" style={{margin:0}} onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Updating…' : 'Update Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
