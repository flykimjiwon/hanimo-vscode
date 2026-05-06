import { useEffect, useMemo, useState } from 'preact/hooks';
import { ConfigDTO, ModelDTO } from '../../services/api';
import { t, useLocale, setLocale, getLocale } from '../i18n';

interface Props {
  config: ConfigDTO | null;
  models: ModelDTO[];
  rules: { path: string; content: string };
  onPatch: (patch: Partial<ConfigDTO>) => void;
  onListModels: () => void;
  onRefreshModels: (provider?: string) => void;
  onBack: () => void;
  onReindex: () => void;
  onLoadRules: () => void;
  onSaveRules: (content: string) => void;
}

// Provider presets — picking one auto-fills BaseURL and seeds the model
// dropdown. The list mirrors hanimo-code's internal/llm/providers/registry.go,
// kept intentionally short so the dropdown stays usable. Pick "Custom" for
// any OpenAI-compatible endpoint not listed.
type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'deepseek' | 'novita' | 'openrouter' | 'ollama' | 'custom';
interface ProviderPreset {
  id: ProviderId;
  label: string;
  baseUrl: string;
  keyPlaceholder: string;
  keyHint: string;
  models: string[];
}
const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    baseUrl: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-...',
    keyHint: 'console.anthropic.com',
    models: ['claude-sonnet-4', 'claude-haiku-4', 'claude-opus-4'],
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    keyHint: 'platform.openai.com',
    models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  },
  {
    id: 'gemini',
    label: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    keyPlaceholder: 'AI...',
    keyHint: 'aistudio.google.com',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    keyPlaceholder: 'sk-...',
    keyHint: 'platform.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'novita',
    label: 'Novita',
    baseUrl: 'https://api.novita.ai/v3/openai',
    keyPlaceholder: 'sk_...',
    keyHint: 'novita.ai',
    models: ['qwen3:8b', 'llama3.1:8b', 'codestral:latest'],
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-...',
    keyHint: 'openrouter.ai',
    models: ['anthropic/claude-sonnet-4', 'openai/gpt-4o', 'google/gemini-2.5-pro'],
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    baseUrl: 'http://localhost:11434/v1',
    keyPlaceholder: '(not required)',
    keyHint: 'No API key — runs locally',
    models: ['qwen3:8b', 'llama3.1:8b', 'codestral:latest'],
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: '',
    keyPlaceholder: 'your-api-key',
    keyHint: 'Any OpenAI-compatible endpoint',
    models: [],
  },
];

function detectProvider(baseUrl: string): ProviderId {
  for (const p of PROVIDER_PRESETS) {
    if (p.id === 'custom') continue;
    if (baseUrl && baseUrl.startsWith(p.baseUrl)) return p.id;
  }
  return 'custom';
}

