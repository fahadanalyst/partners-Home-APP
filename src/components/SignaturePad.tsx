import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from './Button';
import { RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  label?: string;
  initialValue?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, label = "Signature", initialValue }) => {
  const sigPad = useRef<SignatureCanvas>(null);
  const [preview, setPreview] = React.useState<string | null>(initialValue || null);

  React.useEffect(() => {
    if (initialValue && sigPad.current) {
      sigPad.current.fromDataURL(initialValue);
      setPreview(initialValue);
    }
  }, [initialValue]);

  const clear = () => {
    sigPad.current?.clear();
    setPreview(null);
    onSave('');
    console.log('Signature cleared');
  };

  const save = () => {
    if (!sigPad.current) return;
    
    if (sigPad.current.isEmpty()) {
      onSave('');
      setPreview(null);
    } else {
      try {
        const canvas = sigPad.current.getCanvas();
        if (canvas.width === 0 || canvas.height === 0) {
          console.warn('SignaturePad: Canvas has 0 dimensions, skipping save');
          return;
        }
        
        const dataUrl = sigPad.current.getTrimmedCanvas().toDataURL('image/png') || '';
        onSave(dataUrl);
        setPreview(dataUrl);
        console.log('Signature saved, length:', dataUrl.length);
      } catch (err) {
        console.error('SignaturePad: Error saving signature:', err);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700">{label}</label>
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 relative">
        <SignatureCanvas
          ref={sigPad}
          penColor="black"
          canvasProps={{
            className: "w-full h-40 cursor-crosshair",
            style: { width: '100%', height: '160px' }
          }}
          onEnd={save}
        />
        {preview && (
          <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-partners-green border border-partners-green/20 pointer-events-none">
            Captured
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-zinc-500 hover:text-zinc-700"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
};
