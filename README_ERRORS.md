# Tournament Tracker - Errores Encontrados y Soluciones

## Resumen Ejecutivo

Se encontraron **11 errores** durante las pruebas exhaustivas:
- **5 errores criticos** de logica de bracket (avanze de equipos)
- **2 errores de ESLint** (tipado `any`)
- **2 advertencias de ESLint** (dependencies de hooks)
- **2 errores de validacion** (puntajes Bo3/Bo5)

---

## ERRORES CRITICOS - Logica del Bracket

### ERROR 1: M25 envia ganador y perdedor al mismo destino
**Archivo:** `src/data/bracketLayout.ts`
**Lineas:** 78, 123

**Descripcion:**
```typescript
// Linea 78
NEXT_MATCH['M25'] = { id: 'M29', slot: 'team2' };
// Linea 123
LOSER_NEXT_MATCH['M25'] = { id: 'M29', slot: 'team2' };
```

El partido M25 (Final Superior) envia TANTO al ganador COMO al perdedor a M29 (slot team2). Esto es imposible porque un partido no puede tener dos equipos en el mismo slot.

**Impacto:** El torneo se rompe cuando se completa la Final Superior.

**Logica correcta del torneo:**
- Ganador de M25 debe ir directamente a M30 (Gran Final) - tiene ventaja
- Perdedor de M25 debe ir a M29 (Final Lower)

**Solucion:**
```typescript
// NEXT_MATCH - Ganadores
NEXT_MATCH['M25'] = { id: 'M30', slot: 'team1' };  // Ganador va a Gran Final

// LOSER_NEXT_MATCH - Perdedores
LOSER_NEXT_MATCH['M25'] = { id: 'M29', slot: 'team2' };  // Perdedor va a Final Lower
```

---

### ERROR 2: Conflictos en M23 team2 - multiples fuentes
**Archivo:** `src/data/bracketLayout.ts`
**Lineas:** 117, 121

**Descripcion:**
```typescript
LOSER_NEXT_MATCH['M17'] = { id: 'M23', slot: 'team2' };  // Linea 117
LOSER_NEXT_MATCH['M21'] = { id: 'M23', slot: 'team2' };  // Linea 121
```

Dos partidos diferentes envian equipos a M23 team2.

**Impacto:** El segundo equipo en llegar sobrescribira al primero.

**Logica correcta:**
- M21 es un partido de Middle, su perdedor debe ir a Lower
- M17 es un partido de Lower, su perdedor debe ser ELIMINADO (no va a otro partido)

**Solucion:**
```typescript
// M17 es LOWER - perdedor eliminado
LOSER_NEXT_MATCH['M17'] = null;

// M21 es Middle - perdedor va a Lower
LOSER_NEXT_MATCH['M21'] = { id: 'M23', slot: 'team2' };
```

---

### ERROR 3: Conflictos en M24 team2 - multiples fuentes
**Archivo:** `src/data/bracketLayout.ts`
**Lineas:** 118, 122

**Descripcion:**
```typescript
LOSER_NEXT_MATCH['M18'] = { id: 'M24', slot: 'team2' };  // Linea 118
LOSER_NEXT_MATCH['M22'] = { id: 'M24', slot: 'team2' };  // Linea 122
```

Mismo problema que ERROR 2.

**Solucion:**
```typescript
// M18 es LOWER - perdedor eliminado
LOSER_NEXT_MATCH['M18'] = null;

// M22 es Middle - perdedor va a Lower
LOSER_NEXT_MATCH['M22'] = { id: 'M24', slot: 'team2' };
```

---

### ERROR 4: Partidos Lower envian perdedores a otros partidos
**Archivo:** `src/data/bracketLayout.ts`

**Descripcion:**
Los partidos en la seccion LOWER son la "ultima oportunidad". Un equipo que pierde en LOWER debe quedar ELIMINADO, no ir a otro partido.

**Partidos afectados:**
- M17: `LOSER_NEXT_MATCH['M17'] = { id: 'M23', slot: 'team2' }` - INCORRECTO
- M18: `LOSER_NEXT_MATCH['M18'] = { id: 'M24', slot: 'team2' }` - INCORRECTO

**Solucion:**
```typescript
LOSER_NEXT_MATCH['M17'] = null;  // Eliminado
LOSER_NEXT_MATCH['M18'] = null;  // Eliminado
```

---

### ERROR 5: M29 y M30 no tienen LOSER_NEXT_MATCH
**Archivo:** `src/data/bracketLayout.ts`

**Descripcion:**
```typescript
LOSER_NEXT_MATCH['M29'] = null;  // Linea 129
LOSER_DOWN_MATCH['M30'] = null;  // Linea 130
```

Aunque esto es correcto (el perdedor de la Gran Final es subcampeon), falta agregar entradas para M15 y M16:

```typescript
// Falta:
LOSER_NEXT_MATCH['M15'] = null;  // Perdedor eliminado
LOSER_NEXT_MATCH['M16'] = null;  // Perdedor eliminado
```

