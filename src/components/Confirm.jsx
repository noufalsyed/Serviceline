import Icon from './Icon.jsx'
import Sheet from './Sheet.jsx'

export default function Confirm({ title, body, confirmLabel = 'Delete', onConfirm, onClose, danger = true }) {
  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={(
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${danger ? 'danger' : 'primary'}`}
            onClick={() => { onConfirm(); onClose() }}
          >
            <Icon name={danger ? 'trash' : 'check'} />{confirmLabel}
          </button>
        </>
      )}
    >
      <p style={{ margin: 0, fontSize: 14 }}>{body}</p>
    </Sheet>
  )
}
