import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from 'lucide-react';

interface Props {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  maxSizeMb?: number;
  disabled?: boolean;
}

export const ImageUploader: React.FC<Props> = ({
  selectedFile,
  onFileSelect,
  maxSizeMb = 10,
  disabled = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const handleFile = (file: File) => {
    setError(null);

    // Validate type
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP photograph.');
      return;
    }

    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File size exceeds maximum permitted limit of ${maxSizeMb} MB.`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-3">
      {previewUrl && selectedFile ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-sm max-h-80 flex items-center justify-center">
          <img
            src={previewUrl}
            alt="Preview of civic issue"
            className="w-full h-72 object-contain rounded-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <div className="truncate pr-4">
              <p className="font-semibold truncate">{selectedFile.name}</p>
              <p className="text-slate-300">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              >
                <X className="w-4 h-4" /> Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-civic-500 bg-civic-50/50'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleChange}
            disabled={disabled}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-civic-50 text-civic-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-900 mb-1">
            Click to upload or drag & drop photograph
          </p>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Upload clear evidence of the civic problem (road damage, overflowing garbage, broken lamp, leak). JPEG, PNG or WebP up to {maxSizeMb}MB.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-rose-600 text-xs font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
