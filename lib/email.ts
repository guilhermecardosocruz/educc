/**
 * Envio de e-mail desativado por padrão.
 * Para ativar, configure:
 *   - EMAIL_PROVIDER_ENABLED=true
 *   - (exemplo com Resend) RESEND_API_KEY=...
 *   - MAIL_FROM="EDUCC <no-reply@SEU-DOMINIO>"
 */
export async function sendRecoveryEmail(to: string, subject: string, text: string, html?: string) {
  const enabled = process.env.EMAIL_PROVIDER_ENABLED === "true";
  if (!enabled) {
    // Modo silencioso: não envia nada enquanto você não tiver domínio/provedor
    return { sent: false, reason: "Email provider disabled" };
  }

  // EXEMPLO com Resend (quando você tiver domínio e chave):
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "no-reply@example.com";
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to, subject, text, html })
  });
  if (!res.ok) {
    const body = await res.text().catch(()=>"");
    throw new Error(`Email API error ${res.status}: ${body}`);
  }
  return { sent: true };
}
