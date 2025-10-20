"use client";

import { useRef } from "react";

export type CertLogoItem = {
  label?: "prefeitura" | "escola" | "brasao" | "outro";
  dataUrl: string;
  position:
    | "top-left" | "top-center" | "top-right"
    | "center-left" | "center" | "center-right"
    | "bottom-left" | "bottom-center" | "bottom-right";
  widthPx: number;
  margin?: number;
};

export type CertBackground = {
  dataUrl: string;
  mode: "cover" | "contain" | "stretch";
};

export type CertAssets = {
  bg?: CertBackground;
  logos?: CertLogoItem[];
};

type Props = {
  value?: CertAssets;
  onChange: (next: CertAssets) => void;
};

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

export default function CertAssetsUploader({ value, onChange }: Props) {
  const v = value || {};
  const logos = v.logos || [];
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  async function onPickBg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await readFileAsDataURL(f);
    onChange({ ...v, bg: { dataUrl, mode: v.bg?.mode || "cover" } });
    if (bgInputRef.current) bgInputRef.current.value = "";
  }

  function removeBg() {
    const next = { ...v };
    delete (next as any).bg;
    onChange(next);
  }

  function setBgMode(mode: CertBackground["mode"]) {
    onChange({ ...v, bg: v.bg ? { ...v.bg, mode } : { dataUrl: "", mode } });
  }

  async function onAddLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const dataUrl = await readFileAsDataURL(f);
    const next: CertLogoItem = {
      dataUrl,
      label: "outro",
      position: "top-right",
      widthPx: 120,
      margin: 16,
    };
    onChange({ ...v, logos: [...logos, next] });
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function updateLogo(idx: number, patch: Partial<CertLogoItem>) {
    const next = [...logos];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...v, logos: next });
  }

  function removeLogo(idx: number) {
    const next = logos.filter((_, i) => i !== idx);
    onChange({ ...v, logos: next });
  }

  const posLabel: Record<CertLogoItem["position"], string> = {
    "top-left": "Topo — Esquerda",
    "top-center": "Topo — Centro",
    "top-right": "Topo — Direita",
    "center-left": "Centro — Esquerda",
    "center": "Centro — Centralizado",
    "center-right": "Centro — Direita",
    "bottom-left": "Base — Esquerda",
    "bottom-center": "Base — Centro",
    "bottom-right": "Base — Direita",
  };

  return (
    <div className="cert-assets space-y-6">
      {/* Fundo */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <label className="text-sm font-medium">Fundo do certificado</label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Modo do fundo</span>
              <select
                className="input h-9 select-compact select-mid"
                value={v.bg?.mode || "cover"}
                onChange={(e) => setBgMode(e.target.value as CertBackground["mode"])}
                aria-label="Modo do fundo"
                title="Modo do fundo"
              >
                <option value="cover">Preencher (cover)</option>
                <option value="contain">Conter (contain)</option>
                <option value="stretch">Esticar (stretch)</option>
              </select>
            </div>
            {v.bg?.dataUrl ? (
              <button type="button" className="btn-secondary" onClick={removeBg} title="Remover fundo">
                Remover fundo
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="btn-secondary cursor-pointer">
            <input
              ref={bgInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={onPickBg}
            />
            {v.bg?.dataUrl ? "Trocar fundo" : "Enviar fundo (PNG/JPG)"}
          </label>
          {v.bg?.dataUrl ? (
            <img
              src={v.bg.dataUrl}
              alt="Preview fundo"
              className="h-24 w-auto rounded border object-cover"
            />
          ) : (
            <span className="text-xs text-gray-500">Nenhum fundo enviado.</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Recomenda-se JPG grande (&gt; 2000px). “Preencher (cover)” é o padrão.
        </p>
      </div>

      {/* Logos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Logos/Brasões</label>
          <label className="btn-secondary cursor-pointer">
            <input
              ref={logoInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={onAddLogo}
            />
            Adicionar logo
          </label>
        </div>

        {logos.length === 0 ? (
          <p className="text-xs text-gray-500">
            Nenhum logo/brasão adicionado. Prefira PNG com fundo transparente.
          </p>
        ) : (
          <ul className="space-y-3">
            {logos.map((lg, idx) => (
              <li key={idx} className="p-3 border rounded-md">
                {/* Duas linhas para estabilidade e sem sobreposição */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Linha 1 */}
                  <div className="md:col-span-2 flex items-center justify-center">
                    <img
                      src={lg.dataUrl}
                      alt={`Logo ${idx + 1}`}
                      className="h-14 w-auto rounded border bg-white object-contain"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium mb-1">Tipo de logo</label>
                    <select
                      className="input h-9 w-full select-compact select-mid"
                      value={lg.label || "outro"}
                      onChange={(e) => updateLogo(idx, { label: e.target.value as CertLogoItem["label"] })}
                    >
                      <option value="prefeitura">Prefeitura</option>
                      <option value="escola">Escola</option>
                      <option value="brasao">Brasão</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium mb-1">Posição</label>
                    <select
                      className="input h-9 w-full select-compact select-wide"
                      value={lg.position}
                      onChange={(e) =>
                        updateLogo(idx, { position: e.target.value as CertLogoItem["position"] })
                      }
                      title="Posição da logo no certificado"
                    >
                      {([
                        "top-left","top-center","top-right",
                        "center-left","center","center-right",
                        "bottom-left","bottom-center","bottom-right",
                      ] as CertLogoItem["position"][]).map((pos) => (
                        <option key={pos} value={pos}>
                          {posLabel[pos]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Linha 2 */}
                  <div className="md:col-start-3 md:col-span-3">
                    <label className="block text-xs font-medium mb-1">Largura (px)</label>
                    <input
                      className="input h-9 w-full"
                      type="number"
                      min={40}
                      max={600}
                      step={10}
                      value={lg.widthPx || 120}
                      onChange={(e) =>
                        updateLogo(idx, {
                          widthPx: Math.max(40, Math.min(600, Number(e.target.value) || 120)),
                        })
                      }
                      placeholder="largura px"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium mb-1">Margem (px)</label>
                    <input
                      className="input h-9 w-full"
                      type="number"
                      min={0}
                      max={100}
                      step={2}
                      value={lg.margin ?? 16}
                      onChange={(e) =>
                        updateLogo(idx, {
                          margin: Math.max(0, Math.min(100, Number(e.target.value) || 16)),
                        })
                      }
                      placeholder="margem"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end md:justify-end">
                    <button
                      type="button"
                      className="btn-secondary w-full md:w-auto"
                      onClick={() => removeLogo(idx)}
                      title="Remover logo"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
