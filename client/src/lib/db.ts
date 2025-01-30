import Dexie, { Table } from 'dexie';

interface Document {
  id?: number;
  embedding: Float32Array | number[];
  embeddingDim: number;
  content: string;
  metadata: string;
}

export class VectorDB extends Dexie {
  documents!: Table<Document>;

  constructor() {
    super('CurisoVectorDB');
    this.version(1).stores({
      documents: '++id, embedding, embeddingDim, content, metadata',
    });
  }

  async addDocument(embedding: number[], content: string, metadata: any) {
    try {
      // Only reject control characters except newlines and spaces
      /* eslint-disable-next-line no-control-regex -- TODO fix lint */
      if (/[\x00-\x08\x0B-\x1F\x7F]/.test(content)) {
        console.error('Invalid content containing control characters:', content);
        return;
      }

      console.log('Adding Document to VectorDB with Content:', content);

      await this.documents.add({
        embedding: new Float32Array(embedding),
        embeddingDim: embedding.length,
        content,
        metadata: JSON.stringify(metadata),
      });
    } catch (error) {
      console.error('Failed to add document:', error);
      throw new Error(`Failed to add document: ${error}`);
    }
  }

  async search(embedding: number[], limit: number) {
    console.log('VectorDB search:', { embeddingSize: embedding.length, limit });

    const docs = await this.documents.toArray();
    console.log('Found documents:', docs.length);

    // Compute similarities and sort
    const results = docs
      .map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        distance: this.cosineSimilarity(embedding, Array.from(doc.embedding)),
      }))
      .sort((a, b) => b.distance - a.distance)
      .slice(0, limit);

    console.log('Top results:', results);
    return results;
  }

  async removeDocumentsByMetadata(key: string, value: string) {
    try {
      const documents = await this.documents.toArray();
      const idsToDelete = documents
        .filter(doc => {
          const metadata = JSON.parse(doc.metadata);
          return metadata[key] === value;
        })
        .map(doc => doc.id)
        .filter((id): id is number => id !== undefined);

      await this.documents.bulkDelete(idsToDelete);
    } catch (error) {
      console.error('Failed to remove documents:', error);
      throw new Error(`Failed to remove documents: ${error}`);
    }
  }

  private cosineSimilarity(a: number[] | Float32Array, b: number[] | Float32Array): number {
    // Convert inputs to regular arrays to ensure consistent handling
    const vecA = Array.from(a);
    const vecB = Array.from(b);

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return isNaN(similarity) ? 0 : similarity;
  }

  async clearAll() {
    try {
      await this.documents.clear();
    } catch (error) {
      console.error('Failed to clear documents:', error);
      throw new Error(`Failed to clear documents: ${error}`);
    }
  }
}
