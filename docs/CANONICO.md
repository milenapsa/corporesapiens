# Canônico do Produto — Corporesapiens

**Versão canônica:** 1.0.1 — Brand v2  
**Estado:** produção online, build reproduzível, marca principal travada.

## Identidade

- Nome oficial: Corporesapiens
- Domínio oficial: https://corporesapiens.homosapiens.id
- Marca principal aprovada: monograma CS em off-white, com relevo elegante e fundo grafite/escuro.
- Regra de uso: não redesenhar, substituir ou reinterpretar o símbolo sem nova aprovação expressa.
- Arquivo master: `assets/corporesapiens-icon-offwhite-512-v2.png`

## Produto

PWA local-first para organização pessoal de fichas, sessões, cargas, recordes e medidas.

Princípios:
1. uso simples em celular;
2. dados locais por padrão;
3. funcionamento offline;
4. clareza para pessoas leigas;
5. nenhuma promessa de resultado físico ou médico.

## Build oficial

O artefato oficial é gerado por:

```sh
scripts/build-v10.sh . dist-v10
```

Saídas obrigatórias:
- `index.html`
- `app-v10.js`
- `styles-v10.css`
- `manifest.webmanifest`
- `sw.js`
- `favicon.ico`
- ícones 180, 192 e 512 px
- páginas comercial, onboarding, privacidade e termos
- `PRODUCTION_SHA256SUMS.txt`

Cache oficial: `corporesapiens-v1.0.1-brand-v2`.

## Gate de publicação

Toda publicação real é A4 e exige:
- backup ou snapshot recuperável;
- escopo exato;
- build e validação;
- teste HTTPS e ativos;
- teste mobile e desktop;
- teste de instalação/offline;
- rollback identificado;
- evidência técnica antes de afirmar conclusão.

## Definição de pronto

Uma versão só está pronta quando:
- produção responde por HTTPS;
- marca e ícones aprovados estão presentes;
- manifest e service worker apontam para os ativos corretos;
- build do GitHub reproduz a versão publicada;
- validações automatizadas passam;
- backup e rollback permanecem disponíveis;
- canônico, inventário e JSON refletem o estado real.

## Limites

O Corporesapiens não substitui profissional de educação física, médico ou nutricionista. Não diagnostica, prescreve ou promete hipertrofia, emagrecimento ou qualquer resultado.
