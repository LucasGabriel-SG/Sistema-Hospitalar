# Sistema Hospitalar - Posto de Saúde Central

Sistema completo para gestão de atendimento em consultório médico, com controle de fila, triagem, consulta e geração de documentos médicos.

## Funcionalidades

### 1. Recepção
- **Cadastro de Pacientes**: Formulário completo para cadastrar novos pacientes
- **Busca por CPF**: Localizar pacientes já cadastrados
- **Geração de Senhas**: Sistema automático de senhas (A001, A002, etc.)
- **Prioridades**: Normal, Preferencial (idosos, gestantes) e Urgente
- **Controle de Fila**: Visualização em tempo real da fila de espera
- **Chamada por Voz**: Síntese de voz para chamar pacientes

### 2. Triagem
- **Fila de Triagem**: Lista de pacientes chamados para triagem
- **Sinais Vitais**: Pressão arterial, temperatura, peso, altura
- **Cálculo Automático de IMC**: Baseado no peso e altura
- **Avaliação Clínica**: Sintomas, alergias, medicamentos em uso
- **Encaminhamento**: Após triagem, paciente vai automaticamente para consulta

### 3. Consulta Médica
- **Prontuário Eletrônico**: Visualização dos dados do paciente
- **Dados da Triagem**: Sinais vitais coletados na triagem
- **Documentos Editáveis**:
  - **Atestado Médico**: Com campos para CID e dias de repouso
  - **Receituário**: Template para prescrição de medicamentos
  - **Declaração de Comparecimento**: Para comprovação de atendimento
- **Histórico de Documentos**: Acesso a documentos salvos anteriormente
- **Finalização**: Encerramento do atendimento

### 4. TV de Chamada
- **Painel em Tempo Real**: Mostra filas de espera, triagem e consulta
- **Chamada por Voz**: Anúncio automático quando paciente é chamado
- **Último Chamado**: Destaque visual do último paciente chamado
- **Controle de Som**: Opção de ativar/desativar som
- **Relógio e Data**: Exibição em tempo real

## Tecnologias Utilizadas

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Banco de Dados**: LocalStorage (simulação de SQL)
- **Síntese de Voz**: Web Speech API
- **Ícones**: Lucide React

## Estrutura do Banco de Dados

O arquivo `database.sql` contém o schema completo com:
- Tabela `pacientes`: Dados cadastrais
- Tabela `atendimentos`: Controle de fila
- Tabela `triagens`: Dados de triagem
- Tabela `documentos`: Atestados, receituários e declarações
- Views e Procedures para consultas otimizadas

## Como Usar

1. **Acesse o sistema** através do link de deploy
2. **Escolha a interface** desejada na tela inicial:
   - Recepcionista
   - Triagem
   - Médico
   - TV de Chamada

3. **Fluxo de Atendimento**:
   - Recepcionista cadastra o paciente
   - Recepcionista gera senha de atendimento
   - Recepcionista chama o paciente (com som)
   - Enfermeiro realiza a triagem
   - Médico realiza a consulta e gera documentos
   - Atendimento é finalizado

## Recursos Adicionais

- **Navegação**: Menu lateral para alternar entre interfaces
- **Atualização em Tempo Real**: Dados sincronizados automaticamente
- **Estatísticas**: Dashboard com indicadores do dia
- **Responsivo**: Interface adaptada para diferentes telas

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## Notas

- O sistema utiliza LocalStorage para persistência de dados
- A síntese de voz funciona melhor no Google Chrome
- Os dados são mantidos apenas no navegador local
- Para ambiente de produção, recomenda-se implementar backend com banco de dados real

## Licença

Sistema desenvolvido para uso em consultórios médicos e postos de saúde.
