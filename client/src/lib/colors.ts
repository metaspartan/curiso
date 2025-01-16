export function generateChartColor(index: number) {
    // Golden ratio for better color distribution
    const goldenRatio = 0.618033988749895
    
    // Use the index to generate a hue value between 0 and 360
    const hue = (index * goldenRatio * 360) % 360
    
    // Fixed saturation and lightness for consistent look
    const saturation = 65
    const lightness = 55
    
    return `${hue} ${saturation}% ${lightness}%`
}