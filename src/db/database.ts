// Sistema Hospitalar - Banco de Dados
// Simulação de SQL com localStorage para persistência

export interface Paciente {
  id: number;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  convenio: string;
  numeroCarteirinha: string;
  createdAt: string;
}

export interface Atendimento {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  status: 'espera' | 'triagem' | 'consulta' | 'finalizado';
  prioridade: 'normal' | 'preferencial' | 'urgente';
  senha: string;
  dataHora: string;
  observacoes: string;
  chamadoEm?: string;
}

export interface Documento {
  id: number;
  pacienteId: number;
  pacienteNome: string;
  tipo: 'atestado' | 'receituario' | 'declaracao';
  conteudo: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Triagem {
  id: number;
  atendimentoId: number;
  pacienteId: number;
  pressaoArterial: string;
  temperatura: string;
  peso: string;
  altura: string;
  imc: string;
  frequenciaCardiaca: string;
  frequenciaRespiratoria: string;
  saturacaoO2: string;
  glicemia: string;
  sintomas: string;
  alergias: string;
  medicamentos: string;
  historicoDoencas: string;
  cirurgiasAnteriores: string;
  observacoes: string;
  enfermeiro: string;
  dataHora: string;
}

export interface ConsultaMedica {
  id: number;
  atendimentoId: number;
  pacienteId: number;
  queixaPrincipal: string;
  historiaDoencaAtual: string;
  exameFisico: string;
  diagnosticos: string[];
  diagnosticoDefinitivo: string;
  condutas: string[];
  examesSolicitados: string[];
  procedimentosRealizados: string[];
  medicamentosPrescritos: Medicamento[];
  orientacoes: string;
  cid: string;
  diasAfastamento: number;
  necessitaRetorno: boolean;
  diasRetorno: number;
  observacoes: string;
  medico: string;
  crm: string;
  dataHora: string;
}

export interface Medicamento {
  nome: string;
  dosagem: string;
  via: string;
  frequencia: string;
  duracao: string;
  instrucoes: string;
}

// Inicializar banco de dados
export const initDB = () => {
  if (!localStorage.getItem('pacientes')) {
    localStorage.setItem('pacientes', JSON.stringify([]));
  }
  if (!localStorage.getItem('atendimentos')) {
    localStorage.setItem('atendimentos', JSON.stringify([]));
  }
  if (!localStorage.getItem('documentos')) {
    localStorage.setItem('documentos', JSON.stringify([]));
  }
  if (!localStorage.getItem('triagens')) {
    localStorage.setItem('triagens', JSON.stringify([]));
  }
  if (!localStorage.getItem('consultas')) {
    localStorage.setItem('consultas', JSON.stringify([]));
  }
  if (!localStorage.getItem('config')) {
    localStorage.setItem('config', JSON.stringify({ ultimaSenha: 0 }));
  }
};

// Funções auxiliares
const getTable = (table: string): any[] => {
  const data = localStorage.getItem(table);
  return data ? JSON.parse(data) : [];
};

const setTable = (table: string, data: any[]) => {
  localStorage.setItem(table, JSON.stringify(data));
};

// PACIENTES
export const addPaciente = (paciente: Omit<Paciente, 'id' | 'createdAt'>): Paciente => {
  const pacientes = getTable('pacientes');
  const novoPaciente: Paciente = {
    ...paciente,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };
  pacientes.push(novoPaciente);
  setTable('pacientes', pacientes);
  return novoPaciente;
};

export const getPacientes = (): Paciente[] => {
  return getTable('pacientes');
};

export const getPacienteById = (id: number): Paciente | undefined => {
  const pacientes = getTable('pacientes');
  return pacientes.find((p: Paciente) => p.id === id);
};

export const updatePaciente = (id: number, dados: Partial<Paciente>): Paciente | null => {
  const pacientes = getTable('pacientes');
  const index = pacientes.findIndex((p: Paciente) => p.id === id);
  if (index !== -1) {
    pacientes[index] = { ...pacientes[index], ...dados };
    setTable('pacientes', pacientes);
    return pacientes[index];
  }
  return null;
};

export const buscarPacientePorCPF = (cpf: string): Paciente | undefined => {
  const pacientes = getTable('pacientes');
  return pacientes.find((p: Paciente) => p.cpf === cpf);
};

// ATENDIMENTOS
export const addAtendimento = (atendimento: Omit<Atendimento, 'id' | 'senha' | 'dataHora'>): Atendimento => {
  const atendimentos = getTable('atendimentos');
  const config = getTable('config');
  const novaSenha = config[0].ultimaSenha + 1;
  config[0].ultimaSenha = novaSenha;
  setTable('config', config);

  const novoAtendimento: Atendimento = {
    ...atendimento,
    id: Date.now(),
    senha: `A${novaSenha.toString().padStart(3, '0')}`,
    dataHora: new Date().toISOString(),
  };
  atendimentos.push(novoAtendimento);
  setTable('atendimentos', atendimentos);
  return novoAtendimento;
};

export const getAtendimentos = (): Atendimento[] => {
  return getTable('atendimentos').sort((a: Atendimento, b: Atendimento) => 
    new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()
  );
};

export const getAtendimentosPorStatus = (status: Atendimento['status']): Atendimento[] => {
  const atendimentos = getTable('atendimentos');
  return atendimentos.filter((a: Atendimento) => a.status === status);
};

export const getAtendimentosPendentes = (): Atendimento[] => {
  const atendimentos = getTable('atendimentos');
  return atendimentos.filter((a: Atendimento) => 
    a.status === 'espera' || a.status === 'triagem' || a.status === 'consulta'
  );
};

export const updateAtendimento = (id: number, dados: Partial<Atendimento>): Atendimento | null => {
  const atendimentos = getTable('atendimentos');
  const index = atendimentos.findIndex((a: Atendimento) => a.id === id);
  if (index !== -1) {
    atendimentos[index] = { ...atendimentos[index], ...dados };
    setTable('atendimentos', atendimentos);
    return atendimentos[index];
  }
  return null;
};

export const chamarProximoPaciente = (): Atendimento | null => {
  const atendimentos = getTable('atendimentos');
  const emEspera = atendimentos.filter((a: Atendimento) => a.status === 'espera');
  
  if (emEspera.length === 0) return null;
  
  // Ordenar por prioridade (urgente > preferencial > normal) e depois por hora
  const prioridadeOrdem = { urgente: 0, preferencial: 1, normal: 2 };
  emEspera.sort((a: Atendimento, b: Atendimento) => {
    if (prioridadeOrdem[a.prioridade] !== prioridadeOrdem[b.prioridade]) {
      return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
    }
    return new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime();
  });
  
  const proximo = emEspera[0];
  proximo.status = 'triagem';
  proximo.chamadoEm = new Date().toISOString();
  
  const index = atendimentos.findIndex((a: Atendimento) => a.id === proximo.id);
  atendimentos[index] = proximo;
  setTable('atendimentos', atendimentos);
  
  return proximo;
};

// DOCUMENTOS
export const addDocumento = (documento: Omit<Documento, 'id' | 'dataCriacao' | 'dataAtualizacao'>): Documento => {
  const documentos = getTable('documentos');
  const novoDocumento: Documento = {
    ...documento,
    id: Date.now(),
    dataCriacao: new Date().toISOString(),
    dataAtualizacao: new Date().toISOString(),
  };
  documentos.push(novoDocumento);
  setTable('documentos', documentos);
  return novoDocumento;
};

export const getDocumentosPorPaciente = (pacienteId: number): Documento[] => {
  const documentos = getTable('documentos');
  return documentos.filter((d: Documento) => d.pacienteId === pacienteId);
};

export const updateDocumento = (id: number, conteudo: string): Documento | null => {
  const documentos = getTable('documentos');
  const index = documentos.findIndex((d: Documento) => d.id === id);
  if (index !== -1) {
    documentos[index].conteudo = conteudo;
    documentos[index].dataAtualizacao = new Date().toISOString();
    setTable('documentos', documentos);
    return documentos[index];
  }
  return null;
};

export const getDocumentoPorId = (id: number): Documento | undefined => {
  const documentos = getTable('documentos');
  return documentos.find((d: Documento) => d.id === id);
};

// TRIAGEM
export const addTriagem = (triagem: Omit<Triagem, 'id' | 'dataHora'>): Triagem => {
  const triagens = getTable('triagens');
  const novaTriagem: Triagem = {
    ...triagem,
    id: Date.now(),
    dataHora: new Date().toISOString(),
  };
  triagens.push(novaTriagem);
  setTable('triagens', triagens);
  
  // Atualizar status do atendimento
  updateAtendimento(triagem.atendimentoId, { status: 'consulta' });
  
  return novaTriagem;
};

export const getTriagemPorAtendimento = (atendimentoId: number): Triagem | undefined => {
  const triagens = getTable('triagens');
  return triagens.find((t: Triagem) => t.atendimentoId === atendimentoId);
};

export const getTriagemPorPaciente = (pacienteId: number): Triagem | undefined => {
  const triagens = getTable('triagens');
  return triagens.find((t: Triagem) => t.pacienteId === pacienteId);
};

// CONSULTA MÉDICA
export const addConsulta = (consulta: Omit<ConsultaMedica, 'id' | 'dataHora'>): ConsultaMedica => {
  const consultas = getTable('consultas');
  const novaConsulta: ConsultaMedica = {
    ...consulta,
    id: Date.now(),
    dataHora: new Date().toISOString(),
  };
  consultas.push(novaConsulta);
  setTable('consultas', consultas);
  
  // Finalizar atendimento
  updateAtendimento(consulta.atendimentoId, { status: 'finalizado' });
  
  return novaConsulta;
};

export const getConsultaPorAtendimento = (atendimentoId: number): ConsultaMedica | undefined => {
  const consultas = getTable('consultas');
  return consultas.find((c: ConsultaMedica) => c.atendimentoId === atendimentoId);
};

export const getConsultasPorPaciente = (pacienteId: number): ConsultaMedica[] => {
  const consultas = getTable('consultas');
  return consultas.filter((c: ConsultaMedica) => c.pacienteId === pacienteId);
};

// Estatísticas
export const getEstatisticas = () => {
  const atendimentos = getTable('atendimentos');
  const hoje = new Date().toDateString();
  const atendimentosHoje = atendimentos.filter((a: Atendimento) => 
    new Date(a.dataHora).toDateString() === hoje
  );
  
  return {
    totalHoje: atendimentosHoje.length,
    emEspera: atendimentos.filter((a: Atendimento) => a.status === 'espera').length,
    emTriagem: atendimentos.filter((a: Atendimento) => a.status === 'triagem').length,
    emConsulta: atendimentos.filter((a: Atendimento) => a.status === 'consulta').length,
    finalizados: atendimentos.filter((a: Atendimento) => a.status === 'finalizado').length,
  };
};

// Limpar dados (para testes)
export const limparDados = () => {
  localStorage.removeItem('pacientes');
  localStorage.removeItem('atendimentos');
  localStorage.removeItem('documentos');
  localStorage.removeItem('triagens');
  localStorage.removeItem('consultas');
  localStorage.removeItem('config');
  initDB();
};
