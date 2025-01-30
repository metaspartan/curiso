// src/lib/rag.ts
import { VectorDB } from './db';
import { embeddingService } from './embeddings';
import { encode } from 'gpt-tokenizer';
import { PDFProcessor } from './pdf';
import { WebScraper } from './scraper';
import { useStore } from '@/lib/store';

interface ProgressCallbacks {
  onChunk?: (current: number, total: number) => void;
  onModelStatus?: (status: string) => void;
}

export class RAGService {
  private db: VectorDB;

  constructor() {
    this.db = new VectorDB();
  }

  async addDocument(file: File, metadata: any, callbacks?: ProgressCallbacks) {
    if (!embeddingService.isInitialized()) {
      await embeddingService.init(status => callbacks?.onModelStatus?.(status));
    }

    let content: string;
    callbacks?.onModelStatus?.('Processing file...');

    // Define supported file types and their MIME types
    const supportedTypes = {
      // Documents
      'application/pdf': true,
      'text/plain': true,
      'text/markdown': true,
      'text/rtf': true,
      'application/rtf': true,
      'application/msword': true,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,

      // Code files
      'text/javascript': true,
      'application/javascript': true,
      'text/typescript': true,
      'application/typescript': true,
      'text/x-python': true,
      'text/x-java': true,
      'text/x-c': true,
      'text/x-c++': true,
      'text/x-csharp': true,
      'text/x-go': true,
      'text/x-ruby': true,
      'text/x-rust': true,
      'text/x-swift': true,
      'text/x-kotlin': true,
      'text/x-scala': true,
      'text/x-php': true,
      'text/x-zig': true,

      // Web files
      'text/html': true,
      'text/css': true,
      'application/json': true,
      'application/xml': true,
      'text/xml': true,
      'application/x-yaml': true,
      'text/x-yaml': true,

      // Config files
      'text/x-properties': true,
      'text/x-toml': true,
      'text/x-ini': true,

      // Shell scripts
      'text/x-sh': true,
      'application/x-sh': true,
      'text/x-bash': true,
      'text/x-powershell': true,
    };

    // File extensions mapped to their common types
    const extensionMap: { [key: string]: string } = {
      // Documents
      txt: 'text/plain',
      md: 'text/markdown',
      pdf: 'application/pdf',
      rtf: 'application/rtf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

      // Code files
      js: 'text/javascript',
      jsx: 'text/javascript',
      ts: 'text/typescript',
      tsx: 'text/typescript',
      py: 'text/x-python',
      java: 'text/x-java',
      c: 'text/x-c',
      cpp: 'text/x-c++',
      cc: 'text/x-c++',
      h: 'text/x-c',
      hpp: 'text/x-c++',
      cs: 'text/x-csharp',
      go: 'text/x-go',
      rb: 'text/x-ruby',
      rs: 'text/x-rust',
      swift: 'text/x-swift',
      kt: 'text/x-kotlin',
      scala: 'text/x-scala',
      php: 'text/x-php',
      zig: 'text/x-zig',

      // Web files
      html: 'text/html',
      htm: 'text/html',
      css: 'text/css',
      json: 'application/json',
      xml: 'text/xml',
      yaml: 'application/x-yaml',
      yml: 'application/x-yaml',

      // Config files
      properties: 'text/x-properties',
      toml: 'text/x-toml',
      ini: 'text/x-ini',

      // Shell scripts
      sh: 'text/x-sh',
      bash: 'text/x-bash',
      ps1: 'text/x-powershell',
      psm1: 'text/x-powershell',
      psd1: 'text/x-powershell',
    };

    try {
      // Check if the file type is directly supported
      if (supportedTypes[file.type as keyof typeof supportedTypes]) {
        if (file.type === 'application/pdf') {
          const pdfProcessor = new PDFProcessor();
          content = await pdfProcessor.extractText(file);
        } else {
          content = await file.text();
        }
      } else {
        // Try to determine type by extension
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        const mappedType = extensionMap[extension];

        if (mappedType && supportedTypes[mappedType as keyof typeof supportedTypes]) {
          content = await file.text();
        } else {
          throw new Error(`Unsupported file type: ${file.type || extension}`);
        }
      }

      callbacks?.onModelStatus?.('Chunking document...');
      const chunks = this.chunkText(content);
      const chunkIds: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        callbacks?.onChunk?.(i + 1, chunks.length);
        callbacks?.onModelStatus?.(`Embedding chunk ${i + 1}/${chunks.length}`);

        const chunkId = crypto.randomUUID();
        const embedding = await embeddingService.getEmbeddings(chunks[i]);

        const pageMatch = chunks[i].match(/^\[Page (\d+)\]/);
        const pageNumber = pageMatch ? parseInt(pageMatch[1]) : 1;

        await this.db.addDocument(embedding, chunks[i], {
          ...metadata,
          chunkId,
          documentId: metadata.id,
          type: 'document',
          pageNumber,
          source: metadata.filename,
          mimeType:
            file.type ||
            extensionMap[file.name.split('.').pop()?.toLowerCase() || ''] ||
            'text/plain',
        });
        chunkIds.push(chunkId);
      }

      return chunkIds;
    } catch (error) {
      console.error('Error processing document:', error);
      throw error;
    }
  }

  async removeDocument(documentId: string) {
    await this.db.removeDocumentsByMetadata('documentId', documentId);
  }

  async removeWebsite(websiteId: string) {
    await this.db.removeDocumentsByMetadata('documentId', websiteId);
  }

  async addWebsite(url: string, callbacks?: ProgressCallbacks) {
    if (!embeddingService.isInitialized()) {
      await embeddingService.init(status => callbacks?.onModelStatus?.(status));
    }

    callbacks?.onModelStatus?.('Scraping website...');
    const scraper = new WebScraper();
    const { content, metadata } = await scraper.scrapeUrl(url);

    const documentId = crypto.randomUUID();
    const enhancedMetadata = {
      id: documentId,
      type: 'website',
      ...metadata,
    };

    callbacks?.onModelStatus?.('Chunking content...');
    const chunks = this.chunkText(content);
    const chunkIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      callbacks?.onChunk?.(i + 1, chunks.length);
      callbacks?.onModelStatus?.(`Embedding chunk ${i + 1}/${chunks.length}`);

      const chunkId = crypto.randomUUID();
      const embedding = await embeddingService.getEmbeddings(chunks[i]);

      await this.db.addDocument(embedding, chunks[i], {
        ...enhancedMetadata,
        chunkId,
        documentId,
        type: 'website',
        source: new URL(url).hostname || url,
      });
      chunkIds.push(chunkId);
    }

    return { documentId, metadata: enhancedMetadata };
  }

  async search(query: string, selectedDocs?: string[], selectedWebsites?: string[]) {
    console.log('RAG search:', { query, selectedDocs, selectedWebsites });
    const embedding = await embeddingService.getEmbeddings(query);
    console.log('Query embedding generated:', embedding.length);

    // Get initial results
    const results = await this.db.search(embedding, 10); // Get more initial results to filter
    console.log('Raw search results:', results);

    // Filter by selected documents/websites and similarity threshold
    const similarityThreshold = useStore.getState().settings.rag.similarityThreshold;
    const seenContent = new Set<string>();
    const filteredResults = results.filter(doc => {
      // Skip if content already seen
      if (seenContent.has(doc.content)) return false;
      seenContent.add(doc.content);

      // Check similarity threshold
      if (doc.distance <= similarityThreshold) return false;

      // If no selections, include all results
      if (!selectedDocs?.length && !selectedWebsites?.length) return true;

      const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;

      // Filter based on document type
      if (metadata.type === 'document') {
        return selectedDocs?.includes(metadata.documentId);
      } else if (metadata.type === 'website') {
        return selectedWebsites?.includes(metadata.documentId);
      }
      return false;
    });

    // Get additional results if needed (maintaining top 3 most relevant)
    if (filteredResults.length < 3) {
      const additionalResults = await this.db.search(embedding, 15);
      for (const doc of additionalResults) {
        if (filteredResults.length >= 3) break;

        const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;

        if (
          !seenContent.has(doc.content) &&
          doc.distance > similarityThreshold &&
          ((metadata.type === 'document' && selectedDocs?.includes(metadata.documentId)) ||
            (metadata.type === 'website' && selectedWebsites?.includes(metadata.documentId)) ||
            (!selectedDocs?.length && !selectedWebsites?.length))
        ) {
          filteredResults.push(doc);
          seenContent.add(doc.content);
        }
      }
    }

    return filteredResults.map(doc => ({
      content: doc.content.trim(),
      metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata,
      score: doc.distance,
    }));
  }

  private chunkText(text: string, maxChars = 512): string[] {
    if (typeof text !== 'string') {
      console.error('Invalid text input:', text);
      return [];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    // Split into paragraphs first
    const paragraphs = text.split(/\n\s*\n/);

    for (const paragraph of paragraphs) {
      // If paragraph is too long, split into sentences
      if (paragraph.length > maxChars) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);

        for (const sentence of sentences) {
          if ((currentChunk + sentence).length > maxChars && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          currentChunk += sentence + ' ';
        }
      } else {
        if ((currentChunk + paragraph).length > maxChars && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        currentChunk += paragraph + '\n\n';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
