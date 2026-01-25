// Grand Staff Organism - Treble + Bass staves + brace
use crate::components::organisms::Staff;
use leptos::*;

#[component]
pub fn GrandStaff(#[prop] children: Children) -> impl IntoView {
    view! {
        <div class="grand-staff">
            <svg viewBox="0 0 1000 250" class="grand-staff-svg">
                <g class="treble-staff">
                    <Staff clef_type="treble".to_string()>
                        {children()}
                    </Staff>
                </g>
            </svg>
        </div>
    }
}
