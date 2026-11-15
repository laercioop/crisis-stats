"""Reproduz a extração do arquivo público do CARA, sem dependências."""
import zipfile, xml.etree.ElementTree as E, json
from pathlib import Path
z=zipfile.ZipFile('data/sources/CARAFrequentlyRequested.xlsx'); ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
strings=[''.join(t.itertext()) for t in E.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si',ns)]
def rows(sheet):
 for row in E.fromstring(z.read(f'xl/worksheets/sheet{sheet}.xml')).findall('.//m:row',ns):
  out={}
  for c in row:
   v=c.find('m:v',ns)
   if v is not None:
    x=v.text
    if c.attrib.get('t')=='s': x=strings[int(x)]
    out[''.join(i for i in c.attrib['r'] if i.isalpha())]=x
  yield out
out={}
for sheet,key in [(1,'us'),(2,'world')]:
 out[key]={}; years={}
 for r in rows(sheet):
  if r.get('A')=='Clergy Sexual Abuse of Minors': break
  if r.get('B') in ['1965','1970']:
   years={k:int(v[:4]) for k,v in r.items() if k!='A' and v[:4].isdigit()}
  elif r.get('A') and years:
   values=[]
   for col,year in years.items():
    v=r.get(col,'')
    try:
     n=float(v.rstrip('mb')); n*=1e6 if v.endswith('m') else 1e9 if v.endswith('b') else 1
     values.append([year,n])
    except ValueError: pass
   if values: out[key][r['A']]=values
Path('data/cara.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
