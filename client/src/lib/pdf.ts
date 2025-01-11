// client/src/lib/pdf.ts
import * as pdfjs from 'pdfjs-dist';

export class PDFProcessor {
  constructor() {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  }

  async extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ 
      data: arrayBuffer,
      useSystemFonts: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/',
      disableFontFace: true,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true,
    }).promise;

    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent({});

      const pageTextRaw = content.items
        .filter(item => 'str' in item && typeof item.str === 'string')
        .map(item => (item as any).str)
        .join(' ');

      console.log(`Page ${i} Raw Text:`, pageTextRaw);

      const pageTextFiltered = pageTextRaw.replace(/[^\x20-\x7E\n]/g, '');
      console.log(`Page ${i} After Removing Non-ASCII:`, pageTextFiltered);

      const cleanedText = this.cleanText(pageTextFiltered);
      console.log(`Page ${i} Cleaned Text:`, cleanedText);

      if (cleanedText.trim().length > 0) {
        fullText += `[Page ${i}] ${cleanedText}\n\n`;
      }
    }

    console.log('Full Extracted Text:', fullText);
    
    return fullText.trim();
  }
  
  private cleanText(text: string): string {
    return text
      .replace(/([a-z])-\n([a-z])/g, '$1$2') // Fix hyphenation
      .replace(/\f/g, '\n')                   // Replace form feeds
      .replace(/[^\S\r\n]+/g, ' ')           // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n')            // Normalize paragraph breaks
      .trim();
  }
}