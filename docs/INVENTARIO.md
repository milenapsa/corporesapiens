# Inventário — Corporesapiens 1.0.1 Brand v2

## Identidade e endereços

- Produto: Corporesapiens
- Versão: 1.0.1
- URL: https://corporesapiens.homosapiens.id
- Compra: https://corporesapiens.homosapiens.id/comprar.html
- Onboarding: https://corporesapiens.homosapiens.id/comece.html
- Repositório: `milenapsa/corporesapiens`
- Tipo: PWA local-first
- Idioma: pt-BR

## Runtime

- VPS Hostinger: `1799286`
- Contêiner principal: `corporesapiens`
- Web server: Nginx
- Reverse proxy: Caddy
- HTTPS: ativo
- Persistência: `/docker/corporesapiens/site`
- Cache: `corporesapiens-v1.0.1-brand-v2`

## Marca travada

- Master: `assets/corporesapiens-icon-offwhite-512-v2.png`
- Produção 512 px: `assets/corporesapiens-icon-512.png`
- Produção 192 px: `assets/corporesapiens-icon-192.png`
- Apple touch: `assets/apple-touch-icon.png`
- Favicon: `favicon.ico`
- Direção: off-white com relevo elegante sobre grafite/escuro
- Regra: sem redesenho ou troca sem aprovação expressa

## Arquivos públicos canônicos

- `index.html`
- `app-v10.js`
- `styles-v10.css`
- `manifest.webmanifest`
- `sw.js`
- `favicon.ico`
- `comprar.html`
- `comece.html`
- `privacy.html`
- `terms.html`
- `corporesapiens-og.png`
- diretório `assets/`

## Fonte e reprodução

- Script: `scripts/build-v10.sh`
- Validação: `.github/workflows/validate.yml`
- Sincronização auditável: `.github/workflows/sync-production.yml`
- Saída local: `dist-v10/`
- Integridade: `PRODUCTION_SHA256SUMS.txt`

## Backup e rollback

A publicação da Brand v2 preservou cópia integral anterior em `/docker/corporesapiens/backups/`. O rollback deve restaurar o diretório de backup correspondente e repetir os testes públicos.

## Estado verificado

- produção online;
- ícones e manifest Brand v2 publicados;
- service worker Brand v2 publicado;
- build do repositório atualizado para reproduzir a marca;
- documentação canônica atualizada;
- nenhum fluxo de pagamento automatizado;
- nenhuma venda ou pagamento presumido.
