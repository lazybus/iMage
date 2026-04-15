import { NewBatchForm } from "@/components/batches/new-batch-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function NewBatchPage() {
  return <NewBatchForm configured={isSupabaseConfigured()} />;
}
