import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Settings } from "lucide-react";
  import logo from "@/assets/logo.svg";
  
  interface WelcomeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  
  export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <DialogHeader>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-primary/30 rounded-full blur-md" />
                <img 
                  src={logo} 
                  alt="Curiso.ai" 
                  className="relative w-20 h-20 animate-fade-in" 
                />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold mb-2">
              Welcome to Curiso!
            </DialogTitle>
            <p className="text-center text-muted-foreground text-sm">
              Your AI-powered canvas for infinite possibilities
            </p>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div className="space-y-4">
              <p className="text-center leading-relaxed">
                Transform your thinking process with an infinite AI-powered canvas that grows with your imagination. Connect ideas, explore concepts, and create knowledge networks with ease.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm flex items-center justify-center gap-2">
                  <span>To get started, click the</span>
                  <span className="bg-background p-1.5 rounded-md border border-border">
                    <Settings className="w-4 h-4" />
                  </span>
                  <span>icon to set up your AI providers</span>
                </p>
              </div>
            </div>
  
            <Button 
              onClick={() => onOpenChange(false)} 
              className="w-full h-12 text-base font-medium"
              variant="default"
            >
              Let's Begin
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }