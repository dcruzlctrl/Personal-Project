// ===== PROJECTS VIEW COMPONENT =====
// Main projects dashboard with stats, project list, and management

const { useState, useEffect } = React;

import { projectsAPI, tasksAPI } from '../../js/api.js';
import { StatsOverview } from './StatsOverview.js';
import { ProjectCard } from './ProjectCard.js';
import { ProjectModal } from './ProjectModal.js';
import { ProjectDetailView } from './ProjectDetailView.js';

export const ProjectsView = ({ user }) => {
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [view, setView] = useState('list'); // 'list' or 'detail'

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const { data: projectsData } = await projectsAPI.fetchAll(user.id);
            setProjects(projectsData || []);
            
            // Load all tasks
            const projectIds = (projectsData || []).map(p => p.id);
            if (projectIds.length > 0) {
                const { data: tasksData } = await tasksAPI.fetchAll(projectIds);
                setTasks(tasksData || []);
            }
        } catch (err) {
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setView('detail');
    };

    const handleEditProject = (project) => {
        setSelectedProject(project);
        setShowProjectModal(true);
    };

    const handleBackToList = () => {
        setSelectedProject(null);
        setView('list');
        loadProjects();
    };

    const handleDeleteProject = async (projectId) => {
        if (window.confirm('Delete this project and all its tasks?')) {
            try {
                await projectsAPI.delete(projectId);
                loadProjects();
            } catch (err) {
                console.error('Error deleting project:', err);
            }
        }
    };

    if (loading) return <div className="loading">Loading projects...</div>;

    // Show detail view
    if (view === 'detail' && selectedProject) {
        return (
            <ProjectDetailView
                project={selectedProject}
                onBack={handleBackToList}
                onRefresh={loadProjects}
            />
        );
    }

    // Show projects list
    const getProjectTaskCount = (projectId) => {
        return tasks.filter(t => t.project_id === projectId).length;
    };

    return (
        <>
            {/* Stats Overview */}
            <StatsOverview projects={projects} tasks={tasks} />

            {/* Projects Header */}
            <div className="section-header">
                <h2>Projects</h2>
                <button 
                    className="btn-sm btn-sm-primary"
                    onClick={() => {
                        setSelectedProject(null);
                        setShowProjectModal(true);
                    }}
                >
                    + New Project
                </button>
            </div>

            {/* Project Modal */}
            {showProjectModal && (
                <ProjectModal
                    project={selectedProject ? { ...selectedProject, userId: user.id } : { userId: user.id }}
                    onClose={() => {
                        setShowProjectModal(false);
                        setSelectedProject(null);
                    }}
                    onRefresh={loadProjects}
                />
            )}

            {/* Projects List */}
            {projects.length === 0 ? (
                <div className="empty-state">
                    <h3>No projects yet</h3>
                    <p>Create your first project to get started</p>
                </div>
            ) : (
                <div className="grid">
                    {projects.map(project => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            taskCount={getProjectTaskCount(project.id)}
                            onSelect={handleSelectProject}
                            onEdit={handleEditProject}
                            onDelete={handleDeleteProject}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default ProjectsView;
