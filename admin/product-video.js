export function mountPrivateVideo(root,{db,isAuthorized,onDenied}){
  root.innerHTML=[
    '<div class="pd-film-heading"><div><span class="eyebrow">VERDANT / ANIMATED PRODUCT FILM</span><h3>Watch the growing world in motion.</h3><p>A short, captioned concept walkthrough with lighting, flowing water, airflow and changing sensor readings.</p></div></div>',
    '<video id="pd-video-player" controls playsinline preload="none" muted hidden aria-label="VERDANT animated concept walkthrough"></video>',
    '<div class="pd-film-actions"><button class="button" id="pd-video-watch" type="button">Watch private video ▶</button><button class="quiet" id="pd-video-download" type="button">Download MP4 ↓</button><label class="quiet pd-file-label">Open MP4 from this device<input id="pd-video-file" type="file" accept="video/mp4,.mp4"></label><button class="quiet" id="pd-video-save" type="button" disabled>Save video privately</button></div>',
    '<p id="pd-video-status" class="pd-help" role="status" aria-live="polite">The video is restricted to the administrator. You can also open a downloaded MP4 from your device.</p>',
    '<details class="pd-film-transcript"><summary>Walkthrough overview</summary><p>The film introduces VERDANT, changes LED colours, traces water through the irrigation pipe, animates airflow, and shows sensor values updating. It ends with the Econova Labs tagline. This is a silent concept simulation, not footage of a working physical product.</p></details>'
  ].join('');
  const find=id=>root.querySelector('#'+id),player=find('pd-video-player');
  const bucket=db.storage.from('econova-admin-media'),object='verdant-walkthrough.mp4';
  let destroyed=false,localUrl=null,file=null;
  const guard=()=>!destroyed&&isAuthorized();
  const status=message=>{if(guard())find('pd-video-status').textContent=message;};
  async function permission(){
    if(!guard())return false;
    const result=await db.rpc('econova_admin_status');
    if(!guard())return false;
    if(result.error||result.data!==true){onDenied();return false;}
    return true;
  }
  async function show(url){
    if(!guard())return;player.src=url;player.hidden=false;player.load();
    try{await player.play();}catch{status('Video ready. Press Play to begin.');}
  }
  find('pd-video-watch').addEventListener('click',async()=>{
    const button=find('pd-video-watch');if(!guard()||button.disabled)return;button.disabled=true;status('Opening your private video…');
    try{
      if(!await permission())return;
      const {data,error}=await bucket.createSignedUrl(object,600);
      if(!guard())return;
      if(error)throw Error('No saved video is available yet. Open the provided MP4 from your device, then choose Save video privately.');
      await show(data.signedUrl);status('Private video ready. The playback link expires automatically.');
    }catch(error){status(error.message||'Unable to open the video.');}finally{if(guard())button.disabled=false;}
  });
  find('pd-video-file').addEventListener('change',async event=>{
    if(!guard())return;file=event.target.files?.[0]||null;
    if(!file)return;
    if(!file.name.toLowerCase().endsWith('.mp4')||file.size>50*1024*1024){file=null;event.target.value='';find('pd-video-save').disabled=true;status('Choose an MP4 file smaller than 50 MB.');return;}
    if(localUrl)URL.revokeObjectURL(localUrl);
    localUrl=URL.createObjectURL(file);find('pd-video-save').disabled=false;
    await show(localUrl);status('Playing the MP4 from this device. Choose Save video privately to make it available on your other devices.');
  });
  find('pd-video-save').addEventListener('click',async()=>{
    const button=find('pd-video-save');if(!guard()||!file||button.disabled)return;button.disabled=true;status('Saving the video to private storage…');
    try{
      if(!await permission())return;
      const {error}=await bucket.upload(object,file,{upsert:true,contentType:'video/mp4',cacheControl:'3600'});
      if(!guard())return;if(error)throw Error('The video could not be saved. Check the private video setup and try again.');
      status('Video saved privately. Watch private video now works on your other devices.');
    }catch(error){status(error.message||'Unable to save the video.');}finally{if(guard())button.disabled=!file;}
  });
  find('pd-video-download').addEventListener('click',async()=>{
    if(!guard())return;
    try{
      if(localUrl&&file){const link=document.createElement('a');link.href=localUrl;link.download='VERDANT-animated-demo.mp4';link.click();return;}
      if(!await permission())return;
      const {data,error}=await bucket.createSignedUrl(object,60,{download:'VERDANT-animated-demo.mp4'});
      if(!guard())return;if(error)throw Error('Open or save the MP4 first, then download it here.');
      const link=document.createElement('a');link.href=data.signedUrl;link.rel='noopener';link.click();
    }catch(error){status(error.message||'Unable to download the video.');}
  });
  return {
    pause(){player.pause();},
    destroy(){destroyed=true;player.pause();player.removeAttribute('src');player.load();if(localUrl)URL.revokeObjectURL(localUrl);file=null;root.replaceChildren();}
  };
}
