/**
 * --------------------------------------DOCUMENTATION--------------------------------------------------
 *
 * @param email - The email address of the user to be added.
 * @param password - The password of the user to be added.
 * @returns A promise that resolves to `true` if the operation is successful, or `false` if an error occurs.
 *
 * @remarks
 * This function uses the Supabase client to interact with the database. Ensure that the environment variables
 * `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are properly set before using this function.
 *
 * @throws This function does not throw errors directly but logs them to the console in case of unexpected issues.
 *
 * @example
 * ```typescript
 * const result = await setUserTableData("user@example.com", "securepassword123");
 * if (result) {
 *   console.log("User added successfully.");
 * } else {
 *   console.log("Failed to add user.");
 * }
 * ```
 */

import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function setUserTableData(
  email: string,
  password: string
): Promise<boolean> {
  const tableName = "adminpaneluser";
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  try {
    const { error } = await supabase
      .from(tableName)
      .insert({ user_email: email, user_password: password });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error during inserting user data:", error);
    return false;
  }
}
