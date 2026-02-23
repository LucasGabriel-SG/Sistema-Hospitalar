import { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  FileText, 
  User, 
  Clock, 
  Printer, 
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  Activity,
  Pill,
  AlertTriangle,
  Home,
  Users,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  getAtendimentosPorStatus, 
  getAtendimentosPendentes,
  getPacienteById,
  getTriagemPorAtendimento,
  addDocumento,
  getDocumentosPorPaciente,
  addConsulta,
  type Atendimento,
  type Paciente,
  type Triagem,
  type Documento,
  type Medicamento
} from '@/db/database';

interface MedicoProps {
  onVoltar?: () => void;
}

const Medico = ({ onVoltar }: MedicoProps) => {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [atendimentosPendentes, setAtendimentosPendentes] = useState<Atendimento[]>([]);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<Atendimento | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [triagem, setTriagem] = useState<Triagem | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [mensagem, setMensagem] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);
  const [activeTab, setActiveTab] = useState('atendimento');
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [documentoAtual, setDocumentoAtual] = useState<Documento | null>(null);
  const [showPendentesModal, setShowPendentesModal] = useState(false);

  // Formulário de Atendimento Médico
  const [atendimentoMedico, setAtendimentoMedico] = useState({
    queixaPrincipal: '',
    historiaDoencaAtual: '',
    exameFisico: '',
    hipotesesDiagnosticas: [] as string[],
    diagnosticoDefinitivo: '',
    cid: '',
    conduta: '',
    examesSolicitados: [] as string[],
    procedimentosRealizados: [] as string[],
    orientacoes: '',
    diasAfastamento: 0,
    necessitaRetorno: false,
    diasRetorno: 30,
    observacoes: '',
    medico: '',
    crm: '',
  });

  // Medicamentos
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [novoMedicamento, setNovoMedicamento] = useState<Medicamento>({
    nome: '',
    dosagem: '',
    via: '',
    frequencia: '',
    duracao: '',
    instrucoes: '',
  });

  // Campos dinâmicos
  const [novaHipotese, setNovaHipotese] = useState('');
  const [novoExame, setNovoExame] = useState('');
  const [novoProcedimento, setNovoProcedimento] = useState('');

  useEffect(() => {
    carregarAtendimentos();
    const interval = setInterval(carregarAtendimentos, 3000);
    return () => clearInterval(interval);
  }, []);

  const carregarAtendimentos = () => {
    setAtendimentos(getAtendimentosPorStatus('consulta'));
    setAtendimentosPendentes(getAtendimentosPendentes());
  };

  const selecionarAtendimento = (atendimento: Atendimento) => {
    setAtendimentoSelecionado(atendimento);
    const pac = getPacienteById(atendimento.pacienteId);
    setPaciente(pac || null);
    const triag = getTriagemPorAtendimento(atendimento.id);
    setTriagem(triag || null);
    
    // Carregar documentos existentes
    const docs = getDocumentosPorPaciente(atendimento.pacienteId);
    setDocumentos(docs);
    
    // Preencher dados da triagem no atendimento
    if (triag) {
      setAtendimentoMedico(prev => ({
        ...prev,
        queixaPrincipal: triag.sintomas || '',
        observacoes: `Sinais Vitais - PA: ${triag.pressaoArterial}, Temp: ${triag.temperatura}°C, FC: ${triag.frequenciaCardiaca}, FR: ${triag.frequenciaRespiratoria}, SatO2: ${triag.saturacaoO2}%, Peso: ${triag.peso}kg, Altura: ${triag.altura}m, IMC: ${triag.imc}\n\nAlergias: ${triag.alergias || 'Nenhuma'}\nMedicamentos em uso: ${triag.medicamentos || 'Nenhum'}\nHistórico: ${triag.historicoDoencas || ''}\nCirurgias: ${triag.cirurgiasAnteriores || ''}\n\nObservações da Triagem: ${triag.observacoes || ''}`,
      }));
    }
    
    setShowPendentesModal(false);
  };

  const voltarParaLista = () => {
    setAtendimentoSelecionado(null);
    setPaciente(null);
    setTriagem(null);
    setDocumentos([]);
    setAtendimentoMedico({
      queixaPrincipal: '',
      historiaDoencaAtual: '',
      exameFisico: '',
      hipotesesDiagnosticas: [],
      diagnosticoDefinitivo: '',
      cid: '',
      conduta: '',
      examesSolicitados: [],
      procedimentosRealizados: [],
      orientacoes: '',
      diasAfastamento: 0,
      necessitaRetorno: false,
      diasRetorno: 30,
      observacoes: '',
      medico: '',
      crm: '',
    });
    setMedicamentos([]);
  };

  const adicionarMedicamento = () => {
    if (novoMedicamento.nome && novoMedicamento.dosagem) {
      setMedicamentos([...medicamentos, novoMedicamento]);
      setNovoMedicamento({
        nome: '',
        dosagem: '',
        via: '',
        frequencia: '',
        duracao: '',
        instrucoes: '',
      });
    }
  };

  const removerMedicamento = (index: number) => {
    setMedicamentos(medicamentos.filter((_, i) => i !== index));
  };

  const adicionarHipotese = () => {
    if (novaHipotese) {
      setAtendimentoMedico({
        ...atendimentoMedico,
        hipotesesDiagnosticas: [...atendimentoMedico.hipotesesDiagnosticas, novaHipotese]
      });
      setNovaHipotese('');
    }
  };

  const removerHipotese = (index: number) => {
    setAtendimentoMedico({
      ...atendimentoMedico,
      hipotesesDiagnosticas: atendimentoMedico.hipotesesDiagnosticas.filter((_, i) => i !== index)
    });
  };

  const adicionarExame = () => {
    if (novoExame) {
      setAtendimentoMedico({
        ...atendimentoMedico,
        examesSolicitados: [...atendimentoMedico.examesSolicitados, novoExame]
      });
      setNovoExame('');
    }
  };

  const removerExame = (index: number) => {
    setAtendimentoMedico({
      ...atendimentoMedico,
      examesSolicitados: atendimentoMedico.examesSolicitados.filter((_, i) => i !== index)
    });
  };

  const adicionarProcedimento = () => {
    if (novoProcedimento) {
      setAtendimentoMedico({
        ...atendimentoMedico,
        procedimentosRealizados: [...atendimentoMedico.procedimentosRealizados, novoProcedimento]
      });
      setNovoProcedimento('');
    }
  };

  const removerProcedimento = (index: number) => {
    setAtendimentoMedico({
      ...atendimentoMedico,
      procedimentosRealizados: atendimentoMedico.procedimentosRealizados.filter((_, i) => i !== index)
    });
  };

  const finalizarAtendimento = () => {
    if (!atendimentoSelecionado) return;
    
    if (!atendimentoMedico.medico || !atendimentoMedico.crm) {
      setMensagem({ tipo: 'erro', texto: 'Nome do médico e CRM são obrigatórios!' });
      setTimeout(() => setMensagem(null), 3000);
      return;
    }

    // Salvar consulta médica
    addConsulta({
      atendimentoId: atendimentoSelecionado.id,
      pacienteId: atendimentoSelecionado.pacienteId,
      queixaPrincipal: atendimentoMedico.queixaPrincipal,
      historiaDoencaAtual: atendimentoMedico.historiaDoencaAtual,
      exameFisico: atendimentoMedico.exameFisico,
      diagnosticos: atendimentoMedico.hipotesesDiagnosticas,
      diagnosticoDefinitivo: atendimentoMedico.diagnosticoDefinitivo,
      cid: atendimentoMedico.cid,
      condutas: atendimentoMedico.conduta ? [atendimentoMedico.conduta] : [],
      examesSolicitados: atendimentoMedico.examesSolicitados,
      procedimentosRealizados: atendimentoMedico.procedimentosRealizados,
      medicamentosPrescritos: medicamentos,
      orientacoes: atendimentoMedico.orientacoes,
      diasAfastamento: atendimentoMedico.diasAfastamento,
      necessitaRetorno: atendimentoMedico.necessitaRetorno,
      diasRetorno: atendimentoMedico.diasRetorno,
      observacoes: atendimentoMedico.observacoes,
      medico: atendimentoMedico.medico,
      crm: atendimentoMedico.crm,
    });

    // Gerar documentos automaticamente
    gerarDocumentos();

    setMensagem({ tipo: 'sucesso', texto: 'Atendimento finalizado com sucesso!' });
    voltarParaLista();
    carregarAtendimentos();
    setTimeout(() => setMensagem(null), 3000);
  };

  const gerarDocumentos = () => {
    if (!atendimentoSelecionado || !paciente) return;

    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Gerar Atestado
    if (atendimentoMedico.diasAfastamento > 0) {
      const atestadoConteudo = `ATESTADO MÉDICO

Atesto que o(a) paciente ${paciente.nome}, portador(a) do CPF ${paciente.cpf}, foi atendido(a) neste estabelecimento de saúde no dia ${dataAtual}, necessitando de repouso por ${atendimentoMedico.diasAfastamento} dia(s).

CID: ${atendimentoMedico.cid || '___'}
Diagnóstico: ${atendimentoMedico.diagnosticoDefinitivo || atendimentoMedico.hipotesesDiagnosticas.join(', ')}

Observações:
${atendimentoMedico.observacoes}

Data: ${dataAtual}

_________________________________
Dr(a). ${atendimentoMedico.medico}
CRM: ${atendimentoMedico.crm}
`;
      addDocumento({
        pacienteId: atendimentoSelecionado.pacienteId,
        pacienteNome: paciente.nome,
        tipo: 'atestado',
        conteudo: atestadoConteudo,
      });
    }

    // Gerar Receituário
    if (medicamentos.length > 0) {
      const medicamentosTexto = medicamentos.map((med, i) => 
        `${i + 1}. ${med.nome} ${med.dosagem}
   Via: ${med.via} | ${med.frequencia} | ${med.duracao}
   ${med.instrucoes ? 'Obs: ' + med.instrucoes : ''}`
      ).join('\n\n');

      const receituarioConteudo = `RECEITUÁRIO MÉDICO

Paciente: ${paciente.nome}

${medicamentosTexto}

${atendimentoMedico.examesSolicitados.length > 0 ? '\nEXAMES SOLICITADOS:\n' + atendimentoMedico.examesSolicitados.map((e, i) => `${i + 1}. ${e}`).join('\n') : ''}

Orientações:
${atendimentoMedico.orientacoes}

${atendimentoMedico.necessitaRetorno ? `Retorno em ${atendimentoMedico.diasRetorno} dias.` : ''}

Data: ${dataAtual}

_________________________________
Dr(a). ${atendimentoMedico.medico}
CRM: ${atendimentoMedico.crm}
`;
      addDocumento({
        pacienteId: atendimentoSelecionado.pacienteId,
        pacienteNome: paciente.nome,
        tipo: 'receituario',
        conteudo: receituarioConteudo,
      });
    }

    // Gerar Declaração
    const declaracaoConteudo = `DECLARAÇÃO DE COMPARECIMENTO

Declaro para os devidos fins que o(a) Sr(a). ${paciente.nome}, portador(a) do CPF ${paciente.cpf}, compareceu a esta unidade de saúde para atendimento médico no dia ${dataAtual}.

${atendimentoMedico.diagnosticoDefinitivo ? `Diagnóstico: ${atendimentoMedico.diagnosticoDefinitivo}` : ''}

Esta declaração não prescreve medicamentos nem atesta incapacidade laboral.

Data: ${dataAtual}

_________________________________
Dr(a). ${atendimentoMedico.medico}
CRM: ${atendimentoMedico.crm}
`;
    addDocumento({
      pacienteId: atendimentoSelecionado.pacienteId,
      pacienteNome: paciente.nome,
      tipo: 'declaracao',
      conteudo: declaracaoConteudo,
    });
  };

  const visualizarDocumento = (documento: Documento) => {
    setDocumentoAtual(documento);
    setShowDocumentoModal(true);
  };

  const imprimirDocumento = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && documentoAtual) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${getTituloDocumento(documentoAtual.tipo)}</title>
          <style>
            @media print {
              body { 
                margin: 0; 
                padding: 40px; 
                font-family: 'Times New Roman', serif;
                font-size: 14px;
                line-height: 1.6;
              }
              .documento { 
                max-width: 210mm; 
                margin: 0 auto; 
                white-space: pre-wrap;
              }
              .header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
            }
          </style>
        </head>
        <body>
          <div class="documento">${documentoAtual.conteudo}</div>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const getTituloDocumento = (tipo: string) => {
    switch (tipo) {
      case 'atestado': return 'Atestado Médico';
      case 'receituario': return 'Receituário';
      case 'declaracao': return 'Declaração de Comparecimento';
      default: return 'Documento';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'espera': return <Badge className="bg-blue-500">Em Espera</Badge>;
      case 'triagem': return <Badge className="bg-yellow-500">Em Triagem</Badge>;
      case 'consulta': return <Badge className="bg-purple-500">Em Consulta</Badge>;
      default: return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  if (!atendimentoSelecionado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Área Médica</h1>
                  <p className="text-gray-600">Consultório - Atendimento Médico</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPendentesModal(true)}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Pacientes Pendentes
                  <Badge className="ml-2 bg-orange-500">{atendimentosPendentes.length}</Badge>
                </Button>
                <div className="text-right mr-4">
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                  <p className="text-lg font-semibold text-blue-600">Médico</p>
                </div>
                {onVoltar && (
                  <Button variant="outline" onClick={onVoltar} className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Tela Principal
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Mensagens */}
          {mensagem && (
            <Alert className={`mb-4 ${mensagem.tipo === 'sucesso' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <AlertCircle className={`w-4 h-4 ${mensagem.tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'}`} />
              <AlertDescription className={mensagem.tipo === 'sucesso' ? 'text-green-800' : 'text-red-800'}>
                {mensagem.texto}
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Pacientes Aguardando Consulta
                </span>
                <Badge className="bg-blue-500">{atendimentos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atendimentos.length === 0 ? (
                <div className="text-center py-12">
                  <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum paciente aguardando consulta</p>
                  <p className="text-gray-400">Os pacientes aparecerão aqui após a triagem</p>
                  <Button 
                    onClick={() => setShowPendentesModal(true)} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Todos os Pacientes Pendentes
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {atendimentos.map((atendimento) => (
                    <div 
                      key={atendimento.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => selecionarAtendimento(atendimento)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{atendimento.pacienteNome}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(atendimento.dataHora).toLocaleTimeString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Senha: {atendimento.senha}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button>
                        Atender
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Pacientes Pendentes */}
        <Dialog open={showPendentesModal} onOpenChange={setShowPendentesModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pacientes Pendentes de Atendimento
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {atendimentosPendentes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhum paciente pendente</p>
              ) : (
                <div className="grid gap-3">
                  {atendimentosPendentes.map((atendimento) => (
                    <div 
                      key={atendimento.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-blue-300 cursor-pointer"
                      onClick={() => {
                        if (atendimento.status === 'consulta') {
                          selecionarAtendimento(atendimento);
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          atendimento.status === 'espera' ? 'bg-blue-100' :
                          atendimento.status === 'triagem' ? 'bg-yellow-100' : 'bg-purple-100'
                        }`}>
                          <User className={`w-5 h-5 ${
                            atendimento.status === 'espera' ? 'text-blue-600' :
                            atendimento.status === 'triagem' ? 'text-yellow-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">{atendimento.pacienteNome}</p>
                          <div className="flex items-center gap-3 text-sm">
                            {getStatusBadge(atendimento.status)}
                            <span className="text-gray-500">Senha: {atendimento.senha}</span>
                            <span className="text-gray-500">
                              {new Date(atendimento.dataHora).toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      {atendimento.status === 'consulta' && (
                        <Button size="sm">Atender</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={voltarParaLista}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Consulta Médica</h1>
              <p className="text-gray-600">{paciente?.nome} - Senha: {atendimentoSelecionado.senha}</p>
            </div>
          </div>
          <Button onClick={finalizarAtendimento} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Finalizar Atendimento
          </Button>
        </div>

        {/* Mensagens */}
        {mensagem && (
          <Alert className={`mb-4 ${mensagem.tipo === 'sucesso' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <AlertCircle className={`w-4 h-4 ${mensagem.tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription className={mensagem.tipo === 'sucesso' ? 'text-green-800' : 'text-red-800'}>
              {mensagem.texto}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar com informações */}
          <div className="col-span-3 space-y-4">
            {/* Dados do Paciente */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  Dados do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="font-medium">{paciente?.nome}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">CPF</p>
                  <p className="font-medium">{paciente?.cpf}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Data Nasc.</p>
                  <p className="font-medium">{paciente?.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR') : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="font-medium">{paciente?.telefone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Convênio</p>
                  <p className="font-medium">{paciente?.convenio || '-'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Dados da Triagem */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-yellow-600" />
                  Dados da Triagem
                </CardTitle>
              </CardHeader>
              <CardContent>
                {triagem ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Heart className="w-3 h-3" /> PA
                      </span>
                      <span className="font-medium">{triagem.pressaoArterial}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Thermometer className="w-3 h-3" /> Temp
                      </span>
                      <span className="font-medium">{triagem.temperatura}°C</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> FC
                      </span>
                      <span className="font-medium">{triagem.frequenciaCardiaca || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Scale className="w-3 h-3" /> Peso
                      </span>
                      <span className="font-medium">{triagem.peso} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Ruler className="w-3 h-3" /> Altura
                      </span>
                      <span className="font-medium">{triagem.altura} m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">IMC</span>
                      <span className="font-medium">{triagem.imc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">SatO2</span>
                      <span className="font-medium">{triagem.saturacaoO2 || '-'}%</span>
                    </div>
                    {triagem.alergias && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Alergias
                        </p>
                        <p className="text-xs text-red-600">{triagem.alergias}</p>
                      </div>
                    )}
                    {triagem.medicamentos && (
                      <div className="pt-2">
                        <p className="text-xs text-blue-500 flex items-center gap-1">
                          <Pill className="w-3 h-3" /> Medicamentos
                        </p>
                        <p className="text-xs">{triagem.medicamentos}</p>
                      </div>
                    )}
                    {triagem.historicoDoencas && (
                      <div className="pt-2">
                        <p className="text-xs text-gray-500">Histórico</p>
                        <p className="text-xs">{triagem.historicoDoencas}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center text-sm py-4">Triagem não realizada</p>
                )}
              </CardContent>
            </Card>

            {/* Documentos Salvos */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-green-600" />
                  Documentos Salvos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {documentos.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 text-sm"
                      onClick={() => visualizarDocumento(doc)}
                    >
                      <span>{getTituloDocumento(doc.tipo)}</span>
                      <Eye className="w-3 h-3 text-gray-400" />
                    </div>
                  ))}
                  {documentos.length === 0 && (
                    <p className="text-gray-500 text-center text-xs py-2">Nenhum documento</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Área Principal de Atendimento */}
          <div className="col-span-9">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Prontuário Médico</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
                    <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
                    <TabsTrigger value="prescricao">Prescrição</TabsTrigger>
                    <TabsTrigger value="documentos">Documentos</TabsTrigger>
                  </TabsList>

                  {/* Aba Atendimento */}
                  <TabsContent value="atendimento" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="queixa">Queixa Principal *</Label>
                        <Textarea
                          id="queixa"
                          value={atendimentoMedico.queixaPrincipal}
                          onChange={(e) => setAtendimentoMedico({...atendimentoMedico, queixaPrincipal: e.target.value})}
                          placeholder="Qual a principal queixa do paciente?"
                          className="min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="historia">História da Doença Atual *</Label>
                        <Textarea
                          id="historia"
                          value={atendimentoMedico.historiaDoencaAtual}
                          onChange={(e) => setAtendimentoMedico({...atendimentoMedico, historiaDoencaAtual: e.target.value})}
                          placeholder="Descreva a evolução dos sintomas..."
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="exameFisico">Exame Físico</Label>
                      <Textarea
                        id="exameFisico"
                        value={atendimentoMedico.exameFisico}
                        onChange={(e) => setAtendimentoMedico({...atendimentoMedico, exameFisico: e.target.value})}
                        placeholder="Descreva os achados do exame físico..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Dados da Triagem (Referência)</Label>
                      <div className="p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
                        {triagem ? (
                          <div className="grid grid-cols-4 gap-2">
                            <span><strong>PA:</strong> {triagem.pressaoArterial}</span>
                            <span><strong>Temp:</strong> {triagem.temperatura}°C</span>
                            <span><strong>FC:</strong> {triagem.frequenciaCardiaca || '-'}</span>
                            <span><strong>FR:</strong> {triagem.frequenciaRespiratoria || '-'}</span>
                            <span><strong>SatO2:</strong> {triagem.saturacaoO2 || '-'}%</span>
                            <span><strong>Peso:</strong> {triagem.peso}kg</span>
                            <span><strong>Altura:</strong> {triagem.altura}m</span>
                            <span><strong>IMC:</strong> {triagem.imc}</span>
                          </div>
                        ) : (
                          'Triagem não realizada'
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba Diagnóstico */}
                  <TabsContent value="diagnostico" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hipóteses Diagnósticas</Label>
                      <div className="flex gap-2">
                        <Input
                          value={novaHipotese}
                          onChange={(e) => setNovaHipotese(e.target.value)}
                          placeholder="Adicionar hipótese diagnóstica..."
                          className="flex-1"
                        />
                        <Button onClick={adicionarHipotese} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {atendimentoMedico.hipotesesDiagnosticas.map((hipotese, index) => (
                          <Badge key={index} className="bg-purple-100 text-purple-800 flex items-center gap-1">
                            {hipotese}
                            <Trash2 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => removerHipotese(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="diagnostico">Diagnóstico Definitivo</Label>
                        <Textarea
                          id="diagnostico"
                          value={atendimentoMedico.diagnosticoDefinitivo}
                          onChange={(e) => setAtendimentoMedico({...atendimentoMedico, diagnosticoDefinitivo: e.target.value})}
                          placeholder="Diagnóstico final..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cid">CID</Label>
                        <Input
                          id="cid"
                          value={atendimentoMedico.cid}
                          onChange={(e) => setAtendimentoMedico({...atendimentoMedico, cid: e.target.value})}
                          placeholder="Código CID..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Exames Solicitados</Label>
                      <div className="flex gap-2">
                        <Input
                          value={novoExame}
                          onChange={(e) => setNovoExame(e.target.value)}
                          placeholder="Adicionar exame..."
                          className="flex-1"
                        />
                        <Button onClick={adicionarExame} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {atendimentoMedico.examesSolicitados.map((exame, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800 flex items-center gap-1">
                            {exame}
                            <Trash2 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => removerExame(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Procedimentos Realizados</Label>
                      <div className="flex gap-2">
                        <Input
                          value={novoProcedimento}
                          onChange={(e) => setNovoProcedimento(e.target.value)}
                          placeholder="Adicionar procedimento..."
                          className="flex-1"
                        />
                        <Button onClick={adicionarProcedimento} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {atendimentoMedico.procedimentosRealizados.map((proc, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800 flex items-center gap-1">
                            {proc}
                            <Trash2 
                              className="w-3 h-3 cursor-pointer" 
                              onClick={() => removerProcedimento(index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Aba Prescrição */}
                  <TabsContent value="prescricao" className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        Adicionar Medicamento
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        <Input
                          placeholder="Nome do medicamento"
                          value={novoMedicamento.nome}
                          onChange={(e) => setNovoMedicamento({...novoMedicamento, nome: e.target.value})}
                        />
                        <Input
                          placeholder="Dosagem (ex: 500mg)"
                          value={novoMedicamento.dosagem}
                          onChange={(e) => setNovoMedicamento({...novoMedicamento, dosagem: e.target.value})}
                        />
                        <Select 
                          value={novoMedicamento.via} 
                          onValueChange={(v) => setNovoMedicamento({...novoMedicamento, via: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Via de administração" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Oral">Oral</SelectItem>
                            <SelectItem value="Sublingual">Sublingual</SelectItem>
                            <SelectItem value="Intravenosa">Intravenosa</SelectItem>
                            <SelectItem value="Intramuscular">Intramuscular</SelectItem>
                            <SelectItem value="Subcutânea">Subcutânea</SelectItem>
                            <SelectItem value="Tópica">Tópica</SelectItem>
                            <SelectItem value="Retal">Retal</SelectItem>
                            <SelectItem value="Inalatória">Inalatória</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Frequência (ex: 8/8h)"
                          value={novoMedicamento.frequencia}
                          onChange={(e) => setNovoMedicamento({...novoMedicamento, frequencia: e.target.value})}
                        />
                        <Input
                          placeholder="Duração (ex: 7 dias)"
                          value={novoMedicamento.duracao}
                          onChange={(e) => setNovoMedicamento({...novoMedicamento, duracao: e.target.value})}
                        />
                        <Input
                          placeholder="Instruções especiais"
                          value={novoMedicamento.instrucoes}
                          onChange={(e) => setNovoMedicamento({...novoMedicamento, instrucoes: e.target.value})}
                        />
                      </div>
                      <Button onClick={adicionarMedicamento} className="mt-3 w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Medicamento
                      </Button>
                    </div>

                    {medicamentos.length > 0 && (
                      <div className="space-y-2">
                        <Label>Medicamentos Prescritos</Label>
                        <div className="space-y-2">
                          {medicamentos.map((med, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{med.nome} {med.dosagem}</p>
                                <p className="text-sm text-gray-500">
                                  Via: {med.via} | {med.frequencia} | {med.duracao}
                                </p>
                                {med.instrucoes && <p className="text-sm text-blue-600">{med.instrucoes}</p>}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removerMedicamento(index)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="orientacoes">Orientações ao Paciente</Label>
                      <Textarea
                        id="orientacoes"
                        value={atendimentoMedico.orientacoes}
                        onChange={(e) => setAtendimentoMedico({...atendimentoMedico, orientacoes: e.target.value})}
                        placeholder="Orientações gerais..."
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="diasAfastamento">Dias de Afastamento</Label>
                        <Input
                          id="diasAfastamento"
                          type="number"
                          value={atendimentoMedico.diasAfastamento}
                          onChange={(e) => setAtendimentoMedico({...atendimentoMedico, diasAfastamento: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 mt-6">
                          <Checkbox 
                            id="retorno" 
                            checked={atendimentoMedico.necessitaRetorno}
                            onCheckedChange={(checked) => setAtendimentoMedico({...atendimentoMedico, necessitaRetorno: checked as boolean})}
                          />
                          <Label htmlFor="retorno">Necessita Retorno</Label>
                        </div>
                      </div>
                      {atendimentoMedico.necessitaRetorno && (
                        <div className="space-y-2">
                          <Label htmlFor="diasRetorno">Dias para Retorno</Label>
                          <Input
                            id="diasRetorno"
                            type="number"
                            value={atendimentoMedico.diasRetorno}
                            onChange={(e) => setAtendimentoMedico({...atendimentoMedico, diasRetorno: parseInt(e.target.value) || 30})}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Aba Documentos */}
                  <TabsContent value="documentos" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="medico">Nome do Médico *</Label>
                        <Input
                          id="medico"
                          value={atendimentoMedico.medico}
                          onChange={(e) => setAtendimentoMedico({...atendimentoMedico, medico: e.target.value})}
                          placeholder="Dr(a). Nome Completo"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="crm">CRM *</Label>
                        <Input
                          id="crm"
                          value={atendimentoMedico.crm}
                          onChange={(e) => setAtendimentoMedico({...atendimentoMedico, crm: e.target.value})}
                          placeholder="00000/UF"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoesFinais">Observações Finais</Label>
                      <Textarea
                        id="observacoesFinais"
                        value={atendimentoMedico.observacoes}
                        onChange={(e) => setAtendimentoMedico({...atendimentoMedico, observacoes: e.target.value})}
                        placeholder="Observações adicionais..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Documentos que serão gerados:</h4>
                      <ul className="space-y-1 text-sm text-green-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Declaração de Comparecimento
                        </li>
                        {atendimentoMedico.diasAfastamento > 0 && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Atestado Médico ({atendimentoMedico.diasAfastamento} dias)
                          </li>
                        )}
                        {medicamentos.length > 0 && (
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Receituário ({medicamentos.length} medicamentos)
                          </li>
                        )}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Visualização de Documento */}
      <Dialog open={showDocumentoModal} onOpenChange={setShowDocumentoModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{documentoAtual ? getTituloDocumento(documentoAtual.tipo) : 'Documento'}</span>
              <Button variant="outline" onClick={imprimirDocumento}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="bg-white p-8 border rounded-lg font-mono whitespace-pre-wrap text-sm">
            {documentoAtual?.conteudo}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Medico;
