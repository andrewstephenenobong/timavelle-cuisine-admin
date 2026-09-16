/* Timavelle Contact Manager v2: Simplified, workflow-focused, draft→publish clearly visible */
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '../lib/api';
import ConfirmDialog from '../components/ConfirmDialog';
import './contact-manager-improved.css';

interface ContactItem {
  _id: string;
  key: string;
  label: string;
  value: string;
  published?: { label: string; value: string; publishedAt: string; isArchived?: boolean } | null;
  archivedAt?: string;
}

interface Draft extends ContactItem {
  isDraft: boolean;
  isModified: boolean;
  publishedValue?: string;
}

export default function ContactManager() {
  const [items, setItems] = useState<Draft[]>([]);
  const [editingItems, setEditingItems] = useState<Draft[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [hasUnpublished, setHasUnpublished] = useState(false);
  const [status, setStatus] = useState('Connecting…');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const loadDrafts = useCallback(async () => {
    setIsBusy(true);
    setError('');
    setIsEditMode(false);
    try {
      const response = await api.get<{ items: ContactItem[] }>('/api/contact-details/admin?scope=active');
      const drafts = response.data.items.map((item) => ({
        ...item,
        isDraft: !item.published?.value || item.published.value.trim() === '',
        isModified: false,
        publishedValue: item.published?.value || '',
      }));
      setItems(drafts);
      setEditingItems(drafts.map(d => ({ ...d })));
      
      // CHECK if any item has unpublished changes
      const hasUnpublishedChanges = drafts.some((item) => item.value !== item.publishedValue);
      setHasUnpublished(hasUnpublishedChanges);
      
      setApiReady(true);
      setStatus('Contact details loaded from server');
    } catch (err) {
      setApiReady(false);
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Failed to load');
      setStatus('Offline — editing unavailable');
    } finally {
      setIsBusy(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadDrafts(), 0);
    return () => clearTimeout(timer);
  }, [loadDrafts]);

  const beginEdit = () => {
    setEditingItems(items.map(item => ({ ...item })));
    setIsEditMode(true);
    setError('');
  };

  const cancelEdit = () => {
    setEditingItems(items.map(item => ({ ...item })));
    setIsEditMode(false);
    setError('');
  };

  const updateField = (key: string, field: 'label' | 'value', newValue: string) => {
    setEditingItems((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, [field]: newValue }
          : item
      )
    );
  };

  const saveDraft = async (key: string) => {
    const item = editingItems.find((i) => i.key === key);
    if (!item || !item._id) return;

    setIsBusy(true);
    setError('');
    try {
      await api.put(`/api/contact-details/${item._id}`, {
        label: item.label,
        value: item.value,
      });
      
      // Reload to confirm server state
      await loadDrafts();
      setStatus(`"${item.label}" saved as draft`);
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Save failed');
      setStatus('Draft save failed');
    } finally {
      setIsBusy(false);
    }
  };

  const publishAll = async () => {
    setIsBusy(true);
    setError('');
    try {
      await api.post('/api/contact-details/publish');
      setHasUnpublished(false);
      await loadDrafts();
      setStatus('✓ All changes published live');
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || err.message : 'Publish failed');
      setStatus('Publish failed');
    } finally {
      setIsBusy(false);
      setShowConfirm(false);
    }
  };

  const displayItems = isEditMode ? editingItems : items;
  const publishDisabled = !apiReady || isBusy || !hasUnpublished;
  return (
    <div className="contact-manager">
      <div className="contact-manager__header">
        <div>
          <div className="admin-page__eyebrow">Public page / 06</div>
          <h2>Contact Details</h2>
          <p className="admin-page__intro">
            Keep address, phone, email, and hours consistent across all customer touchpoints.
          </p>
        </div>
        <div className="contact-manager__header-status">
          <span className={`contact-manager__status ${error ? 'error' : 'ok'}`}>
            {error || status}
          </span>
          <div className="contact-manager__header-actions">
            {!isEditMode ? (
              <>
                {hasUnpublished && (
                  <button
                    className="contact-manager__publish-now"
                    onClick={() => setShowConfirm(true)}
                    disabled={publishDisabled}
                    title={
                      !apiReady ? 'API not connected' :
                      !hasUnpublished ? 'No unpublished changes' :
                      'Publish all changes to the live site'
                    }
                  >
                    {isBusy ? 'Publishing…' : '📢 Publish Now'}
                  </button>
                )}
                <button
                  className="contact-manager__edit-btn"
                  onClick={beginEdit}
                  disabled={isBusy || !apiReady}
                >
                  ✏️ Edit Details
                </button>
              </>
            ) : (
              <>
                <button
                  className="contact-manager__cancel-btn"
                  onClick={cancelEdit}
                  disabled={isBusy}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isEditMode && (
        <div className="contact-manager__edit-mode-banner">
          <span className="contact-manager__edit-mode-icon">✏️</span>
          <strong>Edit mode active</strong>
          <p>Make changes below, click "Save draft" on each field, then "Publish" when ready. Click "Cancel" to discard all changes.</p>
        </div>
      )}

      <div className="contact-manager__form">
        {displayItems.map((item) => {
          const isPhoneField = item.key === 'phone';
          const isEmailField = item.key === 'email';
          const hasUnpublishedDraft = item.isDraft || (item.value !== item.publishedValue);
          const originalItem = items.find(i => i.key === item.key);
          const isModified = isEditMode && originalItem && (item.value !== originalItem.value || item.label !== originalItem.label);
          
          return (
            <fieldset
              key={item.key}
              className={`contact-manager__field-group ${isEditMode ? 'editing' : ''} ${isModified ? 'modified' : ''} ${hasUnpublishedDraft ? 'unpublished' : 'published'}`}
            >
              <legend className="contact-manager__field-label">
                {item.label}
                {hasUnpublishedDraft && (
                  <span className="contact-manager__unpublished-badge">Draft</span>
                )}
              </legend>

              <div className="contact-manager__field-controls">
                <input
                  type={isPhoneField ? 'tel' : isEmailField ? 'email' : 'text'}
                  value={item.value}
                  onChange={(e) => isEditMode && updateField(item.key, 'value', e.target.value)}
                  disabled={!isEditMode || isBusy}
                  placeholder={
                    isPhoneField ? '+234 701 599 0266' :
                    isEmailField ? 'hello@timavellecuisine.com' :
                    '14 Ilaro Crescent, Lagos'
                  }
                  className="contact-manager__input"
                  aria-label={`${item.label} value`}
                  readOnly={!isEditMode}
                />
                {isEditMode && (
                  <button
                    type="button"
                    className="contact-manager__save-field"
                    onClick={() => saveDraft(item.key)}
                    disabled={isBusy || !isModified}
                  >
                    Save draft
                  </button>
                )}
                
              </div>

              {item.publishedValue && item.value !== item.publishedValue && (
                <div className="contact-manager__diff">
                  <small>
                    <strong>Currently live:</strong> <code>{item.publishedValue}</code>
                  </small>
                </div>
              )}
            </fieldset>
          );
        })}
      </div>

      {!isEditMode && (
        <div className="contact-manager__workflow">
          <div className="contact-manager__workflow-step">
            <span className="contact-manager__step-number">1</span>
            <div>
              <strong>Click "✏️ Edit Details"</strong>
              <p>Enable edit mode to start making changes.</p>
            </div>
          </div>
          <div className="contact-manager__workflow-step">
            <span className="contact-manager__step-number">2</span>
            <div>
              <strong>Edit & Save Draft</strong>
              <p>Change values, then click "Save draft" on each field. No changes go live yet.</p>
            </div>
          </div>
          <div className="contact-manager__workflow-step">
            <span className="contact-manager__step-number">3</span>
            <div>
              <strong>Review & Publish</strong>
              <p>Exit edit mode and hit "📢 Publish Now" to make all changes live.</p>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        title="Publish contact details?"
        message="All draft changes will be published to the live site immediately. Customer-facing contact info will update right away."
        confirmLabel="Publish changes"
        busy={isBusy}
        busyLabel="Publishing…"
        onCancel={() => setShowConfirm(false)}
        onConfirm={() => publishAll()}
      />
    </div>
  );
}
