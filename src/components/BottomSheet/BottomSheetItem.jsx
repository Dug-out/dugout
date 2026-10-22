import './BottomSheet.css'

/** 바텀 시트 메뉴 항목 · 52px. 되돌릴 수 없는 항목만 danger */
function BottomSheetItem({danger = false, className = '', children, ...rest}) {
    const classes = ['sheet__item', danger && 'sheet__item--danger', className].filter(Boolean).join(' ')

    return (
        <button type="button" className={classes} {...rest}>
            {children}
        </button>
    )
}

export default BottomSheetItem
