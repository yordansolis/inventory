This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

NOTAS:

He implementado un sistema de autenticación completo para tu aplicación. Aquí está el resumen de los cambios:
Página de Login:
Modificada para guardar el token JWT en localStorage como 'authToken'
Añadida verificación de sesión activa para redirigir al dashboard
Mejorada la gestión de errores y estados de carga
Utilidades de Autenticación:
Creado archivo utils/auth.ts con funciones para:
Verificar autenticación
Obtener token y username
Cerrar sesión
Generar headers de autenticación para peticiones
Protección de Rutas:
Implementado componente AuthGuard que verifica la autenticación
Redirige a login si el usuario no está autenticado
Muestra pantalla de carga durante la verificación
Layout del Dashboard:
Envuelto en AuthGuard para proteger todas las páginas del dashboard
Añadido botón de cierre de sesión
Muestra el nombre de usuario actual
Página de Usuarios:
Actualizada para usar las funciones de autenticación
Corregidos errores de TypeScript
Mejorada la gestión de errores
Redirección Automática:
La página principal redirige al usuario según su estado de autenticación
Si está autenticado, va al dashboard
Si no está autenticado, va al login
Con estos cambios, tu aplicación ahora:
Protege todas las rutas que requieren autenticación
Maneja correctamente el token JWT
Proporciona una experiencia de usuario fluida
Implementa buenas prácticas de seguridad para aplicaciones frontend
El flujo de autenticación está completo y listo para ser usado con tu backend.
