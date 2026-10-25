import {Link} from 'react-router'
import Button from '../Button/Button.jsx'
import EmptyState from '../EmptyState/EmptyState.jsx'
import Loading from '../Loading/Loading.jsx'

/**
 * 불러오기 상태 화면 · 불러오는 중이면 Loading, 실패하면 오류 안내와 [다시 시도], 찾을 수 없으면 안내를 보여 준다.
 * 불러왔을 때(ready)는 아무것도 그리지 않으므로, 화면이 내용을 따로 그린다.
 * @param {{status: 'loading' | 'ready' | 'error' | 'notfound', errorTitle: string, onRetry: () => void,
 *          notFound?: {title: string, description: string, backTo: string, backLabel: string}, className?: string}} props
 *  notFound: 없는 글처럼 "찾을 수 없음"이 있는 화면에서만 넘긴다 · backTo/backLabel 은 돌아갈 곳
 */
function LoadState({status, errorTitle, onRetry, notFound, className = ''}) {
    if (status === 'loading') return <Loading />

    if (status === 'error') {
        return (
            <EmptyState
                className={className}
                title={errorTitle}
                description="잠시 후 다시 시도해 주세요"
                action={
                    <Button variant="small-outline" onClick={onRetry}>
                        다시 시도
                    </Button>
                }
            />
        )
    }

    if (status === 'notfound' && notFound) {
        return (
            <EmptyState
                className={className}
                title={notFound.title}
                description={notFound.description}
                action={
                    <Button as={Link} to={notFound.backTo} variant="small-outline">
                        {notFound.backLabel}
                    </Button>
                }
            />
        )
    }

    return null
}

export default LoadState
