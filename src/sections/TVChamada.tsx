import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, User, Clock, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getAtendimentosPorStatus, 
  type Atendimento 
} from '@/db/database';

interface TVChamadaProps {
  onVoltar?: () => void;
}

const TVChamada = ({ onVoltar }: TVChamadaProps) => {
  const [atendimentosEspera, setAtendimentosEspera] = useState<Atendimento[]>([]);
  const [atendimentosTriagem, setAtendimentosTriagem] = useState<Atendimento[]>([]);
  const [atendimentosConsulta, setAtendimentosConsulta] = useState<Atendimento[]>([]);
  const [ultimoChamado, setUltimoChamado] = useState<Atendimento | null>(null);
  const [horaAtual, setHoraAtual] = useState(new Date());
  const [somAtivado, setSomAtivado] = useState(true);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const ultimoChamadoRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
    
    carregarDados();
    const interval = setInterval(() => {
      carregarDados();
      setHoraAtual(new Date());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const carregarDados = () => {
    const espera = getAtendimentosPorStatus('espera');
    const triagem = getAtendimentosPorStatus('triagem');
    const consulta = getAtendimentosPorStatus('consulta');
    
    setAtendimentosEspera(espera);
    setAtendimentosTriagem(triagem);
    setAtendimentosConsulta(consulta);

    // Verificar se há novo chamado
    const todosAtendimentos = [...espera, ...triagem, ...consulta];
    const chamadosRecentes = todosAtendimentos
      .filter(a => a.chamadoEm)
      .sort((a, b) => new Date(b.chamadoEm!).getTime() - new Date(a.chamadoEm!).getTime());
    
    if (chamadosRecentes.length > 0) {
      const maisRecente = chamadosRecentes[0];
      if (maisRecente.id !== ultimoChamadoRef.current && somAtivado) {
        ultimoChamadoRef.current = maisRecente.id;
        setUltimoChamado(maisRecente);
        anunciarPaciente(maisRecente);
      }
    }
  };

  const anunciarPaciente = (atendimento: Atendimento) => {
    if (!synthRef.current || !somAtivado) return;
    
    synthRef.current.cancel();
    
    const numeroSenha = atendimento.senha.replace('A', '');
    const texto = `Atenção! Senha ${numeroSenha}. ${atendimento.pacienteNome}. Por favor, dirija-se à ${atendimento.status === 'triagem' ? 'triagem' : 'sala de consulta'}.`;
    
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    const voices = synthRef.current.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    
    synthRef.current.speak(utterance);
  };

  const getPrioridadeCor = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return 'bg-red-500 text-white';
      case 'preferencial': return 'bg-yellow-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Posto de Saúde Central
            </h1>
            <p className="text-slate-400 text-lg">Sistema de Chamada de Pacientes</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Button
            variant="outline"
            onClick={() => setSomAtivado(!somAtivado)}
            className={`border-slate-600 ${somAtivado ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}
          >
            {somAtivado ? <Volume2 className="w-5 h-5 mr-2" /> : <VolumeX className="w-5 h-5 mr-2" />}
            {somAtivado ? 'Som Ativado' : 'Som Desativado'}
          </Button>
          {onVoltar && (
            <Button variant="outline" onClick={onVoltar} className="border-slate-600 text-white hover:bg-slate-700">
              <Home className="w-5 h-5 mr-2" />
              Tela Principal
            </Button>
          )}
          <div className="text-right">
            <p className="text-5xl font-bold text-teal-400">
              {horaAtual.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-slate-400 text-lg">
              {horaAtual.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {/* Último Chamado */}
      {ultimoChamado && (
        <div className="mb-8 animate-pulse">
          <Card className="bg-gradient-to-r from-teal-500 to-cyan-600 border-0 shadow-2xl shadow-teal-500/30">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Volume2 className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <p className="text-teal-100 text-xl uppercase tracking-wider">Último Chamado</p>
                    <p className="text-6xl font-bold text-white mb-2">
                      Senha {ultimoChamado.senha}
                    </p>
                    <p className="text-3xl text-white/90">{ultimoChamado.pacienteNome}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-6 py-3 rounded-full text-xl font-bold ${getPrioridadeCor(ultimoChamado.prioridade)}`}>
                    {ultimoChamado.status === 'triagem' ? 'TRIAGEM' : 'CONSULTA'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filas */}
      <div className="grid grid-cols-3 gap-6">
        {/* Fila de Espera */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Em Espera
              </h2>
              <span className="text-3xl font-bold text-blue-400">{atendimentosEspera.length}</span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {atendimentosEspera.slice(0, 8).map((atendimento) => (
                <div 
                  key={atendimento.id} 
                  className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-blue-400">{atendimento.senha}</span>
                    <div>
                      <p className="font-medium text-white">{atendimento.pacienteNome}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(atendimento.dataHora).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getPrioridadeCor(atendimento.prioridade)}`}>
                    {atendimento.prioridade.charAt(0).toUpperCase()}
                  </div>
                </div>
              ))}
              {atendimentosEspera.length === 0 && (
                <p className="text-center text-slate-500 py-8">Nenhum paciente na fila</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Em Triagem */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <User className="w-6 h-6" />
                Em Triagem
              </h2>
              <span className="text-3xl font-bold text-yellow-400">{atendimentosTriagem.length}</span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {atendimentosTriagem.map((atendimento) => (
                <div 
                  key={atendimento.id} 
                  className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-yellow-400">{atendimento.senha}</span>
                    <div>
                      <p className="font-medium text-white">{atendimento.pacienteNome}</p>
                      <p className="text-sm text-yellow-400/70">
                        Chamado às {new Date(atendimento.chamadoEm!).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="animate-pulse w-3 h-3 bg-yellow-400 rounded-full" />
                </div>
              ))}
              {atendimentosTriagem.length === 0 && (
                <p className="text-center text-slate-500 py-8">Nenhum paciente em triagem</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Em Consulta */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Em Consulta
              </h2>
              <span className="text-3xl font-bold text-green-400">{atendimentosConsulta.length}</span>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {atendimentosConsulta.map((atendimento) => (
                <div 
                  key={atendimento.id} 
                  className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-green-400">{atendimento.senha}</span>
                    <div>
                      <p className="font-medium text-white">{atendimento.pacienteNome}</p>
                      <p className="text-sm text-green-400/70">Em atendimento médico</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
              ))}
              {atendimentosConsulta.length === 0 && (
                <p className="text-center text-slate-500 py-8">Nenhum paciente em consulta</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-lg">
          Por favor, aguarde sua senha ser chamada. Obrigado pela paciência!
        </p>
      </div>
    </div>
  );
};

export default TVChamada;
