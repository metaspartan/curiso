// src/lib/rag.ts
import { VectorDB } from './db';
import { embeddingService } from './embeddings';
import { encode } from 'gpt-tokenizer';
import { PDFProcessor } from './pdf';
import { WebScraper } from './scraper';

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
    if (file.type === 'application/pdf') {
      callbacks?.onModelStatus?.('Processing PDF...');
      const pdfProcessor = new PDFProcessor();
      content = await pdfProcessor.extractText(file);
    } else {
      content = await file.text();
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
        type: 'rag-chunk',
        pageNumber,
        source: metadata.filename 
      });
      chunkIds.push(chunkId);
    }
    
    return chunkIds;
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
      ...metadata
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
        type: 'rag-chunk',
        source: new URL(url).hostname || url
      });
      chunkIds.push(chunkId);
    }
  
    return { documentId, metadata: enhancedMetadata };
  }

  async search(query: string, similarityThreshold = 0.3, topK = 3) {
    console.log("RAG search:", { query, similarityThreshold, topK });
    
    const embedding = await embeddingService.getEmbeddings(query);
    console.log("Query embedding generated:", embedding.length);
    
    const results = await this.db.search(embedding, topK);
    console.log("Raw search results:", results);
  
    // Deduplicate results based on content
    const seenContent = new Set<string>();
    const uniqueResults = results.filter(doc => {
      if (seenContent.has(doc.content)) {
        return false;
      }
      seenContent.add(doc.content);
      return doc.distance > similarityThreshold;
    });
  
    // If we filtered out duplicates, get additional results
    if (uniqueResults.length < topK) {
      const additionalResults = await this.db.search(
        embedding, 
        topK + 5
      );
      
      for (const doc of additionalResults) {
        if (uniqueResults.length >= topK) break;
        if (!seenContent.has(doc.content) && doc.distance > similarityThreshold) {
          uniqueResults.push(doc);
          seenContent.add(doc.content);
        }
      }
    }
  
    return uniqueResults.map(doc => ({
      content: doc.content.trim(),
      metadata: JSON.parse(doc.metadata),
      relevance: doc.distance
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