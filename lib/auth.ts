import { Pool } from "pg";

interface UserProps {
  email: string;
  password: string;
}

const client = new Pool({
  password: "admin",
  database: "LNC",
  user: "postgres",
  port: 5432,
});

export default async function isUser(userProps: UserProps): Promise<boolean> {
  const { email, password } = userProps;
  const tableName = "adminPanelUser";

  try {
    const query = `SELECT * FROM ${tableName} WHERE user_email=$1 AND user_password=$2`;

    const result = await client.query(query, [email, password]);
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    //TODO remove console.
    console.error("Database query error:", error);
    return false;
  }
}
