import { supabase } from "@/integrations/supabase/client";

export type ManagerNote = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export const notesService = {
  async listByUser(userId: string): Promise<ManagerNote[]> {
    const { data, error } = await supabase
      .from("manager_notes")
      .select("id, user_id, title, content, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("notesService.listByUser", error);
      return [];
    }
    return data ?? [];
  },
  async create(userId: string, values: { title: string; content?: string | null }): Promise<ManagerNote> {
    const payload = { user_id: userId, title: values.title, content: values.content ?? null } as const;
    const { data, error } = await supabase
      .from("manager_notes")
      .insert(payload)
      .select("id, user_id, title, content, created_at, updated_at")
      .single();
    if (error) {
      throw error;
    }
    return data as ManagerNote;
  },
  async update(id: string, values: Partial<Pick<ManagerNote, "title" | "content">>): Promise<void> {
    const updates: Partial<ManagerNote> = {};
    if (values.title !== undefined) updates.title = values.title;
    if (values.content !== undefined) updates.content = values.content ?? null;
    const { error } = await supabase.from("manager_notes").update(updates).eq("id", id);
    if (error) throw error;
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("manager_notes").delete().eq("id", id);
    if (error) throw error;
  },
};
