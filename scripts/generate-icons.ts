import sharp from "sharp"; import { readFileSync } from "node:fs";
async function make(size:number, inFile:string, outFile:string, pad=0.1){
  const side=size, m=Math.round(side*pad), inner=side-m*2;
  const canvas=sharp({create:{width:side,height:side,channels:4,background:{r:255,g:255,b:255,alpha:0}}});
  const logo=await sharp(readFileSync(inFile)).resize(inner, inner,{fit:"contain"}).png().toBuffer();
  await canvas.composite([{input:logo,left:m,top:m}]).png().toFile(outFile);
}
const src=process.argv[2]; if(!src){console.error("Uso: pnpm icons <logo.svg|png>");process.exit(1);}
await make(192,src,"public/icons/icon-192.png");
await make(512,src,"public/icons/icon-512.png");
await make(180,src,"public/apple-touch-icon.png",0.14);
console.log("✓ Gerados: icon-192.png, icon-512.png, apple-touch-icon.png");
