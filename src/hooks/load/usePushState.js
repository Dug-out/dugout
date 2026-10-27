import {getPushState} from '../../api/pushSubscriptions.js'
import useLoad from '../useLoad.js'

/**
 * 이 기기의 푸시 알림 상태
 * @returns {{status: 'loading' | 'ready' | 'error' | 'notfound', state: 'unsupported' | 'denied' | 'on' | 'off' | null,
 *             refresh: () => void}}
 *  state: ready 일 때만 값이 있다
 */
export default function usePushState() {
    const {status, data: state, refresh} = useLoad(getPushState, [])
    return {status, state, refresh}
}
