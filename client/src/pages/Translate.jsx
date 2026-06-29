import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const API_BASE = '/dictionary';

export default function Translate() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dictionary';
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Dictionary search
  const [keyword, setKeyword] = useState('');
  const [dictResult, setDictResult] = useState(null);

  // Translate
  const [transText, setTransText] = useState('');
  const [transResult, setTransResult] = useState('');

  // Tokenize
  const [tokenText, setTokenText] = useState('');
  const [tokenResult, setTokenResult] = useState(null);

  const searchDict = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true); setDictResult(null);
    try {
      const r = await fetch(API_BASE + '/search-mazii', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), limit: 20 }),
      });
      const d = await r.json();
      setDictResult(d.data || d);
    } catch (e) { setDictResult({ error: 'Không kết nối được dịch vụ dịch' }); }
    setLoading(false);
  };

  const doTranslate = async (e) => {
    e.preventDefault();
    if (!transText.trim()) return;
    setLoading(true); setTransResult('');
    try {
      const r = await fetch(API_BASE + '/translate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transText.trim(), sourceLang: 'ja', targetLang: 'vi' }),
      });
      const d = await r.json();
      setTransResult(d.data?.translatedText || d.translatedText || JSON.stringify(d));
    } catch (e) { setTransResult('Lỗi kết nối'); }
    setLoading(false);
  };

  const doTokenize = async (e) => {
    e.preventDefault();
    if (!tokenText.trim()) return;
    setLoading(true); setTokenResult(null);
    try {
      const r = await fetch(API_BASE + '/tokenize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: tokenText.trim() }),
      });
      const d = await r.json();
      setTokenResult(d.data || d);
    } catch (e) { setTokenResult({ error: 'Lỗi kết nối' }); }
    setLoading(false);
  };

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>🔤 Công cụ dịch tiếng Nhật</h2>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${tab === 'dictionary' ? 'active' : ''}`} onClick={() => setTab('dictionary')}>📖 Tra từ điển</button>
        <button className={`tab ${tab === 'translate' ? 'active' : ''}`} onClick={() => setTab('translate')}>🌐 Dịch văn bản</button>
        <button className={`tab ${tab === 'tokenize' ? 'active' : ''}`} onClick={() => setTab('tokenize')}>✂️ Tách từ</button>
      </div>

      {/* Dictionary Search */}
      {tab === 'dictionary' && (
        <div>
          <form onSubmit={searchDict} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input className="form-input" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Nhập từ cần tra (日本語 / tiếng Việt)" style={{ flex: 1, fontSize: 16 }} />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 24px', fontSize: 15 }}>Tra</button>
          </form>
          {loading && <div className="spinner" />}
          {dictResult && (
            <div>
              {dictResult.error ? <div className="alert alert-error">{dictResult.error}</div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(Array.isArray(dictResult) ? dictResult : dictResult.results || []).slice(0, 20).map((item, i) => (
                    <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e8e8e8' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 700 }}>{item.word || item.vocabulary}</span>
                        {item.reading && <span style={{ fontSize: 14, color: '#999' }}>{item.reading}</span>}
                      </div>
                      <div style={{ fontSize: 14, color: '#666' }}>
                        {(item.means || item.meanings || []).map((m, j) => (
                          <span key={j} style={{ marginRight: 12 }}>{typeof m === 'string' ? m : m.meaning}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Translate */}
      {tab === 'translate' && (
        <div>
          <form onSubmit={doTranslate} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea className="form-input" value={transText} onChange={e => setTransText(e.target.value)} placeholder="Nhập văn bản tiếng Nhật cần dịch..." rows={5} style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, resize: 'vertical' }} />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 24px', fontSize: 15, alignSelf: 'flex-end' }}>Dịch</button>
          </form>
          {loading && <div className="spinner" />}
          {transResult && (
            <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e8e8e8' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>Kết quả dịch:</div>
              <div style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{transResult}</div>
            </div>
          )}
        </div>
      )}

      {/* Tokenize */}
      {tab === 'tokenize' && (
        <div>
          <form onSubmit={doTokenize} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea className="form-input" value={tokenText} onChange={e => setTokenText(e.target.value)} placeholder="Nhập câu tiếng Nhật để tách từ..." rows={3} style={{ fontFamily: 'Inter, sans-serif', fontSize: 16, resize: 'vertical' }} />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px 24px', fontSize: 15, alignSelf: 'flex-end' }}>Tách từ</button>
          </form>
          {loading && <div className="spinner" />}
          {tokenResult && (
            <div style={{ marginTop: 16 }}>
              {tokenResult.error ? <div className="alert alert-error">{tokenResult.error}</div> : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(tokenResult.tokens || tokenResult.words || []).map((t, i) => (
                    <span key={i} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, padding: '8px 14px', fontSize: 16 }}>
                      {typeof t === 'string' ? t : (t.surface || t.word || t.token)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 40, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', fontSize: 13, color: '#999' }}>
        ⚠️ Dịch vụ yêu cầu MePlay Translator Service chạy trên port 8081.
      </div>
    </div>
  );
}
