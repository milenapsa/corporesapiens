# CORPORESAPIENS — CANÔNICO DE CONTINUIDADE ENTRE JANELAS GPT

**Versão do snapshot:** 2026-07-15.1  
**Gerado em UTC:** 2026-07-15T11:58:41+00:00  
**Escopo:** produto Corporesapiens, identidade visual, produção, repositório, evidências e transição de contexto.  
**Autoridade:** este arquivo consolida o estado observado até a última captura de 15/07/2026 às 08:49.  
**Não substitui:** o Canônico Operacional da Porta Única Milena nem a Matriz A0–A4.  
**Regra central:** não presumir sincronização, publicação, aprovação ou fidelidade de ativo sem evidência.

---

## 1. Identidade do produto

- Nome oficial: **Corporesapiens**
- Domínio público: `https://corporesapiens.homosapiens.id`
- Repositório: `milenapsa/corporesapiens`
- Branch principal conhecida: `main`
- Tipo: PWA local-first para fichas, sessões, cargas, recordes, medidas, metas e acompanhamento pessoal.
- Idioma principal: pt-BR.
- Dados do usuário: locais no navegador por padrão.
- Limite: não substitui profissional de educação física, médico ou nutricionista; não promete resultado físico.

---

## 2. Estado visual canônico observado

A referência humana mais recente é a captura:

- `EVIDENCIA_VISUAL_2026-07-15_08-49-29.png`
- SHA-256: `ab31461d197a7f44d27c74e0cdf5d273dd0e737ced8fd8beffe1e9a168d7aeb8`
- Dimensão: 2048 × 1152 px.

O estado visual observado nessa captura é:

- cabeçalho grafite muito escuro;
- marca clara em bloco arredondado no canto superior esquerdo;
- wordmark **Corporesapiens** em off-white;
- eyebrow em dourado discreto: “TREINO · PROGRESSO · PRIVACIDADE”;
- cards em grafite uniforme;
- CTA principal off-white;
- textos auxiliares em cinza quente;
- bloco de meta e consistência sem o roxo anterior;
- navegação inferior escura;
- ausência visual dos antigos cartões azul-marinho e do bloco roxo dominante.

Este estado é a **baseline visual de continuidade UI V12**.

---

## 3. Marca — decisões e limites

### Direção aprovada

- ligação conceitual com as letras **C** e **S**;
- tratamento branco/off-white;
- relevo elegante, baixo e silencioso;
- fundo grafite, carvão ou preto;
- linguagem de marca de fitness apparel de alto padrão;
- sem neon, pulsos, halteres, escudos ou símbolos genéricos.

### Referência autoritativa de marca

- `CORPORESAPIENS_BRAND_MASTER_BOARD_APPROVED_v1.png`
- SHA-256: `b58b3288480c3f5df888c2635d98b59075e41519d2cf7de4c9027eb37531b94f`

Painel de referência do tratamento branco com relevo:

- `CORPORESAPIENS_BRAND_WHITE_EMBOSS_REFERENCE_PANEL_v1.png`
- SHA-256: `5e1e8b4541a9f5ce6da2ae197ca5cc5796a9860910ebabe2c7baccf012838df5`

### Atenção obrigatória

O ícone atualmente exibido em produção foi restaurado a partir de um fallback de favicon durante a correção técnica. Ele está visível e funcional, mas **não deve ser tratado como master vetorial final nem como prova de fidelidade geométrica integral ao quadro aprovado**.

Próxima substituição de ativo deve partir do master autoritativo, com comparação visual explícita.

---

## 4. Estado técnico de produção

- VPS Hostinger conhecida: `1799286`
- Projeto/container principal conhecido: `corporesapiens`
- Web server: Nginx
- Reverse proxy: Caddy
- HTTPS: ativo nas validações realizadas
- Volume público efetivo localizado: `/docker/corporesapiens/site`
- Diretório de backups: `/docker/corporesapiens/backups`

### Arquivos de produção identificados

- `index.html`
- `app-v10.js`
- `styles-v10.css`
- `styles-v11.css`
- `styles-v12.css`
- `manifest.webmanifest`
- `sw.js`
- `favicon.ico`
- `assets/corporesapiens-icon-512.png`
- `assets/corporesapiens-icon-192.png`
- `assets/apple-touch-icon.png`
- `comprar.html`
- `comece.html`
- `privacy.html`
- `terms.html`

