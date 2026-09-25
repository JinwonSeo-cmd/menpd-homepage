# 강의 버전 운영 기준

`data/classes/*.json`은 정식 기본 교안입니다. 기관·업계·수강생에 맞춘 버전은 이 폴더에서 필요한 파트만 덮어씁니다.

## 주소 형식

- 정식본: `class-template.html?id=generative-ai-7hrs`
- 공공기관·공무원 버전: `class-template.html?id=generative-ai-7hrs&variant=public-sector`
- 새 수업 버전: `class-template.html?id=generative-ai-7hrs&variant=기관명-날짜`

## 파일 위치

`data/classes/variants/{강의 ID}/{버전 ID}.json`

## 작성 예시

```json
{
  "id": "기관명-날짜",
  "label": "기관명 맞춤 버전",
  "class": {
    "subtitle": "이 수업에만 표시할 설명"
  },
  "access": {
    "enabled": true,
    "displayName": "261023(금) 기관명",
    "passwordHash": "공동 비밀번호의 SHA-256 해시",
    "expiresAt": "2027-01-23T23:59:59+09:00",
    "expiryLabel": "2027년 1월 23일"
  },
  "parts": [
    {
      "slug": "pe7",
      "summary": "이 수업에 맞춘 파트 설명",
      "prompts": ["수업별-프롬프트-id"]
    }
  ]
}
```

파트에서 지정한 항목만 정식본 위에 덮어씁니다. 예를 들어 `summary`와 `prompts`만 적으면 나머지 챕터·자료·도구는 정식본을 그대로 사용합니다.

`access.enabled`가 켜진 수업은 공동 비밀번호 입력 화면을 먼저 표시합니다. 비밀번호 원문은 저장하지 않고 SHA-256 해시만 기록하며, 잠금이 풀린 기기는 `expiresAt`까지 다시 입력하지 않습니다. 이 잠금은 일반 방문자의 접근을 막는 수강생 편의용이며 기밀자료 보안용이 아닙니다.

프롬프트 본문은 `data/prompts.json`에 추가하고, 강의 또는 수업별 버전의 `prompts` 배열에는 해당 `id`만 넣습니다. 권장 분류는 다음과 같습니다.

- 프롬프트 기본기·메타프롬프트
- 커스텀봇·에이전트 지침
- 문서·PPT·리서치
- 이미지 생성
- 영상 생성·편집
- 오디오 생성
- 디자인 MD·브랜드 MD
