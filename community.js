
/* Luky TV DEA community: Supabase auth, realtime chat, song comments and direct messages.
   On an unconfigured GitHub Pages site, never pretend that these functions are active.
   The original Floot community remains accessible through prominent links.
*/
'use strict';
(function(){
const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll('[data-ui-tab]')];
const panels={chat:$('chatPanel'),messages:$('messagesPanel'),profile:$('profilePanel')};
const config=window.LUKY_COMMUNITY||{};
const connected=typeof config.url==='string'&&/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url)
  &&typeof config.anonKey==='string'&&config.anonKey.length>30&&Boolean(window.supabase?.createClient);
let db=null,user=null,registerMode=false,recipient=null,recipientName='',songForComments=null,subscription=null,authReady=false;

function notice(content,target){
  const element=target||$('authStatus');
  if(element)element.textContent=content;
}
function statePanel(view){
 document.body.dataset.page=view;
 for(const [key,el] of Object.entries(panels))el.hidden=key!==view;
 tabs.forEach(t=>{const yes=t.dataset.uiTab===view;t.classList.toggle('is-active',yes);t.setAttribute('aria-current',yes?'page':'false');});
 document.querySelector('.search').style.visibility=['home','songs'].includes(view)?'visible':'hidden';
 if(view==='chat'&&db)void loadChat();
 if(view==='messages'&&db)void loadPeople();
 if(view==='profile'&&db)void updateProfile();
 window.scrollTo({top:0,behavior:'instant'});
}
tabs.forEach(btn=>btn.addEventListener('click',()=>statePanel(btn.dataset.uiTab)));
document.querySelectorAll('a[href="#skladby"]').forEach(a=>a.addEventListener('click',()=>statePanel('songs')));
document.querySelectorAll('a[href="#domov"]').forEach(a=>a.addEventListener('click',()=>statePanel('home')));
function showMessages(root,items,privateChat=false){
 if(!root)return;
 root.replaceChildren();
 if(!items.length){const p=document.createElement('p');p.className='state';p.textContent='Zatiaľ tu nie sú žiadne správy.';root.appendChild(p);return;}
 const frag=document.createDocumentFragment();
 items.forEach(item=>{
  const wrap=document.createElement('article');wrap.className='msgBubble'+(user?.id===item.user_id||user?.id===item.sender_id?' mine':'');
  const avatar=document.createElement('span');avatar.className='msgAvatar';
  const sender=item.profiles?.display_name||item.display_name||((user&&user.id===(item.user_id||item.sender_id))?'Ja':privateChat?recipientName:'Člen');
  avatar.textContent=sender.slice(0,1).toUpperCase();
  const content=document.createElement('div');content.className='msgContents';
  const title=document.createElement('strong');title.textContent=sender;
  const body=document.createElement('p');body.textContent=item.body;
  const time=document.createElement('small');time.textContent=item.created_at?new Date(item.created_at).toLocaleString('sk-SK'):'';
  content.append(title,body,time);wrap.append(avatar,content);frag.appendChild(wrap);
 });
 root.appendChild(frag);root.scrollTop=root.scrollHeight;
}
function toggleComposer(form,on){
 if(!form)return;
 for(const el of form.elements)el.disabled=!on;
}
async function getProfile(id){
 if(!db||!id)return null;
 const {data}=await db.from('profiles').select('id,display_name').eq('id',id).maybeSingle();
 return data;
}
async function updateProfile(){
 const active=Boolean(user);
 $('profileLogged').hidden=!active;
 $('loginForm').hidden=!connected||active;
 if(active){
  const p=await getProfile(user.id);
  $('profileName').textContent=p?.display_name||user.user_metadata?.display_name||'Člen komunity';
  $('profileEmail').textContent=user.email||'';
 }else{$('profileName').textContent='';$('profileEmail').textContent='';}
 toggleComposer($('chatForm'),active);
 if(!user)toggleComposer($('directForm'),false);
 if(songForComments)toggleComposer($('commentForm'),active);
}
function authMode(mode){
 registerMode=mode==='register';
 $('modeLogin').classList.toggle('is-active',!registerMode);
 $('modeRegister').classList.toggle('is-active',registerMode);
 $('registerNameWrap').hidden=!registerMode;
 $('authSubmit').textContent=registerMode?'Vytvoriť účet':'Prihlásiť sa';
 $('password').autocomplete=registerMode?'new-password':'current-password';
 notice('');
}
$('modeLogin').addEventListener('click',()=>authMode('login'));
$('modeRegister').addEventListener('click',()=>authMode('register'));
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!db)return;
 const email=$('email').value.trim(),password=$('password').value;
 $('authSubmit').disabled=true;notice('Spracovávam…');
 try{
  const result=registerMode
   ?await db.auth.signUp({email,password,options:{data:{display_name:$('displayName').value.trim().slice(0,40)||'Člen komunity'}}})
   :await db.auth.signInWithPassword({email,password});
  if(result.error)throw result.error;
  notice(registerMode?'Účet vytvorený. Ak máš zapnuté potvrdzovanie e-mailu, potvrď adresu vo svojej schránke.':'Prihlásenie úspešné.');
  if(!registerMode)$('password').value='';
 }catch(err){notice(err?.message||'Prihlásenie sa nepodarilo.');}
 finally{$('authSubmit').disabled=false}
});
$('signOut').addEventListener('click',async()=>{
 if(db)await db.auth.signOut();user=null;recipient=null;await updateProfile();statePanel('profile');
});
async function loadChat(){
 if(!db)return;
 const {data,error}=await db.from('chat_messages').select('id,body,user_id,created_at,profiles(display_name)').order('created_at',{ascending:false}).limit(65);
 if(error){$('chatMessages').textContent='Chat sa nepodarilo načítať.';return;}
 showMessages($('chatMessages'),(data||[]).reverse());
}
$('chatForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!db||!user)return;
 const text=$('chatInput').value.trim().slice(0,800);if(!text)return;
 toggleComposer($('chatForm'),false);
 const {error}=await db.from('chat_messages').insert({user_id:user.id,body:text});
 toggleComposer($('chatForm'),true);
 if(error){notice('Správa sa neodoslala: '+error.message,$('chatMessages'));return;}
 $('chatInput').value='';await loadChat();
});
async function loadPeople(){
 if(!db||!user){$('peopleList').textContent=connected?'Pre súkromné správy sa prihlás do účtu.':'';return;}
 const {data,error}=await db.from('profiles').select('id,display_name').order('display_name',{ascending:true}).limit(150);
 if(error){$('peopleList').textContent='Zoznam členov nie je dostupný.';return;}
 $('peopleList').replaceChildren();
 (data||[]).filter(p=>p.id!==user.id).forEach(p=>{
  const b=document.createElement('button');b.type='button';b.textContent=p.display_name||'Člen komunity';
  if(p.id===recipient)b.classList.add('is-active');
  b.addEventListener('click',()=>{recipient=p.id;recipientName=p.display_name||'Člen';$('conversationName').textContent='Rozhovor: '+recipientName;toggleComposer($('directForm'),true);void loadPeople();void loadDirect()});
  $('peopleList').appendChild(b);
 });
 if(!$('peopleList').children.length)$('peopleList').textContent='V komunite zatiaľ nie je žiadny ďalší registrovaný člen.';
 if(recipient)await loadDirect();
}
async function loadDirect(){
 if(!db||!user||!recipient)return;
 const f='and(sender_id.eq.'+user.id+',recipient_id.eq.'+recipient+'),and(sender_id.eq.'+recipient+',recipient_id.eq.'+user.id+')';
 const {data,error}=await db.from('private_messages').select('id,body,created_at,sender_id,recipient_id').or(f).order('created_at',{ascending:true}).limit(100);
 if(error){$('directMessages').textContent='Správy sa nepodarilo načítať.';return;}
 const items=await Promise.all((data||[]).map(async m=>({...m,display_name:m.sender_id===user.id?'Ja':recipientName})));
 showMessages($('directMessages'),items,true);
}
$('directForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!db||!user||!recipient)return;
 const body=$('directInput').value.trim().slice(0,800);if(!body)return;
 toggleComposer($('directForm'),false);
 const {error}=await db.from('private_messages').insert({sender_id:user.id,recipient_id:recipient,body});
 toggleComposer($('directForm'),true);
 if(error){$('directMessages').textContent='Odoslanie sa nepodarilo: '+error.message;return;}
 $('directInput').value='';await loadDirect();
});
async function loadComments(){
 if(!db||!songForComments)return;
 const {data,error}=await db.from('song_comments').select('id,body,user_id,created_at,profiles(display_name)').eq('song_id',songForComments.id).order('created_at',{ascending:true}).limit(100);
 if(error){$('commentMessages').textContent='Komentáre sa nepodarilo načítať.';return;}
 showMessages($('commentMessages'),data||[]);
}
document.addEventListener('luky-song-comments',async e=>{
 const s=e.detail;if(!s?.id)return;
 songForComments=s;
 $('commentTitle').textContent=s.title;
 $('commentOverlay').hidden=false;
 $('commentNotice').hidden=connected;
 toggleComposer($('commentForm'),Boolean(db&&user));
 if(db)await loadComments();
 else $('commentMessages').textContent='';
});
function closeComments(){$('commentOverlay').hidden=true;songForComments=null;}
$('closeComments').addEventListener('click',closeComments);
$('commentOverlay').addEventListener('click',e=>{if(e.target===$('commentOverlay'))closeComments()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('commentOverlay').hidden)closeComments()});
$('commentForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!db||!user||!songForComments)return;
 const body=$('commentInput').value.trim().slice(0,800);if(!body)return;
 toggleComposer($('commentForm'),false);
 const {error}=await db.from('song_comments').insert({user_id:user.id,song_id:songForComments.id,body});
 toggleComposer($('commentForm'),true);
 if(error){$('commentMessages').textContent='Komentár sa nepodarilo odoslať: '+error.message;return;}
 $('commentInput').value='';await loadComments();
});
async function initialize(){
 statePanel('home');
 if(!connected){
  document.querySelectorAll('[data-community-state]').forEach(el=>el.hidden=false);
  $('commentNotice').hidden=false;
  return;
 }
 document.querySelectorAll('[data-community-state]').forEach(el=>el.hidden=true);
 db=window.supabase.createClient(config.url,config.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:{session}}=await db.auth.getSession();user=session?.user||null;
 db.auth.onAuthStateChange((_event,next)=>{user=next?.user||null;void updateProfile();if(document.body.dataset.page==='chat')void loadChat();if(document.body.dataset.page==='messages')void loadPeople()});
 await updateProfile();
 subscription=db.channel('luky-community-events')
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages'},()=>{if(document.body.dataset.page==='chat')void loadChat()})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'song_comments'},()=>{if(songForComments)void loadComments()})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages'},()=>{if(document.body.dataset.page==='messages'&&recipient)void loadDirect()})
  .subscribe();
}
void initialize().catch(e=>{console.warn('Community unavailable',e);document.querySelectorAll('[data-community-state]').forEach(el=>el.hidden=false);});
})();
