import { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  UserPlus, 
  Activity, 
  Monitor, 
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { initDB } from '@/db/database';
import Recepcionista from '@/sections/Recepcionista';
import Medico from '@/sections/Medico';
import Triagem from '@/sections/Triagem';
import TVChamada from '@/sections/TVChamada';

type InterfaceType = 'login' | 'recepcionista' | 'medico' | 'triagem' | 'tv';

function App() {
  const [interfaceAtual, setInterfaceAtual] = useState<InterfaceType>('login');
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    // Inicializar banco de dados
    initDB();
  }, []);

  const voltarParaLogin = () => {
    setInterfaceAtual('login');
  };

  const renderInterface = () => {
    switch (interfaceAtual) {
      case 'recepcionista':
        return <Recepcionista onVoltar={voltarParaLogin} />;
      case 'medico':
        return <Medico onVoltar={voltarParaLogin} />;
      case 'triagem':
        return <Triagem onVoltar={voltarParaLogin} />;
      case 'tv':
        return <TVChamada onVoltar={voltarParaLogin} />;
      default:
        return renderLogin();
    }
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm shadow-2xl">
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">Posto de Saúde Central</h1>
          <p className="text-xl text-white/80">Sistema Integrado de Atendimento</p>
        </div>

        {/* Cards de Acesso */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
            onClick={() => setInterfaceAtual('recepcionista')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Recepcionista</h3>
              <p className="text-sm text-white/70">Cadastro e fila</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
            onClick={() => setInterfaceAtual('triagem')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Triagem</h3>
              <p className="text-sm text-white/70">Avaliação de pacientes</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
            onClick={() => setInterfaceAtual('medico')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Médico</h3>
              <p className="text-sm text-white/70">Consulta e documentos</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all cursor-pointer group"
            onClick={() => setInterfaceAtual('tv')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">TV de Chamada</h3>
              <p className="text-sm text-white/70">Painel de senhas</p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-white/60 text-sm">
          <p>Sistema Hospitalar v1.0 - Desenvolvido para gestão de atendimento em consultório</p>
        </div>
      </div>
    </div>
  );

  // Menu de navegação para quando estiver logado
  const renderMenu = () => {
    if (interfaceAtual === 'login') return null;

    return (
      <>
        {/* Botão do menu */}
        <Button
          variant="outline"
          onClick={() => setMenuAberto(!menuAberto)}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg"
        >
          {menuAberto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {/* Menu lateral */}
        {menuAberto && (
          <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMenuAberto(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl p-6 pt-20">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Navegação</h2>
              
              <nav className="space-y-3">
                <button
                  onClick={() => { setInterfaceAtual('recepcionista'); setMenuAberto(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    interfaceAtual === 'recepcionista' ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <UserPlus className="w-5 h-5" />
                  Recepcionista
                </button>
                
                <button
                  onClick={() => { setInterfaceAtual('triagem'); setMenuAberto(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    interfaceAtual === 'triagem' ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Activity className="w-5 h-5" />
                  Triagem
                </button>
                
                <button
                  onClick={() => { setInterfaceAtual('medico'); setMenuAberto(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    interfaceAtual === 'medico' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Stethoscope className="w-5 h-5" />
                  Médico
                </button>
                
                <button
                  onClick={() => { setInterfaceAtual('tv'); setMenuAberto(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    interfaceAtual === 'tv' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  TV de Chamada
                </button>
              </nav>

              <div className="absolute bottom-6 left-6 right-6">
                <button
                  onClick={() => { setInterfaceAtual('login'); setMenuAberto(false); }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen">
      {renderMenu()}
      {renderInterface()}
    </div>
  );
}

export default App;
