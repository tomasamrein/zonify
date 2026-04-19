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