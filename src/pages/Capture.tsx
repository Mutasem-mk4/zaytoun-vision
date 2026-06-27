// ============================================================
// Capture — Video & File Upload Testing Interface
// ============================================================
// Handles live camera streaming, alignment targeting guides,
// file upload drag-and-drop, and dynamic pipeline status tracking.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnalysisStore } from '@/store/analysisStore';
import type { DemoScenario } from '@/types';
import { analyzeImage } from '@/services/api';
import LoadingOlive from '@/components/shared/LoadingOlive';

type TabMode = 'demo' | 'camera';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  }),
};

export default function Capture() {
  const [activeTab, setActiveTab] = useState<TabMode>('demo');
  const [sampleName, setSampleName] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const {
    demoScenarios,
    loadingState,
    loadingMessage,
    runDemoAnalysis,
    setResult,
    setLoadingState,
  } = useAnalysisStore();

  // Navigate to results when analysis completes
  useEffect(() => {
    if (loadingState === 'complete') {
      const timer = setTimeout(() => navigate('/results'), 400);
      return () => clearTimeout(timer);
    }
  }, [loadingState, navigate]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Start video stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', aspectRatio: 1.7777777778 },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setLoadingState('idle');
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  // Stop video stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Capture image frame from stream and run analysis
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();
        handleAnalysis(dataUrl, sampleName || 'Live Camera Capture');
      }
    }
  };

  // Process selected file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Drag Over & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFileUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle scenario select
  const handleScenarioClick = async (scenario: DemoScenario) => {
    await runDemoAnalysis(scenario);
  };

  // Main analysis wrapper
  const handleAnalysis = async (dataUrl: string, name?: string) => {
    setLoadingState('analyzing', 'Uploading sample to Azure...');
    try {
      const result = await analyzeImage(dataUrl, name || 'Live Sample');
      setResult(result);
    } catch (err) {
      console.error("Analysis failed:", err);
      setLoadingState('error', 'Analysis failed. Please check backend connection.');
    }
  };

  const isAnalyzing = loadingState === 'analyzing' || loadingState === 'capturing' || loadingState === 'uploading';

  const getStepStatus = (stepIndex: number) => {
    const msg = loadingMessage.toLowerCase();
    if (stepIndex === 1) {
      if (msg.includes('capturing')) return 'active';
      if (msg.includes('uploading') || msg.includes('analyzing') || msg.includes('computing') || msg.includes('complete')) return 'done';
      return 'active';
    }
    if (stepIndex === 2) {
      if (msg.includes('capturing')) return 'pending';
      if (msg.includes('uploading')) return 'active';
      if (msg.includes('analyzing') || msg.includes('computing') || msg.includes('complete')) return 'done';
      return 'pending';
    }
    if (stepIndex === 3) {
      if (msg.includes('capturing') || msg.includes('uploading')) return 'pending';
      if (msg.includes('analyzing')) return 'active';
      if (msg.includes('computing') || msg.includes('complete')) return 'done';
      return 'pending';
    }
    if (stepIndex === 4) {
      if (msg.includes('capturing') || msg.includes('uploading') || msg.includes('analyzing')) return 'pending';
      if (msg.includes('computing')) return 'active';
      if (msg.includes('complete')) return 'done';
      return 'pending';
    }
    return 'pending';
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-dark mb-2">
            Analyze Sample
          </h1>
        </motion.div>

        {/* Tab Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <div className="glass rounded-xl p-1.5 flex gap-1">
            {[
              { key: 'demo' as TabMode, label: 'Demo Mode', icon: '🎯' },
              { key: 'camera' as TabMode, label: 'Live Camera', icon: '📷' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-dark/60 hover:text-dark'
                }`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="capture-tab"
                    className="absolute inset-0 gradient-olive rounded-lg"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            /* Loading State */
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 max-w-md mx-auto"
            >
              {/* Spinner */}
              <div className="mb-8">
                <LoadingOlive
                  message={loadingMessage}
                  size={70}
                />
              </div>

              {/* Progress Checklist Card */}
              <div className="w-full glass rounded-2xl p-6 border border-white/20 shadow-elevated">
                <h4 className="font-display text-base font-bold text-primary border-b border-dark/5 pb-3 mb-4 text-center">
                  AI Olive Oil Quality Pipeline
                </h4>
                
                <div className="space-y-4">
                  {[
                    { id: 1, label: "Capture fluorescence signature" },
                    { id: 2, label: "Upload footprint to Azure Blob" },
                    { id: 3, label: "Run Custom Vision classification" },
                    { id: 4, label: "Evaluate EVOO quality scorecard" },
                  ].map((step) => {
                    const status = getStepStatus(step.id);
                    return (
                      <div key={step.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          {status === 'done' ? (
                            <span className="text-success text-base">✅</span>
                          ) : status === 'active' ? (
                            <div className="w-4 h-4 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                          ) : (
                            <span className="text-dark/20 text-base">⚪</span>
                          )}
                          <span className={`font-medium ${
                            status === 'done' 
                              ? 'text-dark/80 line-through' 
                              : status === 'active' 
                                ? 'text-primary font-bold animate-pulse' 
                                : 'text-dark/40'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          status === 'done'
                            ? 'bg-success/10 text-success'
                            : status === 'active'
                              ? 'bg-accent/15 text-accent-dark animate-pulse'
                              : 'bg-dark/5 text-dark/30'
                        }`}>
                          {status === 'done' 
                            ? 'Done' 
                            : status === 'active' 
                              ? 'Active' 
                              : 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'demo' ? (
            /* Demo Mode - Scenario Cards */
            <motion.div
              key="demo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-dark/50 mb-8"
              >
                Select a pre-loaded scenario to test the analysis pipeline
              </motion.p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {demoScenarios.map((scenario, index) => (
                  <motion.button
                    key={scenario.id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="show"
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleScenarioClick(scenario)}
                    className="relative glass rounded-2xl p-6 text-left group overflow-hidden cursor-pointer"
                  >
                    {/* Colored left border */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                      style={{ backgroundColor: scenario.thumbnailColor }}
                    />

                    {/* Icon */}
                    <motion.span
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      className="text-4xl block mb-4"
                    >
                      {scenario.icon}
                    </motion.span>

                    {/* Name */}
                    <h3 className="font-display text-lg font-bold text-dark mb-3 group-hover:text-primary transition-colors">
                      {scenario.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-dark/50 leading-relaxed mb-3">
                      {scenario.description}
                    </p>

                    {/* Status preview */}
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: scenario.thumbnailColor }}
                    >
                      Score: {scenario.result.purityScore}%
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Camera Mode */
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              {/* Sample Name Input */}
              <div className="glass rounded-xl p-4 mb-6">
                <label className="block text-xs font-semibold text-dark/60 uppercase tracking-wider mb-2">
                  Sample Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jerash Organic EVOO"
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  className="w-full bg-white/50 border border-dark/10 rounded-lg px-4 py-2.5 text-dark placeholder-dark/30 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Live Camera */}
                <div className="glass rounded-2xl p-6 text-center flex flex-col items-center justify-between min-h-[340px]">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display text-lg font-bold text-dark text-left">
                        📷 Live UV Camera
                      </h3>
                    </div>

                    <div className="relative aspect-video w-full bg-black/5 rounded-xl overflow-hidden mb-4 border border-dark/5 flex items-center justify-center">
                      {stream ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          {/* Scanner Alignment Overlay */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                            <div className="relative w-4/5 h-4/5 border border-dashed border-primary/30 rounded-lg flex items-center justify-center">
                              {/* Scanning line animation */}
                              <motion.div
                                animate={{ y: ['0%', '280%', '0%'] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent top-0"
                              />
                              
                              {/* Bounding corners */}
                              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-accent rounded-tl-sm" />
                              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-accent rounded-tr-sm" />
                              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-accent rounded-bl-sm" />
                              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-accent rounded-br-sm" />

                              {/* Target Crosshair */}
                              <div className="w-6 h-6 border border-accent/20 rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-accent/50 rounded-full animate-pulse" />
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-6 text-center">
                          <span className="text-4xl block mb-2">💡</span>
                          <p className="text-xs text-dark/50">
                            Place your olive oil sample in the UV light box and activate the camera feed.
                          </p>
                        </div>
                      )}
                      
                      {cameraError && (
                        <div className="absolute inset-0 bg-white/95 flex items-center justify-center p-4">
                          <p className="text-xs text-danger font-medium">{cameraError}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-full">
                    {stream ? (
                      <div className="flex gap-2">
                        <button
                          onClick={captureImage}
                          className="flex-1 py-3 rounded-xl gradient-olive text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
                        >
                          ⚡ Capture & Analyze
                        </button>
                        <button
                          onClick={stopCamera}
                          className="px-4 py-3 rounded-xl border border-dark/10 hover:bg-dark/5 text-dark transition-all"
                        >
                          Stop
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={startCamera}
                        className="w-full py-3 rounded-xl gradient-gold text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
                      >
                        🎥 Start Camera Feed
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. File Upload / Drag-and-Drop */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`glass rounded-2xl p-6 text-center flex flex-col items-center justify-between min-h-[340px] border-2 border-dashed transition-all ${
                    dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-dark/10 hover:border-primary/40'
                  }`}
                >
                  <div className="w-full flex flex-col items-center">
                    <div className="flex items-center justify-between mb-4 w-full">
                      <h3 className="font-display text-lg font-bold text-dark text-left">
                        📁 Upload Image File
                      </h3>
                    </div>

                    {uploadedFileUrl ? (
                      <div className="w-full flex flex-col items-center py-2">
                        <div className="relative aspect-video w-full max-h-36 bg-black/5 rounded-xl overflow-hidden mb-4 border border-dark/5 flex items-center justify-center">
                          <img
                            src={uploadedFileUrl}
                            alt="Sample preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={() => handleAnalysis(uploadedFileUrl)}
                            className="flex-1 py-2.5 rounded-xl gradient-olive text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                          >
                            ⚡ Run AI Analysis
                          </button>
                          <button
                            onClick={() => setUploadedFileUrl(null)}
                            className="px-4 py-2.5 rounded-xl border border-dark/10 hover:bg-dark/5 text-dark font-medium text-xs transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="py-10 flex flex-col items-center justify-center">
                        <span className="text-5xl mb-4 transition-transform block">📤</span>
                        <p className="text-sm font-medium text-dark/70 mb-1">
                          Drag and drop your sample image here
                        </p>
                        <p className="text-xs text-dark/40 mb-4">
                          Supports JPEG, PNG or BMP files under 4MB
                        </p>
                        
                        <label className="cursor-pointer px-4 py-2 bg-white hover:bg-dark/5 border border-dark/10 rounded-lg text-xs font-semibold text-dark/70 shadow-sm transition-all active:scale-95">
                          Browse Files
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="w-full bg-dark/5 rounded-xl p-3 text-left">
                    <p className="text-[10px] text-dark/50 leading-relaxed">
                      💡 <strong>Tip:</strong> Crop the image to focus on the oil bottle or vial, ensuring clear visibility under fluorescent/UV lighting for optimal Custom Vision accuracy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Purity Testing Guide Card */}
              <div className="mt-8 bg-white/40 backdrop-blur-md rounded-2xl border border-dark/5 overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setGuideOpen(!guideOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between font-display text-base font-bold text-primary hover:bg-dark/5 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span>💡</span>
                    <span>Spectroscopic Testing & Imaging Guide</span>
                  </span>
                  <span className="text-xs text-dark/40">{guideOpen ? '▲' : '▼'}</span>
                </button>

                <AnimatePresence>
                  {guideOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-dark/5 overflow-hidden"
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-dark/70 leading-relaxed">
                        {/* DOS */}
                        <div className="bg-success/5 border border-success/10 rounded-xl p-4">
                          <h5 className="font-semibold text-success mb-2 flex items-center gap-1.5">
                            <span>✅</span>
                            <span>Best Practices (Do\'s)</span>
                          </h5>
                          <ul className="space-y-1.5 list-disc list-inside">
                            <li>Align the sample vial/bottle in the center of the viewport guide.</li>
                            <li>Ensure the UV lamp (365nm) is directly illuminating the oil.</li>
                            <li>Crop or focus the image to capture only the bottle/vial content.</li>
                          </ul>
                        </div>

                        {/* DON'TS */}
                        <div className="bg-danger/5 border border-danger/10 rounded-xl p-4">
                          <h5 className="font-semibold text-danger mb-2 flex items-center gap-1.5">
                            <span>❌</span>
                            <span>Avoid These (Don\'ts)</span>
                          </h5>
                          <ul className="space-y-1.5 list-disc list-inside">
                            <li>Do not capture images under standard ambient room light.</li>
                            <li>Avoid high glare or direct overhead reflections on the glass bottle.</li>
                            <li>Do not use blurry, out-of-focus, or extremely low-resolution photos.</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hidden canvas for capturing video frames */}
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
