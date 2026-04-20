import React, { useRef, useState } from 'react';
import { Camera, X, Loader2, Zap, Footprints, Flame, Bike, Upload, Image as ImageIcon, AlertCircle, CameraOff, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeFoodImage, FoodAnalysis } from '../services/geminiService';
import { MealType } from '../types';

interface FoodScannerProps {
  onScan: (analysis: FoodAnalysis, mealType: MealType, customImage?: string) => void;
  dailyGoal: number;
}

export default function FoodScanner({ onScan, dailyGoal }: FoodScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 21) return 'dinner';
    return 'snack';
  });
  const [error, setError] = useState<string | null>(null);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [showScannerOptions, setShowScannerOptions] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFriendlyErrorMessage = (error: any) => {
    const msg = error?.message?.toLowerCase() || "";
    if (msg.includes("api key")) return "AI service is currently unavailable. Please check configuration.";
    if (msg.includes("permission") || msg.includes("denied")) return "Camera access was denied. Please enable it in your browser settings.";
    if (msg.includes("identify") || msg.includes("food") || msg.includes("no food")) return "No food was detected in this image. Please try capturing your meal again.";
    if (msg.includes("network") || msg.includes("fetch")) return "Connection issue. Please check your internet and try again.";
    if (msg.includes("limit") || msg.includes("quota")) return "We've reached our daily analysis limit. Please try again later.";
    return "Oops! Something went wrong while analyzing your meal. Please try another photo.";
  };

  const startCamera = async () => {
    setError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(getFriendlyErrorMessage(err));
      setShowCamera(false);
    }
  };

  const triggerCaptureFeedback = () => {
    setIsFlashActive(true);
    setShowSuccessFeedback(true);
    setTimeout(() => setIsFlashActive(false), 150);
    setTimeout(() => setShowSuccessFeedback(false), 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      triggerCaptureFeedback();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedImage(base64);
        processImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (base64: string) => {
    setIsScanning(true);
    setError(null);
    setAnalysis(null); // Clear previous analysis
    try {
      const result = await analyzeFoodImage(base64, dailyGoal);
      
      // Check if the AI explicitly said no food was found or if calories are 0
      const isNoFood = !result || !result.foodName || 
                       result.foodName.toLowerCase().includes("no food") || 
                       result.foodName.toLowerCase().includes("unknown") ||
                       (result.calories === 0 && result.items.length === 0);

      if (isNoFood) {
        setError("No food detected. Please try capturing your meal again with better lighting or a clearer angle.");
        setCapturedImage(null);
        return;
      }
      
      setAnalysis(result);
    } catch (err) {
      console.error("Analysis failed:", err);
      setError(getFriendlyErrorMessage(err));
      setCapturedImage(null);
      setAnalysis(null);
    } finally {
      setIsScanning(false);
      stopCamera();
    }
  };

  const handleItemChange = (index: number, field: 'name' | 'weight', value: string | number) => {
    if (!analysis) return;
    const newItems = [...analysis.items];
    const item = newItems[index];

    if (field === 'weight') {
      const newWeight = Number(value) || 0;
      const oldWeight = item.weight || 1; // Avoid division by zero

      // Calculate new macros for the item based on weight ratio
      const ratio = newWeight / oldWeight;
      
      newItems[index] = {
        ...item,
        weight: newWeight,
        calories: Math.round(item.calories * ratio),
        protein: Math.round(item.protein * ratio * 10) / 10,
        carbs: Math.round(item.carbs * ratio * 10) / 10,
        fat: Math.round(item.fat * ratio * 10) / 10,
      };

      // Recalculate total macros for the entire analysis
      const totalCalories = newItems.reduce((sum, i) => sum + i.calories, 0);
      const totalProtein = Math.round(newItems.reduce((sum, i) => sum + i.protein, 0) * 10) / 10;
      const totalCarbs = Math.round(newItems.reduce((sum, i) => sum + i.carbs, 0) * 10) / 10;
      const totalFat = Math.round(newItems.reduce((sum, i) => sum + i.fat, 0) * 10) / 10;

      // Recalculate workout equivalents based on new total calories
      // We'll use the original calorie density for workouts
      const calorieRatio = totalCalories / (analysis.calories || 1);
      const newWorkoutEquivalent = {
        walkingMinutes: Math.round(analysis.workoutEquivalent.walkingMinutes * calorieRatio),
        runningMinutes: Math.round(analysis.workoutEquivalent.runningMinutes * calorieRatio),
        cyclingMinutes: Math.round(analysis.workoutEquivalent.cyclingMinutes * calorieRatio),
      };

      // Recalculate micronutrients based on calorie ratio
      const newMicronutrients = analysis.micronutrients ? {
        vitamins: analysis.micronutrients.vitamins.map(v => ({
          ...v,
          amount: Math.round(v.amount * calorieRatio * 100) / 100
        })),
        minerals: analysis.micronutrients.minerals.map(m => ({
          ...m,
          amount: Math.round(m.amount * calorieRatio * 100) / 100
        }))
      } : undefined;

      setAnalysis({
        ...analysis,
        items: newItems,
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        contributionPercentage: Math.round((totalCalories / dailyGoal) * 100),
        workoutEquivalent: newWorkoutEquivalent,
        micronutrients: newMicronutrients,
      });
    } else if (field === 'name') {
      newItems[index] = { ...item, name: value as string };
      setAnalysis({ ...analysis, items: newItems });
    }
  };

  const handleFoodNameChange = (name: string) => {
    if (!analysis) return;
    setAnalysis({ ...analysis, foodName: name });
  };

  const handleMacroChange = (field: 'calories' | 'protein' | 'carbs' | 'fat', value: number) => {
    if (!analysis) return;
    setAnalysis({ ...analysis, [field]: value });
  };

  const captureImage = async () => {
    if (videoRef.current && canvasRef.current) {
      triggerCaptureFeedback();

      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      
      const base64 = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(base64);
      processImage(base64);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const mealTypes: { value: MealType; label: string }[] = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' },
  ];

  return (
    <div className="relative">
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-6 bg-white border border-red-100 rounded-[32px] shadow-sm flex flex-col items-center text-center gap-4"
          >
            <div className="p-4 bg-red-50 rounded-full text-red-500">
              {error.includes("Camera") ? <CameraOff size={32} /> : <AlertCircle size={32} />}
            </div>
            <div>
              <h3 className="font-bold text-[#5A5A40] text-lg">
                {error.toLowerCase().includes("no food") ? "No Food Detected" : "Analysis Failed"}
              </h3>
              <p className="text-sm text-[#5A5A40]/60 mt-1 max-w-[250px]">{error}</p>
            </div>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => {
                  setError(null);
                  startCamera();
                }}
                className="flex-1 py-3 bg-[#5A5A40] text-white rounded-2xl text-sm font-bold transition-all hover:opacity-90"
              >
                {error.toLowerCase().includes("no food") ? "Recapture" : "Try Again"}
              </button>
              <button 
                onClick={() => setError(null)} 
                className="px-6 py-3 bg-[#f5f5f0] text-[#5A5A40] rounded-2xl text-sm font-bold transition-all hover:bg-[#5A5A40]/10"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showCamera && !analysis && !error && (
        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowScannerOptions(!showScannerOptions)}
            className="w-full p-5 sm:p-8 rounded-[28px] sm:rounded-[40px] bg-[#5A5A40] text-white flex items-center justify-between shadow-2xl hover:shadow-[#5A5A40]/20 transition-all group relative overflow-hidden"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"
            />
            <div className="flex items-center gap-3 sm:gap-6 relative z-10">
              <div className="p-3 sm:p-4 bg-white/10 rounded-[20px] sm:rounded-[24px] backdrop-blur-md">
                <Camera size={26} />
              </div>
              <div className="text-left">
                <div className="font-black text-lg sm:text-2xl tracking-tighter">Scan Your Meal</div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-black opacity-40 mt-1">AI-Powered Nutrition Analysis</div>
              </div>
            </div>
            <motion.div
              animate={{ rotate: showScannerOptions ? 90 : 0 }}
              className="p-3 bg-white/10 rounded-full relative z-10"
            >
              <ChevronRight size={24} />
            </motion.div>
          </motion.button>

          <AnimatePresence>
            {showScannerOptions && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="absolute top-full left-0 right-0 mt-4 sm:mt-6 z-20 bg-white rounded-[28px] sm:rounded-[48px] shadow-2xl border border-[#5A5A40]/5 overflow-hidden p-2 sm:p-3"
              >
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: '#f5f5f0' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowScannerOptions(false);
                    startCamera();
                  }}
                  className="w-full p-4 sm:p-6 flex items-center gap-3 sm:gap-5 rounded-[24px] sm:rounded-[32px] transition-all"
                >
                  <div className="p-3 sm:p-4 bg-[#5A5A40]/5 rounded-[16px] sm:rounded-[20px] text-[#5A5A40]">
                    <Camera size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-[#5A5A40] tracking-tight">Use Camera</div>
                    <div className="text-[10px] uppercase tracking-widest font-black opacity-30">Capture a fresh perspective</div>
                  </div>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: '#f5f5f0' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowScannerOptions(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full p-4 sm:p-6 flex items-center gap-3 sm:gap-5 rounded-[24px] sm:rounded-[32px] transition-all"
                >
                  <div className="p-3 sm:p-4 bg-[#5A5A40]/5 rounded-[16px] sm:rounded-[20px] text-[#5A5A40]">
                    <Upload size={24} />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-[#5A5A40] tracking-tight">Upload from Gallery</div>
                    <div className="text-[10px] uppercase tracking-widest font-black opacity-30">Select from your collection</div>
                  </div>
                </motion.button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black flex flex-col"
          >
            <div className="relative flex-1">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                <div className="w-full h-full border-2 border-white/50 rounded-3xl" />
              </div>
              
              <AnimatePresence>
                {isFlashActive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-white z-10"
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showSuccessFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.5 }}
                    className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                  >
                    <div className="bg-white/20 backdrop-blur-sm p-8 rounded-full border border-white/30">
                      <CheckCircle2 size={80} className="text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-8 bg-black flex justify-between items-center">
              <button onClick={stopCamera} className="text-white p-3 sm:p-4">
                <X size={28} />
              </button>
              <button 
                onClick={captureImage}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white p-1"
              >
                <div className="w-full h-full rounded-full bg-white" />
              </button>
              <div className="w-12 sm:w-16" />
            </div>
          </motion.div>
        )}

        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[120] bg-white/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 sm:p-12 text-center"
          >
            <div className="relative mb-12">
              {capturedImage && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  className="w-64 h-64 rounded-[56px] overflow-hidden border-8 border-white shadow-2xl relative"
                >
                  <img src={capturedImage} alt="Scanning" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#5A5A40]/5 to-[#5A5A40]/20" />
                  
                  {/* Scanning Line Animation */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-0 right-0 h-1.5 bg-white shadow-[0_0_25px_rgba(255,255,255,1)] z-10"
                  />
                </motion.div>
              )}
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-6 -right-6 bg-[#5A5A40] text-white p-5 rounded-[24px] shadow-2xl border-4 border-white"
              >
                <Loader2 size={32} className="animate-spin" />
              </motion.div>
            </div>
            
            <h2 className="text-3xl font-black text-[#5A5A40] tracking-tighter mb-2">Analyzing your plate</h2>
            <p className="text-[11px] uppercase tracking-[0.3em] font-black text-[#5A5A40]/30 max-w-xs leading-relaxed">Gemini is identifying ingredients and calculating metabolic impact.</p>
            
            <div className="mt-12 flex gap-3">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                  className="w-3 h-3 bg-[#5A5A40] rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}

        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] sm:rounded-[56px] p-5 sm:p-10 shadow-2xl border border-[#5A5A40]/5 font-sans relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#5A5A40]/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div className="flex gap-6">
                {capturedImage && (
                  <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={capturedImage} 
                    alt="Scanned food" 
                    className="w-24 h-24 rounded-[32px] object-cover border border-[#5A5A40]/5 shadow-xl"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div>
                  <input 
                    type="text" 
                    className="text-3xl font-black text-[#5A5A40] bg-transparent border-b-2 border-dashed border-[#5A5A40]/10 outline-none w-full tracking-tighter"
                    value={analysis.foodName}
                    onChange={(e) => handleFoodNameChange(e.target.value)}
                  />
                  <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#5A5A40]/30 mt-2">{analysis.description}</p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAnalysis(null)} 
                className="p-4 bg-[#f5f5f0] hover:bg-[#5A5A40]/5 rounded-full transition-all"
              >
                <X size={24} className="text-[#5A5A40]" />
              </motion.button>
            </div>

            <div className="mb-10 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-4 block ml-4">Meal Occasion</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mealTypes.map(type => (
                  <motion.button
                    key={type.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMealType(type.value)}
                    className={`py-4 px-2 rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all ${
                      mealType === type.value 
                        ? 'bg-[#5A5A40] text-white shadow-xl' 
                        : 'bg-[#f5f5f0] text-[#5A5A40] opacity-40 hover:opacity-100'
                    }`}
                  >
                    {type.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 relative z-10">
              <div className="text-center p-6 bg-[#f5f5f0] rounded-[32px] border border-[#5A5A40]/5 shadow-inner">
                <input 
                  type="number" 
                  className="text-2xl font-black text-[#5A5A40] bg-transparent w-full text-center outline-none tracking-tighter"
                  value={analysis.calories}
                  onChange={(e) => handleMacroChange('calories', parseInt(e.target.value) || 0)}
                />
                <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Kcal</div>
              </div>
              <div className="text-center p-6 bg-[#f5f5f0] rounded-[32px] border border-[#5A5A40]/5 shadow-inner">
                <div className="flex items-center justify-center">
                  <input 
                    type="number" 
                    className="text-2xl font-black text-[#5A5A40] bg-transparent w-full text-center outline-none tracking-tighter"
                    value={analysis.protein}
                    onChange={(e) => handleMacroChange('protein', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm font-black text-[#5A5A40]/30">g</span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Prot</div>
              </div>
              <div className="text-center p-6 bg-[#f5f5f0] rounded-[32px] border border-[#5A5A40]/5 shadow-inner">
                <div className="flex items-center justify-center">
                  <input 
                    type="number" 
                    className="text-2xl font-black text-[#5A5A40] bg-transparent w-full text-center outline-none tracking-tighter"
                    value={analysis.carbs}
                    onChange={(e) => handleMacroChange('carbs', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm font-black text-[#5A5A40]/30">g</span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Carb</div>
              </div>
              <div className="text-center p-6 bg-[#f5f5f0] rounded-[32px] border border-[#5A5A40]/5 shadow-inner">
                <div className="flex items-center justify-center">
                  <input 
                    type="number" 
                    className="text-2xl font-black text-[#5A5A40] bg-transparent w-full text-center outline-none tracking-tighter"
                    value={analysis.fat}
                    onChange={(e) => handleMacroChange('fat', parseInt(e.target.value) || 0)}
                  />
                  <span className="text-sm font-black text-[#5A5A40]/30">g</span>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest opacity-30 mt-1">Fat</div>
              </div>
            </div>

            <div className="mb-10 relative z-10">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-4 block ml-4">Detected Ingredients</label>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                {analysis.items.map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-3 items-center p-3 bg-[#f5f5f0]/50 rounded-[24px] border border-[#5A5A40]/5"
                  >
                    <input 
                      type="text" 
                      className="flex-1 text-sm font-black text-[#5A5A40] bg-transparent outline-none px-4"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                    />
                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-[18px] shadow-sm">
                      <input 
                        type="number" 
                        className="w-12 text-sm font-black text-[#5A5A40] bg-transparent outline-none text-right"
                        value={item.weight}
                        onChange={(e) => handleItemChange(idx, 'weight', parseInt(e.target.value) || 0)}
                      />
                      <span className="text-[10px] font-black text-[#5A5A40]/30 uppercase">g</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {analysis.micronutrients && (
              <div className="mb-10 p-8 bg-[#f5f5f0] rounded-[40px] border border-[#5A5A40]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={48} className="text-[#5A5A40]" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40 mb-6 flex items-center gap-3">
                  Micronutrient Profile
                </h3>
                <div className="space-y-8">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#5A5A40]/20 mb-3 ml-2">Vitamins</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.micronutrients.vitamins.map(v => (
                        <div key={v.name} className="flex flex-col bg-white px-4 py-3 rounded-[20px] border border-[#5A5A40]/5 shadow-sm min-w-[90px]">
                          <span className="text-[10px] font-black text-[#5A5A40]">{v.name}</span>
                          <span className="text-[9px] font-black text-[#5A5A40]/30 uppercase mt-0.5">{v.amount}{v.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-[0.2em] text-[#5A5A40]/20 mb-3 ml-2">Minerals</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.micronutrients.minerals.map(m => (
                        <div key={m.name} className="flex flex-col bg-white px-4 py-3 rounded-[20px] border border-[#5A5A40]/5 shadow-sm min-w-[90px]">
                          <span className="text-[10px] font-black text-[#5A5A40]">{m.name}</span>
                          <span className="text-[9px] font-black text-[#5A5A40]/30 uppercase mt-0.5">{m.amount}{m.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 mb-10">
              <div className="flex items-center gap-6 p-6 bg-white border border-[#5A5A40]/5 rounded-[32px] shadow-xl">
                <div className="p-4 bg-orange-50 rounded-[20px] text-orange-500">
                  <Zap size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5A5A40]/40 mb-2">Daily Goal Impact</div>
                  <div className="w-full h-3 bg-[#f5f5f0] rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(analysis.contributionPercentage, 100)}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                    />
                  </div>
                </div>
                <div className="text-xl font-black text-[#5A5A40]">{analysis.contributionPercentage}%</div>
              </div>

              <div className="p-8 bg-[#5A5A40]/5 rounded-[40px] border border-[#5A5A40]/5">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/30 mb-6 text-center">Metabolic Burn Requirements</div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#5A5A40]/5">
                      <Footprints size={24} className="text-[#5A5A40]" />
                    </div>
                    <span className="text-lg font-black text-[#5A5A40] tracking-tighter">{analysis.workoutEquivalent.walkingMinutes}m</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#5A5A40]/30">Walk</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#5A5A40]/5">
                      <Flame size={24} className="text-[#5A5A40]" />
                    </div>
                    <span className="text-lg font-black text-[#5A5A40] tracking-tighter">{analysis.workoutEquivalent.runningMinutes}m</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#5A5A40]/30">Run</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#5A5A40]/5">
                      <Bike size={24} className="text-[#5A5A40]" />
                    </div>
                    <span className="text-lg font-black text-[#5A5A40] tracking-tighter">{analysis.workoutEquivalent.cyclingMinutes}m</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#5A5A40]/30">Cycle</span>
                  </div>
                </div>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onScan(analysis, mealType, capturedImage || undefined);
                setAnalysis(null);
                setCapturedImage(null);
              }}
              className="w-full p-6 bg-[#5A5A40] text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:shadow-[#5A5A40]/20 transition-all"
            >
              Commit to Daily Log
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
