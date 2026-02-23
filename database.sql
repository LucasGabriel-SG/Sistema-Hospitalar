-- Sistema Hospitalar - Schema do Banco de Dados SQL
-- Este arquivo contém a estrutura completa do banco de dados

-- =====================================================
-- TABELA: PACIENTES
-- Armazena os dados cadastrais dos pacientes
-- =====================================================
CREATE TABLE pacientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento DATE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    convenio VARCHAR(100),
    numero_carteirinha VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABELA: ATENDIMENTOS
-- Controla a fila de atendimento dos pacientes
-- =====================================================
CREATE TABLE atendimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    paciente_nome VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'espera' CHECK (status IN ('espera', 'triagem', 'consulta', 'finalizado')),
    prioridade VARCHAR(20) DEFAULT 'normal' CHECK (prioridade IN ('normal', 'preferencial', 'urgente')),
    senha VARCHAR(10) NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT,
    chamado_em TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

-- =====================================================
-- TABELA: TRIAGENS
-- Armazena os dados de triagem dos pacientes
-- =====================================================
CREATE TABLE triagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    atendimento_id INTEGER NOT NULL,
    paciente_id INTEGER NOT NULL,
    pressao_arterial VARCHAR(10),
    temperatura DECIMAL(4,2),
    peso DECIMAL(5,2),
    altura DECIMAL(4,2),
    imc DECIMAL(4,2),
    sintomas TEXT,
    alergias TEXT,
    medicamentos TEXT,
    observacoes TEXT,
    enfermeiro VARCHAR(255),
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id),
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

-- =====================================================
-- TABELA: DOCUMENTOS
-- Armazena atestados, receituários e declarações
-- =====================================================
CREATE TABLE documentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    paciente_nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) CHECK (tipo IN ('atestado', 'receituario', 'declaracao')),
    conteudo TEXT NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

-- =====================================================
-- TABELA: CONFIGURACOES
-- Armazena configurações do sistema
-- =====================================================
CREATE TABLE configuracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- =====================================================
CREATE INDEX idx_atendimentos_status ON atendimentos(status);
CREATE INDEX idx_atendimentos_paciente ON atendimentos(paciente_id);
CREATE INDEX idx_documentos_paciente ON documentos(paciente_id);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);

-- =====================================================
-- INSERTS INICIAIS
-- =====================================================
INSERT INTO configuracoes (chave, valor) VALUES ('ultima_senha', '0');

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View: Fila de espera atual
CREATE VIEW vw_fila_espera AS
SELECT 
    a.id,
    a.senha,
    a.prioridade,
    a.data_hora,
    p.nome as paciente_nome,
    p.cpf as paciente_cpf,
    TIMESTAMPDIFF(MINUTE, a.data_hora, CURRENT_TIMESTAMP) as tempo_espera_minutos
FROM atendimentos a
JOIN pacientes p ON a.paciente_id = p.id
WHERE a.status = 'espera'
ORDER BY 
    CASE a.prioridade 
        WHEN 'urgente' THEN 1 
        WHEN 'preferencial' THEN 2 
        ELSE 3 
    END,
    a.data_hora;

-- View: Atendimentos do dia
CREATE VIEW vw_atendimentos_dia AS
SELECT 
    a.*,
    p.nome as paciente_nome,
    p.cpf as paciente_cpf,
    p.telefone as paciente_telefone
FROM atendimentos a
JOIN pacientes p ON a.paciente_id = p.id
WHERE DATE(a.data_hora) = CURRENT_DATE;

-- View: Estatísticas do dia
CREATE VIEW vw_estatisticas_dia AS
SELECT 
    COUNT(*) as total_atendimentos,
    SUM(CASE WHEN status = 'espera' THEN 1 ELSE 0 END) as em_espera,
    SUM(CASE WHEN status = 'triagem' THEN 1 ELSE 0 END) as em_triagem,
    SUM(CASE WHEN status = 'consulta' THEN 1 ELSE 0 END) as em_consulta,
    SUM(CASE WHEN status = 'finalizado' THEN 1 ELSE 0 END) as finalizados,
    SUM(CASE WHEN prioridade = 'urgente' THEN 1 ELSE 0 END) as urgentes,
    SUM(CASE WHEN prioridade = 'preferencial' THEN 1 ELSE 0 END) as preferenciais
