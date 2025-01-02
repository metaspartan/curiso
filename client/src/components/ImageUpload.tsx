import { Button } from "./ui/button";
import { ImageIcon, X } from "lucide-react";
import { useRef, useState } from "react";

interface ImageUploadProps {
  onImageSelect: (imageData: string | null) => void;
}

export function ImageUpload({ onImageSelect }: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const inputId = useRef(`image-upload-${Math.random()}`).current;
  
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          console.log("Image loaded:", base64String.slice(0, 50) + "..."); // Debug log
          setPreview(base64String);
          onImageSelect(base64String);
        };
        reader.readAsDataURL(file);
      }
    };
  
    const clearImage = () => {
      setPreview(null);
      onImageSelect(null);
    };
  
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => document.getElementById(inputId)?.click()}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {/* {preview && (
          <div className="relative">
            <img src={preview} alt="Preview" className="h-8 w-8 rounded object-cover" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-4 w-4"
              onClick={clearImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )} */}
      </div>
    );
  }