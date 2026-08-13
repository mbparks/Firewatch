function ascii(s:string){return s.normalize('NFKD').replace(/°/g,' deg').replace(/±/g,'+/-').replace(/×/g,'x').replace(/→/g,'->').replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[^\x20-\x7E\n]/g,'?')}
function esc(s:string){return s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')}
function wrap(line:string,width=92){if(line.length<=width)return [line];const out:string[]=[];let rest=line;while(rest.length>width){let cut=rest.lastIndexOf(' ',width);if(cut<20)cut=width;out.push(rest.slice(0,cut));rest=rest.slice(cut).trimStart()}if(rest)out.push(rest);return out}
export function reportPdfBlob(title:string,textBody:string){
  const raw=[title,'',...textBody.split('\n')].flatMap(x=>wrap(ascii(x)));
  const perPage=52;const pages:Array<string[]>=[];for(let i=0;i<raw.length;i+=perPage)pages.push(raw.slice(i,i+perPage));if(!pages.length)pages.push([]);
  const objects:string[]=[];const fontObj=3;const pageStart=4;const contentStart=pageStart+pages.length;
  objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
  objects[2]=`<< /Type /Pages /Kids [${pages.map((_,i)=>`${pageStart+i} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[fontObj]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pages.forEach((lines,i)=>{const pageObj=pageStart+i,contentObj=contentStart+i;objects[pageObj]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${contentObj} 0 R >>`;let y=752;const cmds=['BT','/F1 10 Tf'];for(const line of lines){cmds.push(`1 0 0 1 42 ${y} Tm (${esc(line)}) Tj`);y-=13}cmds.push('ET');const stream=cmds.join('\n');objects[contentObj]=`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`});
  let pdf='%PDF-1.4\n';const offsets:number[]=[0];const count=contentStart+pages.length-1;for(let i=1;i<=count;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 ${count+1}\n0000000000 65535 f \n`;for(let i=1;i<=count;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${count+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf],{type:'application/pdf'});
}
export function downloadBlob(blob:Blob,name:string){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
