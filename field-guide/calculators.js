(function(root){
  'use strict';
  function positive(value,name,max=1e9){const n=Number(value);if(!Number.isFinite(n)||n<=0||n>max)throw new Error('Enter a valid '+name+'.');return n;}
  function parseShutter(value){
    const s=String(value).trim().replace(/\s*(seconds?|secs?|s)\s*$/i,'').trim();
    if(!/^(?:\d+(?:\.\d+)?|\.\d+)(?:\s*\/\s*(?:\d+(?:\.\d+)?|\.\d+))?$/.test(s))throw new Error('Use seconds or a fraction, such as 2 or 1/125.');
    const parts=s.split('/');const n=positive(parts[0],'shutter time');return parts.length===2?n/positive(parts[1],'denominator'):n;
  }
  function duration(seconds){
    if(!Number.isFinite(seconds)||seconds<0)return '—';
    if(seconds===0)return '0 s';
    if(seconds<1)return '1/'+Number((1/seconds).toPrecision(4))+' s';
    if(seconds<60)return Number(seconds.toFixed(2))+' s';
    let total=Math.round(seconds),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
    return [h?h+' h':'',m?m+' min':'',s?s+' s':''].filter(Boolean).join(' ');
  }
  function nd(time,stops){let t=parseShutter(time),n=Number(stops);if(!Number.isFinite(n)||n<0||n>20)throw new Error('Choose an ND strength from 0 to 20 stops.');return t*Math.pow(2,n);}
  function interval(exposure,gap,frames){let e=positive(exposure,'exposure time',86400),g=Number(gap),n=Number(frames);if(!Number.isFinite(g)||g<0||g>86400)throw new Error('Gap must be zero or more seconds.');if(!Number.isInteger(n)||n<1||n>9999)throw new Error('Use a whole number of frames from 1 to 9999.');return {interval:e+g,duration:(n-1)*(e+g)+e,exposureTotal:n*e,frames:n};}
  function swap(time,from,to){let t=parseShutter(time),a=positive(from,'starting aperture',128),b=positive(to,'new aperture',128);return t*Math.pow(b/a,2);}
  root.PFG_CALC={parseShutter,duration,nd,interval,swap};
})(typeof window==='undefined'?globalThis:window);
