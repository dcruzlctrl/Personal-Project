// ===== PROJECT DETAIL VIEW COMPONENT =====
// Shows single project with all tasks, stats, and management

const { useState, useEffect } = React;

import { projectsAPI, tasksAPI } from '../../js/api.js';
import { calculateProjectStats, getStatusBadge, formatDate } from '../../js/services.js';
import { TaskCard } from './TaskCard.js';
import { TaskModal } from './TaskModal.js';
import { ProjectModal } from './ProjectModal.js';

export const ProjectDetailView = ({ project, onBack, onRefresh }) => {
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        loadTasks();
    }, [project.id]);

    const loadTasks = async () => {
        try {
            const { data } = await tasksAPI.fetchByProject(project.id);
            const taskData = data || [];
            setTasks(taskData);
            setStats(calculateProjectStats(taskData));
        } catch (err) {
            console.error('Error loading tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTask = () => {
        setSelectedTask(null);
        setShowTaskModal(true);
    };

    const handleEditTask = (task) => {
        setSelectedTask(task);
        setShowTaskModal(true);
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Delete this task?')) {
            try {
                await tasksAPI.delete(taskId);
                loadTasks();
            } catch (err) {
                console.error('Error deleting task:', err);
            }
        }
    };

    const handleDeleteProject = async () => {
        if (window.confirm('Delete this project and all its tasks?')) {
            try {
                await projectsAPI.delete(project.id);
                onRefresh();
                onBack();
            } catch (err) {
                console.error('Error deleting project:', err);
            }
        }
    };

    if (loading) return <div className="loading">Loading project...</div>;

    const badge = getStatusBadge(project.status);

    return (
        <div>
            {/* Header with back button */}
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                    className="btn-sm btn-sm-secondary"
                    onClick={onBack}
                    style={{ padding: '8px 16px' }}
                >
                    ← Back
                </button>
                <h1 style={{ flex: 1, margin: 0 }}>{project.name}</h1>
                <button 
                    className="btn-sm btn-sm-edit"
                    onClick={() => setShowProjectModal(true)}
                >
                    Edit
                </button>
                <button 
                    className="btn-sm btn-sm-danger"
                    onClick={handleDeleteProject}
                >
                    Delete
                </button>
            </div>

            {/* Project Info */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span 
                        className="badge"
                        style={{
                            background: badge.color,
                            color: badge.text,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}
                    >
                        {badge.label}
                    </span>
                    {project.end_date && (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                            Due: {formatDate(project.end_date)}
                        </span>
                    )}
                </div>
                {project.description && (
                    <p style={{ color: '#6b7280', marginBottom: '12px', lineHeight: '1.6' }}>
                        {project.description}
                    </p>
                )}
            </div>

            {/* Stats */}
            {stats && (
                <div className="stats-section" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-number">{stats.total}</div>
                        <div className="stat-label">Total Tasks</div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-number">{stats.pending}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card in-progress">
                        <div className="stat-number">{stats.inProgress}</div>
                        <div className="stat-label">In Progress</div>
                    </div>
                    <div className="stat-card completed">
                        <div className="stat-number">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.completionRate}%</div>
                        <div className="stat-label">Completion</div>
                    </div>
                </div>
            )}

            {/* Tasks Section */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0 }}>Tasks</h2>
                    <button className="btn-sm btn-sm-primary" onClick={handleAddTask}>
                        + Add Task
                    </button>
                </div>

                {tasks.length === 0 ? (
                    <div className="empty-state">
                        <p>No tasks yet. Create one to get started!</p>
                    </div>
                ) : (
                    <div>
                        {tasks.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onSelect={() => handleEditTask(task)}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {showTaskModal && (
                <TaskModal
                    task={selectedTask}
                    projectId={project.id}
                    onClose={() => setShowTaskModal(false)}
                    onRefresh={loadTasks}
                />
            )}

            {showProjectModal && (
                <ProjectModal
                    project={project}
                    onClose={() => setShowProjectModal(false)}
                    onRefresh={() => {
                        setShowProjectModal(false);
                        onRefresh();
                    }}
                />
            )}
        </div>
    );
};

export default ProjectDetailView;
