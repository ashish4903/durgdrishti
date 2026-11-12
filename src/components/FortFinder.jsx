import { useEffect, useState } from 'react';

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1_600;

async function prepareImage(file) {
  const image = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    image.close();
  }
}

export default function FortFinder({ copy }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectImage = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setResult(null);
    setError('');
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (!selectedFile.type.startsWith('image/')) {
      setFile(null);
      setError(copy.finderInvalidImage);
      event.target.value = '';
      return;
    }
    if (selectedFile.size > MAX_IMAGE_BYTES) {
      setFile(null);
      setError(copy.finderImageTooLarge);
      event.target.value = '';
      return;
    }
    setFile(selectedFile);
  };

  const analyzeImage = async () => {
    if (!file || isAnalyzing) return;
    setIsAnalyzing(true);
    setResult(null);
    setError('');
    try {
      let image;
      try {
        image = await prepareImage(file);
      } catch {
        throw new Error(copy.finderInvalidImage);
      }
      let response;
      try {
        response = await fetch('/api/identify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, language: copy.finderLanguageCode }),
        });
      } catch {
        throw new Error(copy.finderFailed);
      }
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload) throw new Error(payload?.error || copy.finderFailed);
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.finderFailed);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const verdict = result
    ? copy[`finder${result.classification[0].toUpperCase()}${result.classification.slice(1)}`]
    : '';

  return (
    <section className="finder-workspace">
      <div className="finder-heading">
        <span className="section-kicker">03 / {copy.finderKicker}</span>
        <h2>{copy.finderTitle}</h2>
        <p>{copy.finderIntro}</p>
      </div>

      <div className="finder-layout">
        <div className="finder-upload-panel">
          <label className="field-label" htmlFor="fort-photo">{copy.finderPhotoLabel}</label>
          <p className="finder-photo-hint">{copy.finderPhotoHint}</p>
          <label className={`finder-dropzone ${file ? 'finder-has-image' : ''}`} htmlFor="fort-photo">
            {previewUrl
              ? <img className="finder-preview" src={previewUrl} alt={copy.finderPhotoPreview} />
              : <span className="finder-upload-prompt"><span className="finder-upload-icon">＋</span><strong>{copy.finderChoosePhoto}</strong><small>{copy.finderPhotoTypes}</small></span>}
          </label>
          <input id="fort-photo" className="sr-only" type="file" accept="image/*" capture="environment" onChange={selectImage} />
          <p className="finder-privacy"><strong>{copy.finderPrivacyTitle}</strong> {copy.finderPrivacyBody}</p>
          <button type="button" className="finder-analyze-button" disabled={!file || isAnalyzing} onClick={analyzeImage}>
            {isAnalyzing ? copy.finderAnalyzing : copy.finderAnalyze}
          </button>
          {error && <p className="finder-error" role="alert">{error}</p>}
        </div>

        <div className={`finder-result ${result ? `finder-result-${result.classification}` : ''}`} aria-live="polite">
          <div className="finder-result-topline"><span className="status-dot" />{result ? copy.finderResultReady : copy.finderResultWaiting}</div>
          {isAnalyzing
            ? <div className="finder-empty"><span className="finder-spinner" /><h3>{copy.finderAnalyzingTitle}</h3><p>{copy.finderAnalyzingBody}</p></div>
            : result
              ? <>
                <h3>{verdict}</h3>
                <div className="finder-confidence"><span>{copy.finderConfidence}</span><strong>{result.confidence}%</strong></div>
                <div className="score-track"><span style={{ width: `${result.confidence}%` }} /></div>
                <p className="finder-summary">{result.summary}</p>
                {result.visual_cues?.length > 0 && <div className="finder-cues"><strong>{copy.finderCues}</strong><ul>{result.visual_cues.map((cue, index) => <li key={`${cue}-${index}`}>{cue}</li>)}</ul></div>}
                <p className="finder-caveat">{result.limitations || copy.finderCaveat}</p>
              </>
              : <div className="finder-empty">
                <span className="finder-illustration"><span /><i /><b /></span>
                <h3>{copy.finderEmptyTitle}</h3>
                <p>{copy.finderEmptyBody}</p>
                <div className="finder-example-list">
                  <span className="finder-example-label">{copy.finderExampleLabel}</span>
                  <article className="finder-example">
                    <strong>{copy.finderExampleFort}</strong>
                    <span>{copy.finderExampleFortVerdict}</span>
                    <small>{copy.finderExampleFortCues}</small>
                  </article>
                  <article className="finder-example">
                    <strong>{copy.finderExamplePeak}</strong>
                    <span>{copy.finderExamplePeakVerdict}</span>
                    <small>{copy.finderExamplePeakCues}</small>
                  </article>
                  <p className="finder-example-caveat">{copy.finderExampleCaveat}</p>
                </div>
              </div>}
        </div>
      </div>
      <p className="finder-disclaimer">{copy.finderDisclaimer}</p>
    </section>
  );
}
