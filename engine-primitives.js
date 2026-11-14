'use strict';
/* THE STUDIO simulation primitives — extracted from the legacy inline bundle. */
const DEC_SCALE=1000000000000n;
function dec(v){if(typeof v==='bigint')return v;let s=String(v??0).trim(),m=s.match(/^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);if(!m)throw new Error('Invalid decimal: '+s);let sign=m[1]==='-'?-1n:1n,frac=m[3]||'',digits=BigInt((m[2]+frac)||'0'),places=frac.length-Number(m[4]||0),shift=12-places;if(shift>=0)digits*=10n**BigInt(shift);else{let divisor=10n**BigInt(-shift),q=digits/divisor,rem=digits%divisor;digits=q+(rem*2n>=divisor?1n:0n)}return sign*digits}
function dstr(v){let n=typeof v==='bigint'?v:dec(v),neg=n<0n;if(neg)n=-n;let whole=n/DEC_SCALE,frac=String(n%DEC_SCALE).padStart(12,'0').replace(/0+$/,'');return (neg?'-':'')+String(whole)+(frac?'.'+frac:'')}
function dadd(a,b){return dec(a)+dec(b)}function dsub(a,b){return dec(a)-dec(b)}function dmul(a,b){let x=dec(a),y=dec(b),p=x*y,q=p/DEC_SCALE,r=p%DEC_SCALE;if((r<0n?-r:r)*2n>=DEC_SCALE)q+=p<0n?-1n:1n;return q}
function ddiv(a,b){let x=dec(a),y=dec(b);if(y===0n)throw new Error('Decimal division by zero');let p=x*DEC_SCALE,q=p/y,r=p%y;if((r<0n?-r:r)*2n>=(y<0n?-y:y))q+=(p<0n)!==(y<0n)?-1n:1n;return q}
function dclamp(v,lo,hi){let x=dec(v);return x<dec(lo)?dec(lo):x>dec(hi)?dec(hi):x}function dnum(v){return Number(dstr(v))}
function hashSeed(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function stableUnit(seed,key){leֻǱ˞