export function SettingsView({ config, models, rules, onPatch, onListModels, onRefreshModels, onBack, onReindex, onLoadRules, onSaveRules }: Props) {
  useLocale();
  const [baseUrl, setBaseUrl] = useState(config?.base_url || '');
  const [apiKey, setApiKey] = useState('');
  const [superModel, setSuperModel] = useState(config?.super || '');
  const [devModel, setDevModel] = useState(config?.dev || '');
  const [planModel, setPlanModel] = useState(config?.plan || config?.super || '');
  const [provider, setProvider] = useState<ProviderId>(detectProvider(config?.base_url || ''));
  const [rulesDraft, setRulesDraft] = useState(rules.content);

  useEffect(() => {
    setBaseUrl(config?.base_url || '');
    setSuperModel(config?.super || '');
    setDevModel(config?.dev || '');
    setPlanModel(config?.plan || config?.super || '');
    setProvider(detectProvider(config?.base_url || ''));
  }, [config]);

  useEffect(() => { setRulesDraft(rules.content); }, [rules.content]);
  useEffect(() => { onListModels(); onLoadRules(); }, []);

  const isOnprem = !!config?.is_onprem;
  const preset = useMemo(() => PROVIDER_PRESETS.find((p) => p.id === provider)!, [provider]);

  const onProviderChange = (id: ProviderId) => {
    setProvider(id);
    const next = PROVIDER_PRESETS.find((p) => p.id === id)!;
    if (id !== 'custom' && !isOnprem) setBaseUrl(next.baseUrl);
    if (next.models.length > 0) {
      if (!superModel || !next.models.includes(superModel)) setSuperModel(next.models[0]);
      if (!devModel || !next.models.includes(devModel)) setDevModel(next.models[0]);
      if (!planModel || !next.models.includes(planModel)) setPlanModel(next.models[0]);
    }
  };

  const save = () => {
    const patch: Partial<ConfigDTO> = {
      base_url: baseUrl,
      super: superModel,
      dev: devModel,
      plan: planModel,
    };
    if (apiKey.trim()) patch.api_key = apiKey.trim();
    onPatch(patch);
  };

  // Suggested models in the datalist combine the global model registry from
  // hanimo-server with the active provider's curated list.
  const suggestedModels = useMemo(() => {
    const ids = new Set<string>(preset.models);
    for (const m of models) ids.add(m.id);
    return Array.from(ids);
  }, [models, preset]);

  return (
    <div class="view-pane">
      <h2>{t('settings_title')}</h2>

      {isOnprem && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--hanimo-accent-glow)',
          border: '1px solid var(--hanimo-accent)',
          borderRadius: 4,
          fontSize: 11,
          color: 'var(--hanimo-accent)',
          marginBottom: 12,
        }}>
          🛡 <strong>Sealed build</strong> — endpoint and models are baked at compile time. Only the API key field is editable.
        </div>
      )}

      <h3>{t('language_section')}</h3>
      <div class="field">
        <label>{t('language_label')}</label>
        <select value={getLocale()} onChange={(e) => setLocale((e.target as HTMLSelectElement).value as 'ko' | 'en')}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
        </select>
      </div>

      <h3>{t('api_section')}</h3>
      <div class="field">
        <label>Provider</label>
        <select
          value={provider}
          onChange={(e) => onProviderChange((e.target as HTMLSelectElement).value as ProviderId)}
          disabled={isOnprem}
        >
          {PROVIDER_PRESETS.map((p) => <option value={p.id}>{p.label}</option>)}
        </select>
        <div style={{ fontSize: 10, color: 'var(--hanimo-fg-faint)', marginTop: 2 }}>
          {preset.keyHint}
        </div>
      </div>

      <div class="field">
        <label>{t('base_url')}</label>
        <input
          value={baseUrl}
          onInput={(e) => setBaseUrl((e.target as HTMLInputElement).value)}
          placeholder={preset.baseUrl || 'https://your-endpoint/v1'}
          readOnly={isOnprem}
          style={isOnprem ? { opacity: 0.7, cursor: 'not-allowed' } : undefined}
        />
        {isOnprem && (
          <div style={{ fontSize: 10, color: 'var(--hanimo-fg-faint)', marginTop: 2 }}>
            Sealed build — Base URL is fixed.
          </div>
        )}
      </div>
      <div class="field">
        <label>
          {t('api_key')}
          {config?.has_key && <span style={{ color: 'var(--hanimo-accent)' }}> ({t('api_key_saved')}: {config.api_key})</span>}
        </label>
        <input
          type="password"
          value={apiKey}
          onInput={(e) => setApiKey((e.target as HTMLInputElement).value)}
          placeholder={config?.has_key ? t('api_key_replace') : preset.keyPlaceholder}
          disabled={provider === 'ollama'}
        />
        {provider === 'ollama' && (
          <div style={{ fontSize: 10, color: 'var(--hanimo-fg-faint)', marginTop: 2 }}>
            Ollama runs locally — no API key needed.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{t('models_section')}</h3>
        <button
          class="btn-secondary"
          style={{ padding: '3px 10px', fontSize: 11 }}
          title={`Fetch latest models from ${preset.label}`}
          onClick={() => onRefreshModels(provider !== 'custom' ? provider : undefined)}
          disabled={provider === 'ollama' && !config?.has_key && !baseUrl.includes('localhost')}
        >
          ↻ Refresh from provider
        </button>
      </div>
      <datalist id="model-suggestions">
        {suggestedModels.map((id) => <option value={id} />)}
      </datalist>
      <div class="field">
        <label>{t('model_super')}</label>
        <input
          list="model-suggestions"
          value={superModel}
          onInput={(e) => setSuperModel((e.target as HTMLInputElement).value)}
          placeholder={preset.models[0] || 'model-id'}
        />
        <div style={{ fontSize: 10, color: 'var(--hanimo-fg-faint)', marginTop: 2 }}>
          Pick from the dropdown or type any model id. Plan mode reuses this when its own field is blank.
        </div>
      </div>
      <div class="field">
        <label>{t('model_dev')}</label>
        <input
          list="model-suggestions"
          value={devModel}
          onInput={(e) => setDevModel((e.target as HTMLInputElement).value)}
          placeholder={preset.models[0] || 'model-id'}
        />
      </div>
      <div class="field">
        <label>Plan model</label>
        <input
          list="model-suggestions"
          value={planModel}
          onInput={(e) => setPlanModel((e.target as HTMLInputElement).value)}
          placeholder={`${preset.models[0] || 'model-id'} (blank → Super)`}
        />
      </div>

      <div class="actions">
        <button class="btn-primary" onClick={save}>{t('save')}</button>
        <button class="btn-secondary" onClick={onBack}>{t('back')}</button>
      </div>

      <h3>{t('rules_section')}</h3>
      <div class="field" style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)' }}>{t('rules_help')}</div>
      <div class="field">
        <textarea
          value={rulesDraft}
          onInput={(e) => setRulesDraft((e.target as HTMLTextAreaElement).value)}
          style={{ minHeight: 120 }}
        />
        <div style={{ fontSize: 10, color: 'var(--hanimo-fg-faint)', marginTop: 4 }}>{rules.path}</div>
      </div>
      <div class="actions">
        <button class="btn-primary" onClick={() => onSaveRules(rulesDraft)}>{t('rules_save')}</button>
      </div>

      <h3>{t('index_section')}</h3>
      <div class="field" style={{ fontSize: 11, color: 'var(--hanimo-fg-dim)' }}>{t('index_help')}</div>
      <div class="actions">
        <button class="btn-secondary" onClick={onReindex}>{t('reindex')}</button>
      </div>
    </div>
  );
}
