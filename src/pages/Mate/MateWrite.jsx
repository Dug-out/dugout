import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { createMatePost, getMyTeam } from "../../api/mate.js";
import { Button, Chip, Field, InlineMessage } from "../../components";
// Icon은 components/index.js 에서 내보내지 않아서 파일에서 직접 가져온다
import Icon from "../../components/Icon/Icon.jsx";
import { MATE_POST } from "../../constants/policy.js";
import MateGameSheet from "./components/MateGameSheet.jsx";
import MateIcon from "./components/MateIcon.jsx";
import { formatDay, formatTime, matchLabel } from "./utils/mateFormat.js";
import "./MateWrite.css";

/** 새 글의 처음 값 */
const EMPTY_FORM = {
  title: "",
  game: null,
  seat: "",
  capacity: MATE_POST.MEMBERS_MIN,
  ages: [],
  gender: "",
  description: "",
};

/**
 * 모집 글 쓰기 · 주소 /mate/write (Mate-write.dc.html)
 *
 * 입력 순서 (디자인 그대로): 대표 이미지(선택) → 제목 → 경기 선택 → 좌석 → 모집 인원 → 나이대 → 성별 → 소개
 * 필수: 제목 · 경기 · 좌석 (DB 규칙에서 성별 · 소개는 비워도 된다)
 *
 * 🔌 DB: DB 담당자가 만든 src/api/mate.js 를 그대로 쓴다 (이 화면은 그 파일을 고치지 않음)
 *  - getMyTeam()          내 응원팀 · 경기 이름을 "LG vs 두산"처럼 내 팀 먼저 쓰려고
 *  - getSelectableGames() 경기 선택 시트 (MateGameSheet.jsx)
 *  - createMatePost()     모집 글 올리기 · 방장과 팀은 함수가 알아서 채운다
 */
