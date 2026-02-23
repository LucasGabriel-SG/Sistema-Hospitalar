import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Users, 
  Bell, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  Stethoscope,
  FileText,
  Printer,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  initDB, 
  addPaciente, 
  getPacientes, 
  addAtendimento, 
  getAtendimentosPorStatus,
  buscarPacientePorCPF,
  chamarProximoPaciente,
  getEstatisticas,
  type Paciente,
  type Atendimento
} from '@/db/database';
import { useSpeech } from '@/hooks/useSpeech';

interface RecepcionistaProps {
  onVoltar?: () => void;
}

const Recepcionista = ({ onVoltar }: RecepcionistaProps) => {
  const [activeTab, setActiveTab] = useState('cadastro');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [atendimentosEspera, setAtendimentosEspera] = useState<Atendimento[]>([]);
  const [atendimentosTriagem, setAtendimentosTriagem] = useState<Atendimento[]>([]);
  const [estatisticas, setEstatisticas] = useState({ totalHoje: 0, emEspera: 0, emTriagem: 0, emConsulta: 0, finalizados: 0 });
  const { speak } = useSpeech();
  
  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    telefone: '',
    email: '',
    endereco: '',
    convenio: '',
    numeroCarteirinha: '',
  });
  const [buscaCPF, setBuscaCPF] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState<Paciente | null>(null);
  const [mensagem, setMensagem] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);
  const [prioridade, setPrioridade] = useState<'normal' | 'preferencial' | 'urgente'>('normal');
  
  // Estados para impressão de senha
  const [senhaGerada, setSenhaGerada] = useState<Atendimento | null>(null);
  const [showImpressaoModal, setShowImpressaoModal] = useState(false);

  useEffect(() => {
    initDB();
    carregarDados();
    const interval = setInterval(carregarDados, 3000);
    return () => clearInterval(interval);
  }, []);

  const carregarDados = () => {
    setPacientes(getPacientes());
    setAtendimentosEspera(getAtendimentosPorStatus('espera'));
    setAtendimentosTriagem(getAtendimentosPorStatus('triagem'));
    setEstatisticas(getEstatisticas());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const cadastrarPaciente = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cpf) {
      setMensagem({ tipo: 'erro', texto: 'Nome e CPF são obrigatórios!' });
      return;
    }

    const existente = buscarPacientePorCPF(formData.cpf);
    if (existente) {
      setMensagem({ tipo: 'erro', texto: 'CPF já cadastrado!' });
      return;
    }

    const novoPaciente = addPaciente(formData);
    setMensagem({ tipo: 'sucesso', texto: `Paciente ${novoPaciente.nome} cadastrado com sucesso!` });
    setFormData({
      nome: '',
      cpf: '',
      dataNascimento: '',
      telefone: '',
      email: '',
      endereco: '',
      convenio: '',
      numeroCarteirinha: '',
    });
    carregarDados();
    
    setTimeout(() => setMensagem(null), 3000);
  };

  const buscarPaciente = () => {
    if (!buscaCPF) return;
    const paciente = buscarPacientePorCPF(buscaCPF);
    setPacienteEncontrado(paciente || null);
    if (!paciente) {
      setMensagem({ tipo: 'erro', texto: 'Paciente não encontrado!' });
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  const gerarSenha = () => {
    if (!pacienteEncontrado) return;
    
    const atendimento = addAtendimento({
      pacienteId: pacienteEncontrado.id,
      pacienteNome: pacienteEncontrado.nome,
      status: 'espera',
      prioridade,
      observacoes: '',
    });
    
    setSenhaGerada(atendimento);
    setMensagem({ 
      tipo: 'sucesso', 
      texto: `Senha ${atendimento.senha} gerada para ${pacienteEncontrado.nome}!` 
    });
    setPacienteEncontrado(null);
    setBuscaCPF('');
    carregarDados();
    
    // Abrir modal de impressão
    setShowImpressaoModal(true);
    
    setTimeout(() => setMensagem(null), 3000);
  };

  const imprimirSenha = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && senhaGerada) {
      const dataHora = new Date().toLocaleString('pt-BR');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Senha de Atendimento</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .ticket { 
                width: 80mm; 
                margin: 0 auto; 
                text-align: center; 
                border: 2px solid #000;
                padding: 20px;
                page-break-after: always;
              }
              .header { font-size: 14px; margin-bottom: 10px; }
              .senha { font-size: 48px; font-weight: bold; margin: 20px 0; color: #0d9488; }
              .prioridade { font-size: 16px; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
              .prioridade.normal { background: #3b82f6; color: white; }
              .prioridade.preferencial { background: #eab308; color: white; }
              .prioridade.urgente { background: #ef4444; color: white; }
              .paciente { font-size: 18px; font-weight: bold; margin: 15px 0; }
              .data { font-size: 12px; color: #666; margin-top: 20px; }
              .footer { font-size: 11px; margin-top: 30px; color: #666; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <strong>POSTO DE SAÚDE CENTRAL</strong><br>
              Sistema de Atendimento
            </div>
            <hr style="margin: 15px 0;">
            <div class="senha">${senhaGerada.senha}</div>
            <div class="prioridade ${senhaGerada.prioridade}">
              ${senhaGerada.prioridade.toUpperCase()}
            </div>
            <div class="paciente">${senhaGerada.pacienteNome}</div>
            <div class="data">
              Data: ${dataHora.split(' ')[0]}<br>
              Hora: ${dataHora.split(' ')[1]}
            </div>
            <hr style="margin: 15px 0;">
            <div class="footer">
              Por favor, aguarde sua senha ser chamada.<br>
              Obrigado pela preferência!
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    setShowImpressaoModal(false);
  };

  const chamarPaciente = () => {
    const atendimento = chamarProximoPaciente();
    if (atendimento) {
      const texto = `Senha ${atendimento.senha.replace('A', '')}. ${atendimento.pacienteNome}. Por favor, dirija-se à triagem.`;
      speak(texto);
      setMensagem({ 
        tipo: 'sucesso', 
        texto: `Chamando: ${atendimento.pacienteNome} - Senha ${atendimento.senha}` 
      });
      carregarDados();
      setTimeout(() => setMensagem(null), 5000);
    } else {
      setMensagem({ tipo: 'erro', texto: 'Nenhum paciente na fila de espera!' });
      setTimeout(() => setMensagem(null), 3000);
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return <Badge className="bg-red-500">Urgente</Badge>;
      case 'preferencial': return <Badge className="bg-yellow-500">Preferencial</Badge>;
      default: return <Badge className="bg-blue-500">Normal</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Posto de Saúde Central</h1>
                <p className="text-gray-600">Sistema de Atendimento - Recepção</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                <p className="text-lg font-semibold text-teal-600">Recepcionista</p>
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

        {/* Estatísticas */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Atendimentos Hoje</p>
                  <p className="text-2xl font-bold text-gray-800">{estatisticas.totalHoje}</p>
                </div>
                <Calendar className="w-8 h-8 text-teal-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Em Espera</p>
                  <p className="text-2xl font-bold text-blue-600">{estatisticas.emEspera}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Em Triagem</p>
                  <p className="text-2xl font-bold text-yellow-600">{estatisticas.emTriagem}</p>
                </div>
                <Users className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Em Consulta</p>
                  <p className="text-2xl font-bold text-purple-600">{estatisticas.emConsulta}</p>
                </div>
                <Stethoscope className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Finalizados</p>
                  <p className="text-2xl font-bold text-green-600">{estatisticas.finalizados}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-md">
            <TabsTrigger value="cadastro" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Cadastro de Pacientes
            </TabsTrigger>
            <TabsTrigger value="senha" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gerar Senha
            </TabsTrigger>
            <TabsTrigger value="fila" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Controle de Fila
            </TabsTrigger>
          </TabsList>

          {/* Cadastro de Pacientes */}
          <TabsContent value="cadastro">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  Cadastro de Novo Paciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={cadastrarPaciente} className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo *</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Digite o nome completo"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      placeholder="000.000.000-00"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <Input
                      id="dataNascimento"
                      name="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={handleInputChange}
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleInputChange}
                      placeholder="(00) 00000-0000"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@exemplo.com"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="convenio">Convênio</Label>
                    <Input
                      id="convenio"
                      name="convenio"
                      value={formData.convenio}
                      onChange={handleInputChange}
                      placeholder="Nome do convênio"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numeroCarteirinha">Número da Carteirinha</Label>
                    <Input
                      id="numeroCarteirinha"
                      name="numeroCarteirinha"
                      value={formData.numeroCarteirinha}
                      onChange={handleInputChange}
                      placeholder="Número da carteirinha"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleInputChange}
                      placeholder="Rua, número, bairro, cidade"
                      className="border-gray-300"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button type="submit" className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Cadastrar Paciente
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gerar Senha */}
          <TabsContent value="senha">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  Gerar Senha de Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="buscaCPF">Buscar por CPF</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="buscaCPF"
                          value={buscaCPF}
                          onChange={(e) => setBuscaCPF(e.target.value)}
                          placeholder="Digite o CPF do paciente"
                          className="border-gray-300"
                        />
                        <Button onClick={buscarPaciente} variant="outline">
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {pacienteEncontrado && (
                    <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                      <h3 className="font-semibold text-teal-800 mb-2">Paciente Encontrado</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="font-medium">Nome:</span> {pacienteEncontrado.nome}</p>
                        <p><span className="font-medium">CPF:</span> {pacienteEncontrado.cpf}</p>
                        <p><span className="font-medium">Telefone:</span> {pacienteEncontrado.telefone}</p>
                        <p><span className="font-medium">Convênio:</span> {pacienteEncontrado.convenio || 'Não informado'}</p>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <Label>Prioridade do Atendimento</Label>
                        <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="preferencial">Preferencial</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button onClick={gerarSenha} className="w-full mt-4 bg-gradient-to-r from-teal-500 to-cyan-600">
                        <FileText className="w-4 h-4 mr-2" />
                        Gerar Senha
                      </Button>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Últimos Pacientes Cadastrados</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {pacientes.slice(0, 10).map((paciente) => (
                        <div key={paciente.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{paciente.nome}</p>
                            <p className="text-sm text-gray-500">CPF: {paciente.cpf}</p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setBuscaCPF(paciente.cpf);
                              setPacienteEncontrado(paciente);
                            }}
                          >
                            Selecionar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Controle de Fila */}
          <TabsContent value="fila">
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Fila de Espera
                    </span>
                    <Badge className="bg-blue-500">{atendimentosEspera.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {atendimentosEspera.map((atendimento) => (
                      <div key={atendimento.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-700">{atendimento.senha}</span>
                            {getPrioridadeBadge(atendimento.prioridade)}
                          </div>
                          <p className="text-sm text-gray-700">{atendimento.pacienteNome}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(atendimento.dataHora).toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {atendimentosEspera.length === 0 && (
                      <p className="text-center text-gray-500 py-8">Nenhum paciente na fila</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-4">Chamar Próximo Paciente</h3>
                    <p className="text-teal-100 mb-6">
                      Clique no botão abaixo para chamar o próximo paciente da fila. 
                      O nome será anunciado automaticamente.
                    </p>
                    <Button 
                      onClick={chamarPaciente}
                      className="w-full bg-white text-teal-600 hover:bg-teal-50 font-semibold py-6"
                    >
                      <Bell className="w-5 h-5 mr-2" />
                      Chamar Próximo
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-yellow-600" />
                      Em Triagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {atendimentosTriagem.map((atendimento) => (
                        <div key={atendimento.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div>
                            <span className="text-lg font-bold text-yellow-700">{atendimento.senha}</span>
                            <p className="text-sm text-gray-700">{atendimento.pacienteNome}</p>
                          </div>
                          {getPrioridadeBadge(atendimento.prioridade)}
                        </div>
                      ))}
                      {atendimentosTriagem.length === 0 && (
                        <p className="text-center text-gray-500 py-4">Nenhum paciente em triagem</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Impressão de Senha */}
      <Dialog open={showImpressaoModal} onOpenChange={setShowImpressaoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Senha Gerada com Sucesso!
            </DialogTitle>
          </DialogHeader>
          {senhaGerada && (
            <div className="text-center py-6">
              <div className="border-4 border-teal-500 rounded-xl p-8 mb-6">
                <p className="text-sm text-gray-500 mb-2">SENHA</p>
                <p className="text-6xl font-bold text-teal-600">{senhaGerada.senha}</p>
                <div className="mt-4">
                  <Badge className={`text-lg px-4 py-1 ${
                    senhaGerada.prioridade === 'urgente' ? 'bg-red-500' : 
                    senhaGerada.prioridade === 'preferencial' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {senhaGerada.prioridade.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-4 font-semibold text-lg">{senhaGerada.pacienteNome}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {new Date().toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowImpressaoModal(false)} className="flex-1">
                  Fechar
                </Button>
                <Button onClick={imprimirSenha} className="flex-1 bg-teal-600">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Senha
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recepcionista;
