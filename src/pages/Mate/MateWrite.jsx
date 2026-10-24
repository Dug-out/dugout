import {useState} from "react";
import {useNavigate} from "react-router";
import {createMatePost} from "../../api/mate.js";
import {Button, Chip, Field, Icon, InlineMessage} from "../../components";
import {MATE_POST} from "../../constants/policy.js";
import useGoBack from "../../hooks/useGoBack.js";
import useMyTeam from "../../hooks/useMyTeam.js";
import MateGameSheet from "./components/MateGameSheet.jsx";
import MateImagePicker from "./components/MateImagePicker.jsx";
import {formatDay, formatTime, matchLabel} from "../../utils/mateFormat.js";
import "./MateWrite.css";

// 새 글의 처음 값
const EMPTY_FORM = {
    title: "",
    game: null,
    seat: "",
    capacity: MATE_POST.MEMBERS_MIN,
    ages: [],
    gender: "",
    description: "",
    image: null,
};

/** 모집 글 쓰기 · 제목, 경기, 좌석이 필수이고 나머지는 비워도 된다 */
function MateWrite() {
    // 작성에 성공하면 완료 화면으로 이동할 때 쓴다
    const navigate = useNavigate();

    // 입력한 값
    const [form, setForm] = useState(EMPTY_FORM);

    // 입력칸마다 쓰는 변경 함수 · set('title')(값) 은 title 칸만 바꾼다
    const set = (key) => (value) => setForm((prev) => ({...prev, [key]: value}));

    // 내 응원팀 · 경기 이름을 내 팀 먼저 쓸 때 쓴다
    const myTeam = useMyTeam();

    // 경기 선택 시트가 열려 있는지
    const [gameSheetOpen, setGameSheetOpen] = useState(false);

    // 올리는 중인지 (중복 클릭 방지)
    const [busy, setBusy] = useState(false);
    // 버튼 위에 보여줄 오류 문구
    const [error, setError] = useState("");

    // 하나만 고르는 칸(좌석, 성별) · 고른 것을 다시 누르면 해제
    const pickOne = (key, value) => set(key)(form[key] === value ? "" : value);

    // 나이대는 여러 개 · 순서는 항상 10대 → 40대 이상
    const toggleAge = (age) => set("ages")(MATE_POST.AGES.filter((a) => (a === age) !== form.ages.includes(a)));

    // 필수 칸(제목, 경기, 좌석)이 채워졌는지
    const ready = form.title.trim() && form.game && form.seat;
    const canSubmit = ready && !busy;

    // 닫기(✕) · 이전 화면으로, 주소로 바로 들어왔으면 홈으로
    const close = useGoBack();

    // 올리기 버튼을 눌렀을 때 · 성공하면 새 글 상세 화면으로 이동하고, 실패하면 오류 문구를 보여 준다
    const submit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true);
        setError("");
        try {
            const {id} = await createMatePost({
                gameId: form.game.id,
                title: form.title,
                seat: form.seat,
                capacity: form.capacity,
                ages: form.ages,
                gender: form.gender || "무관",
                description: form.description,
                image: form.image,
            });
            navigate(`/mate/${id}`, {replace: true, state: {created: true}});
        } catch (failure) {
            setError(failure.message);
            setBusy(false);
        }
    };

    return (
        <div className="mate-write">
            {/* 닫기(✕) 헤더 · 공통 Header 는 뒤로가기(←)만 있어서 직접 그린다 */}
            <header className="mate-write__header">
                <button type="button" className="mate-write__close" aria-label="닫기" onClick={close}>
                    <Icon name="close" size={22}/>
                </button>
                <h1 className="mate-write__heading">모집 글 쓰기</h1>
            </header>

            {/* noValidate: 브라우저 기본 검사 말풍선 대신 화면 안내를 쓴다 */}
            <form className="mate-write__form" onSubmit={submit} noValidate>
                {/* 대표 이미지 (선택) · 올릴 때 함께 저장된다 */}
                <MateImagePicker onChange={set("image")}/>

                {/* 제목 · 50자까지 */}
                <Field
                    id="mate-write-title"
                    label="제목"
                    placeholder="예) 목요일 퇴근 직관 같이 가요!"
                    maxLength={MATE_POST.TITLE_MAX}
                    value={form.title}
                    onChange={(e) => set("title")(e.target.value)}
                />

                {/* 경기 선택 · 누르면 경기 선택 시트가 열린다 */}
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
                        <Icon name="calendar" size={20} strokeWidth={1.8}/>
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
                        <Icon name="chevronRight" size={18}/>
                    </button>
                </div>

                {/* 좌석 · 하나만 */}
                <ChipGroup label="좌석">
                    {MATE_POST.SEATS.map((seat) => (
                        <Chip key={seat} variant="select" selected={form.seat === seat}
                              onClick={() => pickOne("seat", seat)}>
                            {seat}
                        </Chip>
                    ))}
                </ChipGroup>

                {/* 모집 인원 · 본인 포함 2~10명 */}
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
                        {/* aria-live: 숫자가 바뀌면 화면 읽기 프로그램이 읽는다 */}
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

                {/* 나이대 · 여러 개, 안 고르면 무관 */}
                <ChipGroup label="나이대" sub="(여러 개 선택 가능)">
                    {MATE_POST.AGES.map((age) => (
                        <Chip key={age} variant="select" selected={form.ages.includes(age)}
                              onClick={() => toggleAge(age)}>
                            {age}
                        </Chip>
                    ))}
                </ChipGroup>

                {/* 성별 · 하나만, 안 고르면 무관 */}
                <ChipGroup label="성별">
                    {MATE_POST.GENDERS.map((gender) => (
                        <Chip key={gender} variant="select" selected={form.gender === gender}
                              onClick={() => pickOne("gender", gender)}>
                            {gender}
                        </Chip>
                    ))}
                </ChipGroup>

                {/* 소개 · 500자까지 */}
                <Field
                    id="mate-write-description"
                    label="소개"
                    multiline
                    counter
                    rows={5}
                    maxLength={MATE_POST.DESCRIPTION_MAX}
                    placeholder="어떤 분과 직관하고 싶은지, 좌석은 어디인지 등 소개 글을 자세히 적어주세요."
                    value={form.description}
                    onChange={(e) => set("description")(e.target.value)}
                />

                {/* 하단 고정 버튼 · 필수 칸이 비어 있으면 누를 수 없고 안내가 나온다 */}
                <div className="mate-write__bottom">
                    {error && <InlineMessage tone="error">{error}</InlineMessage>}
                    {!ready && <InlineMessage>제목 · 경기 · 좌석을 채우면 올릴 수 있어요</InlineMessage>}
                    <Button type="submit" block disabled={!canSubmit}>
                        {busy ? "올리는 중…" : "모집 글 올리기"}
                    </Button>
                </div>
            </form>

            {/* 경기 선택 시트 · 열 때마다 새로 만들어 최신 경기를 불러온다 */}
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

/** 칩 묶음 · 라벨 아래에 칩을 나열 */
function ChipGroup({label, sub, children}) {
    return (
        // role="group": 화면 읽기 프로그램이 칩을 한 묶음으로 읽는다
        <div className="mate-write__group" role="group" aria-label={label}>
      <span className="mate-write__label">
        {label} {sub && <small>{sub}</small>}
      </span>
            <div className="mate-write__chips">{children}</div>
        </div>
    );
}

export default MateWrite;
