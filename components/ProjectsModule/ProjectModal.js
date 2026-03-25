// ===== PROJECT MODAL COMPONENT =====
// Create/edit project modal with form validation

const { useState, useEffect } = React;

import { projectsAPI } from '../../js/api.js';
import { getCurrentNYCDate } from '../../js/services.js';

export const ProjectModal = ({ project, onClose, onRefresh }) => {
    const [formData, setFormData] = useState({
        name: project?.name || '',
        description: project?.description || '',
        startDate: project?.start_date || getCurrentNYCDate(),
        endDate: project?.end_date || '',
        status: project?.status || 'active'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            setError('Project name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (project?.id) {
                // Edit existing
                await projectsAPI.update(project.id, {
                    name: formData.name,
                    description: formData.description,
                    end_date: formData.endDate,
                    status: formData.status
                });
            } else {
                // Create new
                await projectsAPI.create(
                    project.userId,
                    formData.name,
                    formData.description,
                    formData.startDate,
                    formData.endDate
                );
            }
            
            onRefresh();
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save project');
            console.error('Error saving project:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{project?.id ? 'Edit Project' : 'New Project'}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {error && <div className="error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Project Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="e.g., Website Redesign"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="What is this project about?"
                            style={{ minHeight: '80px' }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                disabled={!!project?.id}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                            />
                        </div>

                        <div className="form-group" style={{ flex: 1 }}>
                            <label>End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                            />
                        </div>
                    </div>

                    {project?.id && (
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="submit" className="btn-modal-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Project'}
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

export default ProjectModal;
