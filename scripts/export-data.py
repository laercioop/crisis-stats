import json,csv
from pathlib import Path
c=json.loads(Path('data/cara.json').read_text()); d=json.loads(Path('data/editorial.json').read_text())
with open('data/estatisticas.csv','w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';',lineterminator='\n');w.writerow(['Local','Indicador','Ano','Valor','Unidade','Fonte'])
 for area,series in c.items():
  for key,vals in series.items():
   for y,v in vals:
    if area=='us' and 'previous year' in key:y-=1
    w.writerow(['Mundo' if area=='world' else 'EUA',key,y,str(v).replace('.',','),'Conforme indicador (frações nas séries percentuais)','CARA / Georgetown'])
 for g in d['brazil']['groups']:
  for y,v in zip(d['brazil']['years'],g['values']): w.writerow(['Brasil',g['label'],y,str(v).replace('.',','),'% de pessoas de 10 anos ou mais','IBGE (2025)'])
 for r in d['latam']:
  for y,v in zip(['2013–2014',2024],r['catholic']): w.writerow([r['country'],'Católicos',y,v,'% de adultos','Pew Research (2026)'])
  for key in ['none','weeklyCatholic','weeklyProtestant','god','important']:
   if r[key] is not None:w.writerow([r['country'],key,2024,r[key],'% do grupo indicado','Pew Research (2026)'])
 for y,v in d['germany']:w.writerow(['Alemanha','Participação nas celebrações',y,str(v).replace('.',','),'por 100 católicos registrados','DBK (2025)'])
 for y,v in d['franceAdults']:w.writerow(['França','Adultos anunciados para batismo na Páscoa',y,v,'Adultos','CEF (2026)'])
 for name,n,change in d['world2024']['continents']:
  w.writerow([name,'Católicos registrados',2024,str(n).replace('.',','),'Milhões','Fides / Vaticano (2026)'])
  w.writerow([name,'Variação anual sacerdotes',2024,change,'Sacerdotes','Fides / Vaticano (2026)'])

 for name,total,weekly in d['opinions']:
  w.writerow(['EUA',name+' — apoio, todos os católicos',2025,total,'%','Pew Research (2025)'])
  w.writerow(['EUA',name+' — apoio, missa semanal',2025,weekly,'%','Pew Research (2025)'])
 for key in ['ages','states']:
  for label,n in d['brazil'][key]:w.writerow(['Brasil',label+' — católicos',2022,str(n).replace('.',','),'% do grupo ou estado','IBGE (2025)'])

 for label,v in d['eucharist']:w.writerow(['EUA','Crença na transformação eucarística — '+label,2019,v,'%','Pew Research (2019)'])
 for key,v in d['switchingUS'].items():w.writerow(['EUA',key,'2023–2024',str(v).replace('.',','),'% ou razão, conforme indicador','Pew Research (2025)'])
 for key,v in d['world2024'].items():
  if key!='continents':w.writerow(['Mundo',key,2023 if key=='seminarians2023' else 2024,v,'Pessoas ou razão, conforme indicador','Fides / Vaticano (2026)'])
 for year,n in zip(d['brazil']['years'],d['brazil']['catholicsMillions']):w.writerow(['Brasil','Católicos',year,str(n).replace('.',','),'Milhões de pessoas de 10 anos ou mais','IBGE (2025)'])

 for key,series in d['historical'].items():
  for y,v in series:w.writerow(['Brasil' if key=='brazilCatholic' else 'França',key,y,str(v).replace('.',','),'% da população indicada',('IBGE · Censo 2010' if y==2010 else 'FGV / IBGE') if key=='brazilCatholic' else 'IFOP (2010)'])

 for series in d['brazil']['religionHistory']:
  for y,v in series['data']:
   w.writerow(['Brasil',series['name']+' — série histórica censitária',y,str(v).replace('.',','),'% de pessoas de 10 anos ou mais' if y==2022 else '% da população de todas as idades','IBGE · Censos 1872–2022'])

 r=d['franceRecent']
 w.writerow(['França','Missa — '+r['frequency'],r['year'],str(r['value']).replace('.',','),r['unit'],d['sources'][r['source']]['label']])
