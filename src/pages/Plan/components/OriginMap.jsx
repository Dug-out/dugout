import {useEffect, useRef, useState} from 'react'
import {Icon} from '../../../components'
import {loadKakaoMaps} from '../../../lib/kakaoMap.js'
import './OriginMap.css'

/**
 * 출발 위치 지도 · 지도를 움직여 가운데 핀 아래 위치를 고른다 (주소·장소 검색, 현재 위치 버튼)
 * 지도를 움직이거나 검색해서 위치가 정해질 때마다 onChange({lat, lng, label, address}) 를 부른다
 * @param {{initial: {lat: number, lng: number, label: string}, onChange: (origin: {lat: number, lng: number, label: string, address: string}) => void}} props
 *  initial: 처음 지도 가운데 위치와 이름 (지도를 만든 뒤에는 바뀌지 않는다)
 */
function OriginMap({initial, onChange}) {
    const mapRef = useRef(/** @type {HTMLDivElement | null} */ (null))
    // 지도 · 검색 도구 · 위치가 정해질 때 붙일 이름 (검색해서 고른 장소 이름)
    const kakaoRef = useRef(/** @type {any} */ (null))
    const mapObjectRef = useRef(/** @type {any} */ (null))
    const labelRef = useRef(initial.label)
    // onChange 는 매번 새로 만들어져도 지도 이벤트가 다시 연결되지 않게 ref 에 담아 쓴다
    const onChangeRef = useRef(onChange)
    useEffect(() => {
        onChangeRef.current = onChange
    })

    // 지도 상태 · loading | ready | error / 검색어와 결과 / 현재 위치 안내
    const [status, setStatus] = useState('loading')
    const [query, setQuery] = useState('')
    const [results, setResults] = useState(/** @type {any[]} */ ([]))
    const [notice, setNotice] = useState('')

    useEffect(() => {
        let alive = true
        loadKakaoMaps()
            .then((kakao) => {
                if (!alive || !mapRef.current) return
                const map = new kakao.maps.Map(mapRef.current, {
                    center: new kakao.maps.LatLng(initial.lat, initial.lng),
                    level: 3,
                })
                kakaoRef.current = kakao
                mapObjectRef.current = map

                // 지도 움직임이 멈추면 가운데 좌표의 주소를 찾아 알린다
                const geocoder = new kakao.maps.services.Geocoder()
                kakao.maps.event.addListener(map, 'idle', () => {
                    const center = map.getCenter()
                    const lat = center.getLat()
                    const lng = center.getLng()
                    geocoder.coord2Address(lng, lat, (found, geoStatus) => {
                        if (!alive) return
                        const place = geoStatus === kakao.maps.services.Status.OK ? found[0] : null
                        const address = place?.road_address?.address_name ?? place?.address?.address_name ?? ''
                        // 검색해서 고른 장소가 있으면 그 이름, 아니면 동네 이름 근처
                        const town = place?.address?.region_3depth_name
                        const label = labelRef.current ?? (town ? `${town} 근처` : '선택한 위치')
                        labelRef.current = null
                        onChangeRef.current({lat, lng, label, address})
                    })
                })
                setStatus('ready')
            })
            .catch(() => alive && setStatus('error'))
        return () => {
            alive = false
        }
        // 지도는 한 번만 만든다 (처음 위치만 쓴다)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // 장소 · 주소 검색 · 장소 이름으로 찾고, 없으면 주소로 찾는다
    const search = (event) => {
        event.preventDefault()
        const keyword = query.trim()
        const kakao = kakaoRef.current
        if (!keyword || !kakao) return
        const toPlace = (item) => ({name: item.place_name ?? item.address_name, x: item.x, y: item.y})
        new kakao.maps.services.Places().keywordSearch(keyword, (places, placeStatus) => {
            if (placeStatus === kakao.maps.services.Status.OK) {
                setResults(places.slice(0, 5).map(toPlace))
                return
            }
            new kakao.maps.services.Geocoder().addressSearch(keyword, (addresses, addressStatus) => {
                setResults(addressStatus === kakao.maps.services.Status.OK ? addresses.slice(0, 5).map(toPlace) : [])
                if (addressStatus !== kakao.maps.services.Status.OK) setNotice('검색 결과가 없어요')
            })
        })
    }

    // 검색 결과를 골랐을 때 · 지도를 그 위치로 옮긴다
    const pick = (place) => {
        labelRef.current = place.name
        mapObjectRef.current.setCenter(new kakaoRef.current.maps.LatLng(place.y, place.x))
        setResults([])
        setQuery('')
        setNotice('')
    }

    // 현재 위치 버튼 · 브라우저 위치 허용을 받아 지도를 옮긴다
    const goToMyLocation = () => {
        if (!navigator.geolocation || !mapObjectRef.current) {
            setNotice('이 기기에서는 현재 위치를 알 수 없어요')
            return
        }
        navigator.geolocation.getCurrentPosition(
            ({coords}) => {
                labelRef.current = '현재 위치 근처'
                mapObjectRef.current.setCenter(new kakaoRef.current.maps.LatLng(coords.latitude, coords.longitude))
                setNotice('')
            },
            () => setNotice('현재 위치를 가져오지 못했어요. 위치 사용을 허용해 주세요'),
        )
    }

    return (
        <div className="origin-map">
            <div ref={mapRef} className="origin-map__canvas" />

            {status === 'loading' && <p className="origin-map__state">지도를 불러오는 중…</p>}
            {status === 'error' && (
                <p className="origin-map__state">
                    지도를 불러오지 못했어요
                    <br />
                    출발 위치는 {initial.label}(으)로 해 드려요
                </p>
            )}

            {status === 'ready' && (
                <>
                    {/* 검색창과 결과 목록 */}
                    <form className="origin-map__search" onSubmit={search}>
                        <Icon name="search" size={18} />
                        <input
                            type="search"
                            aria-label="주소 검색"
                            placeholder="주소나 장소 이름으로 검색"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </form>
                    {results.length > 0 && (
                        <ul className="origin-map__results">
                            {results.map((place) => (
                                <li key={`${place.x},${place.y},${place.name}`}>
                                    <button type="button" onClick={() => pick(place)}>
                                        {place.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* 가운데 핀 · 지도를 움직여 핀 아래 위치를 고른다 */}
                    <span className="origin-map__pin" aria-hidden="true">
                        <span className="origin-map__pin-label">여기서 출발</span>
                        <svg width="38" height="48" viewBox="0 0 24 30">
                            <path d="M12 29s10-9.2 10-17A10 10 0 0 0 2 12c0 7.8 10 17 10 17z" fill="currentColor" />
                            <circle cx="12" cy="12" r="4" fill="var(--surface)" />
                        </svg>
                    </span>
                    <span className="origin-map__shadow" aria-hidden="true" />

                    <button
                        type="button"
                        className="origin-map__locate"
                        aria-label="현재 위치로"
                        onClick={goToMyLocation}
                    >
                        <Icon name="locate" size={20} />
                    </button>
                    {notice && (
                        <p className="origin-map__notice" role="status">
                            {notice}
                        </p>
                    )}
                </>
            )}
        </div>
    )
}

export default OriginMap
