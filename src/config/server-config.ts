const JWT_SECRET = process.env.JWT_SECRET;
const MASTER_GEMINI_API_KEY = process.env.MASTER_GEMINI_API_KEY;

if (!JWT_SECRET || !MASTER_GEMINI_API_KEY) {
  throw new Error(
    "JWT_SECRET || MASTER_GEMINI_API_KEY is not defined. Please set it in your environment variables."
  );
}

export { JWT_SECRET, MASTER_GEMINI_API_KEY };
