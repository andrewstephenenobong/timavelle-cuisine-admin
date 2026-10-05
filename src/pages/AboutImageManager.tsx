/* Timavelle "The House" image studio: protected replacement with explicit draft/save/publish control. */
import { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmDialog from '../components/ConfirmDialog';
import ImageUploadField from '../components/ImageUploadField';
import api from '../lib/api';
import { PUBLIC_SITE_URL } from '../lib/site';
import './about-image-manager.css';

type AboutDraft = { imageUrl: string; altText: string; published?: { imageUrl?: string; altText?: string; publishedAt?: string } | null };
const FALLBACK_IMAGE = '/images/About/image.png';
const FALLBACK_ALT = 'Timavelle Cuisine — plated dish';

function errorMessage(error: unknown) { return axios.isAxiosError(error) ? error.response?.data?.error || error.message : 'The request could not be completed.'; }
function previewUrl(url: string) { return url.startsWith('/') ? `${PUBLIC_SITE_URL}${url}` : url; }

export default function AboutImageManager() {
  const [draft, setDraft] = useState<AboutDraft>({ imageUrl: FALLBACK_IMAGE, altText: FALLBACK_ALT });
  const [editing, setEditing] = useState<AboutDraft>(draft);
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('Connecting to the content API…');
  const [error, setError] = useState('');
  const [pendingReset, setPendingReset] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadAboutImage() {
      setIsBusy(true);
      try {
        const response = await api.get<{ item: AboutDraft }>('/api/about-image/admin');
        if (!active) return;
        setDraft(response.data.item);
        setEditing(response.data.item);
        setApiReady(true);
        setStatus('Server draft loaded');
      } catch (loadError) {
        if (!active) return;
        setApiReady(false);
        setStatus('Offline preview — editing unavailable');
        setError(errorMessage(loadError));
      } finally {
        if (active) setIsBusy(false);
      }
    }
    void loadAboutImage();
    return () => { active = false; };
  }, []);

  function beginEdit() { setEditing({ ...draft }); setIsEditing(true); setDirty(false); setSaved(false); setError(''); }
  function cancelEdit() { setEditing({ ...draft }); setIsEditing(false); setDirty(false); setError(''); }
  function updateDraft(field: 'imageUrl' | 'altText', value: string) { setEditing((current) => ({ ...current, [field]: value })); setDirty(true); setSaved(false); }

  async function saveDraft() {
    if (!apiReady || !editing.imageUrl || !editing.altText.trim()) { setError('Choose an image and provide descriptive alt text before saving.'); return; }
    setIsBusy(true); setError('');
    try {
      const response = await api.put<{ item: AboutDraft }>('/api/about-image', { imageUrl: editing.imageUrl, altText: editing.altText });
      setDraft(response.data.item); setEditing(response.data.item); setIsEditing(false); setDirty(false); setSaved(true); setStatus('Draft saved on the server');
    } catch (saveError) { setError(errorMessage(saveError)); setStatus('Draft save failed'); } finally { setIsBusy(false); }
  }

  async function publish() {
    if (!apiReady || isEditing || dirty || !saved || isBusy) return;
    setIsBusy(true); setError('');
    try { await api.post('/api/about-image/publish'); setSaved(false); setStatus('Published atomically to the public site'); }
    catch (publishError) { setError(errorMessage(publishError)); setStatus('Publish failed'); }
    finally { setIsBusy(false); }
  }

  async function resetToDefault() {
    if (!apiReady || isBusy) return;
    setIsBusy(true); setError('');
    try {
      await api.delete('/api/about-image');
      const fallbackDraft = { imageUrl: FALLBACK_IMAGE, altText: FALLBACK_ALT, published: null };
      setDraft(fallbackDraft); setEditing(fallbackDraft); setIsEditing(false); setDirty(false); setSaved(false); setStatus('About image reset to the website default');
    } catch (resetError) { setError(errorMessage(resetError)); setStatus('About image reset failed'); }
    finally { setPendingReset(false); setIsBusy(false); }
  }

  const displayed = isEditing ? editing : draft;
  const publishDisabled = !apiReady || isBusy || isEditing || dirty || !saved;
  const publishTitle = !apiReady ? 'Connect the content API first' : isEditing || dirty ? 'Save the draft before publishing' : !saved ? 'Save a draft before publishing' : 'Publish the saved about image to the public site';

  return <><div className="admin-page about-image-manager"><div className="admin-page__head"><div><div className="admin-page__eyebrow">The House / About image</div><h2>The House image <em>studio.</em></h2><p className="admin-page__intro">Replace the picture guests see in &ldquo;The House&rdquo; section — on the homepage and the About page — without touching the public website code.</p></div><div className="about-image-manager__actions"><span className="content-studio__draft-status">{error || (isBusy ? 'Working…' : status)}</span>{isEditing ? <div className="content-studio__edit-tools"><button className="content-studio__cancel" type="button" onClick={cancelEdit} disabled={isBusy}>Cancel</button><button className="content-studio__save" type="button" onClick={() => void saveDraft()} disabled={isBusy || !dirty}>Save draft ↗</button></div> : <div className="content-studio__edit-tools"><button className="content-studio__cancel" type="button" onClick={() => setPendingReset(true)} disabled={isBusy || !apiReady}>Reset to default</button><button className="content-studio__edit" type="button" onClick={beginEdit} disabled={isBusy || !apiReady}>Edit image</button></div>}</div></div><div className="content-studio__notice"><span className="content-studio__notice-mark">i</span><div><strong>{apiReady ? (isEditing ? 'Editing a server draft' : 'Draft and publish mode') : 'Offline preview'}</strong><p>Upload a replacement, save the draft, review it here, then Publish when you are ready. Reset to default removes the custom House image and restores the safe website fallback.</p></div><button className={`content-studio__publish${publishDisabled ? '' : ' content-studio__publish--ready'}`} type="button" onClick={() => void publish()} disabled={publishDisabled} title={publishTitle}>{isBusy ? 'WORKING…' : 'PUBLISH'}</button></div><div className="about-image-manager__grid"><section className="about-image-manager__editor" aria-labelledby="about-editor-title"><div className="admin-page__eyebrow">Content control</div><h3 id="about-editor-title">The House section</h3>{isEditing ? <><ImageUploadField value={previewUrl(editing.imageUrl)} onChange={(url) => updateDraft('imageUrl', url)} /><label className="about-image-manager__label" htmlFor="about-alt-text">Image description <span>Required for accessibility</span><input id="about-alt-text" value={editing.altText} maxLength={160} onChange={(event) => updateDraft('altText', event.target.value)} /></label></> : <div className="about-image-manager__readout"><span>Alt text</span><strong>{draft.altText}</strong><span>Current image URL</span><code>{draft.imageUrl}</code></div>}</section><section className="about-image-manager__preview" aria-labelledby="about-preview-title"><div className="admin-page__eyebrow">Public preview</div><h3 id="about-preview-title">The image guests will see.</h3><div className="about-image-manager__frame"><img src={previewUrl(displayed.imageUrl || FALLBACK_IMAGE)} alt={displayed.altText || FALLBACK_ALT} /></div><p>Preview uses the current {isEditing ? 'draft' : 'public'} image selection. Publish to make a saved draft public. Shown on the homepage &ldquo;The House&rdquo; section and the /about page.</p></section></div></div><ConfirmDialog open={pendingReset} title="Reset the House image?" message="This removes the custom House image configuration and immediately returns the public site to the safe website default image." confirmLabel="Reset to default" busyLabel="Resetting…" busy={isBusy} onCancel={() => setPendingReset(false)} onConfirm={() => void resetToDefault()} /></>;
} 