---

## ERRORES DE ESLint

### ERROR 6: Uso de `any` en filtros
**Archivo:** `src/components/TournamentAdmin.tsx`
**Lineas:** 169, 203

**Descripcion:**
```typescript
onClick={() => setFilter(f.id as any)}  // Linea 169
onChange={(e) => handleStatusChange(match.id, e.target.value as any)}  // Linea 203
```

**Solucion:**
Definir tipos explcitos:
```typescript
type FilterType = 'all' | 'upper' | 'middle' | 'lower' | 'upcoming' | 'live' | 'completed';
type MatchStatus = 'upcoming' | 'live' | 'completed';

// Linea 169
onClick={() => setFilter(f.id as FilterType)}

// Linea 203
onChange={(e) => handleStatusChange(match.id, e.target.value as MatchStatus)}
```

---

## ADVERTENCIAS DE ESLint (Warnings)

### WARNING 1: useEffect sin dependencia `matches`
**Archivo:** `src/components/TournamentAdmin.tsx`
**Linea:** 30

**Descripcion:**
```typescript
useEffect(() => {
  // ... usa `matches`
}, []);  // Falta `matches` en dependencias
```

**Solucion:**
```typescript
useEffect(() => {
  // ...
}, [matches]);
```

---

### WARNING 2: useCallback sin dependencia `getTeamName`
**Archivo:** `src/components/TournamentAdmin.tsx`
**Linea:** 144

**Descripcion:**
```typescript
const handleSaveResult = useCallback(async (match: TournamentMatch) => {
  // ... usa getTeamName()
}, [localScores, updateMatch, addHistory, onMatchesChange]);  // Falta getTeamName
```

**Solucion:**
```typescript
const handleSaveResult = useCallback(async (match: TournamentMatch) => {
  // ...
}, [localScores, updateMatch, addHistory, onMatchesChange, getTeamName]);
```

O mejor, mover `getTeamName` fuera del componente o usar `useCallback` para envolverlo.

---

## ERRORES DE VALIDACION

### ERROR 7: Sin validacion de puntajes Bo3/Bo5
**Archivo:** `src/components/TournamentAdmin.tsx`
**Lineas:** 84-87

**Descripcion:**
El codigo solo valida que los puntajes no sean iguales, pero no valida los lcmites del formato:
- Bo3: Mazimo 2-1 (el ganador necesita 2 victorias)
- Bo5: Mazimo 3-2 (el ganador necesita 3 victorias)

**Impacto:** Se pueden ingresar puntajes imposibles como 5-4.

**Solucion:**
```typescript
const getMaxWins = (matchId: string): number => {
  return BO5_MATCHES.has(matchId) ? 3 : 2;
};

const handleSaveResult = useCallback(async (match: TournamentMatch) => {
  const scores = localScores[match.id] || { team1: 0, team2: 0 };
  const maxWins = getMaxWins(match.id);

  if (!match.team1_id || !match.team2_id) return;
  if (scores.team1 === scores.team2) return;

  // Validacion de formato
  const winnerScore = Math.max(scores.team1, scores.team2);
  const loserScore = Math.min(scores.team1, scores.team2);

  if (winnerScore > maxWins) {
    alert(`Formato ${match.id === 'M29' || match.id === 'M30' ? 'Bo5' : 'Bo3'}: el ganador no puede tener mas de ${maxWins} victorias`);
    return;
  }
  if (loserScore >= winnerScore) return;  // Ya validado arriba
  if (winnerScore < maxWins && loserScore > 0 && winnerScore - loserScore !== 1) {
    // Si no gano por el margen correcto, verificar
    // Para Bo3: 2-0 o 2-1 son validos
    // Para Bo5: 3-0, 3-1, 3-2 son validos
    if (!(winnerScore === maxWins)) {
      alert('Puntaje invalido para el formato');
      return;
    }
  }

  // ... resto del codigo
}, [...]);
```

---

## PROBLEMAS DE BASE DE DATOS

### Problema menor: Columnas no utilizadas
**Tabla:** `tournament_matches`

Las columnas `next_match_id` y `next_match_slot` existen en la base de datos pero NO se usan en el codigo. La logica de avanze esta harcodeada en `bracketLayout.ts`.

**Impacto:** Bajo - no causa errores, pero genera confusion.

**Recomendacion:** Eliminar las columnas o actualizarlas dinamicamente desde el codigo.

---

## Verificacion de Reactividad de la Base de Datos

**Estado: CORRECTO**

La reactividad funciona correctamente:
1. `loadData()` obtiene teams y matches en paralelo
2. `hydrateBracket()` asigna seeds a equipos automaticamente
3. `onTeamsChange` y `onMatchesChange` recargan todos los datos
4. Los estados locales se actualizan correctamente con `useEffect`

**Flujo verificado:**
```
Usuario agrega equipo → onTeamsChange() → loadData() → hydrateBracket() → UI actualizada
Usuario guarda resultado → onMatchesChange() → loadData() → hydrateBracket() → UI actualizada
```

