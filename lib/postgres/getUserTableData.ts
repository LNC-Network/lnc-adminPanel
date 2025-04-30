
/**
 * --------------------------------------DOCUMENTATION--------------------------------------------------
 *
 * @param rowStart - The starting index of the rows to fetch (inclusive).
 * @param rowEnd - The ending index of the rows to fetch (inclusive).
 * @returns A promise that resolves to an array of `User` objects containing `user_email` and `user_password`,
 *          or `false` if an error occurs during the fetch operation.
 *
 * @throws Will log an error message to the console if the database query fails.
 *
 * @remarks
 * This function uses the Supabase client to interact with the database. Ensure that the environment variables
 * `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are properly configured before using this function.
 */



import { User } from "@/types/userDataType";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function getUserTableData(
  rowStart: number,
  rowEnd: number
): Promise<User[] | boolean> {
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const tableName = "adminpaneluser";

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select("user_email, user_password")
      .order("user_id", { ascending: false })
      .range(rowStart, rowEnd);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error during getting user table data", error);
    return false;
  }
}
