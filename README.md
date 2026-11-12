# Cardápio Digital 3D + AR — PWA estática

Site para restaurantes e empresas locais venderem a experiência de um **cardápio em 3D, com realidade aumentada (AR) nos celulares compatíveis**. Projeto independente, sem Supabase, sem banco de dados, sem login e sem backend de pedidos.

## Demonstração: fotografia original com movimento de profundidade

O prato em destaque agora utiliza a nova fotografia recortada e enviada para o projeto, em
`assets/img/pratos/prato-especial-real-movimento.webp`.

O efeito `presentation: "photo-motion"` aplica uma oscilação automática suave e inclinação
interativa (ponteiro no desktop; toque e arraste no celular), usando perspectiva CSS 3D.
A fotografia não é substituída por modelagem gerada, preservando sua aparência real.
**É um efeito 2,5D, não é um objeto 3D volumétrico ou fotogrametria.** Não permite
mostrar lados não fotografados nem usar AR do próprio prato com fidelidade.
Por isso o botão AR é ocultado apenas para esse item. Os outros pratos com GLB
permanecem com visualização 3D e AR compatível.

Para um prato fotorealista giratório em 360° e AR, fotografe o alimento de
muitos ângulos (fotogrametria ou digitalização 3D) e gere um modelo GLB texturizado,
com USDZ se necessário no iOS. Confirmar licenças de uso comercial da fotografia
antes de utilizar o protótipo com restaurantes.

## Prato com fotografia real e modelo 3D

O **Prato Executivo Grelhado** usa a imagem enviada em `assets/img/pratos/prato-executivo-real.webp` e um **arquivo GLB tridimensional real** em `assets/models/prato-executivo-reconstruido.glb`.

O modelo 3D foi construido proceduralmente com pratos e alimentos volumetricos: arroz, feijao, batatas fritas, file grelhado e salada, posicionado de acordo com a fotografia e em escala aproximada (prato de cerca de 30 cm). Nao e uma imagem plana, mas tambem **nao e um escaneamento fotogrametrico nem replica fiel ou fotorrealista**. As regioes invisiveis na foto foram estimadas, e cores, texturas, ingredientes e dimensoes sao ilustrativos. O arquivo GLB habilita a rotacao por toque, zoom e o botao de AR no Android compativel, com Quick Look em iOS quando disponivel.

**Teste em celular:** publique em HTTPS, toque no prato e escolha "Abrir camera e ver na mesa". Android precisa de suporte ARCore / Scene Viewer ou WebXR; iPhone precisa de suporte Quick Look e pode exigir um USDZ separado. O modelo existente permite experimentar a funcionalidade, mas nao garante AR em todos os aparelhos.

O preco foi deixado **sem valor** ate confirmacao do restaurante. A foto enviada tem nome de um banco de imagens; confirme que existe licenca para uso comercial antes de entregar esse exemplo a um cliente. Valide tambem os ingredientes exibidos (tipo de file nao confirmado), os alergenos e a aparencia do prato que a empresa realmente vende.

## O que está incluído

- Home de alto impacto, identificação do restaurante e cardápio com preços.
- 4 modelos GLB demonstrativos **ilustrativos** (hambúrguer, pizza, poke e brownie), giratórios por toque ou mouse. Eles **não são escaneamentos fotorrealistas** de alimentos reais; você poderá substituí-los por modelos profissionalmente digitalizados.
- Cards interativos, busca, categorias e detalhes em pop-up.
- Botão **Ver na minha mesa** usando WebXR / Scene Viewer (Android) e Quick Look (iPhone, se compatível), via `<model-viewer>`.
- Layout responsivo para celular, tablet e desktop.
- Manifest e Service Worker, permitindo instalar como app e disponibilizar recursos localmente após serem armazenados em cache.
- Configuração em `data/menu.json` para trocar marca, produtos, imagens, modelos, categorias, preços, WhatsApp, horário e cores.
- Editor **local de prévia** para montar o cardápio e exportar o JSON: `?editar=1` (não é área administrativa protegida e **não publica edições automaticamente**).
- Gerador de QR Code para impressão após a hospedagem.

## Testar localmente

Abra um terminal **dentro da pasta** e execute:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000/` no computador. Para abrir o editor, acesse `http://localhost:8000/?editar=1`.

