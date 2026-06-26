# 🏆 Tournament Tracker — Plataforma Profesional para Torneos de VALORANT

La solución todo-en-uno para organizar, visualizar y gestionar torneos competitivos de VALORANT en tiempo real. Perfecto para comunidades, organizadores y equipos que buscan una experiencia profesional y visualmente impactante.

---

## 🚀 ¿Por qué Tournament Tracker?

Olvídate de los brackets manuales y las hojas de cálculo. Tournament Tracker te ofrece una plataforma digital completa con:
- Bracket visual dinámico en tiempo real
- Gestión de equipos, partidos y resultados con un solo clic
- Sistema de autenticación y roles para administradores, capitanes y fans
- Pools de pronósticos (pickems) para involucrar a tu comunidad
- Sistema de Map Ban profesional para cada partido

---

## ✨ Características Destacadas

### 👥 Gestión de Usuarios y Roles
- **Roles personalizados**: Admin, Capitán de Equipo y Fan
- Autenticación segura con Supabase
- Nicknames personalizados para cada usuario
- Aprobación manual de cuentas desde el panel de administración

### 🎮 Dos Formatos de Torneo Profesionales
- **12 equipos**: Estructura Upper / Middle / Lower con doble oportunidad
- **8 equipos**: Bracket clásico Upper / Lower con Gran Final Bo5
- Asignación automática de seeds (posiciones iniciales)
- Avance de ganadores y caída de perdedores completamente automática

### 📊 Bracket Visual y Estadísticas
- Renderizado SVG 100% responsive y escalable
- Colores dinámicos: verde (ganador), rojo (eliminado), amarillo pulsante (en vivo)
- Rutas visuales claras para Upper y Lower Bracket
- Estadísticas en tiempo real: progreso del torneo, equipos activos, partidos en vivo y campeón
- Tarjetas de partido con detalles del marcador y maps jugados

### 🎯 Map Ban Profesional
- Rotación completa de mapas actual de VALORANT
- Sistema visual de baneo y selección por equipos
- Integración directa con el bracket del torneo
- Imágenes oficiales de todos los mapas

### 📈 Pickems y Leaderboard para la Comunidad
- Sistema de pronósticos para que los fans participen
- Leaderboard actualizado en tiempo real con puntos
- Incentiva la interacción y engagement con tu torneo

---

## 🛠️ Tecnologías que lo Hacen Posible

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Build | Vite (velocidad sin igual) |
| Estilos | Tailwind CSS (diseño moderno y responsive) |
| Íconos | lucide-react |
| Backend/Base de datos | Supabase (PostgreSQL + Auth + RLS) |
| Autenticación y Seguridad | Supabase Row Level Security |

---

## 🎨 Capturas de Pantalla (Próximamente)

¡Próximamente agregarás screenshots impresionantes para mostrar la magia!

---

## 📦 Instalación y Puesta en Marcha en 4 Pasos

### 1. Clona el repositorio e instala dependencias
```bash
git clone https://github.com/Fefox-glitch/Tournament.git
cd Tournament
npm install
```

### 2. Configura tu base de datos en Supabase
1. Crea un proyecto gratuito en [supabase.com](https://supabase.com)
2. Copia tus credenciales del proyecto en un archivo `.env` en la raíz:
```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

### 3. Aplica las migraciones para crear todas las tablas
Abre el **SQL Editor** de tu proyecto de Supabase y ejecuta el archivo completo:
```
supabase/migrations/000_completo_setup.sql
```
Esto creará todas las tablas necesarias con Row Level Security configurado, incluyendo:
- Equipos (para 12 y 8 equipos)
- Partidos y historial
- User roles y pickems
- Sistema de Map Ban

### 4. ¡Correr el servidor de desarrollo y disfrutar!
```bash
npm run dev
```
Abre [http://localhost:5173/](http://localhost:5173/) y comienza a organizar tu torneo.

---

## ⚙️ Scripts Disponibles

```bash
npm run dev        # Inicia el servidor de desarrollo con Vite
npm run build      # Compila la aplicación para producción
npm run preview    # Previsualiza la build de producción
npm run lint       # Verifica el código con ESLint
npm run typecheck  # Verifica los tipos de TypeScript
```

---

## 📂 Estructura del Proyecto (Clara y Organizada)

```
Tournament/
├── src/
│   ├── components/          # Todos los componentes React
│   │   ├── AdminUserManager.tsx      # Gestión de usuarios (admin)
│   │   ├── BracketVis.tsx            # Bracket 12 equipos
│   │   ├── BracketVis8.tsx           # Bracket 8 equipos
│   │   ├── MapBanRoom.tsx            # Sala de Map Ban
│   │   ├── PickemsDashboard.tsx      # Pickems y leaderboard
│   │   └── ... (todos los demás)
│   ├── context/
│   │   └── AuthContext.tsx           # Contexto de autenticación
│   ├── data/                        # Layouts y lógica de brackets
│   ├── lib/                         # Cliente de Supabase
│   ├── types/                       # Tipos TypeScript
│   └── ... (App.tsx, main.tsx, etc.)
├── supabase/
│   └── migrations/                 # Archivos SQL para setup completo
└── ... (configs: tailwind, vite, tsconfig, etc.)
```

---

## 🎯 Comienza Ahora

1. **Configura tu primer admin**:
   - Registra tu cuenta en la app
   - Ve a Authentication → Users en Supabase y copia tu User ID
   - Ejecuta en el SQL Editor (cambia `TU_USER_ID`):
     ```sql
     INSERT INTO user_roles (user_id, role)
     VALUES ('TU_USER_ID', 'admin')
     ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
     ```

2. **Agrega equipos, configura el bracket y comienza el torneo!**

---

## 📄 Licencia

MIT — Hazlo tuyo y úsalo para tus torneos.

¡Esperamos que disfrutes organizando torneos épicos con Tournament Tracker! 🎉
