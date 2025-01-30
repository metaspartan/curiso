import { Tiktoken, encodingForModel, TiktokenModel } from 'js-tiktoken';

let tokenizer: Tiktoken | null = null;

export const countTokens = async (text: string, model: string = 'gpt-4') => {
  try {
    // Initialize tokenizer if not already done or if model changed
    if (!tokenizer) {
      tokenizer = encodingForModel(model as TiktokenModel);
    }

    const tokens = tokenizer.encode(text);
    return tokens.length;
  } catch (error) {
    console.error('Error counting tokens:', error);
    // Fallback to rough estimation if tokenization fails
    return Math.round(text.length / 4);
  }
};
