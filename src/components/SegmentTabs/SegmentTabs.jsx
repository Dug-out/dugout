import './SegmentTabs.css'

/**
 * 구분 탭 · 회색 바탕에 고른 칸만 흰색 (My-posts, Record 의 탭)
 * tabs: [{key, label}] · value: 고른 key · onChange(key)
 */
function SegmentTabs({tabs, value, onChange, label, className = ''}) {
    const classes = ['segment-tabs', className].filter(Boolean).join(' ')

    return (
        <div className={classes} role="tablist" aria-label={label}>
            {tabs.map((tab) => (
                <button key={tab.key} type="button" role="tab" aria-selected={tab.key === value}
                        className="segment-tabs__tab" onClick={() => onChange(tab.key)}>
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

export default SegmentTabs
