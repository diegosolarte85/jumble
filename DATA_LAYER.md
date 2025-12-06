# Capa de Datos - Documentación Técnica

## Arquitectura General

La capa de datos de Jumble utiliza **SQLite** como base de datos y **Drizzle ORM** como herramienta de mapeo objeto-relacional (ORM). Esta arquitectura proporciona:

- ✅ **Simplicidad**: SQLite es una base de datos embebida, sin necesidad de servidor separado
- ✅ **Type Safety**: Drizzle ORM proporciona tipos TypeScript completos
- ✅ **Migraciones**: Sistema de versionado de esquema de base de datos
- ✅ **Performance**: SQLite con modo WAL (Write-Ahead Logging) para mejor concurrencia

## Componentes Principales

### 1. Configuración (`drizzle.config.ts`)

```typescript
export default {
  schema: './drizzle/schema.ts',      // Ubicación del esquema
  out: './drizzle/migrations',        // Carpeta de migraciones
  dialect: 'sqlite',                   // Tipo de base de datos
  dbCredentials: {
    url: process.env.DATABASE_URL || './jumble.db',  // Ruta del archivo DB
  },
}
```

**Propósito**: Configuración de Drizzle Kit para generar migraciones y gestionar el esquema.

### 2. Conexión a la Base de Datos (`lib/db.ts`)

```typescript
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '@/drizzle/schema';

const sqlite = new Database(process.env.DATABASE_URL || './jumble.db');
sqlite.pragma('journal_mode = WAL');  // Modo WAL para mejor concurrencia

export const db = drizzle(sqlite, { schema });
```

**Características**:
- **Modo WAL**: Permite lecturas concurrentes mientras hay escrituras
- **Singleton Pattern**: Una sola instancia de conexión compartida
- **Type-Safe**: Exporta instancia de Drizzle con tipos del esquema

### 3. Esquema de Base de Datos (`drizzle/schema.ts`)

El esquema define 6 tablas principales que modelan el dominio de la aplicación:

## Estructura de Tablas

### 📊 Tabla: `users`

**Propósito**: Almacena información de usuarios y autenticación.

```typescript
users {
  id: text (PK)                    // ID único (nanoid)
  email: text (UNIQUE, NOT NULL)    // Email único para login
  password: text (NULLABLE)         // Hash bcrypt (null para OAuth)
  name: text (NULLABLE)             // Nombre del usuario
  bio: text (NULLABLE)              // Biografía/descripción
  location: text (NULLABLE)         // Ubicación geográfica
  commitmentLevel: enum             // 'fulltime' | 'parttime' | 'weekends'
  createdAt: integer (timestamp)   // Unix timestamp
  updatedAt: integer (timestamp)    // Unix timestamp
}
```

**Índices**:
- `users_email_unique`: Índice único en `email`

**Relaciones**:
- Un usuario puede tener múltiples skills (1:N)
- Un usuario puede tener múltiples ideas (1:N)
- Un usuario puede hacer múltiples swipes (1:N)
- Un usuario puede estar en múltiples matches (N:M)

---

### 🎯 Tabla: `skills`

**Propósito**: Almacena las habilidades de los usuarios con sus niveles de proficiencia.

```typescript
skills {
  id: text (PK)                     // ID único
  userId: text (FK → users.id)      // Usuario propietario
  skillName: text (NOT NULL)        // Nombre de la skill
  proficiencyLevel: enum            // 'beginner' | 'intermediate' | 'expert'
  skillEmbedding: text (NULLABLE)   // JSON array [384 números] para ML
  createdAt: integer (timestamp)    // Unix timestamp
}
```

**Relaciones**:
- `userId` → `users.id` (CASCADE DELETE: si se elimina usuario, se eliminan sus skills)

**Uso de Embeddings**:
- Los embeddings se almacenan como JSON en texto plano
- Formato: `"[0.123, 0.456, ...]"` (384 dimensiones)
- Se generan mediante el servicio ML de Python
- Se usan para calcular complementariedad de skills

---

### 💡 Tabla: `startup_ideas`

**Propósito**: Almacena las ideas de startup de los usuarios.

```typescript
startup_ideas {
  id: text (PK)                     // ID único
  userId: text (FK → users.id)      // Usuario creador
  title: text (NOT NULL)             // Título de la idea
  description: text (NOT NULL)      // Descripción detallada
  industry: text (NULLABLE)         // Industria/sector
  requiredSkills: text (NULLABLE)   // JSON array de skills requeridas
  ideaEmbedding: text (NULLABLE)    // JSON array [384 números] para ML
  stage: enum (default: 'idea')     // 'idea' | 'mvp' | 'launched'
  createdAt: integer (timestamp)    // Unix timestamp
  updatedAt: integer (timestamp)    // Unix timestamp
}
```

**Relaciones**:
- `userId` → `users.id` (CASCADE DELETE)

