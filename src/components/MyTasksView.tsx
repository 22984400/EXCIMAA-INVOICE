import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import MissionTypeSelector from './MissionTypeSelector';
import { Check, Clock, Minus, X, FileText } from 'lucide-react';

type TaskRow = {
  assignment_id: string;
  task_code: string;
  task_name: string;
  category: string;
  client_name: string;
  client_code: string;
  client_id: string;
  status: string;
  progress_percentage: number;
  completion_date: string | null;
  comments: string;
};

type Props = {
  missionTypeId: number;
  onMissionTypeChange: (id: number) => void;
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Check; color: string; bg: string }> = {
  not_started: { label: 'Non commencé', icon: Minus, color: 'text-slate-600', bg: 'bg-slate-50' },
  in_progress: { label: 'En cours', icon: Clock, color: 'text-yellow-800', bg: 'bg-yellow-100' },
  completed: { label: 'Achevé', icon: Check, color: 'text-green-800', bg: 'bg-green-100' },
  n_a: { label: 'N/A', icon: X, color: 'text-white', bg: 'bg-slate-800' },
};

export default function MyTasksView({ missionTypeId, onMissionTypeChange }: Props) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      if (!profile?.initials) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const initials = profile.initials;

      // Get assignments where user is in production or supervision
      const { data: prodData } = await supabase
        .from('audit_mission_assignments')
        .select('id, task_id, client_id, status, progress_percentage, completion_date, comments')
        .eq('mission_type_id', missionTypeId)
        .overlaps('production_responsible', [initials]);

      const { data: supervData } = await supabase
        .from('audit_mission_assignments')
        .select('id, task_id, client_id, status, progress_percentage, completion_date, comments')
        .eq('mission_type_id', missionTypeId)
        .overlaps('supervision_responsible', [initials]);

      const allAssignments = [...(prodData || []), ...(supervData || [])];
      const seen = new Set<string>();
      const unique = allAssignments.filter((a) => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });

      if (unique.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const taskIds = unique.map((a) => a.task_id);
      const clientIds = unique.map((a) => a.client_id);

      const [taskRes, clientRes] = await Promise.all([
        supabase.from('audit_tasks').select('id, task_code, task_name, category').in('id', taskIds),
        supabase.from('clients').select('id, name, client_code').in('id', clientIds),
      ]);

      const taskMap = Object.fromEntries((taskRes.data || []).map((t) => [t.id, t]));
      const clientMap = Object.fromEntries((clientRes.data || []).map((c) => [c.id, c]));

      const rows: TaskRow[] = unique.map((a) => {
        const task = taskMap[a.task_id] || { task_code: '?', task_name: 'Inconnu', category: '' };
        const client = clientMap[a.client_id] || { name: 'Inconnu', client_code: '?', id: a.client_id };
        return {
          assignment_id: a.id,
          task_code: task.task_code,
          task_name: task.task_name,
          category: task.category,
          client_name: client.name,
          client_code: client.client_code,
          client_id: client.id,
          status: a.status,
          progress_percentage: a.progress_percentage || 0,
          completion_date: a.completion_date,
          comments: a.comments,
        };
      });

      setTasks(rows);
      setLoading(false);
    }
    load();
  }, [missionTypeId, profile?.initials]);

  const filtered = statusFilter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === statusFilter);

  const counts = {
    all: tasks.length,
    not_started: tasks.filter((t) => t.status === 'not_started').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Mes tâches</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {profile?.initials && (
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs mr-2">
                {profile.initials}
              </span>
            )}
            Tâches qui vous sont assignées
          </p>
        </div>
        <MissionTypeSelector selected={missionTypeId} onChange={onMissionTypeChange} />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { key: 'all', label: `Toutes (${counts.all})` },
          { key: 'not_started', label: `Non commencé (${counts.not_started})` },
          { key: 'in_progress', label: `En cours (${counts.in_progress})` },
          { key: 'completed', label: `Achevé (${counts.completed})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === key
                ? 'bg-white shadow text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucune tâche trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((t) => {
              const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG.not_started;
              const Icon = sc.icon;
              return (
                <div key={t.assignment_id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc.bg} ${sc.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{t.task_code}</span>
                      <span className="font-medium text-slate-800 text-sm truncate">{t.task_name}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {t.client_name} · {t.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
                      {t.status === 'in_progress' ? `${t.progress_percentage}%` : sc.label}
                    </span>
                    {t.completion_date && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(t.completion_date).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
