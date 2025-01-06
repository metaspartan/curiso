import ollamaLogo from "@/assets/ollama-logo.svg";
import exoLogo from "@/assets/exo.png";
import janLogo from "@/assets/jan.svg";
import lmstudioLogo from "@/assets/lmstudio.png";
import vllmlogo from "@/assets/vllm.svg";
import logo from "@/assets/logo.svg";

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

  export const PRESET_ENDPOINTS = [
    {
      name: "Exo",
      url: "http://localhost:52415/v1",
      description: "Local Exo instance",
      icon: exoLogo
    },
    {
      name: "Ollama",
      url: "http://localhost:11434/v1",
      description: "Local Ollama instance",
      icon: ollamaLogo
    },
    {
      name: "Jan.ai",
      url: "http://localhost:1337/v1",
      description: "Local Jan.ai instance",
      icon: janLogo
    },
    {
      name: "LM Studio",
      url: "http://localhost:1234/v1",
      description: "Local LM Studio instance",
      icon: lmstudioLogo
    },
    {
      name: "vLLM",
      url: "http://localhost:8000/v1",
      description: "Local vLLM instance",
      icon: vllmlogo
    },
    {
      name: "Custom",
      url: "",
      description: "Custom endpoint URL",
      icon: logo
    }
  ] as const;