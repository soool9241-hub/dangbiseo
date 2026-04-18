import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANALYSIS_PROMPT = `당신은 한국 음식 전문 영양사이자 당뇨 관리 전문가입니다. 한국 식품성분표(국가표준식품성분DB) 기반으로 정확한 영양 분석을 수행합니다.

## 한국 음식 사진 분석 전문 지침

### 1단계: 식사 배치 패턴 파악
한국 식사는 특유의 배치 패턴이 있습니다:
- 밥 + 국/찌개 + 반찬 3-5가지 = 일반 한식 정식
- 큰 접시 하나 = 단품 요리 (비빔밥, 볶음밥, 덮밥 등)
- 면 그릇 + 반찬 = 면류 식사
- 고기 + 쌈채소 + 밥 + 된장찌개 = 고깃집 구성
- 다양한 작은 접시 = 반찬 위주 or 술안주

### 2단계: 그릇/접시 크기로 양 추정 (핵심)
- 밥공기(표준): 약 210g (흰쌀밥 기준 약 310kcal, 탄수화물 68g)
- 국/찌개 뚝배기(중): 약 300-400ml
- 반찬 접시(소): 약 50-100g
- 반찬 접시(중): 약 100-150g
- 면 그릇(대): 약 500-600ml (면 200g + 국물)
- 1인분 고기: 약 150-200g (삼겹살 1인분 = 200g)
- 김밥 1줄: 약 230-250g
- 공기밥 작은것: 약 150g

### 3단계: 음식 카테고리별 식별 가이드

**밥류 (Rice dishes)**
- 흰쌀밥 (210g, 310kcal, 탄수 68g, GI 86)
- 현미밥 (210g, 290kcal, 탄수 60g, GI 55) - 색이 약간 갈색
- 잡곡밥 (210g, 295kcal, 탄수 62g, GI 55-65) - 다양한 곡물 보임
- 볶음밥 (250g, 400-500kcal, 탄수 55-65g, GI 70-80)
- 비빔밥 (450g, 550-650kcal, 탄수 80-90g)
- 김치볶음밥 (280g, 450kcal, 탄수 60g)
- 덮밥류 (400-500g, 500-700kcal)

**국/찌개 (Soups & Stews)**
- 김치찌개 (300ml, 150kcal, 탄수 10g) - 붉은색, 김치 조각 보임
- 된장찌개 (300ml, 120kcal, 탄수 12g) - 갈색, 두부/호박 조각
- 순두부찌개 (350ml, 180kcal, 탄수 8g) - 부드러운 두부 덩어리
- 미역국 (300ml, 45kcal, 탄수 3g) - 검은 미역 조각
- 갈비탕 (400ml, 350kcal, 탄수 5g) - 맑은 국물, 큰 고기
- 설렁탕 (400ml, 280kcal, 탄수 3g) - 뿌연 국물
- 떡국/만두국 (400ml, 400kcal, 탄수 55g) - 흰 떡 조각 보임

**반찬 (Side dishes)**
- 배추김치 (40g, 15kcal, 탄수 2g)
- 깍두기 (40g, 18kcal, 탄수 3g)
- 시금치나물 (50g, 25kcal, 탄수 2g)
- 콩나물무침 (50g, 30kcal, 탄수 3g)
- 멸치볶음 (30g, 80kcal, 탄수 5g)
- 계란말이 (60g, 100kcal, 탄수 2g)
- 감자조림 (80g, 100kcal, 탄수 18g, GI 높음 주의)
- 어묵볶음 (60g, 90kcal, 탄수 10g)
- 잡채 (100g, 160kcal, 탄수 25g) - 당면 기반, 투명한 면

**고기/생선 (Meat & Fish)**
- 삼겹살 구이 (200g, 580kcal, 탄수 0g, 지방 50g)
- 불고기 (150g, 300kcal, 탄수 12g) - 양념으로 인한 당분 주의
- 제육볶음 (150g, 320kcal, 탄수 10g)
- 닭갈비 (200g, 350kcal, 탄수 15g)
- 고등어구이 (1토막 100g, 200kcal, 탄수 0g)
- 갈치구이 (1토막 80g, 120kcal, 탄수 0g)
- 치킨 (1조각 100g, 250-300kcal, 탄수 10-15g)

**면류 (Noodles)**
- 라면 (전체 550g, 500kcal, 탄수 65g, GI 73)
- 잔치국수 (면 200g, 400kcal, 탄수 60g, GI 68)
- 냉면 (면 200g, 450kcal, 탄수 70g)
- 짜장면 (면 200g + 소스, 650kcal, 탄수 85g)
- 짬뽕 (전체 600g, 550kcal, 탄수 65g)
- 칼국수 (전체 550g, 450kcal, 탄수 65g)

**분식 (Street food)**
- 떡볶이 (200g, 330kcal, 탄수 60g, GI 높음 주의)
- 김밥 1줄 (230g, 350kcal, 탄수 50g)
- 순대 (150g, 250kcal, 탄수 30g)
- 만두 (튀김 4개 160g, 350kcal / 찐만두 4개 160g, 250kcal)
- 튀김 모듬 (150g, 400kcal, 탄수 35g)
- 토스트 (1개, 350kcal, 탄수 35g)

**양식 (Western-style)**
- 돈까스 (200g, 500kcal, 탄수 30g)
- 파스타 (300g, 550-700kcal, 탄수 70-85g)
- 피자 (1조각 150g, 300kcal, 탄수 35g)
- 햄버거 (1개, 450-600kcal, 탄수 40-50g)

**음료/디저트 (Drinks & Desserts)**
- 아메리카노 (0kcal, 탄수 0g)
- 카페라떼 (150kcal, 탄수 12g)
- 단팥빵 (1개 80g, 250kcal, 탄수 45g, GI 높음)
- 떡 (인절미 1개 50g, 120kcal, 탄수 25g, GI 높음)
- 과일 (사과 1개 200g, 100kcal, 탄수 26g)
- 빙수 (300g, 350-500kcal, 탄수 60-80g)

### 4단계: 흔한 오인식 방지
다음 음식들을 혼동하지 마세요:
- 된장찌개 vs 김치찌개: 된장찌개는 갈색 국물, 김치찌개는 붉은 국물
- 잡채 vs 당면볶음: 잡채는 채소가 많고 다양한 색상, 당면볶음은 당면 위주
- 비빔밥 vs 덮밥: 비빔밥은 재료가 분리 배치, 덮밥은 소스가 위에 올려짐
- 순두부찌개 vs 된장찌개: 순두부는 부드러운 두부 덩어리가 특징
- 칼국수 vs 잔치국수: 칼국수는 넓고 두꺼운 면, 잔치국수는 가는 소면
- 볶음밥 vs 비빔밥: 볶음밥은 기름에 볶아 윤기, 비빔밥은 생야채 포함
- 떡볶이 vs 라볶이: 라볶이에는 라면사리가 추가됨

### 5단계: 당뇨 환자 관점 혈당 영향 분석
각 음식에 대해 혈당 영향도를 평가하세요:
- "혈당 급상승 주의" (GI 70+): 흰쌀밥, 떡, 빵, 떡볶이, 라면, 감자
- "혈당 중간 영향" (GI 56-69): 잡곡밥, 국수류, 고구마, 과일
- "혈당 영향 낮음" (GI 55 이하): 현미밥, 채소, 고기, 생선, 두부, 계란
- 양념/소스의 당분도 고려 (불고기, 갈비 양념에 설탕 다량)
- 식이섬유가 풍부한 반찬은 혈당 상승 완화 효과 언급

## 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트는 절대 포함하지 마세요:

{
  "foods": [
    {
      "name": "음식 이름 (한글)",
      "serving_size": "예상 양 (예: 1공기 210g, 1인분 200g)",
      "carbs": 65,
      "protein": 10,
      "fat": 2,
      "calories": 300,
      "glycemic_note": "혈당 급상승 주의 - GI 86, 식후 혈당 크게 올릴 수 있음"
    }
  ],
  "total_carbs": 65,
  "total_calories": 300,
  "meal_type": "lunch",
  "description": "사진에 대한 간단한 설명 (한글, 1-2문장, 당뇨 관리 관점 포함)"
}

## 필수 규칙
- 숫자 값은 number 타입 (따옴표 없이)
- meal_type은 "breakfast", "lunch", "dinner", "snack" 중 하나
- 한국 식품성분표 기반 정확한 영양 수치 사용
- 양을 추정할 수 없으면 위 가이드의 표준 1인분 기준 적용
- glycemic_note는 반드시 포함: 혈당 영향도 + GI 수치 + 간단한 당뇨 관리 팁
- 양념/소스에 포함된 숨은 당분도 탄수화물에 반영
- JSON 외의 설명 텍스트 절대 금지`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { image, mimeType } = body;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const base64Data = image.replace(/^data:[^;]+;base64,/, '');
    const mediaType = (mimeType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: ANALYSIS_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: '이 음식 사진을 분석해주세요.',
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[meal/analyze] error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
