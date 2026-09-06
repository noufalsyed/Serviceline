import Icon from './Icon.jsx'

export default function Toast({ notice }) {
  return (
    <div className={`toast ${notice.tone || 'ok'}`} role="status" aria-live="polite">
      <Icon name={notice.tone === 'warn' ? 'alert' : 'check'} />
      {notice.text}
    </div>
  )
}
