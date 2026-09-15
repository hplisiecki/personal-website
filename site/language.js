(() => {
 const language=document.documentElement.lang;
 // Explicit language URLs always win; only the bare site entry remembers a choice.
 try{
  if(location.pathname.endsWith('/')&&localStorage.getItem('site-language')==='pl'){
   location.replace('pl.html'+location.search+location.hash);return;
  }
 }catch(_){}
 addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-language]').forEach(link=>link.addEventListener('click',()=>{
   try{localStorage.setItem('site-language',link.dataset.language)}catch(_){}
  }));
 });
})();
