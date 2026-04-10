import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ANALYSIS_PROMPT = `당신은 의료 검사 결과지를 분석하는 전문가입니다. 첨부된 파일(이미지 또는 PDF, 여러 장일 수 있음)은 한국 병원에서 발급된 검사 결과지입니다. 모든 페이지/파일을 종합해서 하나의 결과로 분석하세요.

다음 작업을 수행하세요:

1. **모든 검사 항목 추출**: 항목명(한글/영문), 측정값, 단위, 정상범위를 정확하게 추출
2. **상태 판정**: 각 항목이 정상(normal), 낮음(low), 높음(high), 심각(critical) 중 어디에 해당하는지 판정
3. **카테고리 분류**: 혈당, 지질, 간기능, 신장기능, 혈액, 전해질, 갑상선 등
4. **전체 요약**: 3-4문장으로 검사 결과 요약
5. **상세 분석**: 당뇨 관리 관점에서 각 수치의 의미와 주의사항 (마크다운)
6. **권고사항**: 구체적인 생활 습관/식단/운동 조언 3-5개 (배열)
7. **검사 정보 추출**: 검사 날짜(YYYY-MM-DD), 병원 이름

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요:

{
  "tested_at": "2026-03-10",
  "hospital_name": "서울대학교병원",
  "lab_values": [
    {
      "name": "공복혈당",
      "name_en": "Glucose (Fasting)",
      "value": 126,
      "unit": "mg/dL",
      "reference_range": "70-100",
      "status": "high",
      "category": "혈당"
    }
  ],
  "ai_summary": "전체 요약 문장",
  "ai_analysis": "상세 분석 (마크다운)",
  "ai_recommendations": [
    "권고사항 1",
    "권고사항 2"
  ]
}

중요:
- 숫자 값은 number 타입 (따옴표 없이)
- 정상범위가 없으면 reference_range는 null
- 이미지에서 추출할 수 없는 정보는 null
- JSON 외의 설명 텍스트 절대 금지`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { previousValues } = body;

    // Support both new (files array) and legacy (single image) formats
    let files: { data: string; mimeType: string }[] = [];
    if (Array.isArray(body.files) && body.files.length > 0) {
      files = body.files;
    } else if (body.image) {
      files = [{ data: body.image, mimeType: body.mimeType || 'image/jpeg' }];
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    let prompt = ANALYSIS_PROMPT;
    if (previousValues && Array.isArray(previousValues) && previousValues.length > 0) {
      prompt += `\n\n이전 회차 검사 결과(참고용):\n${JSON.stringify(previousValues, null, 2)}\n\n이번 결과와 비교해서 "comparison_note" 필드에 주요 변화를 서술하세요.`;
    }

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      { text: prompt },
    ];

    for (const f of files) {
      parts.push({
        inlineData: {
          data: f.data.replace(/^data:[^;]+;base64,/, ''),
          mimeType: f.mimeType || 'image/jpeg',
        },
      });
    }

    const result = await model.generateContent(parts);

    const response = result.response;
    const text = response.text();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON from markdown code block
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        return NextResponse.json({
          error: 'Failed to parse AI response',
          raw: text,
        }, { status: 500 });
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('[lab-report/analyze] error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
