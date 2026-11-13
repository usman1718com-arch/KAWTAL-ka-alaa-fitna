import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
const configured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('COLLER_ICI') && !SUPABASE_ANON_KEY.includes('COLLER_ICI');
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = id => document.getElementById(id);
let mode='login', user=null;
$('connection').textContent = configured ? 'Supabase configuré' : 'Mode démo';
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.tab;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===b));$('authSubmit').textContent=mode==='login'?'Se connecter':'Créer mon compte';$('authMessage').textContent=mode==='login'?'Connectez-vous à votre espace.':'Créez votre compte KAWTAL.';}));
$('authForm').addEventListener('submit',async e=>{e.preventDefault();const email=$('email').value,password=$('password').value;
 if(!supabase){$('authMessage').textContent='Supabase n’est pas encore configuré. Consultez le fichier LISEZ-MOI.txt.';return;}
 const fn=mode==='login'?supabase.auth.signInWithPassword({email,password}):supabase.auth.signUp({email,password});
 const {data,error}=await fn;if(error){$('authMessage').textContent=error.message;return;}user=data.user;$('authMessage').textContent=mode==='signup'?'Compte créé. Vérifiez votre e-mail si la confirmation est activée.':'Connexion réussie.';syncUI();await loadTontines();});
function syncUI(){$('logout').classList.toggle('hidden',!user);$('authForm').classList.toggle('hidden',!!user);}
$('logout').onclick=async()=>{if(supabase)await supabase.auth.signOut();user=null;syncUI();};
$('newToggle').onclick=()=>$('tontineForm').classList.toggle('hidden');
$('tontineForm').addEventListener('submit',async e=>{e.preventDefault();if(!user||!supabase){alert('Connectez un compte Supabase pour enregistrer une vraie tontine.');return;}
 const row={name:$('tName').value,contribution_amount:Number($('amount').value),frequency:$('frequency').value,created_by:user.id};
 const {error}=await supabase.from('tontines').insert(row);if(error){alert(error.message);return;}e.target.reset();e.target.classList.add('hidden');await loadTontines();});
async function loadTontines(){if(!user||!supabase)return;const {data,error}=await supabase.from('tontines').select('*').order('created_at',{ascending:false});if(error){$('tontines').innerHTML='<article class="panel empty">Impossible de charger les tontines. Vérifiez les tables et les règles RLS dans Supabase.</article>';return;}render(data||[]);}
function render(items){$('tontines').innerHTML=items.length?'':'<article class="empty panel">Aucune tontine pour le moment.</article>';items.forEach(t=>{const el=document.createElement('article');el.className='panel tcard';const h=document.createElement('h3');h.textContent=t.name;const p=document.createElement('p');p.textContent=Number(t.contribution_amount).toLocaleString('fr-FR')+' GNF · '+({weekly:'Chaque semaine',monthly:'Chaque mois',daily:'Chaque jour'}[t.frequency]||t.frequency);el.append(h,p);$('tontines').append(el);});}
if(supabase){const {data}=await supabase.auth.getSession();user=data.session?.user||null;syncUI();if(user)await loadTontines();}