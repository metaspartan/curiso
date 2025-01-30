import { fetch } from '@tauri-apps/plugin-http';

export class WebScraper {
  async scrapeUrl(url: string): Promise<{ content: string; metadata: any }> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MyBot/1.0;)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      if (!text) {
        throw new Error('No content received from URL');
      }

      // Use DOMParser for better HTML parsing
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');

      // Remove unwanted elements
      const elementsToRemove = doc.querySelectorAll('script, style, nav, footer, header');
      elementsToRemove.forEach(el => el.remove());

      // Get main content
      const mainContent = doc.querySelector('main, article, .content') || doc.body;
      const cleanText = mainContent.textContent || '';

      console.log('Scraped content length:', cleanText.length);

      const metadata = {
        url,
        title: doc.title || new URL(url).hostname,
        description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
        dateScraped: new Date().toISOString(),
        type: 'website',
      };

      return { content: cleanText, metadata };
    } catch (error) {
      console.error('Failed to scrape URL:', error);
      throw error;
    }
  }
}
