(() => {
  'use strict';
  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'cardapio3d-editor-draft-v1';
  const editorMode = new URLSearchParams(location.search).get('editar') === '1';
  let config = null;
  let publishedConfig = null;
  let activeCategory = 'todos';
  let selectedProduct = null;
  let noticeTimeout = null;
  const safeText = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeUrl = (url, fallback='') => {
    if (!url || typeof url !== 'string') return fallback;
    const value = url.trim();
    if (!value || value.startsWith('//') || value.includes('\\') || /[\n\r\t"'<>]/.test(value)) return fallback;
    try {
      const resolved = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(resolved.protocol) || (location.protocol === 'file:' && resolved.protocol === 'file:') ? value : fallback;
    } catch { return fallback; }
  };
  const money = value => new Intl.NumberFormat('pt-BR', {style:'currency',currency:config?.business?.currency||'BRL'}).format(Number(value)||0);
  const categoryName = id => config.categories.find(c=>c.id===id)?.name || 'Especialidade';
  const slug = text => String(text||'categoria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'categoria';
  const el = (name,attrs={},text='') => { const item=document.createElement(name);Object.entries(attrs).forEach(([key,value])=>item.setAttribute(key,value));item.textContent=text;return item; };
  const showToast = message => {
    const toast = $('toast'); toast.textContent=message; toast.classList.add('is-visible');
    clearTimeout(noticeTimeout);noticeTimeout=setTimeout(()=>toast.classList.remove('is-visible'),4600);
  };
  const clone = obj => JSON.parse(JSON.stringify(obj));

  async function init() {
    try {
      const response = await fetch('./data/menu.json',{cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      publishedConfig = await response.json();
      validateMenu(publishedConfig);
      config = clone(publishedConfig);
      if (editorMode) {
        try {
          const local = JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
          if (local) {validateMenu(local);config=local;}
        } catch { /* rascunho inválido descartado */ }
      }
      render();
      wireInteractions();
      if (editorMode) setupEditor();
    } catch (err) {
      console.error('Não foi possível carregar o cardápio',err);
      $('resultsCount').textContent='Erro ao carregar o cardápio';
      $('productGrid').innerHTML='<p class="load-error">Não foi possível carregar o arquivo data/menu.json. Publique o site em HTTP/HTTPS (ou execute um servidor local) e confira o arquivo.</p>';
      $('emptyState').hidden=true;
    }
    if ('serviceWorker' in navigator && location.protocol==='https:' || 'serviceWorker' in navigator && location.hostname==='localhost') {
      window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service Worker:',err)), {once:true});
    }
  }
  function validateMenu(data) {
    if (!data || !data.business || !Array.isArray(data.products)||!Array.isArray(data.categories)) throw new Error('Arquivo menu.json inválido');
  }
  function render() { renderBrand();renderFilters();renderProducts(); }
  function renderBrand() {
    const b=config.business;
    document.documentElement.style.setProperty('--accent',/^#[0-9a-f]{6}$/i.test(b.accent||'')?b.accent:'#a85333');
    document.documentElement.style.setProperty('--accent-dark',/^#[0-9a-f]{6}$/i.test(b.accentDark||'')?b.accentDark:'#733c2b');
    $('brandName').textContent=b.name||'Seu restaurante';$('brandTagline').textContent=b.tagline||'';
    $('footerName').textContent=b.name||'Seu restaurante';$('footerAddress').textContent=b.address||'';$('footerHours').textContent=b.openingHours||'';
    [$('brandLogo'),$('footerLogo')].forEach(img=>{img.src=safeUrl(b.logo,'./assets/logo.svg');img.onerror=()=>{img.onerror=null;img.src='./assets/logo.svg'};});
    document.title=`Cardápio 3D | ${b.name||'Restaurante'}`;
    const title=b.headline||'Uma nova forma de explorar o cardápio.';
    const comma=title.indexOf(',');
    $('heroTitle').innerHTML=comma>=0?`${safeText(title.slice(0,comma+1))} <em>${safeText(title.slice(comma+1).trim())}</em>`:safeText(title);
    $('heroSubtitle').textContent=b.subtitle||'';
    const featured=config.products[0];
    if (featured) {
      $('heroViewer').setAttribute('src',safeUrl(featured.model,'./assets/models/burger.glb'));
      $('heroViewer').setAttribute('alt',`Modelo 3D de ${featured.name}`);
      $('heroPoster').src=safeUrl(featured.poster,'./assets/posters/burger.svg');
    }
  }
  function renderFilters() {
    const node=$('categoryFilters');node.replaceChildren();
    const cats=config.categories.some(c=>c.id==='todos')?config.categories:[{id:'todos',name:'Tudo'},...config.categories];
    for (const cat of cats) {
      const button=el('button',{type:'button',class:'category-btn'+(cat.id===activeCategory?' active':''),'aria-pressed':String(cat.id===activeCategory)},cat.name);
      button.addEventListener('click',()=>{activeCategory=cat.id;renderFilters();renderProducts();});
      node.append(button);
    }
  }
  function viewerMarkup(product,index) {
    const model=safeUrl(product.model,'');
    const poster=safeUrl(product.poster,'./assets/posters/burger.svg');
    const camera = '35deg 68deg 0.44m';
    return `<div class="product-visual"><img class="poster-img" src="${safeText(poster)}" alt="" loading="lazy"/>${model?`<model-viewer src="${safeText(model)}" alt="Modelo 3D de ${safeText(product.name)}" camera-controls auto-rotate auto-rotate-delay="8000" rotation-per-second="9deg" shadow-intensity=".8" exposure="1.05" environment-image="neutral" interaction-prompt="none" loading="lazy" touch-action="pan-y" camera-orbit="${camera}" min-camera-orbit="auto auto 0.25m" max-camera-orbit="auto auto 0.8m"></model-viewer>`:''}${product.badge?`<span class="card-label">${safeText(product.badge)}</span>`:''}<span class="rotate-indicator" aria-hidden="true">⟳</span></div>`;
  }
  function renderProducts() {
    const query=$('searchInput').value.trim().toLocaleLowerCase('pt-BR');
    const items=config.products.filter(p=>(activeCategory==='todos'||p.category===activeCategory) && (!query || `${p.name} ${p.description||''} ${categoryName(p.category)}`.toLocaleLowerCase('pt-BR').includes(query)));
    const grid=$('productGrid');grid.replaceChildren();
    for (const [index,product] of items.entries()) {
      const card=el('article',{class:'product-card'});
      card.innerHTML=viewerMarkup(product,index)+`<div class="card-content"><div class="card-category">${safeText(categoryName(product.category))}</div><div class="card-name-price"><h3>${safeText(product.name)}</h3><span class="card-price">${safeText(money(product.price))}</span></div><p class="card-description">${safeText(product.description||'Conheça este prato em todos os detalhes.')}</p><div class="card-bottom"><span class="card-prep">◷ ${safeText(product.prepTime||'Consulte a equipe')}</span><button class="details-button" type="button">Ver detalhes ↗</button></div></div>`;
      card.querySelector('.details-button').addEventListener('click',()=>openProduct(product));
      grid.append(card);
    }
    $('emptyState').hidden=items.length!==0;
    $('resultsCount').textContent=`${items.length} ${items.length===1?'prato encontrado':'pratos encontrados'}`;
  }
  function openProduct(product) {
    selectedProduct=product;
    $('dialogTitle').textContent=product.name;
    $('dialogPrice').textContent=money(product.price);
    $('dialogCategory').textContent=categoryName(product.category).toUpperCase();
    $('dialogDescription').textContent=product.description||'';
    $('dialogIngredients').replaceChildren(...(product.ingredients||[]).map(item=>el('span',{class:'ingredient-chip'},item)));
    $('dialogMeta').textContent=`Preparo: ${product.prepTime||'Consulte o estabelecimento'}${product.allergens?.length?' · Alérgenos: '+product.allergens.join(', '):''}`;
    $('dialogPoster').src=safeUrl(product.poster,'./assets/posters/burger.svg');
    const viewer=$('dialogViewer');
    viewer.setAttribute('src',safeUrl(product.model,''));
    viewer.setAttribute('alt',`Prato ${product.name} para girar em 3D`);
    if(product.iosModel) viewer.setAttribute('ios-src',safeUrl(product.iosModel,''));else viewer.removeAttribute('ios-src');
    const phone=(config.business.whatsapp||'').replace(/\D/g,'');
    const order=$('orderLink');
    if(phone.length>=10){
      const msg=`Olá! Gostaria de informações sobre: ${product.name} (${money(product.price)}).`;
      order.href=`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      order.hidden=false;
    } else { order.hidden=true;order.removeAttribute('href'); }
    $('productDialog').showModal();
  }
  function openHelp() {$('helpDialog').showModal();}
  function wireInteractions() {
    $('searchInput').addEventListener('input',renderProducts);
    $('clearSearch').addEventListener('click',()=>{activeCategory='todos';$('searchInput').value='';renderFilters();renderProducts();});
    $('howBtn').addEventListener('click',openHelp);
    $('arHelpBtn').addEventListener('click',openHelp);
    $('arLaunchBtn').addEventListener('click',()=>{
      const viewer=$('dialogViewer');
      if(!selectedProduct?.model) {showToast('Este prato ainda não possui modelo 3D para AR.');return;}
      if(!window.isSecureContext){showToast('Para abrir a câmera em AR, publique o site em HTTPS.');return;}
      if(typeof viewer.activateAR==='function' && viewer.canActivateAR){
        // Chamada no clique original, necessária para Scene Viewer / Quick Look.
        try {const promise=viewer.activateAR();if(promise?.catch)promise.catch(()=>showToast('Não foi possível iniciar AR neste aparelho.'));}
        catch(err){console.error(err);showToast('Não foi possível abrir a realidade aumentada.');}
      } else {
        showToast('AR indisponível neste aparelho ou navegador. O modelo 3D pode ser girado na tela.');
      }
    });
    qsa('[data-close]').forEach(btn=>btn.addEventListener('click',()=>$((btn.dataset.close)).close()));
    qsa('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();}));
  }
  function setupEditor() {
    const launch=el('button',{class:'btn btn-outline',type:'button',id:'openEditorBtn'},'Personalizar cardápio ✎');
    launch.style.cssText='position:fixed;right:17px;bottom:18px;z-index:31;box-shadow:0 15px 40px #0002;background:#fff;border-color:var(--accent);color:var(--accent)';
    document.body.append(launch);
    launch.addEventListener('click',()=>{fillEditor();$('editorDialog').showModal();});
    $('editorForm').addEventListener('submit',event=>{
      event.preventDefault();
      try {const updated=readEditor();config=updated;localStorage.setItem(STORAGE_KEY,JSON.stringify(updated));activeCategory='todos';$('searchInput').value='';render();$('editorDialog').close();showToast('Prévia aplicada neste navegador. Exporte o JSON para publicar.');}
      catch(err){showToast(err.message);}
    });
    $('addProductBtn').addEventListener('click',()=>{
      const node=$('editorProducts');node.append(makeProductEditor({id:`novo-${Date.now()}`,name:'Novo prato',price:0,category:'todos',description:'',model:'',poster:'',ingredients:[],allergens:[],prepTime:'',badge:'',iosModel:''}));
      node.lastElementChild.scrollIntoView({behavior:'smooth',block:'center'});
    });
    $('exportJsonBtn').addEventListener('click',()=>{
      try {
        const data=readEditor();
        const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json;charset=utf-8'});
        const url=URL.createObjectURL(blob);const anchor=el('a',{href:url,download:'menu.json'});document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
        showToast('menu.json exportado. Substitua data/menu.json na hospedagem.');
      }catch(err){showToast(err.message);}
    });
    $('resetEditorBtn').addEventListener('click',()=>{
      if(!confirm('Descartar a prévia local e voltar ao cardápio publicado?')) return;
      localStorage.removeItem(STORAGE_KEY);config=clone(publishedConfig);fillEditor();activeCategory='todos';$('searchInput').value='';render();showToast('Prévia restaurada para a versão publicada.');
    });
    $('importJsonBtn').addEventListener('click',()=>$('importJsonInput').click());
    $('importJsonInput').addEventListener('change',async event=>{
      const file=event.target.files?.[0];if(!file)return;
      try {const imported=JSON.parse(await file.text());validateMenu(imported);config=imported;fillEditor();showToast('JSON importado para edição. Exporte para publicar.');}
      catch(err){showToast('Arquivo JSON inválido.');}
      event.target.value='';
    });
    if(new URLSearchParams(location.search).get('abrir')==='1'){fillEditor();$('editorDialog').showModal();}
  }
  function fillEditor() {
    const f=$('editorForm');const b=config.business;
    ['name','tagline','headline','subtitle','logo','whatsapp','address','openingHours'].forEach(k=>{f.elements[k].value=b[k]||'';});
    f.elements.accent.value=/^#[0-9a-f]{6}$/i.test(b.accent||'')?b.accent:'#a85333';
    f.elements.categories.value=config.categories.filter(c=>c.id!=='todos').map(c=>c.name).join(', ');
    $('editorProducts').replaceChildren(...config.products.map(makeProductEditor));
  }
  function inputHtml(label,name,value='',extra='',cls='') {return `<label class="${cls}">${safeText(label)}<input name="${safeText(name)}" value="${safeText(value)}" ${extra}/></label>`;}
  function makeProductEditor(product) {
    const category=config.categories.find(c=>c.id===product.category)?.name||product.category||'';
    const item=el('div',{class:'editor-product'});
    item.dataset.productId=product.id||`prato-${Date.now()}`;
    item.innerHTML=`<h3>${safeText(product.name||'Novo prato')}</h3><button class="remove-product" type="button">Excluir ✕</button>
      ${inputHtml('Nome','productName',product.name,'required maxlength="80"')}
      ${inputHtml('Preço (R$)','productPrice',String(product.price??0),'required type="number" min="0" step="0.01"')}
      ${inputHtml('Categoria','productCategory',category,'required')}
      ${inputHtml('Tempo de preparo','productPrep',product.prepTime||'')}
      ${inputHtml('Etiqueta','productBadge',product.badge||'')}
      ${inputHtml('Arquivo 3D (GLB)','productModel',product.model||'','','model-input')}
      ${inputHtml('Imagem de fundo','productPoster',product.poster||'','','model-input')}
      ${inputHtml('Modelo para iPhone (USDZ, opcional)','productIos',product.iosModel||'','','model-input')}
      ${inputHtml('Ingredientes (separados por vírgula)','productIngredients',(product.ingredients||[]).join(', '),'','model-input')}
      ${inputHtml('Alérgenos (separados por vírgula)','productAllergens',(product.allergens||[]).join(', '),'','model-input')}
      ${inputHtml('Descrição','productDescription',product.description||'','','description-input')}`;
    item.querySelector('.remove-product').addEventListener('click',()=>{if($('editorProducts').children.length<=1){showToast('Mantenha ao menos um prato.');return;}item.remove();});
    return item;
  }
  function readEditor() {
    const f=$('editorForm');const read=name=>String(f.elements[name]?.value||'').trim();
    const data=clone(config);let names=read('categories').split(',').map(c=>c.trim()).filter(Boolean);
    const products=qsa('#editorProducts .editor-product').map((item,index)=>{
      const field=name=>String(item.querySelector(`[name="${name}"]`)?.value||'').trim();
      const category=field('productCategory')||'Outros';
      if (!names.some(n=>slug(n)===slug(category))) names.push(category);
      return {id:item.dataset.productId||`produto-${index}`,name:field('productName'),price:Number(field('productPrice').replace(',','.'))||0,
        category:slug(category),prepTime:field('productPrep'),badge:field('productBadge'),model:field('productModel'),poster:field('productPoster'),
        iosModel:field('productIos'),description:field('productDescription'),ingredients:field('productIngredients').split(',').map(s=>s.trim()).filter(Boolean),
        allergens:field('productAllergens').split(',').map(s=>s.trim()).filter(Boolean)};
    });
    if (!read('name')) throw new Error('Informe o nome do estabelecimento.');
    if (!products.length) throw new Error('Adicione pelo menos um prato.');
    if (products.some(p=>!p.name)) throw new Error('Todos os pratos precisam de nome.');
    data.business={...data.business,name:read('name'),tagline:read('tagline'),headline:read('headline'),subtitle:read('subtitle'),accent:read('accent'),accentDark:read('accent'),logo:read('logo')||'assets/logo.svg',whatsapp:read('whatsapp'),address:read('address'),openingHours:read('openingHours')};
    data.categories=[{id:'todos',name:'Tudo'},...names.map(name=>({id:slug(name),name})).filter((c,i,a)=>a.findIndex(x=>x.id===c.id)===i)];
    data.products=products;
    return data;
  }
  document.addEventListener('DOMContentLoaded',init);
})();
