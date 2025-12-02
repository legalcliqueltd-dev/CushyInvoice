import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Crop as CropIcon, Eraser, Upload, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface LogoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (blob: Blob) => Promise<void>;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function LogoUploadDialog({ open, onOpenChange, onUpload }: LogoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [processing, setProcessing] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"select" | "edit">("select");
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep("edit");
  };

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  }, []);

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!imgRef.current || !completedCrop) return null;

    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const pixelCrop = {
      x: completedCrop.x * scaleX,
      y: completedCrop.y * scaleY,
      width: completedCrop.width * scaleX,
      height: completedCrop.height * scaleY,
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });
  }, [completedCrop]);

  const removeBackground = async () => {
    if (!previewUrl) return;

    setRemovingBg(true);
    try {
      toast({
        title: "Processing",
        description: "Loading AI model for background removal. This may take a moment...",
      });

      const segmenter = await pipeline(
        "image-segmentation",
        "Xenova/segformer-b0-finetuned-ade-512-512",
        { device: "webgpu" }
      );

      const img = imgRef.current;
      if (!img) throw new Error("Image not loaded");

      // Create canvas from current image/crop
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Use cropped area if available, otherwise full image
      if (completedCrop) {
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        ctx.drawImage(
          img,
          completedCrop.x * scaleX,
          completedCrop.y * scaleY,
          completedCrop.width * scaleX,
          completedCrop.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        );
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
      }

      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      const result = await segmenter(imageData);

      if (!result || !Array.isArray(result) || result.length === 0 || !result[0].mask) {
        throw new Error("Background removal failed");
      }

      // Apply mask
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputCtx = outputCanvas.getContext("2d");
      if (!outputCtx) throw new Error("Could not get output context");

      outputCtx.drawImage(canvas, 0, 0);
      const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
      const data = outputImageData.data;

      for (let i = 0; i < result[0].mask.data.length; i++) {
        const alpha = Math.round((1 - result[0].mask.data[i]) * 255);
        data[i * 4 + 3] = alpha;
      }

      outputCtx.putImageData(outputImageData, 0, 0);

      // Update preview
      const newUrl = outputCanvas.toDataURL("image/png");
      setPreviewUrl(newUrl);
      setCrop(undefined);
      setCompletedCrop(null);

      toast({
        title: "Success",
        description: "Background removed successfully",
      });
    } catch (error: any) {
      console.error("Background removal error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove background. Try a different image.",
        variant: "destructive",
      });
    } finally {
      setRemovingBg(false);
    }
  };

  const handleApplyCrop = async () => {
    if (!completedCrop) {
      toast({
        title: "Info",
        description: "Please select an area to crop",
      });
      return;
    }

    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImage();
      if (croppedBlob) {
        const url = URL.createObjectURL(croppedBlob);
        setPreviewUrl(url);
        setCrop(undefined);
        setCompletedCrop(null);
        toast({
          title: "Success",
          description: "Image cropped",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to crop image",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!previewUrl) return;

    setUploading(true);
    try {
      // Convert preview URL to blob
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      await onUpload(blob);
      handleClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCrop(undefined);
    setCompletedCrop(null);
    setStep("select");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select" ? "Upload Company Logo" : "Edit Logo"}
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 cursor-pointer hover:border-primary/50 transition-colors text-center"
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Click to select an image
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG up to 5MB
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}

        {step === "edit" && previewUrl && (
          <div className="space-y-4">
            <div className="flex justify-center bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-auto">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop={false}
              >
                <img
                  ref={imgRef}
                  src={previewUrl}
                  alt="Preview"
                  onLoad={onImageLoad}
                  className="max-h-[350px] object-contain"
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyCrop}
                disabled={processing || removingBg || !completedCrop}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CropIcon className="h-4 w-4 mr-2" />
                )}
                Apply Crop
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={removeBackground}
                disabled={removingBg || processing}
              >
                {removingBg ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eraser className="h-4 w-4 mr-2" />
                )}
                Remove Background
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={processing || removingBg}
              >
                <Upload className="h-4 w-4 mr-2" />
                Change Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {step === "edit" && (
            <Button
              onClick={handleUpload}
              disabled={uploading || processing || removingBg}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Save Logo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
