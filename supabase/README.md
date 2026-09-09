# Configuración de Supabase

1. Ejecuta [`schema.sql`](./schema.sql) completo en el SQL Editor del proyecto.
2. Crea los usuarios corporativos en **Authentication > Users** usando sus correos reales.
3. El trigger crea automáticamente su perfil como `seller`. Para convertir uno en coordinador, actualiza su registro:

```sql
update public.profiles
set role = 'coordinator'
where email = 'coordinador@empresaspolar.com';
```

La aplicación usa únicamente la publishable key en el navegador. No agregues una `service_role` key al archivo `.env.local` ni al frontend.
