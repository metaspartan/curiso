export class URLProcessor {
    async extractText(url: string): Promise<string> {
      const response = await fetch(url);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      // Remove scripts, styles, and other non-content elements
      const elementsToRemove = doc.querySelectorAll('script, style, nav, footer, header');
      elementsToRemove.forEach(el => el.remove());
      
      // Extract main content
      const mainContent = doc.querySelector('main, article, .content') || doc.body;
      return mainContent.textContent || '';
    }
  }