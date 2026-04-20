# Zonify — Contexto del Proyecto (SaaS Edition)

## Propósito
Plataforma SaaS offline-first para gestión de distribuidoras mayoristas. Permite a múltiples empresas gestionar preventa, stock y logística de forma aislada.

## Arquitectura Multi-tenant (Aislamiento de Datos)
- **Estrategia:** Discriminación por columna (`empresa_id`) en todas las tablas.
- **Seguridad:** RLS (Row Level Security) en Supabase para asegurar que cada usuario solo vea los datos de su `empresa_id`.
- **Auth:** La tabla `perfiles` vincula cada `auth.uid()` con un `empresa_id`.

## Stack
- React 19 + Vite 6 + TS + Tailwind v4 (@theme).
- Zustand v5 (Persist con `empresa_id` como clave de filtrado).
- Supabase (Postgres + Auth + RLS).

## Lógica de Negocio SaaS
- **Suscripciones:** Planes basados en cantidad de preventistas o camiones.
- **Personalización:** Cada empresa configura sus propios códigos internos, listas de precios y zonas.
- **Logística:** Hojas de ruta y rendición de caja por empresa.

## Convenciones de Desarrollo
- **Tenant Context:** Todas las queries deben filtrar por el ID de la empresa del usuario logueado.
- **Mobile-first:** Interfaz optimizada para preventistas en calle y supervisores en depósito.

## Reglas de trabajo (ahorrar tokens y ser preciso)

1. **No programar sin contexto** — Leer archivos relevantes antes de escribir código. Si falta contexto, preguntar.
2. **Respuestas cortas** — 1-3 oraciones. Sin preámbulos ni resumen final. El código habla solo.
3. **No reescribir archivos completos** — Usar Edit (parcial). Write solo si el cambio es >80% del archivo.
4. **No releer archivos ya leídos** — Si ya se leyó en esta conversación, no volver a leer salvo que haya cambiado.
5. **Validar antes de declarar hecho** — Compilar, correr tests o verificar. Nunca decir "listo" sin evidencia.
6. **Cero adulación** — No decir "Excelente pregunta", "Gran idea", etc. Ir directo al trabajo.
7. **Soluciones simples** — Mínimo que resuelve el problema. Sin abstracciones, helpers ni features no pedidos.
8. **No pelear con el usuario** — Si el usuario dice "hacelo así", hacerlo. Mencionar concern en 1 oración máximo.
9. **Leer solo lo necesario** — Usar offset/limit. Si se sabe la ruta exacta, Read directo sin Glob+Grep previo.
10. **No narrar el plan** — No describir lo que se va a hacer. Solo hacerlo. El usuario ve los tool calls.
11. **Paralelizar tool calls** — Leer múltiples archivos independientes en un solo mensaje.
12. **No duplicar código en la respuesta** — Si ya se editó un archivo, no copiarlo en texto también.
13. **No usar Agent cuando Grep/Read basta** — Agent solo para búsquedas amplias o tareas complejas.