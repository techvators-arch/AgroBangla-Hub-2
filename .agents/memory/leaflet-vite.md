---
name: Leaflet in Vite
description: How to safely import Leaflet in a Vite+React app to avoid pre-bundle errors
---

# Leaflet in Vite

## Pattern
Use fully dynamic import inside a `useEffect` — never static import at module top-level:

```ts
useEffect(() => {
  const loadLeaflet = async () => {
    const L = (await import("leaflet")).default;
    await import("leaflet/dist/leaflet.css");
    // ... map setup
  };
  loadLeaflet();
}, []);
```

**Why:** Vite's dependency pre-bundler fails to resolve Leaflet when it's statically imported, throwing "Failed to resolve import" at startup. Dynamic import defers resolution until runtime.

**How to apply:** Any page using Leaflet must follow this pattern. Install with `pnpm --filter @workspace/agrobangla add leaflet react-leaflet @types/leaflet`. React 19 peer dep warnings from react-leaflet 4.x are harmless at runtime.
