// Note Molecule - Notehead + Stem + Accidental
// Simplified for Phase 3: Direct SVG rendering without atom composition
// Combines notehead, stem, accidental in one component
// Lightweight - no state, just composition

use leptos::*;

#[component]
pub fn Note(
    #[prop] x: f32,
    #[prop] y: f32,
    #[prop] duration: String,  // whole, half, quarter, eighth
    #[prop(default = false)] accidental: bool,
    #[prop(default = "natural".to_string())] accidental_type: String,
    #[prop(default = "up".to_string())] stem_direction: String,
) -> impl IntoView {
    let filled = duration != "whole";
    let stem_y1 = if stem_direction == "up" { y - 35.0 } else { y };
    let stem_y2 = if stem_direction == "up" { y } else { y + 35.0 };
    
    view! {
        <g class="note">
            // Notehead
            <ellipse
                cx=x
                cy=y
                rx=8.0
                ry=6.4
                fill={if filled { "black" } else { "white" }}
                stroke="black"
                stroke-width="1"
            />
            // Stem
            <line
                x1={x + 8.0}
                y1=stem_y1
                x2={x + 8.0}
                y2=stem_y2
                stroke="black"
                stroke-width="1.5"
            />
            // Accidental (if needed)
            {if accidental {
                view! {
                    <text x={x - 12.0} y=y font-size="16">
                        {match accidental_type.as_str() {
                            "sharp" => "♯",
                            "flat" => "♭",
                            "natural" => "♮",
                            _ => "",
                        }}
                    </text>
                }.into_view()
            } else {
                view! { <></> }.into_view()
            }}
        </g>
    }
}
