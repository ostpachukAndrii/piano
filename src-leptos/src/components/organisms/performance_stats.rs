// Performance Stats Organism - Real-time stats display
// Shows accuracy, streak, notes played, and time elapsed

use crate::hooks::SessionStats;
use leptos::*;

/// Performance statistics display component
#[component]
pub fn PerformanceStats(
    /// Session statistics to display
    stats: SessionStats,
    /// Elapsed time in seconds
    #[prop(default = 0)]
    elapsed_seconds: u32,
) -> impl IntoView {
    let minutes = elapsed_seconds / 60;
    let seconds = elapsed_seconds % 60;
    let time_str = format!("{:02}:{:02}", minutes, seconds);

    view! {
        <div
            class="performance-stats"
            style="display: flex; gap: 24px; padding: 16px; background: #1f2937; border-radius: 8px; color: white;"
        >
            // Accuracy
            <div class="stat-item" style="text-align: center;">
                <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;">"Accuracy"</div>
                <div style="font-size: 24px; font-weight: bold; color: #22c55e;">
                    {format!("{:.0}%", stats.accuracy)}
                </div>
            </div>

            // Streak
            <div class="stat-item" style="text-align: center;">
                <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;">"Streak"</div>
                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">
                    {stats.current_streak}
                    <span style="font-size: 14px; color: #6b7280;">
                        {format!(" (best: {})", stats.best_streak)}
                    </span>
                </div>
            </div>

            // Notes
            <div class="stat-item" style="text-align: center;">
                <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;">"Notes"</div>
                <div style="font-size: 24px; font-weight: bold;">
                    <span style="color: #22c55e;">{stats.correct_notes}</span>
                    <span style="color: #6b7280;">" / "</span>
                    <span>{stats.total_notes}</span>
                </div>
            </div>

            // Perfect Notes
            <div class="stat-item" style="text-align: center;">
                <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;">"Perfect"</div>
                <div style="font-size: 24px; font-weight: bold; color: #a855f7;">
                    {stats.perfect_notes}
                </div>
            </div>

            // Time
            <div class="stat-item" style="text-align: center;">
                <div style="font-size: 12px; color: #9ca3af; text-transform: uppercase;">"Time"</div>
                <div style="font-size: 24px; font-weight: bold; color: #60a5fa;">
                    {time_str}
                </div>
            </div>
        </div>
    }
}

/// Compact stats display for inline use
#[component]
pub fn PerformanceStatsCompact(stats: SessionStats) -> impl IntoView {
    view! {
        <div
            class="performance-stats-compact"
            style="display: flex; gap: 16px; padding: 8px 16px; background: #374151; border-radius: 4px; color: white; font-size: 14px;"
        >
            <span style="color: #22c55e;">
                {format!("{}%", stats.accuracy as u32)}
            </span>
            <span style="color: #f59e0b;">
                "🔥 " {stats.current_streak}
            </span>
            <span>
                {stats.correct_notes} "/" {stats.total_notes}
            </span>
        </div>
    }
}
