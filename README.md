# Tournament Tracker — VALORANT Champions 2026

Aplicación web para administrar y visualizar un torneo de doble eliminación en tiempo real. Soporta dos formatos: **12 equipos** (Upper / Middle / Lower) y **8 equipos** (Upper / Lower), con bracket visual, gestión de equipos, registro de resultados y avance automático de ganadores/perdedores.

---

## Demo

> Selecciona el modo (12 o 8 equipos) desde el header. Agrega equipos con sus seeds en la pestaña **Equipos**, luego registra resultados en **Partidos** y observa el bracket actualizarse en tiempo real.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite |
| Estilos | Tailwind CSS |
| Íconos | lucide-react |
| Base de datos | Supabase (PostgreSQL) |
| Auth / RLS | Supabase Row Level Security |

---

## Características

### Dos formatos de torneo

**12 equipos — Upper / Middle / Lower**
- Seeds 1–4 entran directamente en Ronda 2 del Upper
- Seeds 5–12 juegan Ronda 1 del Upper
- Los perdedores del Upper caen al Middle (segunda oportunidad)
- Los perdedores del Middle caen al Lower (última oportunidad)
- 28 partidos Bo3 + Gran Final Bo5 + Final Lower Bo5
- Estructura: 30 partidos en total (M01–M30)

**8 equipos — Upper / Lower**
- Ronda 1: 1v8, 4v5, 2v7, 3v6 en Upper Bracket
- Semis y Final Upper → losers caen al Lower en rondas escalonadas
- Lower Final: ganador del Lower vs perdedor de la Final Upper
- Gran Final Bo5: ganador Upper vs ganador Lower
- 13 partidos Bo3 + Gran Final Bo5

### Bracket visual SVG
- Renderizado en SVG escalable y responsive
- Conectores animados: ruta Upper (rojo sólido) y ruta Lower (naranja punteado)
- Tarjetas con colores dinámicos: verde (ganador), rojo (eliminado), amarillo pulsante (en vivo)
- Icono de campeón al finalizar el torneo
- Leyenda de secciones Upper / Lower

### Administración de equipos
- Alta, edición y baja de equipos
- Asignación de seed, región, logo (URL) y color
- Grid visual de cobertura de seeds (detecta vacíos)

### Administración de partidos
- Filtros: todos, upper, lower, pendientes, en vivo, finalizados
- Registro de marcadores por partido
- Avance automático de ganadores al siguiente partido
- Caída automática de perdedores al bracket inferior
- Registro de historial de acciones en base de datos

### Estadísticas en tiempo real
- Progreso del torneo (partidos jugados / total)
- Equipos activos vs eliminados
- Partidos en vivo
- Próximo partido disponible
- Nombre del campeón al finalizar

---