**Uso de Embeddings**:
- Similar a skills, almacena embeddings como JSON
- Se usa para calcular similitud semántica entre ideas
- Rango óptimo de similitud: 0.6-0.9 (alineadas pero no idénticas)

---

### 👆 Tabla: `swipes`

**Propósito**: Registra las acciones de swipe (like/pass) entre usuarios.

```typescript
swipes {
  id: text (PK)                     // ID único
  swiperId: text (FK → users.id)    // Usuario que hace swipe
  swipedId: text (FK → users.id)   // Usuario sobre el que se hace swipe
  direction: enum (NOT NULL)         // 'left' | 'right' | 'super'
  createdAt: integer (timestamp)    // Unix timestamp
}
```

**Constraints**:
- `unique(swiperId, swipedId)`: Previene swipes duplicados del mismo usuario

**Relaciones**:
- `swiperId` → `users.id` (CASCADE DELETE)
- `swipedId` → `users.id` (CASCADE DELETE)

**Lógica de Negocio**:
- `left`: Rechazo (pass)
- `right`: Interés (like)
- `super`: Alto interés (super like)
- Cuando ambos usuarios hacen `right` o uno hace `super`, se crea un match

---

### 💚 Tabla: `matches`

**Propósito**: Almacena los matches (coincidencias mutuas) entre usuarios.

```typescript
matches {
  id: text (PK)                     // ID único
  user1Id: text (FK → users.id)    // Primer usuario del match
  user2Id: text (FK → users.id)    // Segundo usuario del match
  matchScore: real (NULLABLE)       // Score calculado por ML (0.0-1.0)
  createdAt: integer (timestamp)    // Unix timestamp
  lastMessageAt: integer (NULLABLE) // Timestamp del último mensaje
}
```

**Relaciones**:
- `user1Id` → `users.id` (CASCADE DELETE)
- `user2Id` → `users.id` (CASCADE DELETE)

**Prevención de Duplicados**:
- Se verifica antes de crear que no exista un match entre los dos usuarios
- La verificación busca en ambas direcciones (user1-user2 y user2-user1)

**Match Score**:
- Calculado por el servicio ML de Python
- Combina: similitud de ideas (60%) + complementariedad de skills (40%)
- Rango: 0.0 a 1.0

---

### 💬 Tabla: `messages`

**Propósito**: Almacena los mensajes de chat entre usuarios que hicieron match.

```typescript
messages {
  id: text (PK)                     // ID único
  matchId: text (FK → matches.id)    // Match al que pertenece
  senderId: text (FK → users.id)    // Usuario que envía
  content: text (NOT NULL)          // Contenido del mensaje
  read: boolean (default: false)    // Estado de lectura
  createdAt: integer (timestamp)    // Unix timestamp
}
```

**Relaciones**:
- `matchId` → `matches.id` (CASCADE DELETE: si se elimina match, se eliminan mensajes)
- `senderId` → `users.id` (CASCADE DELETE)

**Funcionalidades**:
- Tracking de mensajes no leídos
- Ordenamiento por `createdAt` (más recientes primero)
- Actualización de `lastMessageAt` en matches cuando se envía mensaje

---

## Características Técnicas

### Tipos de Datos

1. **Text**: Usado para IDs (nanoid), emails, nombres, descripciones
2. **Integer**: Usado para timestamps Unix (segundos desde epoch)
3. **Real**: Usado para scores numéricos (matchScore)
4. **Boolean**: Usado para flags (read)

### Timestamps

- **Formato**: Unix timestamp (segundos desde 1970-01-01)
- **Default**: `sql\`(unixepoch())\`` - función SQLite nativa
- **Conversión**: Drizzle convierte automáticamente con `mode: 'timestamp'`

### Enums

Los enums se almacenan como `text` con validación a nivel de aplicación:

- `commitmentLevel`: `'fulltime' | 'parttime' | 'weekends'`
- `proficiencyLevel`: `'beginner' | 'intermediate' | 'expert'`
- `direction`: `'left' | 'right' | 'super'`
- `stage`: `'idea' | 'mvp' | 'launched'`

### Embeddings (Vectores ML)

**Almacenamiento**:
- Formato: JSON array como texto: `"[0.123, 0.456, ...]"`
- Dimensión: 384 (modelo `all-MiniLM-L6-v2`)
- Campos: `skillEmbedding`, `ideaEmbedding`

**Procesamiento**:
```typescript
// Guardar embedding
const embedding = await mlClient.embedIdea(description);
await db.update(startupIdeas)
  .set({ ideaEmbedding: JSON.stringify(embedding) })
  .where(eq(startupIdeas.id, ideaId));

// Leer embedding
const idea = await db.select().from(startupIdeas).where(...);
const embedding = idea.ideaEmbedding ? JSON.parse(idea.ideaEmbedding) : null;
```

**Utilidades**: Ver `lib/utils.ts` para funciones `parseEmbedding()` y `stringifyEmbedding()`

