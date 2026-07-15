# CORPORESAPIENS — INVENTÁRIO DE TRANSIÇÃO GPT

**Snapshot:** 2026-07-15.1  
**Gerado em UTC:** 2026-07-15T11:58:41+00:00  
**Objetivo:** permitir retomada segura em outra janela sem depender da memória da conversa anterior.

---

## 1. Arquivos deste pacote

| Arquivo | Função |
|---|---|
| `README_PRIMEIRO.md` | ordem de leitura e resumo |
| `CANONICO_CORPORESAPIENS_TRANSICAO_GPT.md` | decisões, estado, limites e pendências |
| `INVENTARIO_CORPORESAPIENS_2026-07-15.md` | inventário legível |
| `CORPORESAPIENS_STATE_HANDOFF_2026-07-15.json` | estado legível por máquina |
| `AVISO_NOVA_JANELA_GPT.md` | texto pronto para colar na nova janela |
| `SHA256SUMS.json` | integridade dos arquivos |
| `EVIDENCIA_VISUAL_2026-07-15_08-49-29.png` | última captura humana |
| `CORPORESAPIENS_BRAND_MASTER_BOARD_APPROVED_v1.png` | referência autoritativa de marca |
| `CORPORESAPIENS_BRAND_WHITE_EMBOSS_REFERENCE_PANEL_v1.png` | referência de relevo/off-white |
| `PORTA_UNICA_CANONICO_REFERENCIA_v10_6.md` | governança operacional geral |

---

## 2. Inventário lógico do produto

### Público

- domínio: `corporesapiens.homosapiens.id`
- página principal: `/`
- compra: `/comprar.html`
- onboarding: `/comece.html`
- privacidade: `/privacy.html`
- termos: `/terms.html`

### Aplicação

- PWA local-first;
- JavaScript consolidado conhecido: `app-v10.js`;
- interface pública observada: UI V12;
- CSS público efetivo conhecido: `styles-v12.css`;
- correções de marca e paleta também presentes inline em `index.html`;
- service worker ativo nas rodadas anteriores;
- manifest e ícones de instalação existentes.

### Infraestrutura

- VPS: `1799286`
- volume público: `/docker/corporesapiens/site`
- backups: `/docker/corporesapiens/backups`
- Nginx + Caddy
- HTTPS ativo nas validações realizadas

### Repositório

- owner: `milenapsa`
- repo: `corporesapiens`
- branch: `main`
- documentação padrão:
  - `docs/CANONICO.md`
  - `docs/INVENTARIO.md`
  - `docs/corporesapiens.json`
  - `docs/CHANGELOG.md`
- scripts:
  - `scripts/build-v10.sh`
  - `scripts/build-premium.sh`
- workflows:
  - validação;
  - sincronização de produção;
  - extração de fonte.

---

## 3. Estado da marca

### Aprovado como direção

- nome Corporesapiens;
- conexão visual com CS;
- branco/off-white;
- relevo elegante;
- fundo grafite;
- linguagem de performance sofisticada.

### Autoridade visual

- quadro aprovado SHA-256: `b58b3288480c3f5df888c2635d98b59075e41519d2cf7de4c9027eb37531b94f`
- painel de referência SHA-256: `5e1e8b4541a9f5ce6da2ae197ca5cc5796a9860910ebabe2c7baccf012838df5`

### Produção atual

- marca visível no cabeçalho;
- arquivo público 512 px presente nas últimas validações;
- ativo atual reconstruído de fallback e ainda não equivalente a master vetorial confirmado.

---

## 4. Evidências

### Evidência humana mais recente

- arquivo: `EVIDENCIA_VISUAL_2026-07-15_08-49-29.png`
- SHA-256: `ab31461d197a7f44d27c74e0cdf5d273dd0e737ced8fd8beffe1e9a168d7aeb8`
- observação: interface grafite unificada, marca clara visível, CTA off-white, dourado discreto e ausência do azul/roxo anteriores.

### Evidências técnicas registradas

- `CORPORESAPIENS_BRANDMARK_INLINE_PROOF_OK`
- `CORPORESAPIENS_UI_V12_INLINE_PROOF_OK`
- testes mobile e desktop sem overflow horizontal;
- `Content-Type: image/png` verificado para o ícone durante a rodada técnica.

---

## 5. Divergências e riscos

| Item | Estado | Risco |
|---|---|---|
| Produção UI V12 | ativa/observada | pode ser perdida por deploy antigo |
| GitHub | contém base e docs, mas não toda UI V12 | divergência crítica |
| Ícone atual | visível e funcional | fidelidade ao master não comprovada |
| CSS inline | resolve a cascata | dívida técnica |
| Service worker/cache | já causou versões antigas | exige versionamento controlado |
| API Hostinger | apresentou `VPS:9999` intermitente | evidência pode falhar |
| Dados locais | permanecem no navegador | troca de dispositivo não leva dados automaticamente |

---

## 6. Arquivos locais históricos

O ambiente local contém múltiplas versões e pacotes anteriores do Corporesapiens, incluindo:

- 0.2 a 0.9;
- 1.0 RC, hardening e recovery;
- pacotes de branding, campanha, kit de vendas e premium;
- reancoragem canônica v1;
- capturas de tela de 12 a 15 de julho de 2026.

Esses arquivos são históricos. Não escolher um deles como fonte de produção apenas pelo nome. A autoridade deve seguir o canônico deste pacote e a comparação de hashes/evidências.

---

## 7. Classificação operacional

- criação deste pacote: A3 documental reversível;
- nenhuma alteração de produção realizada por este pacote;
- nenhuma alteração de DNS, VPS, checkout ou pagamentos;
- gravação no GitHub autorizada pela solicitação expressa da Dra. Milena;
- qualquer reconciliação e publicação futura: A4.
