const themePalettes={
 graphite:['Graphite','dark','#151a1b','#20292a','#293d3e','#eeeae0','#b9c9c3','#526863','#a8d5c2','#182a24','#efb989'],
 dark:['Dark+','dark','#1e1e1e','#252526','#37373d','#eeeeee','#bcbcbc','#666666','#79bfff','#10293d','#ffb86c'],
 light:['Light+','light','#ffffff','#f3f3f3','#dcecff','#202020','#505050','#868686','#005a9e','#ffffff','#964000'],
 dracula:['Dracula','dark','#282a36','#303341','#44475a','#f8f8f2','#c7c4de','#77758d','#bd93f9','#221333','#ffb86c'],
 monokai:['Monokai','dark','#272822','#303129','#414339','#f8f8f2','#c8c9bb','#787c68','#a6e22e','#1f2b08','#fdba74'],
 solarized:['Solarized Dark','dark','#002b36','#073642','#164854','#f0e8d2','#b6c9c8','#658d94','#73d3cb','#00302d','#efb963'],
 retrowave:['Retrowave','dark','#170d29','#24133c','#3c2057','#fff1ff','#ddbcf2','#9364ac','#ff80da','#350c2b','#ffe082']
};
const themeLink=document.createElement('link');themeLink.rel='stylesheet';themeLink.href='themes.css';document.head.append(themeLink);
const themeControl=document.createElement('div');themeControl.className='theme-control';
const themeLabel=document.createElement('label');themeLabel.htmlFor='theme-select';themeLabel.textContent='Theme';
const themeSelect=document.createElement('select');themeSelect.id='theme-select';
for(const [id,[name]] of Object.entries(themePalettes)){const option=document.createElement('option');option.value=id;option.textContent=name;themeSelect.append(option);}
themeControl.append(themeLabel,themeSelect);document.querySelector('header').append(themeControl);
function applyTheme(id){if(!themePalettes[id])id='graphite';const [,scheme,...colors]=themePalettes[id];document.documentElement.dataset.theme=id;document.documentElement.style.colorScheme=scheme;['canvas','surface','selected','text','muted','border','accent','on-accent','warning'].forEach((role,index)=>document.documentElement.style.setProperty('--theme-'+role,colors[index]));themeSelect.value=id;}
let savedTheme='graphite';try{savedTheme=localStorage.getItem('tangled-mess-theme')||savedTheme;}catch{}applyTheme(savedTheme);
themeSelect.addEventListener('change',()=>{applyTheme(themeSelect.value);try{localStorage.setItem('tangled-mess-theme',themeSelect.value);}catch{}});
