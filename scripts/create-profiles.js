const { Client } = require('pg');

const client = new Client({
    host: 'db.bjlpvbiyjpcjgvpdzvcy.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'TYylHj1SVGC7xL1u',
    ssl: { rejectUnauthorized: false }
});

async function createProfilesTable() {
    try {
        await client.connect();
        console.log('Connected to database...');

        // Create profiles table
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS profiles (
          id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          role            TEXT NOT NULL DEFAULT 'user',
          display_name    TEXT,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

        await client.query(createTableQuery);
        console.log('✅ Profiles table created successfully!');

        // Create trigger function
        const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO public.profiles (id, role, created_at, updated_at)
          VALUES (
              NEW.id,
              COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
              NOW(),
              NOW()
          );
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

        await client.query(createFunctionQuery);
        console.log('✅ Trigger function created successfully!');

        // Create trigger
        const createTriggerQuery = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

        await client.query(createTriggerQuery);
        console.log('✅ Trigger created successfully!');

        // Create profiles for existing users
        const migrateQuery = `
      INSERT INTO profiles (id, role, created_at, updated_at)
      SELECT 
          id, 
          COALESCE(raw_user_meta_data->>'role', 'user') as role,
          created_at,
          NOW() as updated_at
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    `;

        const result = await client.query(migrateQuery);
        console.log(`✅ Created profiles for ${result.rowCount} existing user(s)!`);

        // Enable RLS
        const rlsQuery = `
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Service role can do everything" ON profiles;
      CREATE POLICY "Service role can do everything" ON profiles
          FOR ALL
          USING (true)
          WITH CHECK (true);
    `;

        await client.query(rlsQuery);
        console.log('✅ Row Level Security enabled!');

        console.log('\n🎉 Database setup completed successfully!');
        console.log('You can now add users from the Settings page.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await client.end();
    }
}

createProfilesTable();
