import { useState, useEffect } from 'react';
import { 
  Activity, 
  User, 
  Clock, 
  Heart, 
  Thermometer, 
  Scale, 
  Ruler, 
  AlertTriangle,
  Pill,
  Save,
  ArrowRight,
  Stethoscope,
  Home,
  Wind,
  Droplets,
  ActivitySquare,
  ClipboardList,
  Syringe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  getAtendimentosPorStatus, 
  getPacienteById,
  addTriagem,
  type Atendimento,
  type Paciente
} from '@/db/database';

interface TriagemProps {
  onVoltar?: () => void;
}

const TriagemPage = ({ onVoltar }: TriagemProps) => {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<Atendimento | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [mensagem, setMensagem] = useState<{tipo: 'sucesso' | 'erro', texto: string} | null>(null);
  
  // Form triagem - Sinais Vitais
  const [sinaisVitais, setSinaisVitais] = useState({
    pressaoArterial: '',
    temperatura: '',
    peso: '',
    altura: '',
    frequenciaCardiaca: '',
    frequenciaRespiratoria: '',
    saturacaoO2: '',
    glicemia: '',
  });

  // Form triagem - Avaliação Clínica
  const [avaliacaoClinica, setAvaliacaoClinica] = useState({
    sintomas: '',
    alergias: '',
    medicamentos: '',
    historicoDoencas: '',
    cirurgiasAnteriores: '',
    observacoes: '',
  });

  // Checkboxes para condições pré-existentes
  const [condicoes, setCondicoes] = useState({
    hipertensao: false,
    diabetes: false,
    asma: false,
    cardiopatia: false,
    epilepsia: false,
    gestante: false,
  });

  const [enfermeiro, setEnfermeiro] = useState('');

  useEffect(() => {
    carregarAtendimentos();
    const interval = setInterval(carregarAtendimentos, 3000);
    return () => clearInterval(interval);
  }, []);

  const carregarAtendimentos = () => {
    setAtendimentos(getAtendimentosPorStatus('triagem'));
  };

  const selecionarAtendimento = (atendimento: Atendimento) => {
    setAtendimentoSelecionado(atendimento);
    const pac = getPacienteById(atendimento.pacienteId);
    setPaciente(pac || null);
    
    // Resetar formulários
    setSinaisVitais({
      pressaoArterial: '',
      temperatura: '',
      peso: '',
      altura: '',
      frequenciaCardiaca: '',
      frequenciaRespiratoria: '',
      saturacaoO2: '',
      glicemia: '',
    });
    setAvaliacaoClinica({
      sintomas: '',
      alergias: '',
      medicamentos: '',
      historicoDoencas: '',
      cirurgiasAnteriores: '',
      observacoes: '',
    });
    setCondicoes({
      hipertensao: false,
      diabetes: false,
      asma: false,
      cardiopatia: false,
      epilepsia: false,
      gestante: false,
    });
    setEnfermeiro('');
  };

  const voltarParaLista = () => {
    setAtendimentoSelecionado(null);
    setPaciente(null);
  };

  const calcularIMC = () => {
    const peso = parseFloat(sinaisVitais.peso);
    const altura = parseFloat(sinaisVitais.altura);
    if (peso && altura) {
      const imc = peso / (altura * altura);
      return imc.toFixed(2);
    }
    return '';
  };

  const getClassificacaoIMC = (imc: number) => {
    if (imc < 18.5) return 'Abaixo do peso';
    if (imc < 25) return 'Peso normal';
    if (imc < 30) return 'Sobrepeso';
    if (imc < 35) return 'Obesidade Grau I';
    if (imc < 40) return 'Obesidade Grau II';
    return 'Obesidade Grau III';
  };

  const salvarTriagem = () => {
    if (!atendimentoSelecionado) return;
    
    if (!sinaisVitais.pressaoArterial || !sinaisVitais.temperatura) {
      setMensagem({ tipo: 'erro', texto: 'Pressão arterial e temperatura são obrigatórios!' });
      setTimeout(() => setMensagem(null), 3000);
      return;
    }

    const imc = calcularIMC();
    
    // Montar histórico de doenças
    const doencasSelecionadas = Object.entries(condicoes)
      .filter(([_, value]) => value)
      .map(([key, _]) => {
        const map: Record<string, string> = {
          hipertensao: 'Hipertensão Arterial',
          diabetes: 'Diabetes Mellitus',
          asma: 'Asma',
          cardiopatia: 'Cardiopatia',
          epilepsia: 'Epilepsia',
          gestante: 'Gestante',
        };
        return map[key];
      });

    const historicoCompleto = doencasSelecionadas.length > 0 
      ? `${doencasSelecionadas.join(', ')}${avaliacaoClinica.historicoDoencas ? '. ' + avaliacaoClinica.historicoDoencas : ''}`
      : avaliacaoClinica.historicoDoencas;
    
    addTriagem({
      atendimentoId: atendimentoSelecionado.id,
      pacienteId: atendimentoSelecionado.pacienteId,
      pressaoArterial: sinaisVitais.pressaoArterial,
      temperatura: sinaisVitais.temperatura,
      peso: sinaisVitais.peso,
      altura: sinaisVitais.altura,
      imc,
      frequenciaCardiaca: sinaisVitais.frequenciaCardiaca,
      frequenciaRespiratoria: sinaisVitais.frequenciaRespiratoria,
      saturacaoO2: sinaisVitais.saturacaoO2,
      glicemia: sinaisVitais.glicemia,
      sintomas: avaliacaoClinica.sintomas,
      alergias: avaliacaoClinica.alergias,
      medicamentos: avaliacaoClinica.medicamentos,
      historicoDoencas: historicoCompleto,
      cirurgiasAnteriores: avaliacaoClinica.cirurgiasAnteriores,
      observacoes: avaliacaoClinica.observacoes,
      enfermeiro,
    });

    setMensagem({ tipo: 'sucesso', texto: 'Triagem realizada com sucesso! Paciente encaminhado para consulta.' });
    voltarParaLista();
    carregarAtendimentos();
    setTimeout(() => setMensagem(null), 3000);
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return <Badge className="bg-red-500">Urgente</Badge>;
      case 'preferencial': return <Badge className="bg-yellow-500">Preferencial</Badge>;
      default: return <Badge className="bg-blue-500">Normal</Badge>;
    }
  };

  if (!atendimentoSelecionado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Triagem</h1>
                  <p className="text-gray-600">Avaliação de Pacientes</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</p>
                  <p className="text-lg font-semibold text-yellow-600">Enfermagem</p>
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
              <AlertTriangle className={`w-4 h-4 ${mensagem.tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'}`} />
              <AlertDescription className={mensagem.tipo === 'sucesso' ? 'text-green-800' : 'text-red-800'}>
                {mensagem.texto}
              </AlertDescription>
            </Alert>
          )}

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5 text-yellow-600" />
                  Pacientes Aguardando Triagem
                </span>
                <Badge className="bg-yellow-500">{atendimentos.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {atendimentos.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum paciente aguardando triagem</p>
                  <p className="text-gray-400">Os pacientes aparecerão aqui quando forem chamados</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {atendimentos.map((atendimento) => (
                    <div 
                      key={atendimento.id} 
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-yellow-300 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => selecionarAtendimento(atendimento)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-lg">{atendimento.pacienteNome}</p>
                            {getPrioridadeBadge(atendimento.prioridade)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Chamado às {new Date(atendimento.chamadoEm!).toLocaleTimeString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              Senha: {atendimento.senha}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button className="bg-yellow-500 hover:bg-yellow-600">
                        Realizar Triagem
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={voltarParaLista}>
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Triagem do Paciente</h1>
              <p className="text-gray-600">{paciente?.nome} - Senha: {atendimentoSelecionado.senha}</p>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        {mensagem && (
          <Alert className={`mb-4 ${mensagem.tipo === 'sucesso' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <AlertTriangle className={`w-4 h-4 ${mensagem.tipo === 'sucesso' ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription className={mensagem.tipo === 'sucesso' ? 'text-green-800' : 'text-red-800'}>
              {mensagem.texto}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Dados do Paciente */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-600" />
                Dados do Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{paciente?.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">CPF</p>
                  <p className="font-medium">{paciente?.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data de Nascimento</p>
                  <p className="font-medium">{paciente?.dataNascimento ? new Date(paciente.dataNascimento).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{paciente?.telefone || 'Não informado'}</p>
                </div>
              </div>
              {paciente?.convenio && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500">Convênio</p>
                  <p className="font-medium">{paciente.convenio}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sinais Vitais */}
          <Card className="shadow-lg col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-600" />
                Sinais Vitais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pressao" className="flex items-center gap-2 text-xs">
                    <Heart className="w-3 h-3 text-red-500" />
                    Pressão Arterial (mmHg) *
                  </Label>
                  <Input
                    id="pressao"
                    value={sinaisVitais.pressaoArterial}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, pressaoArterial: e.target.value})}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperatura" className="flex items-center gap-2 text-xs">
                    <Thermometer className="w-3 h-3 text-orange-500" />
                    Temperatura (°C) *
                  </Label>
                  <Input
                    id="temperatura"
                    value={sinaisVitais.temperatura}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, temperatura: e.target.value})}
                    placeholder="36.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequenciaCardiaca" className="flex items-center gap-2 text-xs">
                    <ActivitySquare className="w-3 h-3 text-pink-500" />
                    FC (bpm)
                  </Label>
                  <Input
                    id="frequenciaCardiaca"
                    value={sinaisVitais.frequenciaCardiaca}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, frequenciaCardiaca: e.target.value})}
                    placeholder="72"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequenciaRespiratoria" className="flex items-center gap-2 text-xs">
                    <Wind className="w-3 h-3 text-cyan-500" />
                    FR (rpm)
                  </Label>
                  <Input
                    id="frequenciaRespiratoria"
                    value={sinaisVitais.frequenciaRespiratoria}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, frequenciaRespiratoria: e.target.value})}
                    placeholder="16"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="peso" className="flex items-center gap-2 text-xs">
                    <Scale className="w-3 h-3 text-blue-500" />
                    Peso (kg)
                  </Label>
                  <Input
                    id="peso"
                    value={sinaisVitais.peso}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, peso: e.target.value})}
                    placeholder="70.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="altura" className="flex items-center gap-2 text-xs">
                    <Ruler className="w-3 h-3 text-green-500" />
                    Altura (m)
                  </Label>
                  <Input
                    id="altura"
                    value={sinaisVitais.altura}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, altura: e.target.value})}
                    placeholder="1.75"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="saturacao" className="flex items-center gap-2 text-xs">
                    <Droplets className="w-3 h-3 text-blue-400" />
                    SatO2 (%)
                  </Label>
                  <Input
                    id="saturacao"
                    value={sinaisVitais.saturacaoO2}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, saturacaoO2: e.target.value})}
                    placeholder="98"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="glicemia" className="flex items-center gap-2 text-xs">
                    <Syringe className="w-3 h-3 text-purple-500" />
                    Glicemia (mg/dL)
                  </Label>
                  <Input
                    id="glicemia"
                    value={sinaisVitais.glicemia}
                    onChange={(e) => setSinaisVitais({...sinaisVitais, glicemia: e.target.value})}
                    placeholder="90"
                  />
                </div>
              </div>
              
              {calcularIMC() && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">IMC:</span> {calcularIMC()}
                  </p>
                  <Badge className="bg-blue-500">{getClassificacaoIMC(parseFloat(calcularIMC()))}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Condições Pré-existentes */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Condições Pré-existentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hipertensao" 
                    checked={condicoes.hipertensao}
                    onCheckedChange={(checked) => setCondicoes({...condicoes, hipertensao: checked as boolean})}
                  />
                  <Label htmlFor="hipertensao" className="text-sm cursor-pointer">Hipertensão</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="diabetes" 
                    checked={condicoes.diabetes}
                    onCheckedChange={(checked) => setCondicoes({...condicoes, diabetes: checked as boolean})}
                  />
                  <Label htmlFor="diabetes" className="text-sm cursor-pointer">Diabetes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="asma" 
                    checked={condicoes.asma}
                    onCheckedChange={(checked) => setCondicoes({...condicoes, asma: checked as boolean})}
                  />
                  <Label htmlFor="asma" className="text-sm cursor-pointer">Asma</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="cardiopatia" 
                    checked={condicoes.cardiopatia}
                    onCheckedChange={(checked) => setCondicoes({...condicoes, cardiopatia: checked as boolean})}
                  />
                  <Label htmlFor="cardiopatia" className="text-sm cursor-pointer">Cardiopatia</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="epilepsia" 
                    checked={condicoes.epilepsia}
                    onCheckedChange={(checked) => setCondicoes({...condicoes, epilepsia: checked as boolean})}
                  />
                  <Label htmlFor="epilepsia" className="text-sm cursor-pointer">Epilepsia</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="gestante" 
                    checked={condicoes.gestante}
                    onCheckedChange={(checked) => setCondicoes({...condicoes, gestante: checked as boolean})}
                  />
                  <Label htmlFor="gestante" className="text-sm cursor-pointer">Gestante</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avaliação Clínica */}
          <Card className="shadow-lg col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                Avaliação Clínica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sintomas" className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    Sintomas / Queixa Principal
                  </Label>
                  <Textarea
                    id="sintomas"
                    value={avaliacaoClinica.sintomas}
                    onChange={(e) => setAvaliacaoClinica({...avaliacaoClinica, sintomas: e.target.value})}
                    placeholder="Descreva os sintomas relatados pelo paciente..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alergias" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Alergias
                  </Label>
                  <Textarea
                    id="alergias"
                    value={avaliacaoClinica.alergias}
                    onChange={(e) => setAvaliacaoClinica({...avaliacaoClinica, alergias: e.target.value})}
                    placeholder="Liste as alergias do paciente..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicamentos" className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-500" />
                    Medicamentos em Uso
                  </Label>
                  <Textarea
                    id="medicamentos"
                    value={avaliacaoClinica.medicamentos}
                    onChange={(e) => setAvaliacaoClinica({...avaliacaoClinica, medicamentos: e.target.value})}
                    placeholder="Liste os medicamentos que o paciente está tomando..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="historico" className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-gray-500" />
                    Outras Doenças / Histórico
                  </Label>
                  <Textarea
                    id="historico"
                    value={avaliacaoClinica.historicoDoencas}
                    onChange={(e) => setAvaliacaoClinica({...avaliacaoClinica, historicoDoencas: e.target.value})}
                    placeholder="Outras doenças ou informações relevantes..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cirurgias" className="flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-orange-500" />
                    Cirurgias Anteriores
                  </Label>
                  <Textarea
                    id="cirurgias"
                    value={avaliacaoClinica.cirurgiasAnteriores}
                    onChange={(e) => setAvaliacaoClinica({...avaliacaoClinica, cirurgiasAnteriores: e.target.value})}
                    placeholder="Cirurgias realizadas anteriormente..."
                    className="min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações Gerais</Label>
                  <Textarea
                    id="observacoes"
                    value={avaliacaoClinica.observacoes}
                    onChange={(e) => setAvaliacaoClinica({...avaliacaoClinica, observacoes: e.target.value})}
                    placeholder="Observações adicionais..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <Label htmlFor="enfermeiro">Nome do Profissional de Enfermagem *</Label>
                <Input
                  id="enfermeiro"
                  value={enfermeiro}
                  onChange={(e) => setEnfermeiro(e.target.value)}
                  placeholder="Digite seu nome completo"
                />
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={salvarTriagem}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-8 py-6 text-lg"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Triagem
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TriagemPage;
