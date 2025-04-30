/**
 * --------------------------------------DOCUMENTATION--------------------------------------------------
 *
 * @param userProps - An object containing the user's email and password.
 * @param userProps.email - The email of the user to authenticate.
 * @param userProps.password - The password of the user to authenticate.
 * @returns A promise<boolean> that resolves to `true` if the user exists and credentials match, otherwise `false`.
 *
 * @throws Will log an error to the console if there is an issue with the Supabase query or an unexpected error occurs.
 *
 * @example
 * ```typescript
 *  const userExists = await isUser({ email: "test@example.com", password: "password123" });
 *  if (userExists) {
 *   console.log("User authenticated successfully.");
 *  }
 *  else {
 *   console.log("Invalid credentials.");
 *  }
 * ```
 * -------------------------------------------------------------------------------------------------------
 */
import { createClient } from "@supabase/supabase-js";

interface UserProps {
  email: string;
  password: string;
}

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function isUser(input: UserProps): Promise<boolean> {
  const { email, password } = input;
  const tableName = "adminpaneluser";

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("user_email", email)
      .eq("user_password", password)
      .single();

    if (error) throw error;

    return !!data;
  } catch (error) {
    console.error("Unexpected error:", error);
    return false;
  }
}
