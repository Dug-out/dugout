import './Loading.css'

/**
 * 불러오는 중 화면 · 남은 공간 가운데에 흔들리는 캐릭터와 안내 문구를 보여 준다
 * 부모가 세로로 쌓는 flex 이고 높이가 남아 있어야 가운데에 온다.
 */
function Loading() {
    return (
        // role="status": 화면 읽기 프로그램이 "불러오는 중"을 알려 준다
        <div className="loading" role="status" aria-live="polite">
            <img className="loading__image" src="/assets/loading.png" alt="" width="640" height="633" />
            <p className="loading__title">
                불러오는 중{/* 점 세 개가 차례로 깜빡인다 */}
                <span className="loading__dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </span>
            </p>
            <p className="loading__desc">잠깐만 기다려 주세요</p>
        </div>
    )
}

export default Loading
