import {useEffect, useState} from 'react'
import {getMyTeam} from '../api/profiles.js'

/**
 * 내 응원팀 코드('KIA' 등)를 불러온다 · 아직 불러오지 못했거나 실패하면 null
 */
export default function useMyTeam() {
    const [team, setTeam] = useState(null)

    useEffect(() => {
        // 화면을 떠나면 true 가 되어, 늦게 도착한 옛 응답을 버린다
        let stale = false

        getMyTeam()
            .then((code) => !stale && setTeam(code))
            .catch(() => {})

        return () => {
            stale = true
        }
    }, [])

    return team
}
