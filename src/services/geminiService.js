import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const hasApiKey = !!apiKey && apiKey !== "YOUR_API_KEY_HERE";
const genAI = hasApiKey ? new GoogleGenerativeAI(apiKey) : null;

function cleanJSONString(str) {
  let cleaned = str.trim();

  const startIdx = cleaned.indexOf("{");
  const endIdx = cleaned.lastIndexOf("}");
  if (startIdx !== -1 && endIdx !== -1) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

  return cleaned.trim();
}

async function generateContentWithFallback(prompt, generationConfig = {}, isJsonMode = false) {
  if (!genAI) throw new Error("GoogleGenerativeAI is not initialized.");

  const modelList = isJsonMode
    ? ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-pro"]
    : ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-pro"];

  let lastError = null;
  for (const modelName of modelList) {
    try {
      const config = { model: modelName };
      if (isJsonMode) {
        config.generationConfig = { responseMimeType: "application/json", ...generationConfig };
      } else if (Object.keys(generationConfig).length > 0) {
        config.generationConfig = generationConfig;
      }

      const model = genAI.getGenerativeModel(config);
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      console.warn(`RERA Hub: Model "${modelName}" failed. Falling back. Error:`, err.message || err);
      lastError = err;
    }
  }
  throw lastError || new Error("All attempted Gemini models failed.");
}