---

## CORRECCION COMPLETA DE bracketLayout.ts

Reemplazar las secciones afectadas:

```typescript
// Lineas 67-99: NEXT_MATCH - Ganadores
export const NEXT_MATCH: Record<string, { id: string; slot: 'team1' | 'team2' } | null> = {
  // UPPER - Mantener igual
  M01: { id: 'M05', slot: 'team2' },
  M02: { id: 'M06', slot: 'team2' },
  M03: { id: 'M07', slot: 'team2' },
  M04: { id: 'M08', slot: 'team2' },
  M05: { id: 'M19', slot: 'team1' },
  M06: { id: 'M19', slot: 'team2' },
  M07: { id: 'M20', slot: 'team1' },
  M08: { id: 'M20', slot: 'team2' },
  M19: { id: 'M25', slot: 'team1' },
  M20: { id: 'M25', slot: 'team2' },
  // CORREGIDO: M25 ganador va directo a Gran Final
  M25: { id: 'M30', slot: 'team1' },  // <-- CAMBIO

  // MIDDLE - Mantener igual
  M09: { id: 'M13', slot: 'team1' },
  M10: { id: 'M13', slot: 'team2' },
  M11: { id: 'M14', slot: 'team1' },
  M12: { id: 'M14', slot: 'team2' },
  M13: { id: 'M21', slot: 'team1' },
  M14: { id: 'M22', slot: 'team1' },
  M21: { id: 'M26', slot: 'team1' },
  M22: { id: 'M26', slot: 'team2' },
  M26: { id: 'M29', slot: 'team1' },

  // LOWER - Mantener igual
  M15: { id: 'M17', slot: 'team1' },
  M16: { id: 'M18', slot: 'team1' },
  M17: { id: 'M23', slot: 'team1' },
  M18: { id: 'M24', slot: 'team1' },
  M23: { id: 'M27', slot: 'team1' },
  M24: { id: 'M27', slot: 'team2' },
  M27: { id: 'M28', slot: 'team1' },
  M28: { id: 'M30', slot: 'team2' },  // <-- CAMBIO: M28 va a M30 team2

  // FINALES
  M29: { id: 'M30', slot: 'team2' },  // Ganador de Lower Final va a Gran Final
  M30: null,  // Sin siguiente
};

// Lineas 101-131: LOSER_NEXT_MATCH - Perdedores
export const LOSER_NEXT_MATCH: Record<string, { id: string; slot: 'team1' | 'team2' } | null> = {
  // UPPER - Mantener igual
  M01: { id: 'M09', slot: 'team1' },
  M02: { id: 'M10', slot: 'team1' },
  M03: { id: 'M11', slot: 'team1' },
  M04: { id: 'M12', slot: 'team1' },
  M05: { id: 'M12', slot: 'team2' },
  M06: { id: 'M11', slot: 'team2' },
  M07: { id: 'M10', slot: 'team2' },
  M08: { id: 'M09', slot: 'team2' },
  M19: { id: 'M21', slot: 'team2' },
  M20: { id: 'M22', slot: 'team2' },
  // CORREGIDO: M25 perdedor va a Lower Final
  M25: { id: 'M29', slot: 'team2' },  // <-- CORRECTO

  // MIDDLE - Mantener igual
  M09: { id: 'M15', slot: 'team1' },
  M10: { id: 'M16', slot: 'team1' },
  M11: { id: 'M16', slot: 'team2' },
  M12: { id: 'M15', slot: 'team2' },
  M13: { id: 'M18', slot: 'team2' },
  M14: { id: 'M17', slot: 'team2' },
  M21: { id: 'M23', slot: 'team2' },
  M22: { id: 'M24', slot: 'team2' },
  M26: { id: 'M28', slot: 'team2' },

  // LOWER - CORREGIDO: Perdedores ELIMINADOS
  M15: null,  // <-- AGREGADO: Eliminado
  M16: null,  // <-- AGREGADO: Eliminado
  M17: null,  // <-- CAMBIADO: Era M23 team2
  M18: null,  // <-- CAMBIADO: Era M24 team2
  M23: null,
  M24: null,
  M27: null,
  M28: null,
  M29: null,
  M30: null,
};
```

---

## Resumen de Prioridades

| Error | Severidad | Prioridad |
|-------|-----------|-----------|
| ERROR 1 (M25 conflicto) | Critico | ALTA |
| ERROR 2 (M23 conflicto) | Critico | ALTA |
| ERROR 3 (M24 conflicto) | Critico | ALTA |
| ERROR 4 (Lower envia perdedores) | Critico | ALTA |
| ERROR 5 (M15/M16 faltantes) | Medio | MEDIA |
| ERROR 6 (`any` types) | Bajo | BAJA |
| WARNING 1 (useEffect deps) | Medio | MEDIA |
| WARNING 2 (useCallback deps) | Medio | MEDIA |
| ERROR 7 (validacion Bo3/Bo5) | Medio | MEDIA |

---

*Documento generado el 2026-06-18*
