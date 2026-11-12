// A visual simulation only. This module never connects to real hardware.
import {mountPrivateVideo} from './product-video.js';
const initialState=()=>({mode:'manual',light:true,color:'#c9a2ff',brightness:75,fan:false,moisture:45,temperature:24,humidity:65,reservoir:80,layout:'full',finish:'#416a4c',day:true,watering:false});
export async function mountProductDemo(root,{db,isAuthorized,onDenied}){
  const permission=await db.rpc('econova_admin_status');
  if(permission.error||permission.data!==true||!isAuthorized()){onDenied();throw Error('Administrator access is required.');}
  const artResponse=await fetch('product-demo-art.svg');
  if(!artResponse.ok)throw Error('The greenhouse illustration could not be loaded.');
  const artText=await artResponse.text();
  if(!isAuthorized())throw Error('Your session has ended.');
  root.innerHTML=[
    '<div class="pd-heading"><div><p class="eyebrow">ADMIN STUDIO / VERDANT SMARTGROW 2.0</p><h2 id="demo-heading">Bring the concept <em>to life.</em></h2><p>Explore light, watering, airflow and automation in a responsive greenhouse model.</p></div><span class="pd-simulation">SIMULATION · NO HARDWARE CONNECTION</span></div>',
    '<div class="pd-notice">Example readings and thresholds explain the concept. They are not measured product performance or plant-care recommendations.</div>',
    '<div class="pd-layout"><div class="pd-visual-column"><div class="pd-stage" id="pd-stage"><div class="pd-stage-top"><span>VERDANT / VIRTUAL PROTOTYPE</span><span id="pd-stage-mode">Manual mode</span></div><div id="pd-art" class="pd-art"></div><div class="pd-stage-bottom"><span id="pd-light-label">LumaGrow on</span><span id="pd-water-label">AquaCore ready</span><span id="pd-fan-label">AirFlow off</span></div></div>',
    '<div class="pd-readings"><div><span>Temperature</span><strong id="pd-temp-reading">24°C</strong></div><div><span>Humidity</span><strong id="pd-humidity-reading">65%</strong></div><div><span>Soil moisture</span><strong id="pd-moisture-reading">45%</strong></div></div>',
    '<div class="pd-tour"><button class="button" id="pd-play" type="button">Play guided demo ▶</button><button class="quiet" id="pd-reset" type="button">Reset demo ↺</button><p id="pd-status" role="status" aria-live="polite">Ready. Try a light colour or start the guided demo.</p></div></div>',
    '<div class="pd-controls"><section class="pd-card"><div class="pd-card-heading"><div><span class="eyebrow">ECOSENSE</span><h3>You set the mode.</h3></div><span class="pd-card-icon">⌘</span></div><div class="pd-segments" role="group" aria-label="Simulation control mode"><button data-pd-mode="manual" aria-pressed="true" type="button">Manual</button><button data-pd-mode="automatic" aria-pressed="false" type="button">Automatic</button></div><label class="pd-select-label">Simulated time<select id="pd-time"><option value="day">Daytime</option><option value="night">Night-time</option></select></label><p class="pd-help">Automatic examples: water below 35% soil moisture; fan above 28°C or 75% humidity; lighting follows day/night.</p></section>',
    '<section class="pd-card"><div class="pd-card-heading"><div><span class="eyebrow">LUMAGROW</span><h3>Change the atmosphere.</h3></div><button class="pd-toggle" id="pd-light" type="button" role="switch" aria-checked="true" aria-label="Grow lighting"><span></span></button></div><div class="pd-colours" role="group" aria-label="Grow light colour"><button data-pd-colour="#c9a2ff" class="pd-colour violet" aria-label="Violet light" aria-pressed="true" type="button">Violet</button><button data-pd-colour="#fff3b0" class="pd-colour warm" aria-label="Warm white light" aria-pressed="false" type="button">Warm</button><button data-pd-colour="#73c9ff" class="pd-colour blue" aria-label="Blue light" aria-pressed="false" type="button">Blue</button><button data-pd-colour="#ff929d" class="pd-colour rose" aria-label="Red light" aria-pressed="false" type="button">Red</button></div><div class="pd-control-row"><label for="pd-colour-custom">Custom light colour</label><input type="color" id="pd-colour-custom" value="#c9a2ff"></div><div class="pd-control-row"><label for="pd-brightness">Brightness</label><output id="pd-brightness-value" for="pd-brightness">75%</output></div><input id="pd-brightness" type="range" min="0" max="100" step="5" value="75"></section>',
    '<section class="pd-card"><div class="pd-card-heading"><div><span class="eyebrow">AQUACORE</span><h3>A little water, in motion.</h3></div><span class="pd-card-icon">◉</span></div><div class="pd-control-row"><span>Water reservoir</span><strong id="pd-reservoir-value">80%</strong></div><meter id="pd-reservoir" min="0" max="100" low="15" optimum="80" value="80">80%</meter><div class="pd-action-row"><button class="button" id="pd-water" type="button">Run watering pulse</button><button class="quiet" id="pd-refill" type="button">Refill tank</button></div><p class="pd-help">Each illustrative pulse raises soil moisture by 20 points and uses 6 reservoir points. A low tank stops the pump.</p></section>',
    '<section class="pd-card"><div class="pd-card-heading"><div><span class="eyebrow">AIRFLOW + CLIMATESYNC</span><h3>Feel the environment.</h3></div><button class="pd-toggle" id="pd-fan" type="button" role="switch" aria-checked="false" aria-label="Air circulation fan"><span></span></button></div><div class="pd-control-row"><label for="pd-temperature">Room temperature</label><output for="pd-temperature" id="pd-temperature-value">24°C</output></div><input id="pd-temperature" type="range" min="15" max="38" value="24"><div class="pd-control-row"><label for="pd-humidity">Humidity</label><output for="pd-humidity" id="pd-humidity-value">65%</output></div><input id="pd-humidity" type="range" min="20" max="95" value="65"><div class="pd-control-row"><label for="pd-moisture">Soil moisture</label><output for="pd-moisture" id="pd-moisture-value">45%</output></div><input id="pd-moisture" type="range" min="5" max="95" value="45"></section>',
    '<section class="pd-card"><div class="pd-card-heading"><div><span class="eyebrow">BIOSPHERE</span><h3>Make the space yours.</h3></div><span class="pd-card-icon">✳</span></div><label class="pd-select-label">Growing layout<select id="pd-layout"><option value="full">Full growing layout</option><option value="compact">Compact layout</option></select></label><span class="pd-field-label">Frame finish</span><div class="pd-segments" role="group" aria-label="Enclosure finish"><button data-pd-finish="#416a4c" aria-pressed="true" type="button">Forest</button><button data-pd-finish="#d5d9c8" aria-pressed="false" type="button">Chalk</button><button data-pd-finish="#39454a" aria-pressed="false" type="button">Charcoal</button></div></section>',
    '<section class="pd-card pd-scenarios"><span class="eyebrow">TRY A SCENARIO</span><div class="pd-action-row"><button class="quiet" data-pd-scenario="dry" type="button">Dry soil</button><button class="quiet" data-pd-scenario="warm" type="button">Warm room</button><button class="quiet" data-pd-scenario="low" type="button">Low water</button><button class="quiet" data-pd-scenario="night" type="button">Night-time</button></div><p class="pd-help">Scenarios switch to automatic mode so you can watch the proposed response.</p></section></div></div>'
  ].join('');
  const art=new DOMParser().parseFromString(artText,'image/svg+xml');
  if(art.querySelector('parsererror')){root.replaceChildren();throw Error('The greenhouse illustration is invalid.');}
  root.querySelector('#pd-art').append(document.importNode(art.documentElement,true));
  const filmRoot=document.createElement('section');filmRoot.className='pd-film';root.append(filmRoot);
  const film=mountPrivateVideo(filmRoot,{db,isAuthorized,onDenied});
  const find=id=>root.querySelector('#'+id);
  const voiceControls=document.createElement('div');voiceControls.className='pd-action-row';
  voiceControls.innerHTML='<button class="button" id="pd-voice" type="button">Automatic demo with voice</button><button class="quiet" id="pd-voice-pause" type="button" hidden>Pause explanation</button><button class="quiet" id="pd-voice-stop" type="button" hidden>Stop explanation</button>';
  find('pd-play').before(voiceControls);
  const explanation=document.createElement('p');explanation.id='pd-explanation';explanation.textContent='Slow walkthrough: each explanation finishes before the next step. Keep this tab open and your device sound on.';voiceControls.after(explanation);
  const speech=window.speechSynthesis;
  let voiceActive=false,voicePaused=false,voiceTimer=null,utterance=null,voiceStep=0,voiceEpoch=0;
  let state=initialState(),destroyed=false,visible=true,pumpTimer=null,tourTimer=null,tourIndex=0;
  const guard=()=>!destroyed&&isAuthorized();
  function say(message){if(guard())find('pd-status').textContent=message;}
  function stopVoice(){
    const wasActive=voiceActive;voiceActive=false;voicePaused=false;voiceEpoch++;clearTimeout(voiceTimer);voiceTimer=null;
    if(utterance){utterance.onend=null;utterance.onerror=null;utterance=null;}if(wasActive&&speech)speech.cancel();
    if(!destroyed){find('pd-voice').disabled=false;find('pd-voice-pause').hidden=true;find('pd-voice-stop').hidden=true;find('pd-voice-pause').textContent='Pause explanation';}
  }
  function stopTour(){stopVoice();clearInterval(tourTimer);tourTimer=null;if(!destroyed)find('pd-play').textContent='Play guided demo ▶';}
  function render(){
    if(!guard())return;
    const stage=find('pd-stage');stage.classList.toggle('pd-night',!state.day);stage.classList.toggle('pd-watering',state.watering);stage.classList.toggle('pd-fanning',state.fan);stage.classList.toggle('pd-compact',state.layout==='compact');
    const lightLevel=state.light?state.brightness/100:0;
    stage.style.setProperty('--pd-light',state.color);stage.style.setProperty('--pd-intensity',String(lightLevel));
    root.querySelectorAll('[data-led]').forEach(item=>{item.setAttribute('stroke',state.light?state.color:'#71866b');item.setAttribute('opacity',state.light?String(.3+lightLevel*.7):'.25');});
    root.querySelectorAll('[data-frame]').forEach(item=>item.setAttribute('stroke',state.finish));
    root.querySelectorAll('[data-base]').forEach(item=>item.setAttribute('fill',state.finish));
    find('pd-light-beam').setAttribute('fill',state.color);find('pd-light-beam').setAttribute('opacity',String(lightLevel*.24));
    find('pd-tank-level').setAttribute('fill',state.reservoir<15?'#dc9e71':'#85c6d4');
    find('pd-plants').style.filter=state.moisture<25?'saturate(.65) sepia(.2)':'none';
    const values={temperature:state.temperature+'°C',humidity:state.humidity+'%',moisture:state.moisture+'%',brightness:state.brightness+'%'};
    for(const [key,value] of Object.entries(values)){find('pd-'+key+'-value').textContent=value;find('pd-'+key).value=state[key];}
    find('pd-temp-reading').textContent=values.temperature;find('pd-humidity-reading').textContent=values.humidity;find('pd-moisture-reading').textContent=values.moisture;
    find('pd-product-display').textContent=state.temperature+'° '+state.humidity+'% '+state.moisture+'%';
    const temperatureColour=state.temperature>28?'#ec9568':state.temperature<20?'#73b9e3':'#8bb661';
    const temperatureHeight=8+(state.temperature-15)/23*26;
    find('pd-temperature-fill').setAttribute('height',String(temperatureHeight));
    find('pd-temperature-fill').setAttribute('y',String(17-temperatureHeight));
    find('pd-temperature-fill').setAttribute('fill',temperatureColour);find('pd-temperature-bulb').setAttribute('fill',temperatureColour);
    find('pd-temp-reading').style.color=state.temperature>28?'#a94622':state.temperature<20?'#267294':'#3d6d35';
    find('pd-reservoir').value=state.reservoir;find('pd-reservoir-value').textContent=state.reservoir+'%';
    find('pd-light').setAttribute('aria-checked',String(state.light));find('pd-fan').setAttribute('aria-checked',String(state.fan));
    find('pd-light-label').textContent=state.light?'LumaGrow · '+state.brightness+'%':'LumaGrow · off';
    find('pd-water-label').textContent=state.watering?'AquaCore · watering':state.reservoir<6?'AquaCore · refill needed':'AquaCore · ready';
    find('pd-fan-label').textContent=state.fan?'AirFlow · on':'AirFlow · off';
    find('pd-stage-mode').textContent=state.mode==='automatic'?'Automatic mode':'Manual mode';
    find('pd-water').disabled=state.watering||state.reservoir<6;find('pd-water').textContent=state.watering?'Watering…':state.reservoir<6?'Refill tank to water':'Run watering pulse';
    find('pd-time').value=state.day?'day':'night';find('pd-layout').value=state.layout;find('pd-colour-custom').value=state.color;
    root.querySelectorAll('[data-pd-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pdMode===state.mode)));
    root.querySelectorAll('[data-pd-colour]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pdColour===state.color)));
    root.querySelectorAll('[data-pd-finish]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pdFinish===state.finish)));
  }
  function water(){
    if(!guard()||state.watering)return;
    if(state.reservoir<6){say('Low-water protection: refill the simulated reservoir before watering.');render();return;}
    state.watering=true;render();say('AquaCore is delivering an illustrative three-second watering pulse.');
    pumpTimer=setTimeout(()=>{
      if(!guard())return;state.watering=false;state.moisture=Math.min(95,state.moisture+20);state.reservoir=Math.max(0,state.reservoir-6);pumpTimer=null;render();say('Watering complete. Soil moisture increased and the reservoir level decreased.');
    },3000);
  }
  function automatic(){
    if(state.mode!=='automatic')return;
    state.light=state.day;state.fan=state.temperature>28||state.humidity>75;
    if(state.moisture<35){if(state.reservoir>=6)water();else say('Dry soil detected, but watering is stopped until the tank is refilled.');}
  }
  function change(action,message,{manual=false,auto=true}={}){
    if(!guard())return;stopTour();if(manual)state.mode='manual';action();if(auto)automatic();render();if(message)say(message);
  }
  function reset(){
    stopTour();clearTimeout(pumpTimer);pumpTimer=null;state=initialState();render();say('Demo reset. All readings are illustrative and no hardware is connected.');
  }
  function scenario(name){
    clearTimeout(pumpTimer);pumpTimer=null;state.watering=false;state.mode='automatic';
    if(name==='dry'){state.moisture=18;state.reservoir=80;say('Dry soil: automatic mode requests watering below the example 35% threshold.');}
    if(name==='warm'){state.temperature=33;state.humidity=79;say('Warm room: AirFlow switches on. Temperature and humidity are monitored; this does not demonstrate active cooling.');}
    if(name==='low'){state.reservoir=4;state.moisture=18;say('Low water: the pump is stopped even though the soil is dry. Refill the tank to continue.');}
    if(name==='night'){state.day=false;state.moisture=45;say('Night-time: the example lighting schedule switches LumaGrow off.');}
    automatic();render();
  }
  root.querySelectorAll('[data-pd-mode]').forEach(button=>button.addEventListener('click',()=>change(()=>{state.mode=button.dataset.pdMode;},button.dataset.pdMode==='automatic'?'Automatic mode reacts to the example sensors.':'Manual mode gives you direct control.')));
  root.querySelectorAll('[data-pd-colour]').forEach(button=>button.addEventListener('click',()=>change(()=>{state.color=button.dataset.pdColour;state.light=true;},'Lighting colour changed. Colour choices are for visual demonstration.',{manual:true})));
  root.querySelectorAll('[data-pd-finish]').forEach(button=>button.addEventListener('click',()=>change(()=>{state.finish=button.dataset.pdFinish;},'Enclosure finish changed in this visual concept.')));
  find('pd-colour-custom').addEventListener('input',event=>change(()=>{state.color=event.target.value;state.light=true;},'',{manual:true}));
  find('pd-brightness').addEventListener('input',event=>change(()=>{state.brightness=Number(event.target.value);},'',{manual:true}));
  find('pd-light').addEventListener('click',()=>change(()=>{state.light=!state.light;},'Grow lighting '+(state.light?'switched off.':'switched on.'),{manual:true}));
  find('pd-fan').addEventListener('click',()=>change(()=>{state.fan=!state.fan;},'Air circulation '+(state.fan?'switched off.':'switched on.'),{manual:true}));
  for(const key of ['temperature','humidity','moisture'])find('pd-'+key).addEventListener('input',event=>change(()=>{state[key]=Number(event.target.value);},''));
  find('pd-time').addEventListener('change',event=>change(()=>{state.day=event.target.value==='day';},'Simulated time changed.'));
  find('pd-layout').addEventListener('change',event=>change(()=>{state.layout=event.target.value;},'Growing layout changed.'));
  find('pd-water').addEventListener('click',()=>{if(!guard())return;stopTour();state.mode='manual';water();});
  find('pd-refill').addEventListener('click',()=>change(()=>{state.reservoir=100;},'Simulated tank refilled.'));
  root.querySelectorAll('[data-pd-scenario]').forEach(button=>button.addEventListener('click',()=>{if(!guard())return;stopTour();scenario(button.dataset.pdScenario);}));
  find('pd-reset').addEventListener('click',()=>{if(guard())reset();});
  const steps=[
    ()=>{state=initialState();state.color='#fff3b0';say('1 / 6 · LumaGrow lights the growing space.');},
    ()=>{state.color='#c9a2ff';state.brightness=100;say('2 / 6 · Change the LED colour and brightness.');},
    ()=>{state.mode='manual';water();},
    ()=>{state.fan=true;say('4 / 6 · AirFlow circulates air inside the enclosure.');},
    ()=>{state.layout='compact';state.finish='#39454a';say('5 / 6 · BioSphere changes the layout; choose an enclosure finish.');},
    ()=>{state.day=false;state.mode='automatic';automatic();say('6 / 6 · EcoSense coordinates the example night-time schedule.');}
  ];
  const explanations=[
    ['Welcome to VERDANT by Econova Labs. This model explains a proposed smart growing enclosure. The values are examples, and this demonstration does not control real equipment. We will explore each feature slowly.',()=>{state=initialState();}],
    ['First, look at the grow lights above the plants. LumaGrow lights the growing space. Watch the light change to warm white. The brightness is now sixty percent. You can also choose colours and brightness using the manual controls.',()=>{state.color='#fff3b0';state.brightness=60;}],
    ['Now the light changes to violet at full brightness. The coloured beam shows the lighting setting. These colours illustrate the controls. They do not demonstrate a tested plant growth result.',()=>{state.color='#c9a2ff';state.brightness=100;}],
    ['Next, follow the blue water flowing from the reservoir through the irrigation pipe to the plants. AquaCore runs one watering pulse. When it finishes, the example soil moisture rises and the water level in the tank falls.',()=>{state.mode='manual';state.moisture=25;water();}],
    ['Now watch the temperature reading and the thermometer on the greenhouse. The example temperature rises to thirty three degrees Celsius. Automatic mode switches on the fan. The moving air lines show circulation, not a measured cooling result.',()=>{state.mode='automatic';state.temperature=33;state.humidity=65;automatic();}],
    ['The example temperature now returns to twenty four degrees. The indicator changes back to green and the fan stops. In the controls, moving the temperature slider changes the reading and the greenhouse screen immediately.',()=>{state.temperature=24;automatic();}],
    ['Water protection is also important. Here the soil is dry, but the tank is almost empty. Automatic mode keeps the pump off. In the manual controls, refill the tank to allow another watering pulse.',()=>{scenario('low');}],
    ['Finally, the model changes to night time. The automatic schedule turns the grow lights off. This completes the walkthrough. You can replay the explanation, or explore the controls yourself. All readings remain illustrative.',()=>{state.reservoir=80;scenario('night');}]
  ];
  let voiceWaiting=false;
  function nextExplanation(){
    if(!guard()||!visible||!voiceActive||voicePaused)return;
    if(voiceStep>=explanations.length){stopVoice();say('Automatic explanation complete. Replay it or explore the controls.');return;}
    const [text,action]=explanations[voiceStep++];action();render();
    explanation.textContent=text;say('Explanation '+voiceStep+' / '+explanations.length);voiceWaiting=false;
    const epoch=voiceEpoch,started=Date.now();
    utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-IN';utterance.rate=.78;utterance.pitch=1;
    const voices=speech.getVoices();utterance.voice=voices.find(v=>v.lang==='en-IN')||voices.find(v=>v.lang.startsWith('en'))||null;
    utterance.onend=()=>{if(!guard()||!voiceActive||epoch!==voiceEpoch)return;voiceWaiting=true;utterance=null;if(!voicePaused)voiceTimer=setTimeout(nextExplanation,Math.max(3000,12000-(Date.now()-started)));};
    utterance.onerror=event=>{if(!voiceActive||epoch!==voiceEpoch||event.error==='canceled'||event.error==='interrupted')return;stopVoice();say('Voice playback could not start. Check your device speech settings and sound, then try again. The explanation remains visible above.');};
    speech.speak(utterance);
  }
  find('pd-voice').addEventListener('click',()=>{
    if(!guard())return;stopTour();film.pause();
    if(!speech||!window.SpeechSynthesisUtterance){say('Voice is unavailable in this browser. Open this dashboard in a browser with text-to-speech support.');return;}
    clearTimeout(pumpTimer);pumpTimer=null;state.watering=false;voiceActive=true;voiceStep=0;voiceWaiting=false;
    find('pd-voice').disabled=true;find('pd-voice-pause').hidden=false;find('pd-voice-stop').hidden=false;speech.resume();nextExplanation();
  });
  find('pd-voice-pause').addEventListener('click',()=>{
    if(!guard()||!voiceActive)return;voicePaused=!voicePaused;
    if(voicePaused){clearTimeout(voiceTimer);speech.pause();say('Explanation paused. Choose Resume explanation to continue.');}
    else{speech.resume();if(voiceWaiting)voiceTimer=setTimeout(nextExplanation,3000);say('Explanation '+voiceStep+' / '+explanations.length);}
    find('pd-voice-pause').textContent=voicePaused?'Resume explanation':'Pause explanation';
  });
  find('pd-voice-stop').addEventListener('click',()=>{if(!guard())return;stopVoice();clearTimeout(pumpTimer);pumpTimer=null;state.watering=false;render();say('Automatic explanation stopped.');});
  find('pd-play').addEventListener('click',()=>{
    stopVoice();
    if(!guard())return;if(tourTimer){stopTour();say('Guided demo paused.');return;}
    clearTimeout(pumpTimer);state.watering=false;tourIndex=0;steps[tourIndex++]();render();find('pd-play').textContent='Pause guided demo Ⅱ';
    tourTimer=setInterval(()=>{if(!guard()||!visible){stopTour();return;}if(tourIndex>=steps.length){stopTour();say('Guided demo complete. Explore the controls or reset to start again.');return;}steps[tourIndex++]();render();},4200);
  });
  const heartbeat=setInterval(async()=>{
    if(!visible||!guard())return;
    try{const result=await db.rpc('econova_admin_status');if(!destroyed&&(result.error||result.data!==true)){onDenied();}}catch{if(!destroyed)onDenied();}
  },30000);
  render();
  return {
    setVisible(value){visible=value;if(!value){film.pause();stopTour();clearTimeout(pumpTimer);pumpTimer=null;state.watering=false;if(guard())render();}find('pd-stage')?.classList.toggle('pd-paused',!value);},
    destroy(){stopVoice();destroyed=true;film.destroy();clearInterval(heartbeat);clearInterval(tourTimer);clearTimeout(pumpTimer);root.replaceChildren();}
  };
}
