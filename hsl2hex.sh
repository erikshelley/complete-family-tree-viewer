#!/usr/bin/env bash
# Usage: hsl2hex.sh <hue 0-360> <saturation 0-100> <lightness 0-100>
# Output: #rrggbb

if [[ $# -ne 3 ]]; then
    echo "Usage: $0 <hue 0-360> <saturation 0-100> <lightness 0-100>" >&2
    exit 1
fi

awk -v h="$1" -v s="$2" -v l="$3" '
BEGIN {
    s /= 100
    l /= 100

    if (s == 0) {
        r = g = b = l
    } else {
        q = (l < 0.5) ? l * (1 + s) : l + s - l * s
        p = 2 * l - q

        r = hue2rgb(p, q, h / 360 + 1/3)
        g = hue2rgb(p, q, h / 360)
        b = hue2rgb(p, q, h / 360 - 1/3)
    }

    printf "#%02x%02x%02x\n", r * 255, g * 255, b * 255
}

function hue2rgb(p, q, t) {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1/6) return p + (q - p) * 6 * t
    if (t < 1/2) return q
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
    return p
}
'
