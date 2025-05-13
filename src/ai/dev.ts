import { config } from 'dotenv';
config();

import '@/ai/flows/create-article.ts';
import '@/ai/flows/revise-article.ts';
import '@/ai/flows/translate-article.ts';