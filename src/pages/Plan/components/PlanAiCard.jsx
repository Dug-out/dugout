import Icon from '../../../components/Icon/Icon.jsx'
import './PlanAiCard.css'

/**
 * AI 경기 포인트 카드 · "덕아웃 AI 분석" 머리줄, 강조 문구 + 이어지는 한 문장, 분석 키워드(태그), 안내 한 줄
 * @param {{ai: {highlight: string, point: string, tags: string[], sourceCount: number}}} props
 */
function PlanAiCard({ai}) {
    const {highlight, point, tags, sourceCount} = ai

    return (
        <section className="plan-ai" aria-label="AI 경기 포인트">
            <div className="plan-ai__inner">
                {/* 오른쪽 위 흐린 반짝이 장식 */}
                <Icon name="sparkle" size={96} strokeWidth={1.2} className="plan-ai__deco" />

                <div className="plan-ai__head">
                    <span className="plan-ai__badge">
                        <Icon name="sparkle" size={15} strokeWidth={2.2} />
                    </span>
                    <span className="plan-ai__name">덕아웃 AI 분석</span>
                    <span className="plan-ai__source">
                        <Icon name="check" size={12} strokeWidth={3} />
                        기사 {sourceCount}건 분석
                    </span>
                </div>

                <p className="plan-ai__headline">{highlight}</p>
                <p className="plan-ai__point">{point}</p>

                <div className="plan-ai__tags">
                    {tags.map((tag) => (
                        <span key={tag} className="plan-ai__tag">
                            #{tag}
                        </span>
                    ))}
                </div>

                <p className="plan-ai__note">
                    <Icon name="info" size={13} />
                    AI가 기사와 경기 일정을 분석한 결과예요. 실제와 다를 수 있어요.
                </p>
            </div>
        </section>
    )
}

export default PlanAiCard