function MateWrite() {
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);

  // set('title')(값) 처럼 칸 이름을 넣으면 그 칸만 바꾸는 함수를 만든다
  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  // 내 응원팀 · 못 불러와도 글쓰기는 할 수 있다 (경기 이름만 "홈 vs 원정" 순서로 보인다)
  const [myTeam, setMyTeam] = useState(null);

  useEffect(() => {
    let stale = false;
    getMyTeam()
      .then((team) => !stale && setMyTeam(team))
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, []);

  const [gameSheetOpen, setGameSheetOpen] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 좌석 · 성별: 하나만 · 이미 고른 것을 다시 누르면 해제 (디자인 동작)
  const pickOne = (key, value) => set(key)(form[key] === value ? "" : value);

  // 나이대: 여러 개 · 순서는 항상 10대 → 40대 이상으로 맞춘다
  const toggleAge = (age) => set("ages")(MATE_POST.AGES.filter((a) => (a === age) !== form.ages.includes(a)));

  // 필수 3칸(제목, 선택한경기, 좌석)
  const ready = form.title.trim() && form.game && form.seat;
  const canSubmit = ready && !busy;

  // 닫기(✕) · 들어온 화면으로 돌아간다 · 이전 화면이 없으면(주소로 바로 들어옴) 홈으로
  const close = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate("/home", { replace: true });
  };

  // 모집 글 올리기 → 성공하면 새 글의 상세 화면으로
  const submit = async (e) => {
    e.preventDefault(); // <form> 기본 동작(페이지 새로고침) 막기
    if (!canSubmit) return;
    setBusy(true);
    setError("");
    try {
      const { id } = await createMatePost({
        gameId: form.game.id,
        title: form.title,
        seat: form.seat,
        capacity: form.capacity,
        ages: form.ages,
        gender: form.gender || "무관",
        description: form.description,
        imageUrl: null, // 사진 올리기 함수가 아직 없어서 기본 이미지로 저장
      });
      // replace: 뒤로가기를 눌렀을 때 쓰기 화면으로 돌아오지 않게
      // state.created: 상세 화면(MateDetail)이 이 값을 보고 "모집 글을 올렸어요!" 완료 창을 띄운다
      navigate(`/mate/${id}`, { replace: true, state: { created: true } });
    } catch (failure) {
      // createMatePost가 화면에 그대로 보여 줘도 되는 문구로 오류를 낸다 (예: '입력한 내용을 다시 확인해 주세요')
      setError(failure.message);
      setBusy(false);
    }
  };

  return (
    <div className="mate-write">
      {/* 헤더 · 디자인은 뒤로가기(←) 대신 닫기(✕)라서 공통 Header 대신 같은 크기로 직접 그린다 */}
      <header className="mate-write__header">
        <button type="button" className="mate-write__close" aria-label="닫기" onClick={close}>
          <MateIcon name="close" size={22} />
        </button>
        <h1 className="mate-write__heading">모집 글 쓰기</h1>
      </header>

      {/* noValidate: 브라우저 기본 입력 검사 말풍선 대신 화면 안내를 쓴다 */}
      <form className="mate-write__form" onSubmit={submit} noValidate>
        {/* 대표 이미지 (선택) · 사진 올리기 함수가 아직 없어서 버튼만 두고 누를 수 없게 했다 */}
        <div className="mate-write__group">
          <span className="mate-write__label">
            대표 이미지 <small>(선택)</small>
          </span>
          <div className="mate-write__image-row">
            <button type="button" className="mate-write__add-photo" disabled>
              <MateIcon name="camera" size={24} strokeWidth={1.8} />
              사진 추가
            </button>
            <span className="mate-write__image-hint">
              사진 올리기는 준비 중이에요.
              <br />
              지금은 기본 이미지로 올라가요.
            </span>
          </div>
        </div>

        {/* 제목 · 기존 Field 컴포넌트 (높이 50 · radius 12 · 글자 16px) · 50자까지 (DB 규칙) */}
        <Field
          id="mate-write-title"
          label="제목"
          placeholder="예) 목요일 퇴근 직관 같이 가요!"
          maxLength={MATE_POST.TITLE_MAX}
          value={form.title}
          onChange={(e) => set("title")(e.target.value)}
        />

        {/* 경기 선택 · 누르면 경기 선택 시트 */}
        <div className="mate-write__group">
          <span className="mate-write__label" id="mate-write-game-label">
            경기 선택
          </span>
          <button
            type="button"
            className="mate-write__game"
            aria-haspopup="dialog"
            aria-labelledby="mate-write-game-label mate-write-game-value"
            onClick={() => setGameSheetOpen(true)}
          >
            <Icon name="calendar" size={20} strokeWidth={1.8} />
            <span id="mate-write-game-value" className="mate-write__game-text">
              {form.game ? (
                <>
                  {/* '10.22 (목) 18:30 · LG vs 두산' / 구장 */}
                  <span className="mate-write__game-main">
                    {formatDay(form.game.gameAt)} {formatTime(form.game.gameAt)} · {matchLabel(form.game, myTeam)}
                  </span>
                  <span className="mate-write__game-sub">{form.game.stadium}</span>
                </>
              ) : (
                <span className="mate-write__game-placeholder">같이 볼 경기를 골라 주세요</span>
              )}
            </span>
            <MateIcon name="chevronRight" size={18} />
          </button>
        </div>

        {/* 좌석 · 하나만 · 기존 Chip(select) 사용 */}
        <ChipGroup label="좌석">
          {MATE_POST.SEATS.map((seat) => (
            <Chip key={seat} variant="select" selected={form.seat === seat} onClick={() => pickOne("seat", seat)}>
              {seat}
            </Chip>
          ))}
        </ChipGroup>

        {/* 모집 인원 · − 숫자 + (본인 포함 2~10명) */}
        <div className="mate-write__count-row">
          <span className="mate-write__label">
            모집 인원 <small>(본인 포함)</small>
          </span>
          <div className="mate-write__stepper">
            <button
              type="button"
              aria-label="인원 줄이기"
              disabled={form.capacity <= MATE_POST.MEMBERS_MIN}
              onClick={() => set("capacity")(form.capacity - 1)}
            >
              −
            </button>
            {/* aria-live: 숫자가 바뀌면 화면 읽기 프로그램이 읽어 준다 */}
            <span className="mate-write__count" aria-live="polite">
              {form.capacity}명
            </span>
            <button
              type="button"
              aria-label="인원 늘리기"
              disabled={form.capacity >= MATE_POST.MEMBERS_MAX}
              onClick={() => set("capacity")(form.capacity + 1)}
            >
              +
            </button>
          </div>
        </div>

        {/* 나이대 · 여러 개 · 안 고르면 무관 */}
        <ChipGroup label="나이대" sub="(여러 개 선택 가능)">
          {MATE_POST.AGES.map((age) => (
            <Chip key={age} variant="select" selected={form.ages.includes(age)} onClick={() => toggleAge(age)}>
              {age}
            </Chip>
          ))}
        </ChipGroup>

        {/* 성별 · 하나만 · 안 고르면 무관 */}
        <ChipGroup label="성별">
          {MATE_POST.GENDERS.map((gender) => (
            <Chip key={gender} variant="select" selected={form.gender === gender} onClick={() => pickOne("gender", gender)}>
              {gender}
            </Chip>
          ))}
        </ChipGroup>

        {/* 소개 · 500자까지 (DB 규칙) · 글자 수 표시 */}
        <div className="mate-write__group">
          <label htmlFor="mate-write-description" className="mate-write__label">
            소개
          </label>
          <textarea
            id="mate-write-description"
            className="mate-write__description"
            rows={5}
            maxLength={MATE_POST.DESCRIPTION_MAX}
            aria-describedby="mate-write-description-count"
            placeholder="어떤 분과 직관하고 싶은지, 좌석은 어디인지 등 소개 글을 자세히 적어주세요."
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
          />
          <span id="mate-write-description-count" className="mate-write__count-text">
            {form.description.length}/{MATE_POST.DESCRIPTION_MAX}
          </span>
        </div>

        {/* 아래 고정 버튼 · 필수 칸이 비어 있으면 회색(누를 수 없음) + 안내 */}
        <div className="mate-write__bottom">
          {error && <InlineMessage tone="error">{error}</InlineMessage>}
          {!ready && <InlineMessage>제목 · 경기 · 좌석을 채우면 올릴 수 있어요</InlineMessage>}
          <Button type="submit" block disabled={!canSubmit}>
            {busy ? "올리는 중…" : "모집 글 올리기"}
          </Button>
        </div>
      </form>

      {/* 경기 선택 시트 · 열 때마다 새로 만들어서 최신 경기 목록을 불러온다 */}
      {gameSheetOpen && (
        <MateGameSheet
          myTeam={myTeam}
          selectedId={form.game?.id ?? null}
          onClose={() => setGameSheetOpen(false)}
          onPick={(game) => {
            set("game")(game);
            setGameSheetOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** 칩 묶음 · [라벨 (작은 설명)] 아래에 칩을 줄바꿈하며 나열 */
function ChipGroup({ label, sub, children }) {
  return (
    // role="group" + aria-label: 화면 읽기 프로그램이 "좌석 그룹"처럼 묶어서 읽는다
    <div className="mate-write__group" role="group" aria-label={label}>
      <span className="mate-write__label">
        {label} {sub && <small>{sub}</small>}
      </span>
      <div className="mate-write__chips">{children}</div>
    </div>
  );
}

export default MateWrite;