export const geminiService = {
  /**
   * Generates a legal document draft based on user prompt.
   * @param {string} promptText - User instructions (e.g. Form M complaint).
   * @param {string} language - Target language (English, Hindi, Marathi).
   */
  async generateLegalDraft(promptText, language = "English") {
    if (!genAI) {
      return `[Mock Legal Draft] Draft generated for "${promptText}" in ${language}.\n\nThis is a mock draft. Configure a valid API key to run live drafting.`;
    }

    try {
      const prompt = `You are LexSuite, an expert Indian legal draftsman.
Draft a professional, standard legal document based on this request: "${promptText}".
Ensure the draft is structured formally, utilizes standard Indian court and contractual vocabulary (including proper sections/clauses where applicable), and fits Indian legal practice.

Write the draft document content in the selected language: ${language}.
Format the output in clean, professional text. Return ONLY the drafted legal document text. Do not add conversational intro or outro text.

Draft Request: ${promptText}`;

      return await generateContentWithFallback(prompt, {}, false);
    } catch (error) {
      console.error("Gemini API Error in generateLegalDraft:", error);
      throw error;
    }
  },

  /**
   * Fetches RERA project details dynamically from Gemini's knowledge graph.
   * @param {string} regNo - The RERA Registration Number.
   * @param {string} stateName - The jurisdiction state name.
   */
  async fetchReraDetails(regNo, stateName = "Maharashtra") {
    if (!genAI) {
      return {
        projectName: "Prestige Habitat Phase 2 (Mock)",
        promoter: "Prestige Group (Mock)",
        completionDate: "2025-12-31",
        status: "Delayed",
        locality: "Whitefield, Bengaluru",
        builtArea: "500,000 sq ft",
        warnings: "Simulated warning."
      };
    }

    try {
      const prompt = `You are LexSuite, an expert Indian RERA auditor.
Query your knowledge database for the Indian RERA project registration number: "${regNo}" registered in the state of "${stateName}".

You must return a valid JSON object containing these keys:
- projectName (name of the real estate project)
- promoter (name of the builder / developer company)
- completionDate (the registered RERA completion/possession deadline in YYYY-MM-DD format)
- status (e.g. "On Schedule", "Delayed", "Severely Delayed", "Completed")
- locality (the area/city where the project is situated)
- builtArea (estimated square footage or scale of the project)
- warnings (regulatory alerts, extension alerts, or warnings regarding the developer's execution rate)

If you do not find the exact registration number in your training database, generate the most realistic, plausible real estate project details matching this registration number format for the state of ${stateName}.

Return ONLY the raw JSON object. Do not wrap it in markdown code fences or add conversational text.`;

      const responseText = await generateContentWithFallback(prompt, {}, true);
      try {
        return JSON.parse(cleanJSONString(responseText));
      } catch (jsonErr) {
        console.warn("RERA Hub: JSON parse failed. Extracting values manually.", jsonErr);
        const cleanText = responseText.replace(/[\r\n\t]/g, " ");
        const projName = (cleanText.match(/"projectName"\s*:\s*"([^"]+)"/) || [])[1] || "Simulated Housing Residency";
        const promoter = (cleanText.match(/"promoter"\s*:\s*"([^"]+)"/) || [])[1] || "Global Developers Group";
        const completionDate = (cleanText.match(/"completionDate"\s*:\s*"([^"]+)"/) || [])[1] || "2025-06-30";
        const status = (cleanText.match(/"status"\s*:\s*"([^"]+)"/) || [])[1] || "Delayed";
        const locality = (cleanText.match(/"locality"\s*:\s*"([^"]+)"/) || [])[1] || "Sector-5, Metropolitan Zone";
        const builtArea = (cleanText.match(/"builtArea"\s*:\s*"([^"]+)"/) || [])[1] || "450,000 sq ft";
        const warnings = (cleanText.match(/"warnings"\s*:\s*"([^"]+)"/) || [])[1] || "Construction audit ongoing.";

        return { projectName: projName, promoter, completionDate, status, locality, builtArea, warnings };
      }
    } catch (error) {
      console.error("Gemini API Error in fetchReraDetails:", error);
      throw error;
    }
  },

  /**
   * Parses raw copied text from an official RERA website project sheet.
   * @param {string} rawText - The pasted text.
   */
  async parseReraSheetText(rawText) {
    if (!genAI) {
      return {
        projectName: "Prestige Habitat Phase 2 (Pasted)",
        promoter: "Prestige Group (Pasted)",
        completionDate: "2024-12-31",
        status: "Delayed",
        locality: "Whitefield, Bengaluru",
        builtArea: "500,000 sq ft",
        warnings: "No regulatory warning."
      };
    }

    try {
      const prompt = `You are LexSuite, an expert Indian RERA auditor.
Below is the raw, copied text from an official state RERA project details sheet.

Pasted Text:
"""
${rawText}
"""

You must analyze this text and return a valid JSON object containing these keys:
- projectName (name of the real estate project mentioned in text)
- promoter (name of the developer / promoter company)
- completionDate (the registered RERA completion or revised possession deadline in YYYY-MM-DD format)
- status (evaluate the completionDate against today. If completionDate is past, status should be "Delayed" or "Completed", otherwise "On Schedule")
- locality (the area/city where the project is situated)
- builtArea (any mentioned built-up or carpet area, or "N/A")
- warnings (mention if there are any extension approvals, delays, or warning flags in the text)

Return ONLY the raw JSON object. Do not wrap it in markdown code fences or add conversational text.`;

      const responseText = await generateContentWithFallback(prompt, {}, true);
      try {
        return JSON.parse(cleanJSONString(responseText));
      } catch (jsonErr) {
        console.warn("RERA Hub: JSON parse failed for pasted sheet. Extracting values manually.", jsonErr);
        const cleanText = responseText.replace(/[\r\n\t]/g, " ");
        const projName = (cleanText.match(/"projectName"\s*:\s*"([^"]+)"/) || [])[1] || "Parsed Housing Society";
        const promoter = (cleanText.match(/"promoter"\s*:\s*"([^"]+)"/) || [])[1] || "Parsed Developers Ltd";
        const completionDate = (cleanText.match(/"completionDate"\s*:\s*"([^"]+)"/) || [])[1] || "2025-06-30";
        const status = (cleanText.match(/"status"\s*:\s*"([^"]+)"/) || [])[1] || "Delayed";
        const locality = (cleanText.match(/"locality"\s*:\s*"([^"]+)"/) || [])[1] || "Metropolitan Zone";
        const builtArea = (cleanText.match(/"builtArea"\s*:\s*"([^"]+)"/) || [])[1] || "N/A";
        const warnings = (cleanText.match(/"warnings"\s*:\s*"([^"]+)"/) || [])[1] || "Audit complete.";

        return { projectName: projName, promoter, completionDate, status, locality, builtArea, warnings };
      }
    } catch (error) {
      console.error("Gemini API Error in parseReraSheetText:", error);
      throw error;
    }
  },
};
