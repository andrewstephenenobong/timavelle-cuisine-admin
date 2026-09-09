import { useId, useRef, useState } from 'react';
import api from '../lib/api';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif']);

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    if (response?.data?.error) return response.data.error;
  }
  return 'Upload failed. Check the file and try again.';
}

export default function ImageUploadField({ value, onChange }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setError('');
    input.value = '';
    if (!acceptedTypes.has(file.type.toLowerCase())) {
      setError('Unsupported image format. Use JPG, PNG, WebP, AVIF, HEIC, or HEIF.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image is too large. Choose an image up to 8 MB.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post<{ url?: string }>('/api/upload', formData);
      if (!response.data.url) throw new Error('The image service returned no URL.');
      onChange(response.data.url);
    } catch (uploadError) {
      setError(errorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-upload-field">
      <label htmlFor={inputId} className="font-utility text-xs font-medium uppercase tracking-wide text-stone">Image</label>
      <div className="mt-2 flex items-center gap-4">
        {value && <img src={value} alt="Selected gallery image preview" className="h-20 w-20 rounded-lg object-cover" />}
        <div className="flex-1">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif,image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full rounded-xl border border-stone/20 px-4 py-2 font-body text-sm file:mr-4 file:rounded-full file:border-0 file:bg-emerald file:px-4 file:py-1.5 file:font-utility file:text-xs file:text-ivory hover:file:bg-emerald-deep"
            aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ''}`}
          />
          <p id={`${inputId}-help`} className="mt-1 font-body text-xs text-stone">JPG, PNG, WebP, AVIF, HEIC, or HEIF · max 8 MB</p>
          {uploading && <p className="mt-1 font-body text-xs text-emerald" role="status">Uploading image securely…</p>}
          {error && <p id={`${inputId}-error`} className="mt-1 font-body text-xs text-red-600" role="alert">{error}</p>}
        </div>
      </div>
    </div>
  );
}
