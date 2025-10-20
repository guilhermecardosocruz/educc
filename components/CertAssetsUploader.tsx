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
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600" htmlFor="bg-mode">
                Modo do fundo
              </label>
              <select
                id="bg-mode"
                className="input h-9 min-w-[190px]"
                value={v.bg?.mode || "cover"}
                onChange={(e) => setBgMode(e.target.value as CertBackground["mode"])}
                aria-label="Modo de ajuste do fundo"
                title="Como a imagem de fundo se ajusta à página"
              >
                {/* values mantêm inglês para o backend; labels em PT-BR */}
                <option value="cover">Preencher (cover)</option>
                <option value="contain">Conter (contain)</option>
                <option value="stretch">Esticar (stretch)</option>
              </select>
            </div>
            {v.bg?.dataUrl ? (
              <button type="button" className="btn-secondary" onClick={removeBg} title="Remover a imagem de fundo">
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
                <div className="flex items-center gap-3">
                  <img
                    src={lg.dataUrl}
                    alt={`Logo ${idx + 1}`}
                    className="h-14 w-auto rounded border bg-white object-contain"
                  />

                  {/* Controles */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                    <div className="space-y-1">
                      <label className="text-xs font-medium" htmlFor={`logo-tipo-${idx}`}>
                        Tipo de logo
                      </label>
                      <select
                        id={`logo-tipo-${idx}`}
                        className="input h-9 min-w-[160px]"
                        value={lg.label || "outro"}
                        onChange={(e) =>
                          updateLogo(idx, {
                            label: e.target.value as CertLogoItem["label"],
                          })
                        }
                        title="Categoria do logo (apenas para referência)"
                      >
                        <option value="prefeitura">Prefeitura</option>
                        <option value="escola">Escola</option>
                        <option value="brasao">Brasão</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium" htmlFor={`logo-pos-${idx}`}>
                        Posição
                      </label>
                      <select
                        id={`logo-pos-${idx}`}
                        className="input h-9 min-w-[190px]"
                        value={lg.position}
                        onChange={(e) =>
                          updateLogo(idx, {
                            position: e.target.value as CertLogoItem["position"],
                          })
                        }
                        title="Posição do logo na página"
                      >
                        {/* valores (en-US) mantidos; rótulos em PT-BR */}
                        <option value="top-left">Topo — Esquerda</option>
                        <option value="top-center">Topo — Centro</option>
                        <option value="top-right">Topo — Direita</option>
                        <option value="center-left">Centro — Esquerda</option>
                        <option value="center">Centro</option>
                        <option value="center-right">Centro — Direita</option>
                        <option value="bottom-left">Inferior — Esquerda</option>
                        <option value="bottom-center">Inferior — Centro</option>
                        <option value="bottom-right">Inferior — Direita</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium" htmlFor={`logo-width-${idx}`}>
                        Largura (px)
                      </label>
                      <input
                        id={`logo-width-${idx}`}
                        className="input h-9 w-32"
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
                        title="Largura aproximada do logo em pixels"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium" htmlFor={`logo-margin-${idx}`}>
                        Margem (px)
                      </label>
                      <input
                        id={`logo-margin-${idx}`}
                        className="input h-9 w-28"
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
                        title="Distância do logo até a borda mais próxima"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => removeLogo(idx)}
                      title="Remover este logo"
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
