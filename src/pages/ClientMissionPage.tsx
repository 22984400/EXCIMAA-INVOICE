import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCountry } from '../contexts/CountryContext';
import MissionTypeSelector from '../components/MissionTypeSelector';
import ClientMissionMatrix from '../components/ClientMissionMatrix';
import { useEffect } from 'react';

export default function ClientMissionPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams] = useSearchParams();
  const initialType = parseInt(searchParams.get('type') || '1', 10);
  const [missionTypeId, setMissionTypeId] = useState(initialType);
  const [clientName, setClientName] = useState('');
  const [clientCode, setClientCode] = useState('');

  useEffect(() => {
    async function load() {
      if (!clientId) return;
      const { data } = await supabase
        .from('clients')
        .select('name, client_code')
        .eq('id', clientId)
        .maybeSingle();
      if (data) {
        setClientName(data.name);
        setClientCode(data.client_code);
      }
    }
    load();
  }, [clientId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/missions"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            <ArrowLeft size={16} /> Retour
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{clientName}</h1>
            <p className="text-xs text-slate-400 font-mono">{clientCode}</p>
          </div>
        </div>
        <MissionTypeSelector selected={missionTypeId} onChange={setMissionTypeId} />
      </div>

      {clientId && (
        <ClientMissionMatrix clientId={clientId} missionTypeId={missionTypeId} />
      )}
    </div>
  );
}
