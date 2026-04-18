import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANALYSIS_PROMPT = `당신은 음식 사진을 분석하는 영양 전문가입니다. 사진에 보이는 음식을 분석해주세요.

다음 작업을 수행하세요:
1. 사진에 보이는 모든 음식을 식별
2. 각 음식의 예상 양(serving size)을 추정
3. 각 음식의 탄수화물, 단백질, 지방, 칼로리를 추정
4. 식사 유형(아침/점심/저녁/간식)을 사진 내용과 시간대로 추정

반드시 아래 JSON 형식으로만 응답하세요:

{
  "foods": [
    {
      "name": "음식 이름 (한글)",
      "serving_size": "예상 양 (예: 1공기, 1개, 100g)",
      "carbs": 65,
      "protein": 10,
      "fat": 2,
      "calories": 300
    }
  ],
  "total_carbs": 65,
  "total_calories": 300,
  "meal_type": "lunch",
  "description": "사진에 대한 간단한 설명 (한글, 1-2문장)"
}

중요:
- 숫자 값은 number 타입 (따옴표 없이)
- meal_type은 "breakfast", "lunch", "dinner", "snack" 중 하나
- 한국 음식이 많을 수 있으니 한국 음식 영양 정보에 정확하게 답변
- 양을 추정할 수 없으면 일반적인 1인분 기준
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
      max_tokens: 1024,
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
