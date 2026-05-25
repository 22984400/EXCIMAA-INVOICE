import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Save, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';

type Task = {
  id: string;
  task_code: string;
  task_name: string;
  category: string;
  display_order: number;
  is_header: boolean;
};

type Assignment = {
  id: string;
  task_id: string;
  production_responsible: string[];
  supervision_responsible: string[];
  status: string;
  progress_percentage: number;
  completion_date: string | null;
  comments: string;
};

type TeamMember = {
  initials: string;
  full_name: string;
};

type Props = {
  clientId: string;
  missionTypeId: number;
};

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-50 text-slate-400 border-slate-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  n_a: 'bg-slate-800 text-white border-slate-900',
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Non commencé',
  in_progress: 'En cours',
  completed: 'Achevé',
  n_a: 'N/A',
};

export default function ClientMissionMatrix({ clientId, missionTypeId }: Props) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [existingNote, setExistingNote] = useState<{ id: string; note: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);

    const { data: taskData } = await supabase
      .from('audit_tasks')
      .select('*')
      .eq('mission_type_id', missionTypeId)
      .eq('is_active', true)
      .order('display_order');
    setTasks((taskData || []) as Task[]);

    const { data: assignData } = await supabase
      .from('audit_mission_assignments')
      .select('*')
      .eq('client_id', clientId)
      .eq('mission_type_id', missionTypeId);
    setAssignments((assignData || []) as Assignment[]);

    if ((assignData || []).length === 0 && (taskData || []).length > 0) {
      const inserts = (taskData as Task[]).map((t) => ({
        client_id: clientId,
        mission_type_id: missionTypeId,
        task_id: t.id,
        production_responsible: [],
        supervision_responsible: [],
        status: 'not_started',
        progress_percentage: 0,
        comments: '',
      }));
      const { data: newAssign } = await supabase
        .from('audit_mission_assignments')
        .insert(inserts)
        .select('*');
      setAssignments((newAssign || []) as Assignment[]);
    }

    const { data: members } = await supabase
      .from('team_members')
      .select('initials, full_name')
      .eq('is_active', true)
      .order('initials');
    setTeamMembers((members || []) as TeamMember[]);

    const { data: noteData } = await supabase
      .from('client_notes')
      .select('id, note')
      .eq('client_id', clientId)
      .eq('mission_type_id', missionTypeId)
      .maybeSingle();
    if (noteData) {
      setExistingNote({ id: noteData.id, note: noteData.note });
      setNoteText(noteData.note);
    } else {
      setExistingNote(null);
      setNoteText('');
    }

    setDirty(false);
    setLoading(false);
  }, [clientId, missionTypeId]);

  useEffect(() => { load(); }, [load]);

  function getAssignment(taskId: string): Assignment | undefined {
    return assignments.find((a) => a.task_id === taskId);
  }

  function updateAssignment(taskId: string, field: string, value: any) {
    setAssignments((prev) =>
      prev.map((a) => (a.task_id === taskId ? { ...a, [field]: value } : a))
    );
    setDirty(true);
  }

  function toggleInitial(arr: string[], initial: string): string[] {
    return arr.includes(initial) ? arr.filter((i) => i !== initial) : [...arr, initial];
  }

  function toggleCategory(cat: string) {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  async function handleSave() {
    setSaving(true);
    for (const a of assignments) {
      await supabase
        .from('audit_mission_assignments')
        .update({
          production_responsible: a.production_responsible,
          supervision_responsible: a.supervision_responsible,
          status: a.status,
          progress_percentage: a.progress_percentage,
          completion_date: a.completion_date || null,
          comments: a.comments,
          last_updated_by: user?.id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', a.id);
    }

    if (existingNote) {
      await supabase.from('client_notes').update({ note: noteText }).eq('id', existingNote.id);
    } else if (noteText.trim()) {
      const { data: newNote } = await supabase
        .from('client_notes')
        .insert({
          client_id: clientId,
          mission_type_id: missionTypeId,
          note: noteText,
          created_by: user?.id || null,
        })
        .select('id, note')
        .maybeSingle();
      if (newNote) setExistingNote({ id: newNote.id, note: newNote.note });
    }

    setDirty(false);
    setSaving(false);
  }

  // Progress calculation: 100% when all non-N/A cells are completed
  // Yellow cells contribute their percentage; green = 100%; black = excluded
  const nonNA = assignments.filter((a) => a.status !== 'n_a');
  const totalApplicable = nonNA.length;
  const totalProgress = nonNA.reduce((sum, a) => {
    if (a.status === 'completed') return sum + 100;
    if (a.status === 'in_progress') return sum + (a.progress_percentage || 0);
    return sum;
  }, 0);
  const overallPct = totalApplicable > 0 ? Math.round(totalProgress / totalApplicable) : 0;

  // Group tasks by category, preserving order
  const categories: string[] = [];
  const tasksByCategory: Record<string, Task[]> = {};
  for (const t of tasks) {
    if (!tasksByCategory[t.category]) {
      tasksByCategory[t.category] = [];
      categories.push(t.category);
    }
    tasksByCategory[t.category].push(t);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPct === 100 ? 'bg-green-500' : overallPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
            }`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <span className="text-sm font-bold text-slate-700">{overallPct}%</span>
        <span className="text-xs text-slate-400">
          {nonNA.filter((a) => a.status === 'completed').length}/{totalApplicable} achevées
        </span>
      </div>

      {/* Matrix table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-[#1e3a5f] text-white">
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider w-12">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Tâche</th>
              <th className="text-center px-2 py-3 font-semibold text-xs uppercase tracking-wider w-48">
                <div className="flex flex-col">
                  <span className="border-b border-white/20 pb-1 mb-1">Production</span>
                  <span>Supervision</span>
                </div>
              </th>
              <th className="text-center px-2 py-3 font-semibold text-xs uppercase tracking-wider w-28">Statut</th>
              <th className="text-center px-2 py-3 font-semibold text-xs uppercase tracking-wider w-20">%</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider">Commentaires</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const catTasks = tasksByCategory[cat] || [];
              const headerTask = catTasks.find((t) => t.is_header);
              const subTasks = catTasks.filter((t) => !t.is_header);
              const isCollapsed = collapsedCategories[cat] || false;

              return (
                <>
                  {/* Category header row */}
                  {headerTask && (
                    <tr
                      key={`header-${cat}`}
                      className="bg-[#1e3a5f]/5 cursor-pointer hover:bg-[#1e3a5f]/10 transition-colors"
                      onClick={() => toggleCategory(cat)}
                    >
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronRight size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                          <span className="font-bold text-slate-800 text-sm uppercase tracking-wide">{cat}</span>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Sub-tasks */}
                  {!isCollapsed && subTasks.map((task) => {
                    const a = getAssignment(task.id);
                    if (!a) return null;
                    const cellColor = STATUS_COLORS[a.status] || STATUS_COLORS.not_started;

                    return (
                      <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-slate-500">{task.task_code}</td>
                        <td className="px-4 py-2 text-slate-700 text-sm">{task.task_name}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            {/* Production */}
                            <div className="flex flex-wrap gap-0.5">
                              {teamMembers.map((m) => (
                                <button
                                  key={`p-${m.initials}`}
                                  onClick={() => updateAssignment(task.id, 'production_responsible', toggleInitial(a.production_responsible, m.initials))}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                    a.production_responsible.includes(m.initials)
                                      ? 'bg-[#1e3a5f] text-white shadow-sm'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={m.full_name}
                                >
                                  {m.initials}
                                </button>
                              ))}
                            </div>
                            {/* Supervision */}
                            <div className="flex flex-wrap gap-0.5">
                              {teamMembers.map((m) => (
                                <button
                                  key={`s-${m.initials}`}
                                  onClick={() => updateAssignment(task.id, 'supervision_responsible', toggleInitial(a.supervision_responsible, m.initials))}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                    a.supervision_responsible.includes(m.initials)
                                      ? 'bg-teal-600 text-white shadow-sm'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={m.full_name}
                                >
                                  {m.initials}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <select
                            value={a.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              updateAssignment(task.id, 'status', newStatus);
                              if (newStatus === 'completed') {
                                updateAssignment(task.id, 'progress_percentage', 100);
                              } else if (newStatus === 'not_started') {
                                updateAssignment(task.id, 'progress_percentage', 0);
                              }
                            }}
                            className={`text-xs font-medium rounded-lg px-2 py-1.5 border cursor-pointer w-full ${cellColor}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {a.status === 'in_progress' ? (
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={a.progress_percentage || 0}
                              onChange={(e) => updateAssignment(task.id, 'progress_percentage', parseInt(e.target.value) || 0)}
                              className="w-full text-center text-xs font-bold border border-yellow-300 rounded-lg px-1 py-1.5 bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                          ) : (
                            <span className={`text-xs font-bold ${a.status === 'completed' ? 'text-green-700' : a.status === 'n_a' ? 'text-slate-500' : 'text-slate-300'}`}>
                              {a.status === 'completed' ? '100' : a.status === 'n_a' ? '--' : '0'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={a.comments || ''}
                            onChange={(e) => updateAssignment(task.id, 'comments', e.target.value)}
                            placeholder="Note..."
                            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {/* If no header task but still a category, show tasks directly */}
                  {!headerTask && !isCollapsed && subTasks.length === 0 && catTasks.map((task) => {
                    const a = getAssignment(task.id);
                    if (!a) return null;
                    const cellColor = STATUS_COLORS[a.status] || STATUS_COLORS.not_started;
                    return (
                      <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-slate-500">{task.task_code}</td>
                        <td className="px-4 py-2 text-slate-700 text-sm">{task.task_name}</td>
                        <td className="px-2 py-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap gap-0.5">
                              {teamMembers.map((m) => (
                                <button
                                  key={`p-${m.initials}`}
                                  onClick={() => updateAssignment(task.id, 'production_responsible', toggleInitial(a.production_responsible, m.initials))}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                    a.production_responsible.includes(m.initials)
                                      ? 'bg-[#1e3a5f] text-white shadow-sm'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={m.full_name}
                                >
                                  {m.initials}
                                </button>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-0.5">
                              {teamMembers.map((m) => (
                                <button
                                  key={`s-${m.initials}`}
                                  onClick={() => updateAssignment(task.id, 'supervision_responsible', toggleInitial(a.supervision_responsible, m.initials))}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                                    a.supervision_responsible.includes(m.initials)
                                      ? 'bg-teal-600 text-white shadow-sm'
                                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                  }`}
                                  title={m.full_name}
                                >
                                  {m.initials}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <select
                            value={a.status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              updateAssignment(task.id, 'status', newStatus);
                              if (newStatus === 'completed') updateAssignment(task.id, 'progress_percentage', 100);
                              else if (newStatus === 'not_started') updateAssignment(task.id, 'progress_percentage', 0);
                            }}
                            className={`text-xs font-medium rounded-lg px-2 py-1.5 border cursor-pointer w-full ${cellColor}`}
                          >
                            {Object.entries(STATUS_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {a.status === 'in_progress' ? (
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={a.progress_percentage || 0}
                              onChange={(e) => updateAssignment(task.id, 'progress_percentage', parseInt(e.target.value) || 0)}
                              className="w-full text-center text-xs font-bold border border-yellow-300 rounded-lg px-1 py-1.5 bg-yellow-50 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                          ) : (
                            <span className={`text-xs font-bold ${a.status === 'completed' ? 'text-green-700' : a.status === 'n_a' ? 'text-slate-500' : 'text-slate-300'}`}>
                              {a.status === 'completed' ? '100' : a.status === 'n_a' ? '--' : '0'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={a.comments || ''}
                            onChange={(e) => updateAssignment(task.id, 'comments', e.target.value)}
                            placeholder="Note..."
                            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Client note */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={16} className="text-slate-400" />
          <h3 className="font-semibold text-slate-700 text-sm">Notes client</h3>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => { setNoteText(e.target.value); setDirty(true); }}
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Ajouter des notes pour ce client..."
        />
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4f7f] disabled:opacity-50 transition-all"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
