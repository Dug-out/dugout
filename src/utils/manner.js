import {MANNER} from '../constants/policy.js'

// 매너 타율 .389 형태로 표시
export const formatManner = (value) => value.toFixed(3).replace(/^0/, '')

/**
 * 매너 타율 카드에 쓸 값 · 구간 이름, 막대 길이(0~1), 다음 구간까지 안내 문구
 * MANNER.TIERS 는 높은 구간부터 적혀 있어서 처음으로 맞는 구간이 지금 구간이고, 바로 앞 칸이 다음 구간이다.
 */
export function mannerSummary(manner) {
    const index = MANNER.TIERS.findIndex((tier) => manner >= tier.min)
    const tier = MANNER.TIERS[index]
    const next = MANNER.TIERS[index - 1]
    return {
        label: tier.label,
        progress: Math.min(1, Math.max(0, (manner - MANNER.MIN) / (MANNER.MAX - MANNER.MIN))),
        nextText: next ? `${next.label}까지 ${formatManner(next.min - manner)}` : '가장 높은 구간이에요',
    }
}