**Não abra `index.html` clicando duas vezes (file://)**: o navegador pode bloquear a leitura do `data/menu.json`, o Service Worker e a realidade aumentada.

## Publicar para clientes

Publique a pasta inteira em uma hospedagem estática com **HTTPS**, por exemplo GitHub Pages ou Cloudflare Pages. O link será semelhante a:

`https://sua-empresa.github.io/cardapio-3d/`

Em GitHub Pages, os caminhos relativos já contemplam a implantação em subpasta. Cada restaurante deve ter sua própria cópia/URL se quiser cardápios independentes. O QR Code deve apontar para a **URL pública**, nunca para `localhost`.

### Gerar o QR Code

Instale uma vez a biblioteca de geração do QR:

```bash
pip install 'qrcode[pil]'
```

Depois execute:

```bash
python tools/gerar_qr.py https://seu-dominio.com/cardapio/ --saida qr-cardapio.png
```

Imprima o PNG gerado na mesa, embalagem ou balcão.

## Personalizar o restaurante

**Forma simples:** abra `https://seu-site.com/?editar=1` no navegador, personalize e clique em **Exportar menu.json**. Depois substitua o arquivo **`data/menu.json`** na hospedagem (commit + publicação). O botão **Aplicar prévia** só altera o navegador em que você está, e guarda um rascunho em `localStorage` no modo de edição. Não existe sincronização entre dispositivos; isso é proposital num site estático.

**Forma direta:** edite `data/menu.json` num editor de texto. Mantenha a estrutura existente:

- `business`: `name`, `tagline`, `headline`, `subtitle`, `logo`, `accent`, `whatsapp`, `address` e `openingHours`.
- `categories`: `{ "id": "pizzas", "name": "Pizzas" }`.
- `products`: `id`, `name`, `category`, `price`, `description`, `ingredients`, `allergens`, `prepTime`, `badge`, `poster`, `model` e `iosModel` (opcional).

**Importante:** URLs de modelos no JSON apenas apontam para arquivos já hospedados. O editor não faz upload de GLB, imagens ou USDZ. Coloque esses arquivos na pasta do projeto e atualize os respectivos caminhos. Recomenda-se usar GLB otimizado, com dimensões próximas às reais (unidades em metros). Use USDZ no campo `iosModel` quando precisar de maior previsibilidade em iPhones.

Após alterar os modelos ou arquivos estáticos, atualize a versão `VERSION` no `sw.js` e publique novamente. Fotos reais não precisam de GLB, mas não permitem rotação 3D ou AR. O JSON usa estratégia **network-first**, para refletir atualizações quando online, com fallback para cache offline.

### WhatsApp

Deixe `whatsapp` vazio para não mostrar botão de consulta. Se for utilizar, preencha somente números com DDI 55 + DDD + número, exemplo fictício `5581999999999`. O link abrirá uma conversa com texto pré-preenchido; não confirma pedidos nem salva dados no servidor.

## Realidade aumentada — requisitos reais

- **HTTPS obrigatório** para AR em um domínio público (exceto testes em contextos seguros locais específicos).
- Chrome/Android com suporte ARCore/Scene Viewer ou Safari/iOS com Quick Look, conforme compatibilidade do aparelho.
- Permissão/uso de câmera e superfície bem iluminada, quando o sistema de AR solicitar.
- Modelo GLB válido e, opcionalmente, modelo USDZ para iOS. O `<model-viewer>` pode tentar gerar USDZ automaticamente quando `iosModel` estiver vazio, mas isso não garante suporte em todos os aparelhos.
- Sem aparelho compatível, o site ainda exibe o modelo 3D navegável, **mas não finge abrir AR**.
- Posicionamento, iluminação e dimensão percebidos podem variar por dispositivo; os modelos demonstrativos não representam o prato exato de um estabelecimento.

O modo AR usa soluções oficiais documentadas em <https://modelviewer.dev/docs/>. A dependência `<model-viewer>` é carregada da CDN `unpkg.com` na primeira visita; por isso a experiência 3D depende de acesso inicial à rede e pode exigir novo acesso se não tiver sido armazenada em cache.

## Estrutura

```text
cardapio-3d-ar/
├── index.html                 Página do cliente e editor de prévia
├── css/style.css              Estilos e layout adaptativo
├── js/app.js                  Filtros, detalhes, AR, editor, exportação
├── data/menu.json             Marca, categorias, pratos e preços
├── manifest.webmanifest       Instalação como PWA
├── sw.js                      Cache offline / Service Worker
├── icon-192.png               Ícone da PWA
├── icon-512.png               Ícone da PWA
├── assets/logo.svg            Logotipo demonstrativo
├── assets/models/*.glb        4 modelos 3D demonstrativos
├── assets/posters/*.svg       Imagens de fundo demonstrativas
└── tools/                     Scripts opcionais para modelos, posters e QR
```

## Limites de uma solução exclusivamente estática

Este projeto é **um cardápio de apresentação/consulta**, não um sistema de vendas com estoque, múltiplos usuários, sincronização de alterações, autenticação segura, meios de pagamento ou banco de pedidos. Para oferecer atualizações automáticas de todos os cardápios sem editar arquivos/publicar, seria preciso acrescentar algum mecanismo de persistência/publicação — o que ficou intencionalmente fora do escopo.

**Licenças:** 3D de demonstração, posters e logo criados programaticamente para este projeto. Renderização AR via pacote `@google/model-viewer` (Apache-2.0); carregado de CDN em vez de empacotado. A imagem de marca e os dados do restaurante são apenas fictícios e devem ser substituídos para uso comercial real.

### Ícone e nome do aplicativo instalado

O editor altera o nome exibido **no site**. Para personalizar também o nome do aplicativo no celular, edite `name` e `short_name` em `manifest.webmanifest`. Substitua `icon-192.png`, `icon-512.png` e `assets/logo.svg` pela marca do estabelecimento antes de publicar.
