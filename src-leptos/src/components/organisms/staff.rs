// Staff Organism - Single staff (treble or bass)
// Phase 3: Simplified implementation with inline SVG
use leptos::*;

#[component]
pub fn Staff(
    #[prop] clef_type: String, // "treble" or "bass"
    #[prop] children: Children,
) -> impl IntoView {
    let clef_symbol = if clef_type == "treble" { "𝄞" } else { "𝄢" };
    
    view! {
        <svg class="staff" viewBox="0 0 1000 100" height="100">
            <g class="staff-group">
                // Staff lines (5 horizontal lines)
                {(0..5)
                    .map(|i| {
                        let y = 10.0 + (i as f32) * 10.0;
                        view! {
                            <line
                                x1=0.0
                                y1=y
                                x2=1000.0
                                y2=y
                                stroke="black"
                                stroke-width="1"
                            />
                        }
                    })
                    .collect::<Vec<_>>()
                }
                // Clef
                <text x=30.0 y=50.0 font-size="48">
                    {clef_symbol}
                </text>
                // Measures
                <g class="measures" transform="translate(80, 0)">
                    {children()}
                </g>
            </g>
        </svg>
    }
}