FROM atendimentos
WHERE DATE(data_hora) = CURRENT_DATE;

-- =====================================================
-- STORED PROCEDURES (FUNÇÕES)
-- =====================================================

-- Procedure: Gerar nova senha
CREATE PROCEDURE sp_gerar_senha(
    IN p_paciente_id INTEGER,
    IN p_prioridade VARCHAR(20)
)
BEGIN
    DECLARE v_ultima_senha INTEGER;
    DECLARE v_nova_senha VARCHAR(10);
    DECLARE v_paciente_nome VARCHAR(255);
    
    -- Pegar última senha
    SELECT CAST(valor AS INTEGER) INTO v_ultima_senha 
    FROM configuracoes WHERE chave = 'ultima_senha';
    
    -- Incrementar
    SET v_ultima_senha = v_ultima_senha + 1;
    SET v_nova_senha = CONCAT('A', LPAD(v_ultima_senha, 3, '0'));
    
    -- Pegar nome do paciente
    SELECT nome INTO v_paciente_nome FROM pacientes WHERE id = p_paciente_id;
    
    -- Inserir atendimento
    INSERT INTO atendimentos (paciente_id, paciente_nome, prioridade, senha, status)
    VALUES (p_paciente_id, v_paciente_nome, p_prioridade, v_nova_senha, 'espera');
    
    -- Atualizar última senha
    UPDATE configuracoes SET valor = v_ultima_senha, updated_at = CURRENT_TIMESTAMP
    WHERE chave = 'ultima_senha';
    
    SELECT v_nova_senha as senha_gerada;
END;

-- Procedure: Chamar próximo paciente
CREATE PROCEDURE sp_chamar_proximo()
BEGIN
    DECLARE v_atendimento_id INTEGER;
    
    -- Selecionar próximo paciente (por prioridade e hora)
    SELECT id INTO v_atendimento_id
    FROM atendimentos
    WHERE status = 'espera'
    ORDER BY 
        CASE prioridade 
            WHEN 'urgente' THEN 1 
            WHEN 'preferencial' THEN 2 
            ELSE 3 
        END,
        data_hora
    LIMIT 1;
    
    -- Atualizar status
    IF v_atendimento_id IS NOT NULL THEN
        UPDATE atendimentos 
        SET status = 'triagem', chamado_em = CURRENT_TIMESTAMP
        WHERE id = v_atendimento_id;
        
        SELECT * FROM atendimentos WHERE id = v_atendimento_id;
    END IF;
END;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Atualizar data de atualização do documento
CREATE TRIGGER trg_documento_update
BEFORE UPDATE ON documentos
FOR EACH ROW
BEGIN
    SET NEW.data_atualizacao = CURRENT_TIMESTAMP;
END;

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

/*
SISTEMA HOSPITALAR - DOCUMENTAÇÃO DO BANCO DE DADOS

Fluxo de Atendimento:
1. Paciente chega à recepção
2. Recepcionista cadastra paciente (tabela: pacientes)
3. Recepcionista gera senha de atendimento (tabela: atendimentos, status: 'espera')
4. Recepcionista chama paciente (status: 'triagem')
5. Enfermeiro realiza triagem (tabela: triagens)
6. Paciente vai para consulta (status: 'consulta')
7. Médico atende e gera documentos (tabela: documentos)
8. Atendimento finalizado (status: 'finalizado')

Tipos de Prioridade:
- normal: Atendimento padrão
- preferencial: Idosos, gestantes, deficientes
- urgente: Casos emergenciais

Tipos de Documentos:
- atestado: Atestado Médico
- receituario: Receituário de medicamentos
- declaracao: Declaração de Comparecimento
*/
