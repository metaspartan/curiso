export const themeColors = [
    // Blues & Teals
    { name: 'Teal', value: 'hsl(183 31% 26%)' },
    { name: 'Blue', value: 'hsl(221 70% 35%)' },
    { name: 'Slate', value: 'hsl(215 35% 35%)' },
    { name: 'Azure', value: 'hsl(205 65% 35%)' },

    // Purples
    { name: 'Indigo', value: 'hsl(243 65% 35%)' },
    { name: 'Purple', value: 'hsl(271 65% 35%)' },
    { name: 'Violet', value: 'hsl(284 65% 35%)' },

    // Reds & Pinks
    { name: 'Crimson', value: 'hsl(348 65% 35%)' },
    { name: 'Rose', value: 'hsl(330 65% 35%)' },
    { name: 'Magenta', value: 'hsl(300 65% 35%)' },

    // Warm Colors
    { name: 'Orange', value: 'hsl(24 75% 35%)' },
    { name: 'Amber', value: 'hsl(43 75% 35%)' },

    // Greens
    { name: 'Green', value: 'hsl(142 60% 25%)' },
    { name: 'Emerald', value: 'hsl(168 65% 25%)' },
];

export const DEFAULT_AI_SETTINGS = {
    temperature: 0.7,
    top_p: 0,
    max_tokens: 8192,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  
  export type AISettings = typeof DEFAULT_AI_SETTINGS;