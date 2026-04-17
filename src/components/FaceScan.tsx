import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FaceScanResult } from '../types';
import { analyzeFaceScan } from '../services/geminiService';
import { Camera, RefreshCw, Loader2, Sparkles, Droplets, Moon, Info, CheckCircle2, History, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface FaceScanProps {
  logs: FaceScanResult[];
  onAddLog: (log: FaceScanResult) => void;
  onDeleteLog: (id: string) => void;
}

export default function FaceScan({ logs, onAddLog, onDeleteLog }: FaceScanProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FaceScanResult['analysis'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setError("Please allow camera access for the face scan.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  }, []);

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeFaceScan(capturedImage);
      setAnalysis(result.analysis);
      const newLog: FaceScanResult = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        imageUrl: capturedImage,
        analysis: result.analysis
      };
      onAddLog(newLog);
    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze face scan. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setError(null);
    setIsScanning(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12 pb-32 font-sans">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#5A5A40] tracking-tighter">Face Health Scan</h1>
          <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mt-1">AI-powered health indicators from your face.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowHistory(!showHistory)}
          className="p-5 bg-white text-[#5A5A40] rounded-[24px] shadow-xl border border-[#5A5A40]/5 hover:bg-[#f5f5f0] transition-all"
        >
          <History size={28} />
        </motion.button>
      </header>

      {!showHistory ? (
        <div className="space-y-12">
          {!isScanning && !capturedImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[48px] p-16 shadow-2xl border border-[#5A5A40]/5 flex flex-col items-center text-center space-y-10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              
              <div className="w-32 h-32 bg-[#f5f5f0] rounded-[40px] flex items-center justify-center text-[#5A5A40] shadow-inner group-hover:scale-110 transition-transform duration-700">
                <Camera size={48} />
              </div>
              <div className="space-y-4 relative z-10">
                <h2 className="text-3xl font-black text-[#5A5A40] tracking-tight">Ready for your scan?</h2>
                <p className="text-sm text-[#5A5A40]/50 max-w-xs mx-auto font-medium leading-relaxed">
                  Our AI analyzes skin health, fatigue, and hydration to provide personalized recommendations.
                </p>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCamera}
                className="px-12 py-6 bg-[#5A5A40] text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl shadow-[#5A5A40]/30 flex items-center gap-4 relative z-10"
              >
                <Camera size={24} />
                Start Health Scan
              </motion.button>
            </motion.div>
          )}

          {isScanning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-black rounded-[56px] overflow-hidden aspect-[3/4] max-w-md mx-auto shadow-2xl border-8 border-white"
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-4 border-dashed border-white/20 rounded-[48px] pointer-events-none m-10" />
              <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={stopCamera}
                  className="p-5 bg-white/10 backdrop-blur-xl text-white rounded-[24px] border border-white/20 hover:bg-white/20 transition-all font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={captureImage}
                  className="p-5 bg-white text-[#5A5A40] rounded-[24px] font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center gap-3"
                >
                  <Camera size={20} />
                  Capture
                </motion.button>
              </div>
            </motion.div>
          )}

          {capturedImage && !analysis && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-10"
            >
              <div className="relative bg-white rounded-[56px] overflow-hidden aspect-[3/4] max-w-md mx-auto shadow-2xl border-8 border-white group">
                <img src={capturedImage} alt="Captured face" className="w-full h-full object-cover" />
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-[#5A5A40]/60 backdrop-blur-xl flex flex-col items-center justify-center text-white space-y-6"
                    >
                      <div className="relative">
                        <Loader2 className="animate-spin text-white/40" size={64} />
                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-pulse" size={32} />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black tracking-tight">Analyzing Vitals</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-black mt-1">AI Processing...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {!isAnalyzing && (
                <div className="flex justify-center gap-6">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={reset}
                    className="px-10 py-5 bg-[#f5f5f0] text-[#5A5A40] rounded-[28px] font-black uppercase tracking-widest text-[10px] border border-[#5A5A40]/5"
                  >
                    Retake
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAnalyze}
                    className="px-10 py-5 bg-[#5A5A40] text-white rounded-[28px] font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-[#5A5A40]/30 flex items-center gap-3"
                  >
                    <Sparkles size={20} />
                    Run Analysis
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {analysis && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-10 rounded-[40px] border border-[#5A5A40]/5 shadow-xl flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500">
                  <div className="p-4 bg-[#f5f5f0] rounded-2xl text-[#5A5A40] mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles size={32} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mb-2">Skin Health</div>
                  <div className="text-lg font-black text-[#5A5A40] tracking-tight leading-tight">{analysis.skinHealth}</div>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-[#5A5A40]/5 shadow-xl flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500">
                  <div className="p-4 bg-purple-50 rounded-2xl text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                    <Moon size={32} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mb-2">Fatigue</div>
                  <div className={`text-lg font-black capitalize tracking-tight ${
                    analysis.fatigueLevel === 'high' ? 'text-red-500' :
                    analysis.fatigueLevel === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {analysis.fatigueLevel}
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[40px] border border-[#5A5A40]/5 shadow-xl flex flex-col items-center text-center group hover:shadow-2xl transition-all duration-500">
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                    <Droplets size={32} />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 mb-2">Hydration</div>
                  <div className="text-lg font-black text-[#5A5A40] tracking-tight leading-tight">{analysis.hydrationStatus}</div>
                </div>
              </div>

              <div className="bg-white rounded-[48px] p-12 shadow-2xl border border-[#5A5A40]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                
                <h3 className="text-2xl font-black text-[#5A5A40] mb-10 flex items-center gap-4 tracking-tight relative z-10">
                  <div className="p-3 bg-[#f5f5f0] rounded-2xl text-[#5A5A40]">
                    <Info size={24} />
                  </div>
                  Recommendations
                </h3>
                <div className="space-y-6 relative z-10">
                  {analysis.recommendations.map((rec, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-6 p-6 bg-[#f5f5f0]/50 rounded-[32px] border border-[#5A5A40]/5 group hover:bg-white hover:shadow-xl transition-all duration-500"
                    >
                      <div className="p-3 bg-white rounded-2xl text-green-500 shadow-sm group-hover:bg-green-500 group-hover:text-white transition-colors duration-500">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-sm text-[#5A5A40]/70 leading-relaxed font-medium pt-1">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={reset}
                className="w-full p-6 bg-[#5A5A40] text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4 shadow-2xl shadow-[#5A5A40]/30"
              >
                <RefreshCw size={24} />
                Start New Health Scan
              </motion.button>
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-red-50 text-red-600 rounded-[32px] text-xs text-center font-black uppercase tracking-widest border border-red-100"
            >
              {error}
            </motion.div>
          )}
        </div>
      ) : (
        <section className="space-y-8">
          <div className="flex items-center gap-4 ml-2">
            <div className="p-3 bg-[#f5f5f0] rounded-2xl text-[#5A5A40] shadow-sm">
              <History size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#5A5A40] tracking-tight">Scan History</h2>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30">Previous Insights</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[48px] border-2 border-dashed border-[#5A5A40]/10">
                <Camera size={48} className="mx-auto mb-4 text-[#5A5A40]/10" />
                <p className="text-[#5A5A40]/30 font-black uppercase tracking-widest text-xs">No previous scans found.</p>
              </div>
            ) : (
              logs.map((log, idx) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 bg-white rounded-[40px] border border-[#5A5A40]/5 flex items-center justify-between group shadow-sm hover:shadow-xl transition-all duration-500"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <img src={log.imageUrl} alt="Scan" className="w-20 h-20 rounded-[28px] object-cover border-4 border-[#f5f5f0] group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute -bottom-2 -right-2 p-1.5 bg-white rounded-full shadow-lg">
                        <CheckCircle2 size={12} className="text-green-500" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-black text-[#5A5A40] tracking-tight leading-tight">{log.analysis.skinHealth}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#5A5A40]/30 mt-1">{format(log.timestamp, 'MMMM do, h:mm a')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                      log.analysis.fatigueLevel === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                      log.analysis.fatigueLevel === 'medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                      'bg-green-50 text-green-600 border border-green-100'
                    }`}>
                      {log.analysis.fatigueLevel} Fatigue
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.2, rotate: 15 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => onDeleteLog(log.id)}
                      className="p-3 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-2xl"
                    >
                      <Trash2 size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowHistory(false)}
            className="w-full p-6 bg-[#f5f5f0] text-[#5A5A40] rounded-[32px] font-black uppercase tracking-[0.2em] text-sm border border-[#5A5A40]/5 mt-10"
          >
            Back to Scanner
          </motion.button>
        </section>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
