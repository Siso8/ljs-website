/* Language switch: English / Arabic. Translations live in AR below (English text -> Arabic). */
(function(){
  var AR = window.TLC_AR || {};
  var norm = function(t){ return t.replace(/\s+/g,' ').trim(); };
  var lang = 'en';
  try{ lang = localStorage.getItem('tlc-lang') || 'en'; }catch(e){}
  if(/[?&]lang=ar/.test(location.search)) lang='ar';
  var ATTRS=['placeholder','aria-label','title','alt'];
  var skip=function(el){ return !el || el.closest('script,style,[data-noi18n]'); };

  function doText(node){
    if(skip(node.parentElement)) return;
    if(node.__en===undefined){ var k=norm(node.nodeValue); if(!AR[k]) return; node.__en=node.nodeValue; }
    var tr=AR[norm(node.__en)]; if(tr===undefined) return;
    var lead=node.__en.match(/^\s*/)[0], trail=node.__en.match(/\s*$/)[0];
    var want = lang==='ar' ? lead+tr+trail : node.__en;
    if(node.nodeValue!==want) node.nodeValue=want;
  }
  function doEl(el){
    if(skip(el)) return;
    ATTRS.forEach(function(a){
      if(!el.hasAttribute(a)) return;
      var store='__en_'+a;
      if(el[store]===undefined){ var k=norm(el.getAttribute(a)); if(!AR[k]) return; el[store]=el.getAttribute(a); }
      var v= lang==='ar' ? AR[norm(el[store])] : el[store]; if(el.getAttribute(a)!==v) el.setAttribute(a,v);
    });
  }
  function walk(root){
    if(root.nodeType===3){ doText(root); return; }
    if(root.nodeType!==1) return;
    doEl(root);
    var w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
    var n; while((n=w.nextNode())){ n.nodeType===3 ? doText(n) : doEl(n); }
  }
  var busy=false;
  var mo=new MutationObserver(function(muts){
    if(busy) return; busy=true;
    muts.forEach(function(m){
      if(m.type==='characterData'){ var n=m.target; if(n.__en!==undefined && norm(n.nodeValue)!==norm(AR[norm(n.__en)]) && norm(n.nodeValue)!==norm(n.__en)) n.__en=undefined; doText(n); }
      else m.addedNodes.forEach(walk);
    });
    busy=false;
  });
  function setLang(l){
    lang=l; try{ localStorage.setItem('tlc-lang',l); }catch(e){}
    var h=document.documentElement; h.lang=l; h.dir= l==='ar' ? 'rtl' : 'ltr';
    busy=true; walk(document.body); busy=false;
    if(!document.__enTitle) document.__enTitle=document.title;
    document.title = l==='ar' ? (AR[norm(document.__enTitle)]||document.__enTitle) : document.__enTitle;
    document.querySelectorAll('[data-lang-toggle]').forEach(function(b){ b.textContent = l==='ar' ? 'English' : 'العربية'; b.setAttribute('lang', l==='ar'?'en':'ar'); });
    try{ window.tlcTrack && window.tlcTrack('Language', {lang:l}); }catch(e){}
  }
  window.tlcLang=function(){ return lang; };
  document.addEventListener('click',function(e){ var b=e.target.closest('[data-lang-toggle]'); if(!b) return; e.preventDefault(); setLang(lang==='ar'?'en':'ar'); });
  function start(){ mo.observe(document.body,{childList:true,subtree:true,characterData:true}); setLang(lang); }
  document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',start) : start();
})();
