import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useState } from 'react';
import { exportData, importData } from '../lib/storage';
import { toast, useToast } from '@/hooks/use-toast';

export function BackupDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleExport = async () => {
    try {
      if (!password) {
        toast({
          title: 'Error',
          description: 'Please enter a password to encrypt your backup',
          variant: 'destructive',
        });
        return;
      }
      await exportData(password);
      toast({
        title: 'Success',
        description: 'Backup file created successfully',
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create backup',
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    try {
      if (!file || !password) {
        toast({
          title: 'Error',
          description: 'Please select a file and enter the password',
          variant: 'destructive',
        });
        return;
      }
      await importData(file, password);
      toast({
        title: 'Success',
        description: 'Backup restored successfully',
      });
      setIsOpen(false);
      // Reload the page to apply changes
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to restore backup',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Backup & Restore</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Backup & Restore</DialogTitle>
          <DialogDescription>
            Export or import your Curiso data. All data is encrypted with your password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              className="col-span-3"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter encryption password"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              Backup File
            </Label>
            <Input
              id="file"
              type="file"
              className="col-span-3"
              accept=".cur"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button onClick={handleExport} variant="secondary">
            Export Backup
          </Button>
          <Button onClick={handleImport} variant="default">
            Import Backup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
