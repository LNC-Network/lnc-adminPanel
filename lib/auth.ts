import { createClient } from "@supabase/supabase-js";

interface UserProps {
  email: string;
  password: string;
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function isUser(userProps: UserProps): Promise<boolean> {
  const { email, password } = userProps;
  const tableName = "adminpaneluser";

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("user_email", email)
      .eq("user_password", password)
      .single();

    if (error) {
      console.error("Supabase query error:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return false;
  }
}
