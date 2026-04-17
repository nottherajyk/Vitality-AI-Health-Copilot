import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface HealthConnectProps {
  onConnect: (connected: boolean) => void;
  onSyncWeight: (weight: number) => void;
  onSyncActivity: (calories: number) => void;
}

export default function HealthConnect({ onConnect, onSyncWeight, onSyncActivity }: HealthConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncData = async () => {
    setIsSyncing(true);
    try {
      // Sync Weight
      const weightResponse = await fetch('/api/google-fit/weight');
      if (weightResponse.ok) {
        const { weight } = await weightResponse.json();
        onSyncWeight(weight);
      }

      // Sync Activity
      const activityResponse = await fetch('/api/google-fit/activity');
      if (activityResponse.ok) {
        const { calories } = await activityResponse.json();
        onSyncActivity(calories);
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/auth/google-fit/status');
        if (response.ok) {
          const { connected } = await response.json();
          if (connected) {
            setIsConnected(true);
            onConnect(true);
            syncData();
          }
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
      }
    };
    checkStatus();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsConnected(true);
        onConnect(true);
        syncData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConnect]);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/google-fit/url');
      const { url } = await response.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 bg-white rounded-[48px] border border-[#5A5A40]/5 shadow-xl relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#5A5A40]/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className={`p-5 rounded-[24px] shadow-inner transition-all duration-700 ${
            isConnected ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f0] text-[#5A5A40]'
          }`}>
            <Activity size={32} className={isSyncing ? 'animate-pulse' : ''} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#5A5A40] tracking-tight">Google Fit</h3>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30 mt-1">
              {isConnected ? 'Biometric Data Synchronized' : 'Connect Health Ecosystem'}
            </p>
          </div>
        </div>
        
        {isConnected ? (
          <div className="flex items-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={syncData}
              disabled={isSyncing}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A5A40]/40 hover:text-[#5A5A40] transition-all flex items-center gap-2"
            >
              <motion.div animate={isSyncing ? { rotate: 360 } : {}} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                <Activity size={14} />
              </motion.div>
              Sync Now
            </motion.button>
            <div className="flex items-center gap-2.5 px-5 py-2.5 bg-green-50 rounded-full text-[10px] font-black text-green-600 uppercase tracking-widest border border-green-100 shadow-sm">
              <CheckCircle2 size={14} />
              Active
            </div>
          </div>
        ) : (
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleConnect}
            className="px-8 py-4 bg-[#5A5A40] text-white rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-[#5A5A40]/20 transition-all"
          >
            Authorize
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
