// Supabase Edge Function: Générateur de Reçus PDF
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { adherentName, refFacture, amount } = await req.json();

  const responseBody = {
    message: "Reçu de paiement généré avec succès",
    refFacture,
    adherentName,
    amount,
    generatedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(responseBody), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
