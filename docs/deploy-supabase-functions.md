# Deploying Supabase Functions

Edge functions live in the `supabase/functions` directory. After adding or updating a function, deploy it with the Supabase CLI.

1. Ensure environment variables are available in an `.env` file:

```env
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

2. Deploy the function:

```bash
supabase functions deploy synthesize-mission --project-ref aybygkwfqpsphhopatso --env-file supabase/.env
```

The command builds the function and makes it accessible at `/functions/v1/synthesize-mission` in your project.
