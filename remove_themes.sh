#!/bash

# Define the replacements
# We use ! as separator to avoid issues with / in colors
replacements=(
    "t.bg_primary!'#000000'"
    "t.bg_secondary!'#0a0a0a'"
    "t.bg_card!'#111111'"
    "t.bg_card_2!'#1a1a1a'"
    "t.bg_input!'#111111'"
    "t.bg_elevated!'#1a1a1a'"
    "t.border_primary!'#222222'"
    "t.border_secondary!'#1a1a1a'"
    "t.border_subtle!'#333333'"
    "t.text_primary!'#ffffff'"
    "t.text_secondary!'#888888'"
    "t.text_tertiary!'#555555'"
    "t.text_placeholder!'#444444'"
    "t.accent!'#FF2D78'"
    "t.accent_dark!'#CC0055'"
    "t.accent_bg!'rgba(255,45,120,0.1)'"
    "t.accent_border!'rgba(255,45,120,0.25)'"
    "t.gradient!'linear-gradient(135deg, #9B27AF, #FF2D78)'"
    "t.green!'#22c55e'"
    "t.green_bg!'rgba(34,197,94,0.1)'"
    "t.green_border!'rgba(34,197,94,0.25)'"
    "t.amber!'#f59e0b'"
    "t.amber_bg!'rgba(245,158,11,0.1)'"
    "t.amber_border!'rgba(245,158,11,0.25)'"
    "t.red!'#ef4444'"
    "t.red_bg!'rgba(239,68,68,0.1)'"
    "t.red_border!'rgba(239,68,68,0.25)'"
    "t.blue!'#3b82f6'"
    "t.blue_bg!'rgba(59,130,246,0.1)'"
    "t.blue_border!'rgba(59,130,246,0.25)'"
    "t.nav_bg!'#000000'"
    "t.nav_border!'#111111'"
    "t.nav_active!'#FF2D78'"
    "t.nav_inactive!'#555555'"
    "t.story_ring!'#FF2D78'"
    "t.overlay!'rgba(0,0,0,0.75)'"
    "t.shadow!'0 4px 20px rgba(0,0,0,0.4)'"
    "t.shadow_lg!'0 8px 40px rgba(0,0,0,0.6)'"
    "t.cardShadow!'none'"
)

# List of files to process
files=$(grep -rl "t\." src/*.tsx src/**/*.tsx 2>/dev/null)

for file in $files; do
    echo "Processing $file..."
    for replacement in "${replacements[@]}"; do
        old=${replacement%!*}
        new=${replacement#*!}
        sed -i "s/$old/$new/g" "$file"
    done
    
    # Remove useTheme hooks and variables
    sed -i "/const t = useTheme();/d" "$file"
    sed -i "/const { .* } = useThemeControl();/d" "$file"
done
