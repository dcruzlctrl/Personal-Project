// ===== TASK MODAL COMPONENT =====
// Create/edit task modal with form and validation

const { useState } = React;

import { tasksAPI } from '../../js/api.js';
import { TASK_PRIORITY } from '../../js/config.js';

export const TaskModal = ({ task, projectId, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        title: task?.title || '',
        description: task?.description || '',
        dueDate: task?.due_date || '',
        priority: task?.priority || TASK_PRIORITY.MEDIUM,
        status: task?.status || 'pending'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) {
            setError('Task title is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (task?.id) {
                // Edit existing
                await tasksAPI.update(task.id, {
                    title: formData.title,
                    description: formData.description,
                    due_date: formData.dueDate,
                    priority: formData.priority,
                    status: formData.status
                });
            } else {
                // Create new
                await tasksAPI.create(
                    projectId,
                    formData.title,
                    formData.description,
                    formData.dueDate,
                    formData.priority
                );
            }
            
            onRefresh();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save task');
            console.error('Error saving task:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{task?.id ? 'Edit Task' : 'New Task'}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Task Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="What needs to be done?"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Details about this task..."
                            style={{ minHeight: '80px' }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Due Date</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => handleChange('dueDate', e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Priority</label>
                            <select
                                value={formData.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>

                    {task?.id && (
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="submit" className="btn-modal-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Task'}
                        </button>
                        <button type="button" className="btn-modal-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaskModal;
