// ===== PROJECT CARD COMPONENT =====
// Individual project card with status, description, and quick actions

import { getStatusBadge, formatDate } from '../../js/services.js';

export const ProjectCard = ({ project, taskCount, onSelect, onEdit, onDelete }) => {
    const badge = getStatusBadge(project.status);
    const daysUntilEnd = project.end_date ? 
        Math.ceil((new Date(project.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : 
        null;

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <h3 style={{ flex: 1 }}>{project.name}</h3>
                <span 
                    className="badge"
                    style={{
                        background: badge.color,
                        color: badge.text,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {badge.label}
                </span>
            </div>

            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px', lineHeight: '1.5' }}>
                {project.description || 'No description'}
            </p>

            <div className="card-meta">
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    <div>{taskCount || 0} tasks</div>
                    {project.end_date && (
                        <div>{daysUntilEnd > 0 ? `${daysUntilEnd} days left` : 'Overdue'}</div>
                    )}
                </div>
                <div className="card-actions">
                    <button 
                        className="btn-sm btn-sm-edit"
                        onClick={() => onSelect(project)}
                    >
                        View
                    </button>
                    <button 
                        className="btn-sm btn-sm-edit"
                        onClick={() => onEdit(project)}
                    >
                        Edit
                    </button>
                    <button 
                        className="btn-sm btn-sm-danger"
                        onClick={() => onDelete(project.id)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
