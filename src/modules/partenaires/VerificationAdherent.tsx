/**
 * Vérification d'un adhérent depuis l'espace partenaire.
 * Le partenaire n'accède jamais à la base : la fonction serveur ne renvoie
 * que la validité de la carte, la catégorie et l'ouverture des droits.
 */
import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ScanLine, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { extraireToken, useVerifierAdherent } from "./queries";

interface Resultat {
  valide?: boolean;
  numero?: string;
  titulaire?: string;
  categorie?: string;
  taux_couverture?: number;
  plafond_usd?: number;
  date_expiration?: string;
  droits_ouverts?: boolean;
  adherent_id?: string;
  motif?: string;
}

export function VerificationAdherent({
  partenaireId,
  onVerified,
}: {
  partenaireId: string;
  onVerified?: (result: Resultat) => void;
}) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Resultat | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const verifier = useVerifierAdherent();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopCamera, []);

  async function lancer(token: string) {
    try {
      const data = (await verifier.mutateAsync({ partenaire_id: partenaireId, token })) as Resultat;
      setResult(data);
      onVerified?.(data);
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  async function handleSubmit() {
    const token = extraireToken(value);
    if (!token) {
      toast.error("Token invalide : scannez le QR ou collez le lien /verify/…");
      return;
    }
    await lancer(token);
  }

  async function startScan() {
    const Detector = (
      globalThis as unknown as {
        BarcodeDetector?: new (o: unknown) => {
          detect: (s: unknown) => Promise<{ rawValue: string }[]>;
        };
      }
    ).BarcodeDetector;
    if (!Detector) {
      toast.error(
        "Le scan caméra n'est pas disponible sur cet appareil : saisissez le lien du QR.",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      setScanning(true);
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current) return;
        try {
          const codes = await detector.detect(video);
          const raw = codes[0]?.rawValue;
          const token = raw ? extraireToken(raw) : null;
          if (token) {
            stopCamera();
            setValue(raw ?? token);
            await lancer(token);
            return;
          }
        } catch {
          /* image non exploitable, on retente */
        }
        requestAnimationFrame(() => void tick());
      };
      void tick();
    } catch {
      toast.error("Accès caméra refusé.");
      stopCamera();
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <ScanLine className="size-4 text-primary" /> Vérifier un adhérent
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <Label>Lien du QR code ou token</Label>
          <Input
            value={value}
            placeholder="https://…/verify/xxxxxxxx-xxxx-…"
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <Button onClick={handleSubmit} disabled={verifier.isPending}>
          {verifier.isPending ? "Vérification…" : "Vérifier"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={scanning ? stopCamera : () => void startScan()}
        >
          <Camera className="mr-2 size-4" />
          {scanning ? "Arrêter" : "Scanner"}
        </Button>
      </div>

      {scanning ? (
        <video
          ref={videoRef}
          className="w-full max-w-sm rounded-xl border border-border/70"
          muted
          playsInline
        />
      ) : null}

      {result ? (
        <div className="rounded-xl border border-border/70 bg-surface p-4 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            {result.valide ? (
              <>
                <CheckCircle2 className="size-5 text-primary" /> Carte valide
              </>
            ) : (
              <>
                <XCircle className="size-5 text-destructive" /> {result.motif ?? "Carte non valide"}
              </>
            )}
          </div>
          {result.valide ? (
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Numéro</dt>
                <dd>{result.numero}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Titulaire</dt>
                <dd>{result.titulaire}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Catégorie</dt>
                <dd>{result.categorie ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Couverture</dt>
                <dd>{result.taux_couverture ?? "—"} %</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Plafond</dt>
                <dd>{result.plafond_usd ?? "—"} USD</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Droits</dt>
                <dd className={result.droits_ouverts ? "text-primary" : "text-destructive"}>
                  {result.droits_ouverts ? "Ouverts" : "Non ouverts"}
                </dd>
              </div>
            </dl>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
