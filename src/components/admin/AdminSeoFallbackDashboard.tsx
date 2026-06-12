import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  Database,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

const FALLBACK_FIELD_KEYS = ['title', 'description', 'keyphrase'] as const

type PluginCardProps = {
  name: string
  mark: string
  tone: 'yoast' | 'rankmath'
}

function PluginSupportCard({ name, mark, tone }: PluginCardProps) {
  const { t } = useTranslation()

  return (
    <div className="admin-seo-fallback__plugin-card">
      <span
        className={[
          'admin-seo-fallback__plugin-mark',
          tone === 'yoast'
            ? 'admin-seo-fallback__plugin-mark--yoast'
            : 'admin-seo-fallback__plugin-mark--rankmath',
        ].join(' ')}
        aria-hidden
      >
        {mark}
      </span>
      <div className="admin-seo-fallback__plugin-copy">
        <p className="admin-seo-fallback__plugin-name">{name}</p>
        <p className="admin-seo-fallback__plugin-status">
          {t('adminSeo.fallbackDashboard.fullySupported')}
        </p>
      </div>
      <Check className="admin-seo-fallback__plugin-check" aria-hidden />
    </div>
  )
}

export function AdminSeoFallbackDashboard() {
  const { t } = useTranslation()
  const [howItWorksOpen, setHowItWorksOpen] = useState(false)

  return (
    <div className="admin-seo-fallback-wrap">
      <section
        className="admin-seo-fallback admin-seo-fallback__main"
        role="status"
        aria-labelledby="admin-seo-fallback-heading"
      >
        <div className="admin-seo-fallback__top">
          <span className="admin-seo-fallback__warn-icon-wrap" aria-hidden>
            <AlertTriangle className="admin-seo-fallback__warn-icon" />
          </span>
          <div className="admin-seo-fallback__top-copy">
            <div className="admin-seo-fallback__title-row">
              <h3 id="admin-seo-fallback-heading" className="admin-seo-fallback__headline">
                {t('adminSeo.fallbackDashboard.headline')}
              </h3>
              <span className="admin-seo-fallback__status-badge">
                {t('adminSeo.fallbackDashboard.notCompatibleBadge')}
              </span>
            </div>
            <p className="admin-seo-fallback__intro">
              {t('adminSeo.fallbackDashboard.intro')}
            </p>
          </div>
        </div>

        <div className="admin-seo-fallback__columns">
          <div className="admin-seo-fallback__col">
            <p className="admin-seo-fallback__col-label">
              {t('adminSeo.fallbackDashboard.supportedTitle')}
            </p>
            <p className="admin-seo-fallback__col-hint">
              {t('adminSeo.fallbackDashboard.supportedHint')}
            </p>
            <div className="admin-seo-fallback__plugins">
              <PluginSupportCard
                name={t('adminSeo.fallbackDashboard.pluginYoast')}
                mark="Y"
                tone="yoast"
              />
              <PluginSupportCard
                name={t('adminSeo.fallbackDashboard.pluginRankMath')}
                mark="R"
                tone="rankmath"
              />
            </div>
          </div>

          <div className="admin-seo-fallback__col admin-seo-fallback__col--panel">
            <div className="admin-seo-fallback__col-head">
              <Database className="admin-seo-fallback__col-icon" aria-hidden />
              <p className="admin-seo-fallback__col-label">
                {t('adminSeo.fallbackDashboard.fallbackTitle')}
              </p>
            </div>
            <p className="admin-seo-fallback__col-text">
              {t('adminSeo.fallbackDashboard.fallbackDesc')}
            </p>
            <p className="admin-seo-fallback__col-note">
              {t('adminSeo.fallbackDashboard.fallbackNote')}
            </p>
          </div>

          <div className="admin-seo-fallback__col admin-seo-fallback__col--panel">
            <div className="admin-seo-fallback__col-head">
              <Lightbulb className="admin-seo-fallback__col-icon admin-seo-fallback__col-icon--action" aria-hidden />
              <p className="admin-seo-fallback__col-label">
                {t('adminSeo.fallbackDashboard.actionTitle')}
              </p>
            </div>
            <p className="admin-seo-fallback__col-text">
              {t('adminSeo.fallbackDashboard.actionDesc')}
            </p>
          </div>
        </div>
      </section>

      <div className="admin-seo-fallback__safe-card" role="status">
        <ShieldCheck className="admin-seo-fallback__safe-icon" aria-hidden />
        <div className="admin-seo-fallback__safe-copy">
          <p className="admin-seo-fallback__safe-title">
            {t('adminSeo.fallbackDashboard.safeTitle')}
          </p>
          <p className="admin-seo-fallback__safe-desc">
            {t('adminSeo.fallbackDashboard.safeDesc')}
          </p>
          {howItWorksOpen ? (
            <p className="admin-seo-fallback__safe-extra">
              {t('adminSeo.fallbackDashboard.howItWorksDesc')}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="admin-seo-fallback__how-btn"
          aria-expanded={howItWorksOpen}
          onClick={() => setHowItWorksOpen((open) => !open)}
        >
          {t('adminSeo.fallbackDashboard.howItWorks')}
        </button>
      </div>

      <div className="admin-seo-fallback__storage-grid">
        <div className="admin-seo-fallback__storage-card">
          <p className="admin-seo-fallback__storage-card-label">
            {t('adminSeo.fallbackDashboard.storageMethodTitle')}
          </p>
          <p className="admin-seo-fallback__storage-card-value">
            {t('adminSeo.fallbackDashboard.storageMethodValue')}
          </p>
          <p className="admin-seo-fallback__storage-card-note">
            {t('adminSeo.fallbackDashboard.storageMethodNote')}
          </p>
        </div>
        <div className="admin-seo-fallback__storage-card">
          <p className="admin-seo-fallback__storage-card-label">
            {t('adminSeo.fallbackDashboard.storageFieldsTitle')}
          </p>
          <div className="admin-seo-fallback__field-tags">
            {FALLBACK_FIELD_KEYS.map((key) => (
              <code key={key} className="admin-seo-fallback__field-tag">
                {t(`adminSeo.fallbackDashboard.fields.${key}`)}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
