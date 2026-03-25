// ===== STATS OVERVIEW COMPONENT =====
// Shows key metrics: active projects, tasks by status, upcoming due dates

const { useState, useEffect } = React;

export const StatsOverview = ({ projects, tasks }) => {
    const [stats, setStats] = useState({
        activeProjects: 0,
        totalTasks: 0,
        pendingTasks: 0,
        inProgressTasks: 0,
        completedTasks: 0,
        upcomingTasks: 0
    });

    useEffect(() => {
        calculateStats();
    }, [projects, tasks]);

    const calculateStats = () => {
        const today = new Date();
        const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const activeProjects = projects.filter(p => p.status === 'active').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in-progress').length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        
        const upcoming = tasks.filter(t => {
            if (!t.due_date || t.status === 'completed') return false;
            const dueDate = new Date(t.due_date);
            return dueDate >= today && dueDate <= sevenDaysFromNow;
        }).length;

        setStats({
            activeProjects,
            totalTasks: tasks.length,
            pendingTasks: pending,
            inProgressTasks: inProgress,
            completedTasks: completed,
            upcomingTasks: upcoming
        });
    };

    return (
        <div className="stats-section">
            <div className="stat-card projects">
                <div className="stat-number">{stats.activeProjects}</div>
                <div className="stat-label">Active Projects</div>
            </div>
            <div className="stat-card">
                <div className="stat-number">{stats.totalTasks}</div>
                <div className="stat-label">Total Tasks</div>
            </div>
            <div className="stat-card pending">
                <div className="stat-number">{stats.pendingTasks}</div>
                <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card in-progress">
                <div className="stat-number">{stats.inProgressTasks}</div>
                <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card completed">
                <div className="stat-number">{stats.completedTasks}</div>
                <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card upcoming">
                <div className="stat-number">{stats.upcomingTasks}</div>
                <div className="stat-label">Due in 7 Days</div>
            </div>
        </div>
    );
};

export default StatsOverview;
