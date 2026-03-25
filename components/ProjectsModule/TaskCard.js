// ===== TASK CARD COMPONENT =====
// Individual task card with title, priority, due date, and status

import { getStatusBadge, getPriorityColor, formatDate, isTaskOverdue } from '../../js/services.js';

export const TaskCard = ({ task, onSelect, onStatusChange, onDelete }) => {
    const statusBadge = getStatusBadge(task.status);
    const priorityColor = getPriorityColor(task.priority);
    const overdue = isTaskOverdue(task.due_date, task.status);

    return (
        <div className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                {/* Priority indicator */}
                <div 
                    style={{
                        width: '4px',
                        height: '40px',
                        background: priorityColor,
                        borderRadius: '2px',
                        flexShrink: 0
                    }}
                />
                
                <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '4px', color: '#0f172a' }}>{task.title}</h4>
                    {task.description && (
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                            {task.description.substring(0, 80)}...
                        </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Status badge */}
                        <span 
                            className="badge"
                            style={{
                                background: statusBadge.color,
                                color: statusBadge.text,
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600'
                            }}
                        >
                            {statusBadge.label}
                        </span>

                        {/* Due date */}
                        {task.due_date && (
                            <span style={{
                                fontSize: '11px',
                                color: overdue ? '#ef4444' : '#6b7280',
                                fontWeight: overdue ? '600' : '400'
                            }}>
                                {overdue ? '⚠️' : '📅'} {formatDate(task.due_date)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="card-actions" style={{ marginTop: '4px' }}>
                    <button 
                        className="btn-sm btn-sm-edit"
                        onClick={() => onSelect(task)}
                    >
                        Edit
                    </button>
                    <button 
                        className="btn-sm btn-sm-danger"
                        onClick={() => onDelete(task.id)}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;
