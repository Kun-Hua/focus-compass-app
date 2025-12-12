-- Create Todos table
CREATE TABLE public."Todos" (
  todo_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES public."Goal"(goal_id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  due_date DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_todos_user_id ON public."Todos"(user_id);
CREATE INDEX idx_todos_goal_id ON public."Todos"(goal_id);
CREATE INDEX idx_todos_due_date ON public."Todos"(due_date);

-- RLS
ALTER TABLE public."Todos" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for dev" ON public."Todos" FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_todos_updated_at 
BEFORE UPDATE ON public."Todos" 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
