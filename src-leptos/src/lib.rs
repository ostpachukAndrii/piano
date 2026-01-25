// Leptos Piano Frontend Library
// This module re-exports all public components, hooks, and utilities

pub mod app;
pub mod components;
pub mod hooks;
pub mod models;
pub mod tauri;
pub mod utils;

pub use app::App;
// pub use components::*;  // TODO: Fix component prop syntax
pub use hooks::*;
pub use models::*;
