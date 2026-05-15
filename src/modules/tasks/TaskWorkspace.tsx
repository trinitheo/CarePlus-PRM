import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar, 
  Filter,
  MoreVertical,
  CheckCircle2,
  ListTodo,
  Flag
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';
import { subscribeToCollection } from '../../services/clinicalFirestoreService';
import { updateTaskStatus, InternalTask } from '../../services/taskService';

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<InternalTask[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    return subscribeToCollection('tasks', (data) => {
      setTasks(data);
    });
  }, []);

  const getPriorityColor = (priority: InternalTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'high': return 'text-amber-600 bg-amber-50 border-amber-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending' || t.status === 'in_progress';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 font-segoe">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <ListTodo className="h-8 w-8 text-[#0078D4]" />
            Workflow & Tasks
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">Operational checklists and assigned clinical tasks</p>
        </div>
        <Button className="bg-[#0078D4] hover:bg-[#005A9E] text-white font-black h-12 rounded-xl px-6 gap-2">
          <Plus className="h-5 w-5" />
          New Task
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-[#FAFAFA] p-2 rounded-2xl border border-[#EDEBE9] w-fit">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white shadow-sm text-[#242424]' : 'text-[#A19F9D] hover:text-[#616161]'}`}
        >
          Active View
        </button>
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'pending' ? 'bg-white shadow-sm text-[#242424]' : 'text-[#A19F9D] hover:text-[#616161]'}`}
        >
          Pending
        </button>
        <button 
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'completed' ? 'bg-white shadow-sm text-[#242424]' : 'text-[#A19F9D] hover:text-[#616161]'}`}
        >
          Completed
        </button>
      </div>

      <div className="space-y-4">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-5">
                <button 
                  onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                  className={`mt-1 h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500' : 'border-[#EDEBE9] hover:border-[#0078D4]'}`}
                >
                  {task.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-white" />}
                </button>
                <div>
                  <h3 className={`text-lg font-black tracking-tight ${task.status === 'completed' ? 'text-[#A19F9D] line-through' : 'text-[#242424]'}`}>
                    {task.title}
                  </h3>
                  <p className="text-sm font-medium text-[#616161] mt-1 line-clamp-1">{task.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                     <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 border ${getPriorityColor(task.priority)}`}>
                        <Flag className="h-3 w-3 mr-1.5" />
                        {task.priority} Priority
                     </Badge>
                     <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#A19F9D] uppercase tracking-wider">
                        <Calendar className="h-3.5 w-3.5" />
                        Due Today
                     </div>
                     <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0078D4] uppercase tracking-wider bg-[#DEECF9] px-2.5 py-0.5 rounded-lg border border-[#CFE4FA]">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {task.category}
                     </div>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10 text-[#A19F9D] hover:bg-[#F3F2F1] rounded-xl">
                 <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="py-24 text-center">
             <div className="h-20 w-20 bg-[#FAFAFA] rounded-3xl border-2 border-dashed border-[#EDEBE9] flex items-center justify-center mx-auto mb-6">
                <CheckSquare className="h-8 w-8 text-[#A19F9D]" />
             </div>
             <h3 className="text-xl font-black text-[#242424]">Clear Workspace</h3>
             <p className="text-sm font-medium text-[#616161] mt-2">All tasks for this view have been processed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
