export const uid = () => globalThis.crypto?.randomUUID?.() || `e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const clone = value => JSON.parse(JSON.stringify(value));
export const wallLength = wall => Math.hypot(wall.x2-wall.x1,wall.z2-wall.z1);
export const snap = (n,enabled=true) => enabled ? Math.round(n*4)/4 : Math.round(n*100)/100;
export function createProject(){
 const walls=[
 ['w1','North exterior',-6,-6,6,-6,false],['w2','West exterior',-6,-6,-6,6,false],['w3','East exterior',6,-6,6,6,true],['w4','South exterior',-6,6,6,6,true],
 ['w5','Bedroom partition',-1,-6,-1,-1,false],['w6','Bathroom partition',2,-6,2,-1,false],['w7','Bedroom south',-6,-1,-2.4,-1,false],['w8','Hall return',-.9,-1,2,-1,false],['w9','Guest south',3.1,-1,6,-1,false],['w10','Kitchen partition',2,-1,2,1.4,false]
 ].map(([id,name,x1,z1,x2,z2,cutaway])=>({id,type:'wall',name,x1,z1,x2,z2,thickness:.2,height:2.8,cutaway,material:'plaster'}));
 const furniture=[
 ['bed','Primary bed',-3.5,-4.2,1.9,2.4,0],['bed','Guest bed',4.05,-4.3,1.7,2.2,0],
 ['nightstand','Bedside table',-4.9,-4.8,.55,.6,0],['nightstand','Bedside table',-2.1,-4.8,.55,.6,0],['wardrobe','Primary wardrobe',-5.45,-2.4,.7,1.8,0],
 ['bath','Freestanding bath',.48,-4.6,1.4,2,0],['vanity','Bathroom vanity',.5,-1.55,1.8,.5,0],
 ['sofa','Linen sofa',-4.7,2.3,2.8,1,90],['chair','Lounge chair',-1.4,3.6,.9,.9,-25],['table','Coffee table',-3,2.7,1.3,.8,0],['rug','Living room rug',-3,2.5,3.8,3.5,0],
 ['kitchen','Kitchen counter',5.45,1.65,.8,4,0],['kitchen','Kitchen counter',4,-.35,2.9,.65,0],['island','Kitchen island',3.5,2.3,1.05,2.2,0],
 ['dining','Dining table',2.7,4.8,2.3,1,0],['plant','Olive tree',-5.1,4.9,.65,.65,0],['plant','Indoor plant',5.2,5.1,.7,.7,0],['plant','Bedroom plant',-1.7,-1.7,.45,.45,0]
 ].map(([kind,name,x,z,width,depth,rotation])=>({id:uid(),type:'furniture',kind,name,x,z,width,depth,rotation,height:kind==='plant'?1.5:kind==='wardrobe'?2.2:.8,material:kind==='kitchen'||kind==='island'?'sage':'oak'}));
 const openings=[['window','Bedroom glazing','w1',2.7,2.6,1.4,.9],['window','Guest glazing','w1',10,2.2,1.4,.9],['window','Living room glazing','w2',8,3,1.8,.55],['door','Garden entrance','w4',6.1,1.2,2.2,0]].map(([type,name,wallId,offset,width,height,sill])=>({id:uid(),type,name,wallId,offset,width,height,sill}));
 return {schema:'stratum.project',version:1,name:'The Courtyard House',description:'A considered, light-filled home with space to slow down.',site:'Residential / Concept design',width:12,depth:12,ceiling:2.8,elements:[...walls,...openings,...furniture]};
}
export function validateProject(p){
 if(!p||p.schema!=='stratum.project'||p.version!==1||!Array.isArray(p.elements)||p.elements.length>5000)throw new Error('This is not a supported Stratum project.');
 if(typeof p.name!=='string'||!p.name.trim()||p.name.length>100)throw new Error('Project name must contain 1–100 characters.');
 for(const k of ['width','depth','ceiling'])if(!Number.isFinite(p[k])||p[k]<.1||p[k]>1000)throw new Error(`Invalid project ${k}.`);
 const ids=new Set();
 for(const e of p.elements){
  if(typeof e.id!=='string'||ids.has(e.id)||!['wall','window','door','furniture'].includes(e.type)||typeof e.name!=='string')throw new Error('Invalid element or duplicate ID.');ids.add(e.id);
  const fields=e.type==='wall'?['x1','z1','x2','z2','height','thickness']:e.type==='furniture'?['x','z','width','depth','height','rotation']:['offset','width','height','sill'];
  for(const k of fields)if(!Number.isFinite(e[k])||Math.abs(e[k])>10000)throw new Error(`Invalid ${e.type} ${k}.`);
  if(e.height<=0||e.height>100)throw new Error('Element height must be positive and below 100 m.');
  if(e.type==='wall'&&(wallLength(e)<.1||e.thickness<=0||e.thickness>5))throw new Error('Wall dimensions are out of range.');
  if(e.type!=='wall'&&(e.width<=0||e.width>100))throw new Error('Element width must be positive and below 100 m.');
  if(e.type==='furniture'&&(!['bed','nightstand','wardrobe','bath','vanity','sofa','chair','table','rug','kitchen','island','dining','plant'].includes(e.kind)||e.depth<=0||e.depth>100))throw new Error('Unsupported furniture component.');
 }
 for(const e of p.elements.filter(e=>e.type==='door'||e.type==='window')){
  const w=p.elements.find(w=>w.id===e.wallId&&w.type==='wall');if(!w)throw new Error('Opening has no parent wall.');
  if(e.offset-e.width/2<0||e.offset+e.width/2>wallLength(w)+.001||e.sill<0||e.sill+e.height>w.height+.001)throw new Error('An opening is outside its parent wall.');
  const peers=p.elements.filter(o=>o.id!==e.id&&o.wallId===e.wallId);
  if(peers.some(o=>Math.abs(o.offset-e.offset)<(o.width+e.width)/2-.001))throw new Error('Wall openings cannot overlap.');
 }
 return clone(p);
}
export function openingPosition(p,e){const w=p.elements.find(w=>w.id===e.wallId);const length=wallLength(w);return {x:w.x1+(w.x2-w.x1)*e.offset/length,z:w.z1+(w.z2-w.z1)*e.offset/length,angle:Math.atan2(w.z2-w.z1,w.x2-w.x1),wall:w};}
export function nearestWall(p,x,z){let best=null;for(const w of p.elements.filter(e=>e.type==='wall')){const length=wallLength(w);const dx=(w.x2-w.x1)/length,dz=(w.z2-w.z1)/length;const offset=Math.max(0,Math.min(length,(x-w.x1)*dx+(z-w.z1)*dz));const distance=Math.hypot(x-w.x1-offset*dx,z-w.z1-offset*dz);if(!best||distance<best.distance)best={wall:w,offset,distance};}return best;}
export function quantities(p){const walls=p.elements.filter(e=>e.type==='wall');return {area:p.width*p.depth,wallLength:walls.reduce((s,w)=>s+wallLength(w),0),wallVolume:walls.reduce((s,w)=>s+wallLength(w)*w.height*w.thickness-p.elements.filter(o=>o.wallId===w.id).reduce((v,o)=>v+o.width*o.height*w.thickness,0),0),walls:walls.length,doors:p.elements.filter(e=>e.type==='door').length,windows:p.elements.filter(e=>e.type==='window').length,furniture:p.elements.filter(e=>e.type==='furniture').length};}
export class History{constructor(project){this.past=[];this.future=[];this.current=clone(project)}push(p){this.past.push(clone(this.current));if(this.past.length>80)this.past.shift();this.current=clone(p);this.future=[]}undo(){if(!this.past.length)return null;this.future.push(clone(this.current));this.current=this.past.pop();return clone(this.current)}redo(){if(!this.future.length)return null;this.past.push(clone(this.current));this.current=this.future.pop();return clone(this.current)}}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
