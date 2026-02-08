import React, { useContext, useEffect, useRef, useState } from 'react';
import { Activity, Terminal } from 'lucide-react';
import { AppContext } from '../context/AppContext';

interface ConsolePanelProps {
  height?: number;
  onHeightChange?: (height: number) => void;
}

const commandsHelp: Record<string, { desc: string; usage: string; details: string }> = {
  help: {
    desc: 'Справка',
    usage: 'help [команда]',
    details: 'Выводит список команд или подробную справку по указанной команде.'
  },
  status: {
    desc: 'Статус дрона',
    usage: 'status',
    details: 'Показывает текущее состояние подключения, режим полета и напряжение батареи.'
  },
  clear: {
    desc: 'Очистка консоли',
    usage: 'clear (или cls)',
    details: 'Очищает лог сообщений консоли.'
  },
  cls: {
    desc: 'Очистка консоли',
    usage: 'cls (см. clear)',
    details: 'Алиас для команды clear.'
  },
  connect: {
    desc: 'Подключение',
    usage: 'connect',
    details: 'Пытается установить соединение с дроном по заданному IP.'
  },
  disconnect: {
    desc: 'Отключение',
    usage: 'disconnect',
    details: 'Принудительно разрывает соединение с дроном.'
  },
  arm: {
    desc: 'Включить моторы',
    usage: 'arm',
    details: 'Арминг (запуск моторов). Требует подтверждения готовности.'
  },
  disarm: {
    desc: 'Выключить моторы',
    usage: 'disarm',
    details: 'Дизарминг (остановка моторов). Работает всегда.'
  },
  land: {
    desc: 'Посадка',
    usage: 'land (или l)',
    details: 'Команда на посадку в текущем месте.'
  },
  l: {
    desc: 'Посадка',
    usage: 'l (см. land)',
    details: 'Алиас для команды land.'
  }
};

const ConsolePanel = ({ height, onHeightChange }: ConsolePanelProps) => {
  const context = useContext(AppContext);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [command, setCommand] = useState('');
  const [fontSize, setFontSize] = useState(12);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const isDark = context?.state.darkMode;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !onHeightChange) return;
      const delta = startYRef.current - e.clientY;
      const newHeight = Math.max(150, Math.min(450, startHeightRef.current + delta));
      onHeightChange(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onHeightChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!onHeightChange) return;
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = height || 220;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [context?.state.logs]);

  const apiBase = 'http://localhost:8000';

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = command.trim();
    if (!rawCmd) return;
    
    context?.addLog('COMMAND', rawCmd);
    setCommand('');

    const parts = rawCmd.split(/\s+/);
    const mainCmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (mainCmd === 'help') {
      if (args.length > 0) {
        const target = args[0].toLowerCase();
        const info = commandsHelp[target];
        if (info) {
          context?.addLog('INFO', `Справка по "${target}":`);
          context?.addLog('INFO', `  ${info.details}`);
          context?.addLog('INFO', `  Использование: ${info.usage}`);
        } else {
          context?.addLog('WARN', `Команда "${target}" не найдена.`);
        }
      } else {
        context?.addLog('INFO', 'Доступные команды:');
        Object.entries(commandsHelp).forEach(([key, val]) => {
          context?.addLog('INFO', `  ${key.padEnd(12)} - ${val.desc}`);
        });
        context?.addLog('INFO', 'Введите "help <команда>" для подробностей.');
      }
    } else if (mainCmd === 'status') {
      const result = await context?.refreshStatus();
      if (!result) {
        context?.addLog('WARN', 'Не удалось получить статус');
      } else {
        const statusText = result.connected ? 'CONNECTED' : 'DISCONNECTED';
        const apState = result.autopilotState || 'UNKNOWN';
        const voltageText = result.connected && result.voltage !== null ? result.voltage.toFixed(2) : '0.00';
        context?.addLog('INFO', `БПЛА: ${statusText} [${apState}], Питание: ${voltageText}V`);
      }
    } else if (mainCmd === 'clear' || mainCmd === 'cls') {
      context?.clearLogs();
    } else if (mainCmd === 'connect') {
      const result = await context?.connect();
      if (result?.connected) {
        context?.addLog('INFO', 'Принудительное подключение к дрону выполнено');
      } else {
        const detail = result?.error ?? 'Подключение инициировано, но подтверждение не получено. Проверьте статус позже.';
        context?.addLog('ERROR', `Ошибка подключения: ${detail}`);
      }
    } else if (mainCmd === 'disconnect') {
      await context?.disconnect();
      context?.addLog('INFO', 'Отключено от дрона');
    } else if (mainCmd === 'land' || mainCmd === 'l') {
        await context?.land();
    } else if (mainCmd === 'arm' || mainCmd === 'disarm') {
      try {
        const response = await fetch(`${apiBase}/api/${mainCmd}`, { method: 'POST' });
        if (!response.ok) {
          const data = await response.json().catch(() => null);
          const detail = data?.detail ?? response.statusText;
          context?.addLog('ERROR', `Ошибка команды ${mainCmd}: ${detail}`);
        } else {
          context?.addLog('INFO', `Команда ${mainCmd} выполнена`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        context?.addLog('WARN', `Команда ${mainCmd} не отправлена: ${message}`);
      }
    } else {
      context?.addLog('WARN', `Неизвестная команда: "${mainCmd}". Введите "help" для списка.`);
    }

  };

  return (
    <div className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white'} border-2 border-black rounded-[18px] p-4 h-full flex flex-col shadow-sm relative`}>
      {onHeightChange && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 cursor-ns-resize flex items-center justify-center hover:scale-110 transition-transform"
          title="Потяните, чтобы изменить размер"
        >
          <div className={`w-8 h-1.5 rounded-full border border-black/20 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`} />
        </div>
      )}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
          <Activity size={16} /> Консоль Pioneer
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold opacity-50 uppercase">Размер шрифта:</span>
          <input
            type="range"
            min="12"
            max="48"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-20 accent-yellow-400 h-1"
          />
          <span className="text-[10px] font-bold w-4">{fontSize}</span>
        </div>
      </div>
      <div ref={scrollRef} className={`flex-1 overflow-y-auto font-mono rounded-t-lg p-3 border-x border-t ${isDark ? 'bg-black border-zinc-700' : 'bg-gray-50 border-gray-200'} scroll-smooth`} style={{ fontSize: `${fontSize}px` }}>
        {context?.state.logs.map((log) => (
          <div key={log.id} className="mb-1 border-b border-white/5 last:border-0 pb-1">
            <span className="opacity-40">[{log.timestamp.split('T')[1].split('.')[0]}]</span>{' '}
            <span className={
              log.level === 'ERROR' ? 'text-red-500 font-bold' :
              log.level === 'WARN' ? 'text-yellow-600 font-bold' :
              log.level === 'COMMAND' ? 'text-green-400 font-bold' : 'text-blue-400 font-bold'
            }>
              [{log.level}]
            </span>{' '}
            <span>
              {log.level === 'COMMAND' && '> '}{log.message}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendCommand} className={`flex items-center gap-2 p-2 border border-black/10 rounded-b-lg ${isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
        <Terminal size={14} className="opacity-40" />
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="Введите команду..."
          className="flex-1 bg-transparent outline-none text-[12px] font-mono py-1"
        />
        <button type="submit" className="text-[10px] font-black uppercase bg-yellow-400 px-3 py-1 rounded border border-black active:translate-y-0.5 transition-transform">
          Отправить
        </button>
      </form>
    </div>
  );
};

export default ConsolePanel;
