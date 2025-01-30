import { useStore } from '@/lib/store';
import { Button } from './ui/button';
import { Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';

interface RAGSelectorProps {
  selectedDocs: string[];
  selectedWebsites: string[];
  onDocsChange: (docs: string[]) => void;
  onWebsitesChange: (sites: string[]) => void;
}

export function RAGSelector({
  selectedDocs,
  selectedWebsites,
  onDocsChange,
  onWebsitesChange,
}: RAGSelectorProps) {
  const { settings } = useStore();

  const handleRemoveDoc = (docId: string) => {
    onDocsChange(selectedDocs.filter(id => id !== docId));
  };

  const handleRemoveWebsite = (siteId: string) => {
    onWebsitesChange(selectedWebsites.filter(id => id !== siteId));
  };

  const handleAddDoc = (docId: string) => {
    if (!selectedDocs.includes(docId)) {
      onDocsChange([...selectedDocs, docId]);
    }
  };

  const handleAddWebsite = (siteId: string) => {
    if (!selectedWebsites.includes(siteId)) {
      onWebsitesChange([...selectedWebsites, siteId]);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="h-7 w-7">
              <Plus className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <ScrollArea className="h-[300px] p-4">
              {settings.rag.documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Documents</h4>
                  {settings.rag.documents.map(doc => (
                    <Button
                      key={doc.id}
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => handleAddDoc(doc.id)}
                      disabled={selectedDocs.includes(doc.id)}
                    >
                      {doc.filename}
                    </Button>
                  ))}
                </div>
              )}

              {settings.rag.websites?.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-medium">Websites</h4>
                  {settings.rag.websites.map(site => (
                    <Button
                      key={site.id}
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => handleAddWebsite(site.id)}
                      disabled={selectedWebsites.includes(site.id)}
                    >
                      {site.url}
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {selectedDocs.map(docId => {
          const doc = settings.rag.documents.find(d => d.id === docId);
          if (!doc) return null;
          return (
            <div
              key={doc.id}
              className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1 text-sm"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-muted"
                onClick={() => handleRemoveDoc(doc.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              <span className="truncate max-w-[200px]">{doc.filename}</span>
            </div>
          );
        })}

        {selectedWebsites.map(siteId => {
          const site = settings.rag.websites?.find(s => s.id === siteId);
          if (!site) return null;
          return (
            <div
              key={site.id}
              className="flex items-center gap-1 bg-muted/50 rounded-md px-2 py-1 text-sm"
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 hover:bg-muted"
                onClick={() => handleRemoveWebsite(site.id)}
              >
                <X className="h-3 w-3" />
              </Button>
              <span className="truncate max-w-[200px]">{site.url}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
