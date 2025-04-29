import { User } from "@/types/userDataType";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function getUserTableData(
  rowStart: number,
  rowEnd: number
): Promise<User[] | boolean> {
  const tableName = "adminpaneluser";

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("user_email, user_password")
      .order("user_id", { ascending: false })
      .range(rowStart, rowEnd);

    if (error) {
      console.error("Supabase query error:", error);
      return false;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return false;
  }
}
