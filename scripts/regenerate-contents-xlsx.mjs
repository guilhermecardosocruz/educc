import * as XLSX from "xlsx";
const headers = [
  "Aula",
  "Título",
  "Conteúdo da Aula",
  "Objetivos",
  "Desenvolvimento das Atividades",
  "Recursos Pedagógicos",
  "BNCC",
];
const sample = [
  1,
  "Robótica de Introdução",
  "O que é robótica? Conceitos básicos.",
  "- Identificar componentes básicos\n- Compreender aplicações no cotidiano",
  "Quebra-gelo; demonstração de kit; atividade em duplas montando circuito simples.",
  "Kit robótico, notebook, projetor.",
  "EF02TE01; EF05CI06",
];
const aoa = [headers, sample];
const ws = XLSX.utils.aoa_to_sheet(aoa, { cellDates: false });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Modelo");
XLSX.writeFile(wb, "public/templates/contents.xlsx", { bookType: "xlsx" });
console.log("✅ Gerado public/templates/contents.xlsx com 1 linha de exemplo.");
