import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PARSE_PROMPT = `당신은 당뇨 환자의 건강 기록을 텍스트에서 추출하는 AI입니다.
사용자가 자유 형식으로 입력한 텍스트를 분석하여, 해당하는 기록 유형별로 구조화된 데이터를 반환하세요.

## 기록 유형별 추출 규칙

### 1. glucose (혈당)
- 키워드: 혈당, 혈당수치, mg/dL, 공복, 식전, 식후, 취침전
- timing 값: fasting(공복), before_meal(식전), after_meal(식후), before_exercise(운동전), after_exercise(운동후), before_sleep(취침전)
- 예: "혈당 120" → value: 120

### 2. insulin (인슐린)
- 키워드: 인슐린, 단위, U, 노보래피드, 휴마로그, 란투스, 트레시바, 레버미어, 투제오, 피아스프, 애피드라
- insulin_type: rapid(속효성: 노보래피드,휴마로그,피아스프,애피드라), long(지속성: 트레시바,란투스,레버미어,투제오)
- injection_site: abdomen(배), thigh(허벅지), arm(팔), hip(엉덩이)
- 예: "노보래피드 4단위 배에" → insulin_name: "노보래피드", dose: 4, injection_site: "abdomen"

### 3. meal (식단)
- 키워드: 먹었, 식사, 아침, 점심, 저녁, 간식, 밥, 빵, 라면 등 음식 이름
- meal_type: breakfast(아침), lunch(점심), dinner(저녁), snack(간식)
- 탄수화물(g), 칼로리(kcal) 추정
- 예: "점심에 김치찌개랑 밥 먹음" → meal_type: "lunch", total_carbs: 75

### 4. exercise (운동)
- 키워드: 운동, 걷기, 달리기, 수영, 헬스, 웨이트, 자전거, 요가, 댄스, 격투기
- exercise_type: weight(웨이트), cardio(유산소), swimming(수영), dance(댄스), martial_arts(격투기), yoga(요가), walking(걷기), cycling(자전거), other(기타)
- intensity: low(가벼움), moderate(보통), high(격렬)
- 예: "30분 걸었어" → exercise_type: "walking", duration_minutes: 30, intensity: "low"

### 5. mood (기분)
- 키워드: 기분, 컨디션, 스트레스, 힘들, 좋은, 나쁜, 우울, 최고, 짜증
- mood: great(최고), good(좋음), neutral(보통), bad(나쁨), terrible(최악)
- stress_level: 1-5 (1=낮음, 5=높음)
- factors: work(업무), sleep(수면), exercise(운동), relationship(관계), food(음식), weather(날씨), glucose(혈당), other(기타)
- 예: "오늘 기분 좋아 스트레스 없음" → mood: "good", stress_level: 1

## 응답 형식

반드시 아래 JSON 형식으로만 응답하세요:

{
  "records": {
    "glucose": null 또는 { "value": 120, "timing": "fasting", "source": "manual", "note": null },
    "insulin": null 또는 { "insulin_name": "노보래피드", "insulin_type": "rapid", "dose": 4, "injection_site": "abdomen", "note": null },
    "meal": null 또는 { "meal_type": "lunch", "total_carbs": 75, "total_calories": 450, "note": "김치찌개, 밥" },
    "exercise": null 또는 { "exercise_type": "walking", "duration_minutes": 30, "intensity": "low", "calories_burned": null, "carb_supplement": null, "note": null },
    "mood": null 또는 { "mood": "good", "stress_level": 2, "factors": ["work"], "note": null }
  },
  "summary": "인식된 내용 요약 (한글, 1줄)"
}

## 중요 규칙
- 텍스트에서 언급되지 않은 기록 유형은 null
- 숫자 값은 number 타입
- 한국 음식 영양 정보는 정확하게
- 애매한 경우 합리적으로 추정
- JSON 외의 텍스트 절대 금지
- 여러 기록 유형이 동시에 있을 수 있음`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { text, type } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    let systemPrompt = PARSE_PROMPT;

    // If a specific type is given, focus on that type only
    if (type && ['glucose', 'insulin', 'meal', 'exercise', 'mood'].includes(type)) {
      systemPrompt += `\n\n추가 지시: 이 텍스트는 "${type}" 기록을 위한 입력입니다. "${type}" 유형에 집중하여 분석하세요. 다른 유형도 명확히 언급되어 있다면 함께 추출하세요.`;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `사용자 입력: ${text.trim()}` },
    ]);

    const responseText = result.response.text();

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

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[record/parse] error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
