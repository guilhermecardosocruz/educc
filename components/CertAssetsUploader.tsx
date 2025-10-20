"use client";

import { useRef } from "react";

export type CertLogoItem = {
  label?: "prefeitura" | "escola" | "brasao" | "outro";
  dataUrl: string; // data:image/png|jpeg;base64,...
  position:
    | "top-left" | "top-center" | "top-right"
    | "center-left" | "center" | "center-right"
    | "bottom-left" | "bottom-center" | "bottom-right";
  widthPx: number; // largura desejada (px aprox. aos pontos PDF)
  margin?: number; // margem a partir da borda (default 16)
};

export type CertBackground = {
  dataUrl: string; // png/jpg em dataURL
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

  return (
    <div className="space-y-5">
      {/* Fundo */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Fundo do certificado</label>
          <div className="flex items-center gap-2">
            <select
              className="input h-9"
              value={v.bg?.mode || "cover"}
              onChange={(e) => setBgMode(e.target.value as CertBackground["mode"])}
              aria-label="Modo de ajuste do fundo"
            >
              <option value="cover">cover (preencher)</option>
              <option value="contain">contain (conter)</option>
              <option value="stretch">stretch (esticar)</option>
            </select>
            {v.bg?.dataUrl ? (
              <button type="button" className="btn-secondary" onClick={removeBg}>
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
          Recomenda-se JPG grande (&gt; 2000px). “cover” é o padrão.
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
            Nenhum logo/brasão adicionado. Prefira PNG com fundo transparente.
          </p>
        ) : (
          <ul className="space-y-3">
            {logos.map((lg, idx) => (
              <li key={idx} className="p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <img
                    src={lg.dataUrl}
                    alt={`Logo ${idx + 1}`}
                    className="h-14 w-auto rounded border bg-white object-contain"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1">
                    <select
                      className="input h-9"
                      value={lg.label || "outro"}
                      onChange={(e) =>
                        updateLogo(idx, {
                          label: e.target.value as CertLogoItem["label"],
                        })
                      }
                    >
                      <option value="prefeitura">Prefeitura</option>
                      <option value="escola">Escola</option>
                      <option value="brasao">Brasão</option>
                      <option value="outro">Outro</option>
                    </select>

                    <select
                      className="input h-9"
                      value={lg.position}
                      onChange={(e) =>
                        updateLogo(idx, {
                          position: e.target.value as CertLogoItem["position"],
                        })
                      }
                    >
                      <option value="top-left">top-left</option>
                      <option value="top-center">top-center</option>
                      <option value="top-right">top-right</option>
                      <option value="center-left">center-left</option>
                      <option value="center">center</option>
                      <option value="center-right">center-right</option>
                      <option value="bottom-left">bottom-left</option>
                      <option value="bottom-center">bottom-center</option>
                      <option value="bottom-right">bottom-right</option>
                    </select>

                    <input
                      className="input"
                      type="number"
                      min={40}
                      max={600}
                      step={10}
                      value={lg.widthPx || 120}
                      onChange={(e) =>
                        updateLogo(idx, {
                          widthPx: Math.max(
                            40,
                            Math.min(600, Number(e.target.value) || 120)
                          ),
                        })
                      }
                      placeholder="largura px"
                    />

                    <input
                      className="input"
                      type="number"
                      min={0}
                      max={100}
                      step={2}
                      value={lg.margin ?? 16}
                      onChange={(e) =>
                        updateLogo(idx, {
                          margin: Math.max(
                            0,
                            Math.min(100, Number(e.target.value) || 16)
                          ),
                        })
                      }
                      placeholder="margem"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => removeLogo(idx)}
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
