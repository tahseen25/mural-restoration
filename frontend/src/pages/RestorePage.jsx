// src/pages/RestorePage.jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { uploadImage, startRestoration, pollRestoration } from '@/services/api';

const DAMAGE_TYPES = [
  { value: 'auto',     label: 'Auto-detect' },
  { value: 'faded',    label: 'Faded' },
  { value: 'cracked',  label: 'Cracked' },
  { value: 'stained',  label: 'Stained' },
  { value: 'peeling',  label: 'Peeling' },
  { value: 'moisture', label: 'Moisture' },
  { value: 'flaking',  label: 'Flaking' },
];

const MODES = [
  { value: 'original',       label: 'Original size',     desc: 'Fast · Best for ≤1024px images' },
  { value: 'sliding_window', label: 'Sliding window',    desc: 'Slower · Better for large murals' },
];

const STEPS = ['Upload', 'Configure', 'Processing', 'Done'];

export default function RestorePage() {
  const navigate = useNavigate();
  const [step, setStep]      = useState(0); // 0=Upload 1=Config 2=Processing 3=Done
  const [file, setFile]      = useState(null);
  const [preview, setPreview]= useState(null);
  const [config, setConfig]  = useState({ damageType: 'auto', mode: 'original' });
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId]    = useState(null);
  const [error, setError]    = useState(null);

  const onDrop = useCallback(accepted => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep(1);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    onDropRejected: errs => {
      const msg = errs[0]?.errors[0]?.message || 'File rejected';
      toast.error(msg);
    },
  });

  const handleRestore = async () => {
    setStep(2);
    setError(null);
    setProgress(5);
    try {
      // 1. Upload
      const image = await uploadImage(file);
      setProgress(20);

      // 2. Start job
      const job = await startRestoration({
        imageId:    image._id,
        damageType: config.damageType,
        mode:       config.mode,
      });
      setJobId(job._id);
      setProgress(30);

      // 3. Poll
      const completed = await pollRestoration(job._id, j => {
        setProgress(30 + (j.progress ?? 0) * 0.65);
      });

      if (completed.status === 'failed') {
        throw new Error(completed.errorMessage || 'Restoration failed');
      }

      setProgress(100);
      setStep(3);
      toast.success('Restoration complete!');
    } catch (err) {
      setError(err.message);
      setStep(1);
      toast.error(err.message);
    }
  };

  return (
    <div className="page max-w-3xl">
      {/* ── Step indicator ────────────────────────── */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono
              ${i < step ? 'bg-sage text-cream' : i === step ? 'bg-ochre text-cream' : 'bg-ink/10 text-ink/30'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${i === step ? 'text-ink font-medium' : 'text-ink/40'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-ink/10" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 0: Upload ────────────────────────── */}
        {step === 0 && (
          <motion.div key="upload" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <h1 className="font-display text-2xl font-bold text-ink mb-2">Upload your mural</h1>
            <p className="text-ink/50 text-sm mb-6">JPG, PNG or WebP · Max 20 MB</p>

            <div {...getRootProps()}
              className={`border-2 border-dashed rounded-sm p-16 text-center cursor-pointer transition-all
                ${isDragActive
                  ? 'border-ochre bg-ochre/5'
                  : 'border-ink/20 hover:border-ochre/50 hover:bg-ochre/3'}`}>
              <input {...getInputProps()} />
              <div className="text-4xl mb-4 opacity-30">↑</div>
              <p className="font-medium text-ink mb-1">
                {isDragActive ? 'Drop it here' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-sm text-ink/40">Supported: JPEG, PNG, WebP</p>
            </div>
          </motion.div>
        )}

        {/* ── Step 1: Configure ─────────────────────── */}
        {step === 1 && (
          <motion.div key="config" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Preview */}
              <div>
                <p className="section-label mb-3">Preview</p>
                <div className="aspect-square rounded-sm overflow-hidden bg-ink/5 relative">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  <button onClick={() => { setFile(null); setPreview(null); setStep(0); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-ink/70 text-cream rounded-full
                               flex items-center justify-center text-xs hover:bg-ink transition-colors">
                    ✕
                  </button>
                </div>
                <p className="text-xs text-ink/40 mt-2 font-mono truncate">{file?.name}</p>
              </div>

              {/* Config */}
              <div className="space-y-6">
                <div>
                  <p className="section-label mb-3">Damage type</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DAMAGE_TYPES.map(d => (
                      <button key={d.value} onClick={() => setConfig(p => ({...p, damageType: d.value}))}
                        className={`px-3 py-2 rounded-sm text-sm text-left transition-all border
                          ${config.damageType === d.value
                            ? 'border-ochre bg-ochre/10 text-ochre-700'
                            : 'border-ink/15 text-ink/60 hover:border-ink/30'}`}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="section-label mb-3">Restoration mode</p>
                  <div className="space-y-2">
                    {MODES.map(m => (
                      <button key={m.value} onClick={() => setConfig(p => ({...p, mode: m.value}))}
                        className={`w-full px-4 py-3 rounded-sm text-left transition-all border
                          ${config.mode === m.value
                            ? 'border-ochre bg-ochre/10'
                            : 'border-ink/15 hover:border-ink/30'}`}>
                        <p className={`text-sm font-medium ${config.mode===m.value?'text-ochre-700':'text-ink'}`}>
                          {m.label}
                        </p>
                        <p className="text-xs text-ink/40 mt-0.5">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="px-4 py-3 bg-clay/10 border border-clay/20 rounded-sm text-sm text-clay">
                    {error}
                  </div>
                )}

                <button onClick={handleRestore} className="btn-primary w-full py-3">
                  Start restoration →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Processing ────────────────────── */}
        {step === 2 && (
          <motion.div key="processing" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="text-center py-20">
            <div className="w-16 h-16 rounded-full border-4 border-ochre/20 border-t-ochre
                            animate-spin mx-auto mb-6" />
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Restoring your mural</h2>
            <p className="text-ink/50 text-sm mb-6">This may take 1–3 minutes…</p>

            {/* Progress bar */}
            <div className="w-64 mx-auto">
              <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-ochre rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-ink/30 font-mono mt-2">{Math.round(progress)}%</p>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Done ──────────────────────────── */}
        {step === 3 && (
          <motion.div key="done" initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}}
            className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-sage">✓</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Restoration complete!</h2>
            <p className="text-ink/50 text-sm mb-8">Your mural has been restored successfully.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate(`/history/${jobId}`)} className="btn-primary">
                View result
              </button>
              <button onClick={() => { setStep(0); setFile(null); setPreview(null); setJobId(null); }}
                className="btn-secondary">
                Restore another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