### Marcadores técnicos observados

- `CORPORESAPIENS_BRANDMARK_INLINE_PROOF_OK`
- `CORPORESAPIENS_UI_V12_INLINE_PROOF_OK`

Esses marcadores confirmaram testes automatizados de mobile e desktop no momento da execução. Eles não substituem revisão humana contínua.

---

## 5. Estado do repositório

O repositório `milenapsa/corporesapiens`, branch `main`, contém o núcleo histórico, documentação, scripts e ativos.

### Divergência crítica

A produção avançou por alterações diretas no volume público e passou a usar `styles-v11.css`, `styles-v12.css` e estilos inline de correção. Na leitura atual do repositório, a raiz ainda possui `styles-v10.css`, mas não apresentou `styles-v11.css` nem `styles-v12.css`.

Portanto:

> **Produção está à frente do repositório em parte da interface visual.**

Antes de qualquer novo deploy ou rebuild, o operador deve:

1. exportar a versão pública efetiva;
2. comparar `index.html`, CSS, service worker e ativos;
3. incorporar as mudanças no GitHub;
4. validar build reproduzível;
5. só então publicar.

Um deploy baseado apenas no estado atual do GitHub pode sobrescrever a interface UI V12.

---

## 6. Estado funcional

A lógica principal do aplicativo não foi deliberadamente alterada durante a rodada visual. Permanecem como funções centrais:

- criação da primeira ficha;
- registro e acompanhamento de treinos;
- volume total;
- sequência;
- recordes;
- meta e consistência;
- conquistas;
- resumo mensal;
- navegação por Início, Treinos, Ferramentas, Progresso e Mais.

Não afirmar funcionamento integral de todos os fluxos sem teste funcional específico.

---

## 7. Backups e rollback

Foram criados backups antes das principais correções visuais. Entre os diretórios técnicos registrados estão:

- `20260715112409-brandmark-final-restore-v2`
- `20260715131826-brandmark-css-override-v2`
- `20260715133010-css-v11-cutover-v2`
- `20260715140815-brandmark-inline-final`
- `20260715143313-ui-v12-finalize`
- `20260715144035-ui-v12-inline-final`

O rollback deve restaurar um diretório completo compatível e repetir testes públicos. Não restaurar arquivo isolado sem conferir dependências de cache, `index.html`, CSS e `sw.js`.

---

## 8. Pendências reais

1. Sincronizar a produção UI V12 com o GitHub.
2. Substituir o ícone reconstruído pelo master fiel e verificável.
3. Remover correções inline temporárias após consolidar uma folha CSS limpa.
4. Atualizar o build oficial para gerar `styles-v12.css` ou versão superior.
5. Atualizar service worker e manifest a partir da mesma fonte.
6. Fazer teste funcional, não apenas visual, das rotas principais.
7. Auditar acessibilidade, contraste, foco, teclado e tamanhos de toque.
8. Reduzir resíduos históricos e arquivos superseded somente após snapshot e comparação.
9. Não alterar preço, vendas, pagamentos ou checkout sem decisão humana separada.

---

## 9. Regras para a próxima janela GPT

- Ler primeiro este canônico, o inventário e o JSON.
- Considerar a captura de 08:49 como última evidência visual humana.
- Não redesenhar a marca sem instrução explícita da Dra. Milena.
- Não presumir que GitHub e produção estão sincronizados.
- Não executar deploy a partir do repositório antes de reconciliar a divergência.
- Classificar qualquer escrita real em A3 ou A4 conforme a Matriz Porta Única.
- Criar backup antes de alterar produção.
- Exigir pós-teste e evidência antes de afirmar conclusão.
- Não pedir nem expor credenciais.
- Não confundir preparação, enfileiramento, criação de projeto Docker ou tentativa de script com conclusão.

---

## 10. Ordem segura de retomada

1. Ler `AVISO_NOVA_JANELA_GPT.md`.
2. Ler este canônico.
3. Ler `INVENTARIO_CORPORESAPIENS_2026-07-15.md`.
4. Ler `CORPORESAPIENS_STATE_HANDOFF_2026-07-15.json`.
5. Conferir a captura visual.
6. Fazer somente leitura do GitHub e da produção.
7. Preparar diff de reconciliação.
8. Pedir aprovação antes de A4.
