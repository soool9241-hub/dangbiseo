import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PARSE_PROMPT = `당신은 당뇨 환자의 하루 건강 기록을 텍스트에서 추출하는 AI입니다.
사용자가 자유 형식으로 입력한 텍스트를 분석하여, **모든 기록을 빠짐없이** 추출하세요.

## 핵심: 같은 유형이 여러 번 나오면 모두 배열로 추출!
- 혈당이 10번 측정되었으면 glucose 배열에 10개
- 인슐린이 3번 맞았으면 insulin 배열에 3개
- 식사/간식이 5번이면 meal 배열에 5개
- 하나도 빠뜨리지 마세요!

## 기록 유형별 추출 규칙

### glucose (혈당)
- 키워드: 혈당, 당수치, mg/dL, 공복, 식전, 식후, 취침전, 당체크
- timing: fasting(공복), before_meal(식전), after_meal(식후), before_exercise(운동전), after_exercise(운동후), before_sleep(취침전), other(기타)
- 숫자만 있어도 맥락상 혈당이면 추출 (예: "10시ㅡ72" → 혈당 72)

### insulin (인슐린)
- 키워드: 인슐린, 단위, U, 노보(노보래피드), 휴마(휴마로그), 란투스, 트레시바, 레버미어, 투제오, 피아스프, 애피드라
- insulin_type: rapid(속효성: 노보래피드/노보,휴마로그,피아스프,애피드라), long(지속성: 트레시바,란투스,레버미어,투제오)
- "노보 20" = 노보래피드 20단위, "트레시바20" = 트레시바 20단위
- injection_site: abdomen(배), thigh(허벅지), arm(팔), hip(엉덩이) - 없으면 "abdomen"

### meal (식단)
- 키워드: 식사, 식시, 먹었, 아침, 점심, 저녁, 간식, 음식 이름
- meal_type: breakfast(아침/오전식사), lunch(점심), dinner(저녁), snack(간식/간단한 음식)
- **음식 이름이 나오면 무조건 meal로 추출!**
  - 버터떡, 떡, 빵, 과자, 라면, 순두부, 김치찌개 등 = meal
  - 두유, 라떼, 라때, 커피, 음료, 주스 등 음료류 = meal (snack)
  - "식사", "식시" = meal (구체적 메뉴 없어도 추출)
- 간식 판단: 식사 시간(7시/12시/18시 근처) 아니면 snack
- 탄수화물(g), 칼로리(kcal) 한국 음식 기준으로 정확하게 추정
- note에 음식 이름 반드시 기재
- **절대 누락 금지**: 텍스트에 음식 이름이 있으면 반드시 meal 배열에 포함

### exercise (운동)
- exercise_type: weight/cardio/swimming/dance/martial_arts/yoga/walking/cycling/other
- intensity: low/moderate/high

### mood (기분)
- mood: great/good/neutral/bad/terrible
- stress_level: 1-5

## 시간 인식 규칙 (매우 중요!)
- 모든 기록에 시간을 반드시 추출
- "새벽 12시19분" → "00:19", "오전 7시" → "07:00", "7시30분" → "07:30"
- "10시" → "10:00", "12시25분" → "12:25", "6시40분" → "18:40"
- "오후 3시" → "15:00", "밤 11시" → "23:00"
- 시간 없으면 time: null

## 응답 형식

반드시 아래 JSON 형식으로만 응답하세요. 각 유형은 **배열**입니다:

{
  "records": {
    "glucose": [
      { "value": 130, "timing": "other", "source": "manual", "note": null, "time": "00:19" },
      { "value": 91, "timing": "fasting", "source": "manual", "note": "공복혈당", "time": "07:30" }
    ],
    "insulin": [
      { "insulin_name": "트레시바", "insulin_type": "long", "dose": 20, "injection_site": "abdomen", "note": null, "time": "07:30" },
      { "insulin_name": "노보래피드", "insulin_type": "rapid", "dose": 20, "injection_site": "abdomen", "note": null, "time": "07:30" }
    ],
    "meal": [
      { "meal_type": "breakfast", "total_carbs": 60, "total_calories": 400, "note": "아침 식사", "time": "07:30" },
      { "meal_type": "snack", "total_carbs": 25, "total_calories": 150, "note": "버터떡 1개", "time": "10:00" }
    ],
    "exercise": [],
    "mood": []
  },
  "summary": "인식된 내용 요약 (한글, 1줄)",
  "total_count": 6
}

## 중요 규칙
- 각 유형은 반드시 배열 (비어있으면 빈 배열 [])
- 같은 시간에 여러 기록이 있을 수 있음 (예: 7시30분에 인슐린+식사 동시)
- 숫자 값은 number 타입
- time 필드는 "HH:mm" 형식 (24시간제)
- "노보20" = 노보래피드 20단위로 해석
- "식사" 또는 "식시"는 meal로 추출 (구체적 메뉴 없으면 note에 "식사"로)
- 한국 음식 영양 정보는 정확하게
- total_count에 전체 추출된 기록 수 기재
- JSON 외의 텍스트 절대 금지`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { text, type } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    let systemPrompt = PARSE_PROMPT;

    if (type && ['glucose', 'insulin', 'meal', 'exercise', 'mood'].includes(type)) {
      systemPrompt += `\n\n추가 지시: 이 텍스트는 "${type}" 기록을 위한 입력입니다. "${type}" 유형에 집중하여 분석하세요. 다른 유형도 명확히 언급되어 있다면 함께 추출하세요.`;
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        { role: 'user', content: `사용자 입력: ${text.trim()}` },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response', raw: responseText }, { status: 500 });
      }
    }

    // Normalize: ensure arrays (backwards compat with old single-object format)
    if (parsed.records) {
      for (const key of ['glucose', 'insulin', 'meal', 'exercise', 'mood']) {
        const val = parsed.records[key];
        if (val === null || val === undefined) {
          parsed.records[key] = [];
        } else if (!Array.isArray(val)) {
          parsed.records[key] = [val];
        }
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[record/parse] error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
