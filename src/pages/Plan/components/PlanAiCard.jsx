import './PlanAiCard.css'

/**
 * AI 경기 포인트 말풍선 · "덕아웃 AI" 이름 줄, 강조 문구(빨강) + 이어지는 한 문장, 태그
 * @param {{ai: {highlight: string, point: string, tags: string[], sourceCount: number}}} props
 */
function PlanAiCard({ai}) {
    const {highlight, point, tags, sourceCount} = ai

    return (
        <section className="plan-ai" aria-label="AI 경기 포인트">
            <span className="plan-ai__name">
                덕아웃 AI
                <span className="plan-ai__source">기사 {sourceCount}건 찾아봤어요</span>
            </span>
            <div className="plan-ai__bubble">
                <p className="plan-ai__text">
                    <b className="plan-ai__highlight">{highlight}</b> {point}
                </p>
                <div className="plan-ai__tags">
                    {tags.map((tag) => (
                        <span key={tag} className="plan-ai__tag">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default PlanAiCard
