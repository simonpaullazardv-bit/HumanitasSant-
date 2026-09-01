/**
 * Capture de la photo d'identité : webcam / caméra du téléphone ou import de fichier,
 * recadrage carré, compression WebP puis envoi dans le stockage sécurisé.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Check, RefreshCw, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { uploadPhoto } from "./queries";

async function cropToWebp(src: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });
  const size = 600;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), "image/webp", 0.85),
  );
}

export function PhotoCapture({
  prefix,
  onUploaded,
  onCancel,
}: {
  /** Dossier de destination, par exemple `adherents/<id>`. */
  prefix: string;
  onUploaded: (path: string) => void;
  onCancel?: () => void;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setStreaming(true);
      setSource(null);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      toast.error("Impossible d'accéder à la caméra. Autorisez l'accès ou importez un fichier.");
    }
  };

  const shoot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    setSource(canvas.toDataURL("image/png"));
    stopCamera();
  };

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSource(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!source || !area) return;
    setSaving(true);
    try {
      const blob = await cropToWebp(source, area);
      const path = await uploadPhoto(prefix, blob);
      toast.success("Photo enregistrée.");
      onUploaded(path);
    } catch (error) {
      toast.error((error as Error).message ?? "Échec de l'envoi de la photo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted">
        {streaming && <video ref={videoRef} playsInline muted className="size-full object-cover" />}
        {!streaming && source && (
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => setArea(pixels)}
          />
        )}
        {!streaming && !source && (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <Camera className="size-8" />
            Webcam, caméra du téléphone ou fichier
          </div>
        )}
      </div>

      {!streaming && source && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.05}
            onValueChange={(value) => setZoom(value[0] ?? 1)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!streaming ? (
          <Button type="button" variant="secondary" size="sm" onClick={startCamera}>
            <Camera className="mr-1 size-4" /> Caméra
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={shoot}>
            <Camera className="mr-1 size-4" /> Prendre la photo
          </Button>
        )}

        <Button type="button" variant="secondary" size="sm" asChild>
          <label className="cursor-pointer">
            <Upload className="mr-1 size-4" /> Importer
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
          </label>
        </Button>

        {source && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setSource(null)}>
            <RefreshCw className="mr-1 size-4" /> Recommencer
          </Button>
        )}

        <Button type="button" size="sm" disabled={!source || !area || saving} onClick={save}>
          <Check className="mr-1 size-4" /> {saving ? "Envoi…" : "Valider la photo"}
        </Button>

        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X className="mr-1 size-4" /> Annuler
          </Button>
        )}
      </div>
    </div>
  );
}
