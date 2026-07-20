# Database Operations Rule

Whenever writing SQL, updating the schema, or modifying Supabase policies, DO NOT ask the user to manually execute the SQL in the Supabase web dashboard or any other SQL client.

Instead, autonomously apply the database changes yourself using your MCP capabilities (`execute_sql` in the Supabase MCP server) or terminal tools (`supabase` CLI, `psql`, etc.).
