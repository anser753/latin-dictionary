'use strict';
(()=>{
 const status=document.getElementById('offline-status'),button=document.getElementById('install-app');let promptEvent,registration;
 const show=text=>{status.textContent=text;};
 const installed=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 function askWorker(worker){return new Promise((resolve,reject)=>{if(!worker){reject(Error('No active offline worker'));return;}const channel=new MessageChannel(),timer=setTimeout(()=>reject(Error('Offline status timed out')),12000);channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};worker.postMessage({type:'GET_OFFLINE_STATUS'},[channel.port2]);});}
 async function updateStatus(worker){try{const result=await askWorker(worker);if(result.ready)show('Available offline · complete dictionary saved on this device.');else show('Saving the dictionary for offline use…');}catch{show(navigator.onLine?'Offline saving is not ready yet. Keep this page open and try again.':'Reconnect once to finish saving the dictionary.');}}
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();promptEvent=e;button.hidden=installed();});
 button.addEventListener('click',async()=>{if(!promptEvent)return;const event=promptEvent;promptEvent=null;button.hidden=true;try{await event.prompt();await event.userChoice;}catch{/* Chrome’s menu remains available for installation. */}});
 window.addEventListener('appinstalled',()=>{button.hidden=true;promptEvent=null;if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});});
 if(!('serviceWorker' in navigator)||!window.isSecureContext||!/^https?:$/.test(location.protocol)){show('To install and save offline, open the hosted HTTPS version. This local file remains usable as a dictionary.');return;}
 show('Saving the dictionary for offline use…');
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(async reg=>{
  registration=reg;
  const watch=worker=>{if(!worker)return;worker.addEventListener('statechange',()=>{if(worker.state==='activated')updateStatus(worker);else if(worker.state==='redundant')show('The offline download did not finish. Reopen this page online to try again.');});};
  watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));
  if(reg.active)await updateStatus(reg.active);
  navigator.serviceWorker.ready.then(r=>updateStatus(r.active)).catch(()=>{});
 }).catch(()=>show('Offline saving could not start. Open this app from its HTTPS address and try again.'));
 navigator.serviceWorker.addEventListener('controllerchange',()=>updateStatus(navigator.serviceWorker.controller));
 window.addEventListener('online',()=>{if(registration){registration.update().catch(()=>{});updateStatus(registration.active);}});
})();
