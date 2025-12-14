import { supabase } from '@/lib/supabaseClient';

export interface Todo {
    todo_id: string;
    user_id: string;
    goal_id?: string | null;
    title: string;
    completed: boolean;
    due_date: string; // YYYY-MM-DD
    start_time?: string | null; // ISO timestamp
    end_time?: string | null; // ISO timestamp
    is_all_day?: boolean;
    created_at: string;
}

export const todosApi = {
    // Get todos for a specific date
    async getTodosByDate(userId: string, date: Date): Promise<Todo[]> {
        // Format date as YYYY-MM-DD (Local Time)
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const { data, error } = await supabase
            .from('Todos')
            .select(`
                *,
                Goal (
                    goal_name,
                    goal_category,
                    linked_role
                )
            `)
            .eq('user_id', userId)
            .eq('due_date', dateStr)
            .order('start_time', { ascending: true, nullsFirst: false })
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    // Get todos for a week (7-day range starting from startDate)
    async getTodosByWeek(userId: string, startDate: Date): Promise<Todo[]> {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        endDate.setHours(23, 59, 59, 999);

        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        const { data, error } = await supabase
            .from('Todos')
            .select(`
                *,
                Goal (
                    goal_name,
                    goal_category,
                    linked_role
                )
            `)
            .eq('user_id', userId)
            .gte('due_date', startStr)
            .lte('due_date', endStr)
            .order('due_date', { ascending: true })
            .order('start_time', { ascending: true, nullsFirst: false });

        if (error) throw error;
        return data || [];
    },

    // Get todos for a month
    async getTodosByMonth(userId: string, year: number, month: number): Promise<Todo[]> {
        const startDate = new Date(year, month - 1, 1); // month is 1-indexed
        const endDate = new Date(year, month, 0); // Last day of month
        endDate.setHours(23, 59, 59, 999);

        endDate.setHours(23, 59, 59, 999);

        const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
        const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        const { data, error } = await supabase
            .from('Todos')
            .select(`
                *,
                Goal (
                    goal_name,
                    goal_category,
                    linked_role
                )
            `)
            .eq('user_id', userId)
            .gte('due_date', startStr)
            .lte('due_date', endStr)
            .order('due_date', { ascending: true })
            .order('start_time', { ascending: true, nullsFirst: false });

        if (error) throw error;
        return data || [];
    },

    // Create a new todo (with optional time support)
    async create(todo: {
        userId: string;
        title: string;
        goalId?: string | null;
        dueDate?: Date;
        startTime?: Date | null;
        endTime?: Date | null;
        isAllDay?: boolean;
    }): Promise<Todo> {
        const d = todo.dueDate || new Date();
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const isAllDay = todo.isAllDay ?? true;

        const { data, error } = await supabase
            .from('Todos')
            .insert({
                user_id: todo.userId,
                title: todo.title,
                goal_id: todo.goalId || null,
                due_date: dateStr,
                start_time: isAllDay ? null : todo.startTime?.toISOString(),
                end_time: isAllDay ? null : todo.endTime?.toISOString(),
                is_all_day: isAllDay,
                completed: false,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update a todo (including time fields)
    async update(todoId: string, updates: Partial<{
        title: string;
        goalId: string | null;
        dueDate: Date;
        startTime: Date | null;
        endTime: Date | null;
        isAllDay: boolean;
        completed: boolean;
    }>): Promise<Todo> {
        const payload: any = {};

        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.goalId !== undefined) payload.goal_id = updates.goalId;
        if (updates.goalId !== undefined) payload.goal_id = updates.goalId;
        if (updates.dueDate !== undefined) {
            const d = updates.dueDate;
            payload.due_date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        if (updates.completed !== undefined) payload.completed = updates.completed;
        if (updates.isAllDay !== undefined) {
            payload.is_all_day = updates.isAllDay;
            if (updates.isAllDay) {
                payload.start_time = null;
                payload.end_time = null;
            }
        }
        if (updates.startTime !== undefined && !updates.isAllDay) {
            payload.start_time = updates.startTime?.toISOString();
        }
        if (updates.endTime !== undefined && !updates.isAllDay) {
            payload.end_time = updates.endTime?.toISOString();
        }

        const { data, error } = await supabase
            .from('Todos')
            .update(payload)
            .eq('todo_id', todoId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Toggle todo completion
    async toggleComplete(todoId: string, currentStatus: boolean): Promise<void> {
        const { error } = await supabase
            .from('Todos')
            .update({ completed: !currentStatus })
            .eq('todo_id', todoId);

        if (error) throw error;
    },

    // Delete a todo
    async delete(todoId: string): Promise<void> {
        const { error } = await supabase
            .from('Todos')
            .delete()
            .eq('todo_id', todoId);

        if (error) throw error;
    },
};
