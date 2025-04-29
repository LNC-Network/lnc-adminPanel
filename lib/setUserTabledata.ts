import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function setUserTableData(
  email: string,
  password: string
): Promise<boolean> {
  const tableName = "adminpaneluser";

  try {
    const { error } = await supabase
      .from(tableName)
      .insert({ user_email: email, user_password: password });

    if (error) {
      console.error("Supabase query error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Unexpected error:", error);
    return false;
  }
}
