# Canônico do Produto — Corporesapiens

**Versão canônica:** 0.5.0

## Identidade
Nome oficial: Corporesapiens  
Assinatura: Seu treino, suas cargas e sua evolução.  
Domínio oficial: corporesapiens.homosapiens.id

## Princípios
1. Registro rápido.
2. Clareza para pessoas leigas.
3. Funcionamento em celular.
4. Privacidade local.
5. Uso offline.
6. Sugestões explicáveis.
7. Nenhuma promessa de resultado.

## Regras
- dados ficam no aparelho por padrão;
- nenhuma conta é obrigatória;
- modelos são editáveis e não constituem prescrição;
- atualizações não podem apagar dados existentes;
- backups devem ser exportáveis;
- sugestões precisam indicar sua base;
- funções críticas devem ter estado vazio compreensível.

## Saúde e segurança
O Corporesapiens não substitui profissional de educação física, médico ou nutricionista. Não diagnostica lesão, não prescreve carga, não recomenda substâncias e não promete hipertrofia ou emagrecimento.

## Arquitetura
- app-core.js: núcleo;
- app-smart.js: inteligência local;
- app-v03.js: biblioteca e gráficos;
- app-v04.js: metas e consistência;
- app-v05.js: histórico detalhado, metas pessoais e central de dados.

## Gate de publicação
Toda publicação exige pré-voo, backup, validação de sintaxe, atualização do Service Worker, teste HTTPS, teste dos ativos, verificação da versão e rollback identificado.

## Definição de pronto
Uma versão só é considerada publicada quando HTTPS e ativos respondem 200, o JavaScript passa em node --check, o HTML referencia os módulos corretos, o Service Worker usa o cache da versão e existe evidência de backup.
