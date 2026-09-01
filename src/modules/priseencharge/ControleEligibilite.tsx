/**
 * Étapes 1 à 3 du circuit : arrivée du patient, identification (QR ou numéro
 * Humanitas) puis vérification complète des droits par le serveur.
 * Le partenaire ne reçoit qu'un verdict et les éléments strictement utiles.
 */
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, ScanLine, Search, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { extraireToken } from "@/modules/partenaires/queries";
import { useVerifierEligibilite, type EligibiliteResult } from "./queries";

export function ControleEligibilite({
  partenaireId,
  onResult,
}: {
  partenaireId: string;
  onResult?: (result: EligibiliteResult) => void;
}) {
  const [value, setValue] = useState("");
  const [matricule, setMatricule] = useState("");
  const [result, setResult] = useState<EligibiliteResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const verifier = useVerifierEligibilite();

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanning(false);
  };

  useEffect(() => stopCamera, []);

  async function lancer(payload: { token?: string; matricule?: string }) {
    try {
      const data = await verifier.mutateAsync({ partenaire_id: partenaireId, ...payload });
      setResult(data);
      onResult?.(data);
    } catch (error) {
      toast.error((error as Error).message);
    }
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
        "Scan caméra indisponible sur cet appareil : collez le lien du QR ou saisissez le numéro.",
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
            await lancer({ token });
            return;
          }
        } catch {
          /* image non exploitable */
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
        <ScanLine className="size-4 text-primary" /> Contrôle des droits du patient
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div>
          <Label>Lien du QR code</Label>
          <Input
            value={value}
            placeholder="https://…/verify/xxxxxxxx-xxxx-…"
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
        <Button
          disabled={verifier.isPending}
          onClick={() => {
            const token = extraireToken(value);
            if (!token) {
              toast.error("QR invalide : scannez la carte ou collez le lien /verify/…");
              return;
            }
            void lancer({ token });
          }}
        >
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

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label>Code Humanitas (adhérent ou bénéficiaire)</Label>
          <Input
            value={matricule}
            placeholder="HUM-2026-000123 ou BEN-2026-000001"
            onChange={(event) => setMatricule(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={verifier.isPending}
          onClick={() => {
            if (!matricule.trim()) {
              toast.error("Saisissez le numéro Humanitas.");
              return;
            }
            void lancer({ matricule: matricule.trim() });
          }}
        >
          <Search className="mr-2 size-4" /> Rechercher
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
            {result.eligible ? (
              <>
                <CheckCircle2 className="size-5 text-primary" /> Droits ouverts — prise en charge
                possible
              </>
            ) : (
              <>
                <XCircle className="size-5 text-destructive" /> Prise en charge impossible
              </>
            )}
          </div>

          {(result.motifs ?? []).length > 0 ? (
            <ul className="mt-3 space-y-1">
              {(result.motifs ?? []).map((motif) => (
                <li key={motif} className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {motif}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mb-4 flex items-center gap-4 rounded-xl border border-border/60 bg-card p-3">
            {result.photo_url ? <img src={result.photo_url} alt="Photo du membre vérifié" className="size-16 rounded-xl object-cover" /> : <div className="size-16 rounded-xl bg-muted" />}
            <div><p className="font-semibold">{result.titulaire ?? "Membre Humanitas"}</p><p className="text-xs text-muted-foreground">{result.categorie?.nom ?? "Catégorie non publiée"} · {result.etat_couverture ?? result.statut ?? "État non disponible"}</p></div>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Personne</dt>
              <dd>{result.titulaire ?? "—"} · {result.type_personne === "beneficiaire" ? "Bénéficiaire" : "Adhérent"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Code</dt>
              <dd className="font-mono text-xs">{result.code ?? result.matricule ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Carte</dt>
              <dd>
                {result.carte?.numero ?? "—"}{" "}
                {result.carte ? <Badge variant="secondary">{result.carte.statut}</Badge> : null}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Statut</dt>
              <dd>{result.statut ?? result.statut_adherent ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Catégorie</dt>
              <dd>{result.categorie?.nom ?? "—"}</dd>
            </div>
          </dl>

        </div>
      ) : null}
    </div>
  );
}
