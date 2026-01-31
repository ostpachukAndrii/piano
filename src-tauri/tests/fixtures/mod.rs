// Test Fixtures - Reusable test data
//
// Centralized location for test data that can be reused across multiple tests
// Benefits:
// - Consistent test data
// - Easy to maintain
// - DRY principle
// - Quick test setup

pub mod lessons;
pub mod midi;

pub use lessons::*;
pub use midi::*;