## Instalación local

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd tournament-tracker
npm install
```

### 2. Configurar Supabase

Crea un proyecto en [supabase.com](https://supabase.com) y copia las credenciales en un archivo `.env` en la raíz:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### 3. Aplicar migraciones

Desde el SQL Editor de Supabase, ejecuta los archivos en orden:

```
supabase/migrations/20260618022439_create_pickems_tables.sql
supabase/migrations/20260619031001_create_8team_tournament_tables.sql
```

Esto crea las tablas `teams`, `tournament_matches`, `tournament_history` (12 equipos) y `teams8`, `tournament_matches8`, `tournament_history8` (8 equipos), con RLS habilitado y los partidos pre-cargados.

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

---

## Scripts disponibles

```bash
npm run dev        # Servidor de desarrollo (Vite)
npm run build      # Compilar para producción
npm run preview    # Previsualizar el build
npm run lint       # ESLint
npm run typecheck  # Verificar tipos TypeScript
```

---

## Estructura del proyecto

```
tournament-tracker/
├── src/
│   ├── components/
│   │   ├── BracketMatchCard.tsx    # Tarjeta de partido (12 equipos)
│   │   ├── BracketMatchCard8.tsx   # Tarjeta de partido (8 equipos)
│   │   ├── BracketVis.tsx          # Bracket visual SVG (12 equipos)
│   │   ├── BracketVis8.tsx         # Bracket visual SVG (8 equipos)
│   │   ├── TeamsAdmin.tsx          # Gestión de equipos (12 equipos)
│   │   ├── TeamsAdmin8.tsx         # Gestión de equipos (8 equipos)
│   │   ├── TournamentAdmin.tsx     # Gestión de partidos (12 equipos)
│   │   ├── TournamentAdmin8.tsx    # Gestión de partidos (8 equipos)
│   │   ├── TournamentStats.tsx     # Estadísticas (12 equipos)
│   │   └── TournamentStats8.tsx    # Estadísticas (8 equipos)
│   ├── data/
│   │   ├── bracketLayout.ts        # Posiciones, conectores y lógica (12 equipos)
│   │   └── bracketLayout8.ts       # Posiciones, conectores y lógica (8 equipos)
│   ├── lib/
│   │   └── supabase.ts             # Cliente de Supabase
│   ├── types/
│   │   └── index.ts                # Tipos TypeScript globales
│   ├── App.tsx                     # Componente raíz + selector de modo
│   ├── main.tsx                    # Punto de entrada
│   └── index.css                   # Estilos globales
├── supabase/
│   └── migrations/
│       ├── 20260618022439_create_pickems_tables.sql
│       └── 20260619031001_create_8team_tournament_tables.sql
├── .env                            # Variables de entorno (no subir al repo)
├── package.json
├── tailwind.config.js
├── tsconfig.app.json
└── vite.config.ts
```

---

## Base de datos

### Tablas — 12 equipos

#### `teams`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | Identificador único |
| `name` | text | Nombre del equipo |
| `logo_url` | text | URL del logo |
| `region` | text | Región (NA, EMEA, APAC…) |
| `seed` | integer | Seed (1–12) |
| `color` | text | Color hex |
| `created_at` | timestamptz | Fecha de creación |

#### `tournament_matches`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | text PK | Ej: 'M01', 'M19', 'M30' |
| `section` | text | `upper` \| `middle` \| `lower` |
| `team1_seed` / `team2_seed` | integer | Seeds iniciales |
| `team1_label` / `team2_label` | text | Etiqueta si no hay equipo aún |
| `team1_id` / `team2_id` | uuid FK | Equipo asignado |
| `winner_id` | uuid FK | Ganador del partido |
| `status` | text | `upcoming` \| `live` \| `completed` |
| `score_team1` / `score_team2` | integer | Marcador de mapas |
| `played_at` | timestamptz | Fecha de juego |
| `next_match_id` | text | Siguiente partido del ganador |
| `next_match_slot` | text | `team1` \| `team2` |
| `round_name` | text | Nombre de la ronda |

#### `tournament_history`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid PK | Identificador único |
| `match_id` | text FK | Partido relacionado |
| `action` | text | Descripción de la acción |
| `created_at` | timestamptz | Timestamp del evento |

### Tablas — 8 equipos

Misma estructura con nombres `teams8`, `tournament_matches8`, `tournament_history8`. La tabla de partidos no incluye `next_match_id` ni `next_match_slot` (la lógica de avance se gestiona desde `bracketLayout8.ts`).

---

## Lógica del bracket

### Flujo de avance automático

Cuando se guarda un resultado, la aplicación:

1. Marca el partido como `completed` y registra el marcador
2. Lee `NEXT_MATCH[matchId]` para saber dónde va el **ganador**
3. Lee `LOSER_NEXT_MATCH[matchId]` para saber dónde cae el **perdedor**
4. Actualiza el slot correspondiente (`team1_id` o `team2_id`) en el partido destino
5. Si `LOSER_NEXT_MATCH` es `null`, el equipo queda eliminado
6. Registra todas las acciones en la tabla `history`

### Formato de partidos

| Formato | Descripción | Mapas para ganar |
|---------|-------------|-----------------|
| Bo3 | Mejor de 3 | 2 mapas |
| Bo5 | Mejor de 5 | 3 mapas |

La Gran Final siempre es **Bo5**. Todos los demás partidos son **Bo3**.

---

## RLS (Row Level Security)

Todas las tablas tienen RLS habilitado. Las políticas actuales permiten acceso de lectura y escritura tanto a usuarios anónimos como autenticados — diseñado para uso en panel de administración cerrado. Para producción pública, restringe los permisos de escritura a `authenticated` únicamente.

---

## Contribuir

1. Haz fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-feature`
3. Haz commit de tus cambios: `git commit -m 'feat: descripción'`
4. Haz push: `git push origin feature/mi-feature`
5. Abre un Pull Request

---

## Licencia

MIT
