# Supabase para Caresthetic

Proyecto previsto: `neritqpjotzfkelottgu`

## Activación

1. Conecta en Codex la cuenta de Supabase que tenga acceso al proyecto de Caresthetic.
2. Aplica la migración de `supabase/migrations/` al proyecto.
3. En Supabase, crea el usuario administrativo en **Authentication → Users**. No habilites registro público desde la página.
4. Añade ese usuario a la lista de administradores con esta consulta, reemplazando el correo:

   ```sql
   insert into public.admin_users (user_id)
   select id
   from auth.users
   where lower(email) = lower('ADMIN@CARESTHETICPR.COM')
   on conflict (user_id) do nothing;
   ```

5. Copia la llave pública `sb_publishable_…` del proyecto a `new-site/supabase-config.js`. Esta llave está diseñada para usarse en el navegador; la protección real está en las políticas RLS.
6. Verifica el panel en `/admin` y el catálogo público en `/tizo`.

Nunca añadas una llave `sb_secret_…` o `service_role` al sitio público.
