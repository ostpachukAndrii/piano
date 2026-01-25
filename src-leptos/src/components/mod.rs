// Components - UI building blocks organized by complexity
// Atoms: Dumb SVG (no state, no hooks, ONLY props)
// Molecules: Lightweight compositions (2-3 atoms combined)
// Organisms: Complex layouts (staff, grand_staff)
// Containers: Smart components with logic and hooks

pub mod atoms;
pub mod containers;
pub mod molecules;
pub mod organisms;

// Re-export for easy access
// Phase 3: Deferred due to Leptos 0.6 #[prop] macro issues
// pub use atoms::*;
// pub use molecules::*;
// pub use organisms::*;
pub use containers::*;
