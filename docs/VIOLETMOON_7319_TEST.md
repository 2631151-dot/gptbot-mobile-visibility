# VIOLETMOON-7319 AI visibility test

Created: 2026-10-07

Purpose: distinguish what an AI reports when given the public URL and later when discovering it through search.

Unique markers:
- A visible: A-VISIBLE-CERULEAN-7319 / 청람김치전골 18,731원
- B details: B-DETAILS-AMBER-4826 / 호박빛갈비찜 24,826원
- C CSS hidden DOM: C-HIDDEN-JADE-5637 / 비취냉면 15,637원
- D JSON-LD only: D-ONLY-QUARTZ-7319 / 자운불고기 73,190원 / DORADO-LILAC-9284

Test 1 (direct URL): give only the URL to a fresh GPT chat and ask "이 문서는 어떤 내용인지 자세히 알려줘." Record which A/B/C/D markers appear.

Test 2 (search discovery): after indexing, search the unique phrase VIOLETMOON-7319, then progressively broader terms. Record discovery separately from reading.

This is synthetic test data, not a real restaurant.
