// Staff Lines Atom - 5 horizontal lines
use leptos::*;

#[component]
pub fn StaffLines(
    #[prop(default = 0.0)] x: f32,
    #[prop(default = 0.0)] y: f32,
    #[prop(default = 500.0)] width: f32,
) -> impl IntoView {
    let line_spacing = 10.0;
    view! {
        {(0..5)
            .map(|i| {
                let line_y = y + (i as f32) * line_spacing;
                view! {
                    <line
                        x1=x
                        y1=line_y
                        x2={x + width}
                        y2=line_y
                        stroke="black"
                        stroke-width="1"
                    />
                }
            })
            .collect::<Vec<_>>()}
    }
}
