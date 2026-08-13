import { useId, useState } from 'react';
import api from '../lib/api';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUploadField({ value, onChange }: Props) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/api/upload', formData);
      onChange(res.data.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="font-utility text-xs font-medium uppercase tracking-wide text-stone">Image</label>
      <div className="mt-2 flex items-center gap-4">
        {value && <img src={value} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />}
        <div className="flex-1">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full rounded-xl border border-stone/20 px-4 py-2 font-body text-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald file:px-4 file:py-1.5 file:font-utility file:text-xs file:text-ivory hover:file:bg-emerald-deep"
            aria-describedby={error ? `${inputId}-error` : undefined}
          />
          {uploading && <p className="mt-1 font-body text-xs text-stone">Uploading…</p>}
          {error && <p id={`${inputId}-error`} className="mt-1 font-body text-xs text-red-600" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