---

## Relaciones y Constraints

### Foreign Keys

Todas las relaciones usan `ON DELETE CASCADE`:
- Si se elimina un usuario → se eliminan sus skills, ideas, swipes, matches y mensajes
- Si se elimina un match → se eliminan sus mensajes

### Unique Constraints

1. **users.email**: Garantiza emails únicos
2. **swipes(swiperId, swipedId)**: Previene swipes duplicados

### Índices

- `users_email_unique`: Índice único en email para búsquedas rápidas
- Los foreign keys automáticamente crean índices en SQLite

---

## Migraciones

### Generar Migraciones

```bash
npm run db:generate
```

Genera archivos SQL en `drizzle/migrations/` basados en cambios en `schema.ts`.

### Aplicar Migraciones

```bash
npm run db:init  # Ejecuta migraciones manualmente
# o
npm run db:push  # Push directo del esquema (desarrollo)
```

### Estructura de Migración

```sql
CREATE TABLE `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL,
  ...
);
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
```

---

## Uso en la Aplicación

### Ejemplo: Crear Usuario

```typescript
import { db } from '@/lib/db';
import { users } from '@/drizzle/schema';
import { generateId } from '@/lib/utils';

const userId = generateId();
await db.insert(users).values({
  id: userId,
  email: 'user@example.com',
  password: hashedPassword,
  name: 'John Doe',
});
```

### Ejemplo: Query con Joins

```typescript
import { db } from '@/lib/db';
import { users, skills, startupIdeas } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

// Obtener usuario con sus skills e ideas
const user = await db.select().from(users)
  .where(eq(users.id, userId))
  .limit(1);

const userSkills = await db.select().from(skills)
  .where(eq(skills.userId, userId));

const userIdeas = await db.select().from(startupIdeas)
  .where(eq(startupIdeas.userId, userId));
```

### Ejemplo: Transacciones

```typescript
// Drizzle no tiene transacciones explícitas en SQLite
// Pero puedes usar el driver directamente:
import Database from 'better-sqlite3';
const sqlite = new Database('./jumble.db');
sqlite.exec('BEGIN TRANSACTION');
try {
  // Operaciones...
  sqlite.exec('COMMIT');
} catch {
  sqlite.exec('ROLLBACK');
}
```

---

## Consideraciones de Performance

### Modo WAL

```typescript
sqlite.pragma('journal_mode = WAL');
```

**Beneficios**:
- Lecturas concurrentes mientras hay escrituras
- Mejor performance en aplicaciones multi-usuario
- Menos bloqueos

### Optimizaciones Futuras

1. **Índices Adicionales**:
   - `swipes.swiperId` para búsquedas rápidas de historial
   - `matches.user1Id` y `matches.user2Id` para queries de matches
   - `messages.matchId` para ordenamiento de mensajes

2. **Paginación**:
   - Implementar `LIMIT` y `OFFSET` en queries grandes
   - Usar cursor-based pagination para mejor performance

3. **Caching**:
   - Cachear embeddings frecuentemente consultados
   - Cachear taxonomía de skills (cambia raramente)

---

## Migración a PostgreSQL (Futuro)

Si se necesita migrar a PostgreSQL:

1. **Cambiar driver**: `better-sqlite3` → `pg` o `postgres`
2. **Actualizar schema**: Cambiar `sqliteTable` → `pgTable`
3. **Tipos de datos**: 
   - `text` → `varchar` o `text`
   - `integer` → `timestamp` o `bigint`
   - `real` → `double precision`
4. **Embeddings**: Usar tipo `vector(384)` con extensión `pgvector`
5. **Migraciones**: Regenerar con nuevo dialect

---

## Archivos Relacionados

- `drizzle/schema.ts` - Definición del esquema
- `drizzle.config.ts` - Configuración de Drizzle Kit
- `lib/db.ts` - Conexión y exportación de `db`
- `lib/utils.ts` - Utilidades para embeddings
- `drizzle/migrations/` - Archivos SQL de migraciones
- `scripts/init-db.ts` - Script para inicializar DB

---

## Comandos Útiles

```bash
# Generar migraciones desde cambios en schema.ts
npm run db:generate

# Aplicar migraciones
npm run db:init

# Push directo del esquema (solo desarrollo)
npm run db:push

# Abrir Drizzle Studio (UI para explorar DB)
npm run db:studio

# Seed de datos de prueba
npm run db:seed
```

---

## Resumen

La capa de datos de Jumble está diseñada para:

✅ **Simplicidad**: SQLite embebido, sin servidor separado  
✅ **Type Safety**: TypeScript completo con Drizzle ORM  
✅ **Escalabilidad**: Preparado para migrar a PostgreSQL  
✅ **ML Ready**: Soporte para embeddings vectoriales  
✅ **Mantenibilidad**: Migraciones versionadas y esquema claro  

**Estado**: ✅ Listo para desarrollo y producción (MVP)

