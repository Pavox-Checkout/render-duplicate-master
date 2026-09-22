# Landing pública PAVOX — primeira dobra

## Objetivo
Criar somente a primeira dobra pública em `/`, inspirada no banner enviado, preservando as telas e funções existentes.

## Implementação
- Criar um hero dark premium, ocupando praticamente toda a tela, com cabeçalho integrado.
- Exibir a marca PAVOX CHECKOUT à esquerda e links funcionais para Login e Cadastro à direita.
- Usar exatamente os textos e destinos informados para título, descrição e botões.
- Usar a composição de notebook e celular do banner enviado como elemento visual principal, sem duplicar os textos gravados no banner.
- Adaptar a composição para desktop e celular, mantendo contraste, leitura e microinterações discretas.
- Não criar nenhuma seção abaixo, rodapé ou funcionalidade nova.

## Preservação do sistema
- Manter a Visão geral existente disponível em `/dashboard`.
- Atualizar apenas os acessos internos que antes apontavam para `/`, para continuarem levando usuários autenticados à Visão geral.
- Não alterar o conteúdo do dashboard, login, cadastro, Builder, Produtos, Checkouts, Planos, autenticação ou banco de dados.

## Validação
- Conferir a primeira dobra em desktop e mobile.
- Confirmar os links Login, Cadastrar e Começar agora.
- Confirmar que `/dashboard` continua protegido e apresenta a Visão geral existente.
