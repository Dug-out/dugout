import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Header } from "../../components";
// Icon은 components/index.js 에서 내보내지 않아서 파일에서 직접 가져온다
import Icon from "../../components/Icon/Icon.jsx";
import { MATE_POST } from "../../constants/policy.js";
import MateCreatedDialog from "./components/MateCreatedDialog.jsx";
import MateIcon from "./components/MateIcon.jsx";
import "./MateDetail.css";

const DEFAULT_AVATAR = "/assets/profile-default.png"; // 프로필 사진이 없을 때 (Brand-assets: 모든 프로필 자리)
const TOAST_MS = 2000; // "링크를 복사했어요" 안내가 떠 있는 시간

/**
 * [1단계 · 화면 틀] 화면에 보일 내용 · 지금은 고정 글자
 * 사람이 쓰는 글 칸은 "○○ 들어갈곳", 숫자 · 날짜는 디자인 예시 값
 * → 2단계에서 글 하나를 읽는 함수(getMatePost)가 생기면 이 값 대신 실제 글 내용을 넣는다
 */
const SAMPLE_POST = {
  imageUrl: null,
  isOpen: true,
  title: "모집 글 제목 들어갈곳",
  host: { nickname: "닉네임 들어갈곳", avatarUrl: null, manner: ".250" },
  gameText: "10.22 (목) 18:30 LG vs 두산",
  stadium: "구장 이름 들어갈곳",
  agesText: "20대 · 30대",
  gender: "무관",
  seat: "응원석",
  joined: 1,
  capacity: 4,
  description: "모집 글 소개 들어갈곳\n\n방장이 쓴 소개가\n줄바꿈 그대로 여기에 보여요.",
};

/**
 * 모집 글 상세 · 주소 /mate/:id (Mate-detail.dc.html)
 * 지금은 "글을 올린 직후 방장 본인이 보는 화면"만 만든다.
 * → 참여 신청 버튼 · 신청 시트 · 신청 대기 · 참여 확정은 빼고, 아래 고정 버튼도 두지 않는다
 *
 * 화면 구성: [헤더 ← · 공유] [대표 이미지] [배지 · 제목 · 방장] [정보 카드] [소개] [함께 가는 메이트]
 *
 * 완료 창: 글쓰기(MateWrite)가 저장에 성공하면 navigate(..., {state: {created: true}})로 이 화면에 온다.
 * state: 주소에는 안 보이고 화면 이동에만 실려 오는 값 → 이 값이 있을 때만 "모집 글을 올렸어요!"를 띄운다.
 */
function MateDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const post = SAMPLE_POST;

  // ── 올리기 완료 창 ──
  // 글쓰기에서 막 넘어왔으면 완료 창을 연 채로 시작
  const [createdOpen, setCreatedOpen] = useState(Boolean(location.state?.created));

  // 완료 창 닫기 · 실려 온 state도 지운다 (새로고침하거나 뒤로 갔다 와도 다시 뜨지 않게)
  const closeCreated = () => {
    setCreatedOpen(false);
    navigate(location.pathname, { replace: true, state: null });
  };

  // ── 화면 아래 잠깐 뜨는 안내 ("링크를 복사했어요") ──
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const showToast = (text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_MS);
  };

  // 뒤로가기 · 이전 화면이 있으면 그리로, 주소로 바로 들어왔으면 홈으로
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/home", { replace: true });
  };

  // 공유 · 휴대폰은 공유 창(카카오톡 · 문자 등), 공유 창이 없는 브라우저는 주소 복사
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch {
        // 공유 창에서 사용자가 취소한 경우 · 아무것도 하지 않는다
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("링크를 복사했어요");
    } catch {
      showToast("링크를 복사하지 못했어요");
    }
  };

  const left = post.capacity - post.joined; // 남은 자리
  const percent = Math.min(100, (post.joined / post.capacity) * 100); // 인원 막대 길이

  return (
    <div className="mate-detail">
      <Header
        title=""
        onBack={goBack}
        right={
          <button type="button" className="mate-detail__share" aria-label="공유" onClick={share}>
            <MateIcon name="share" size={22} strokeWidth={1.8} />
          </button>
        }
      />

      {/* 대표 이미지 · 없으면 기본 이미지 · 꾸밈 사진이라 alt 비움 */}
      <img className="mate-detail__hero" src={post.imageUrl || MATE_POST.DEFAULT_IMAGE} alt="" width="390" height="220" />

      {/* 배지 · 제목 · 방장 */}
      <section className="mate-detail__top">
        <span className={`mate-detail__badge${post.isOpen ? "" : " mate-detail__badge--closed"}`}>{post.isOpen ? "모집 중" : "모집 마감"}</span>
        <h1 className="mate-detail__title">{post.title}</h1>
        {/* 방장 줄 · 디자인은 누르면 프로필로 가는 링크(›)인데, 프로필 화면이 아직 없어서 보여 주기만 */}
        <div className="mate-detail__host">
          <img src={post.host.avatarUrl || DEFAULT_AVATAR} alt="" width="40" height="40" />
          <span className="mate-detail__host-text">
            <span className="mate-detail__host-name">
              {post.host.nickname}
              <span className="mate-detail__host-tag">방장</span>
            </span>
            <span className="mate-detail__host-manner">
              매너 타율 <strong>{post.host.manner}</strong>
            </span>
          </span>
        </div>
      </section>

      <main className="mate-detail__body">
        {/* 정보 카드 · [아이콘] [이름 52px] [값] 다섯 줄 */}
        <dl className="mate-detail__info">
          <InfoRow icon={<Icon name="calendar" size={20} strokeWidth={1.8} />} label="경기">
            {post.gameText}
            <span className="mate-detail__info-sub">{post.stadium}</span>
          </InfoRow>
          <InfoRow icon={<Icon name="my" size={20} strokeWidth={1.8} />} label="나이대">
            {post.agesText}
          </InfoRow>
          <InfoRow icon={<Icon name="my" size={20} strokeWidth={1.8} />} label="성별">
            {post.gender}
          </InfoRow>
          <InfoRow icon={<MateIcon name="seat" size={20} strokeWidth={1.8} />} label="좌석">
            {post.seat}
          </InfoRow>
          <InfoRow icon={<Icon name="mate" size={20} strokeWidth={1.8} />} label="인원">
            {post.joined} / {post.capacity}명
            <span className="mate-detail__bar" aria-hidden="true">
              <span style={{ width: `${percent}%` }} />
            </span>
          </InfoRow>
        </dl>

        {/* 소개 · 방장이 쓴 줄바꿈을 그대로 보여 준다 (CSS white-space: pre-line) */}
        <section className="mate-detail__section">
          <h2 className="mate-detail__h2">소개</h2>
          <p className="mate-detail__description">{post.description}</p>
        </section>

        {/* 함께 가는 메이트 · 방금 올린 글이라 방장(나) 1명 + 빈 자리 */}
        <section className="mate-detail__section">
          <h2 className="mate-detail__h2">함께 가는 메이트 {post.joined}</h2>
          <ul className="mate-detail__members">
            <li className="mate-detail__member mate-detail__member--me">
              <span className="mate-detail__avatar">
                <img src={post.host.avatarUrl || DEFAULT_AVATAR} alt="" width="48" height="48" />
                {/* 보는 사람이 방장 본인이라 남색 테두리 + "나" 표시 (Mate-detail-ok 모양) */}
                <span className="mate-detail__me-tag">나</span>
              </span>
              <span className="mate-detail__member-name">{post.host.nickname}</span>
            </li>
            {/* 빈 자리 · 남은 자리 수를 점선 원 하나에 "+3"으로 */}
            {left > 0 && (
              <li className="mate-detail__member">
                <span className="mate-detail__empty-seat">+{left}</span>
                <span className="mate-detail__member-name mate-detail__member-name--empty">빈 자리</span>
              </li>
            )}
          </ul>
        </section>
      </main>

      {/* 올리기 완료 창 */}
      <MateCreatedDialog open={createdOpen} onClose={closeCreated} />

      {/* 안내 문구 · role="status": 화면 읽기 프로그램이 문구를 읽어 준다 */}
      {toast && (
        <p className="mate-detail__toast" role="status">
          {toast}
        </p>
      )}
    </div>
  );
}

/** 정보 카드 한 줄 · <dt>이름 <dd>값 (이름-값 목록을 뜻하는 HTML 태그) */
function InfoRow({ icon, label, children }) {
  return (
    <div className="mate-detail__info-row">
      {icon}
      <dt className="mate-detail__info-label">{label}</dt>
      <dd className="mate-detail__info-value">{children}</dd>
    </div>
  );
}

export default MateDetail;
