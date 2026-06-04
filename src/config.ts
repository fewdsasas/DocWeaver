export const SCANNER = {
  MAX_FILES_PER_DIR: 20,
  MAX_FILE_LINES: 100,
  HALF_LINES: 50,
  MAX_FILE_SIZE: 1048576, // 1MB
  MAX_DEPTH: 20,
} as const;

export const TOKEN = {
  BUDGET: 6000,
  ENGLISH_CHAR_WEIGHT: 0.55,
  CHINESE_CHAR_WEIGHT: 1.5,
  OTHER_CHAR_WEIGHT: 0.8,
} as const;

export const GENERATOR = {
  MIN_BADGES: 3,
  MAX_BADGES: 10,
  MAX_LINES: 500,
  SMALL_PROJECT_LINES: 200,
  MAX_DESC_LENGTH: 40,
  MIN_DESC_LENGTH: 15,
  FAQ_FIRST_QUARTER_RATIO: 0.2,
} as const;

export const LLM = {
  DEFAULT_MODEL: 'gpt-4o-mini',
  DEFAULT_BASE_URL: 'https://api.openai.com/v1',
  TEMPERATURE: 0.3,
} as const;
