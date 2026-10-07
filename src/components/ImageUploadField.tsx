import { useEffect, useId, useRef, useState } from 'react';
import api from '../lib/api';

interface Props { value: string; onChange: (url: string) => void; }

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
  const previewRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  async function uploadFile(file: File) {
    setError(''); setSuccess('');
    if (!acceptedTypes.has(file.type.toLowerCase())) { setError('Unsupported image format. Use JPG, PNG, WebP, AVIF, HEIC, or HEIF.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError('Image is too large. Choose an image up to 8 MB.'); return; }
    const temporaryUrl = URL.createObjectURL(file);
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = temporaryUrl;
    setLocalPreview(temporaryUrl);
    setUploading(true);
    try {
      const formData = new FormData(); formData.append('image', file);
      const response = await api.post<{ url?: string }>('/api/upload', formData);
      if (!response.data.url) throw new Error('The image service returned no URL.');
      onChange(response.data.url); setSuccess('Image uploaded. Save the record to publish this change.');
    } catch (uploadError) { setError(errorMessage(uploadError)); setLocalPreview(null); }
    finally { setUploading(false); }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void uploadFile(file);
  }

  return <div className="image-upload-field"><div className="image-upload-field__heading"><label htmlFor={inputId}>Product image <span>Optional</span></label>{value && <button type="button" onClick={() => { onChange(''); setLocalPreview(null); setSuccess('Image removed from this record. Save to confirm.'); }}>Remove image</button>}</div><div className={`image-upload-field__dropzone${dragging ? ' is-dragging' : ''}${uploading ? ' is-uploading' : ''}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files?.[0]; if (file) void uploadFile(file); }}><div className="image-upload-field__preview">{(localPreview || value) ? <img src={localPreview || value} alt="Selected product preview" /> : <span aria-hidden="true">IMG</span>}</div><div className="image-upload-field__copy"><strong>{uploading ? 'Uploading securely…' : value ? 'Image ready to use' : 'Drop an image here'}</strong><p>{uploading ? 'Keep this page open while the image is being processed.' : 'Drag and drop, or choose a file from your device.'}</p><label className="image-upload-field__choose" htmlFor={inputId}>{value ? 'Replace image' : 'Choose image'}</label><input ref={inputRef} id={inputId} type="file" accept=".jpg,.jpeg,.png,.webp,.avif,.heic,.heif,image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" onChange={handleFileChange} disabled={uploading} aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ''}`} /></div></div><p id={`${inputId}-help`} className="image-upload-field__help">JPG, PNG, WebP, AVIF, HEIC, or HEIF · max 8 MB</p>{uploading && <p className="image-upload-field__status" role="status">Uploading image securely…</p>}{success && <p className="image-upload-field__success" role="status">{success}</p>}{error && <p id={`${inputId}-error`} className="image-upload-field__error" role="alert">{error}</p>}</div>;
}
