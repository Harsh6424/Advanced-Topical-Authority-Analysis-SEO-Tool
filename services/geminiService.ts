import { GoogleGenAI, Type } from "@google/genai";
import type { CsvRow, CategorySummary, SubcategorySummary, CategorizedItem, AiInsights, ChartData, ChatMessage, CategorizedUrlData } from '../types';

const BATCH_SIZE = 200; // Process 200 URLs per API call to avoid token limits

export async function categorizeUrlsFromCsv(
    data: CsvRow[], 
    apiKey: string,
    onProgress?: (progress: { current: number, total: number }) => void
): Promise<CategorizedItem[]> {
    if (!apiKey) throw new Error("API key is required.");
    const ai = new GoogleGenAI({ apiKey });
    
    const urls = data.map(row => row.URL);
    if (urls.length === 0) return [];

    const allCategorizedItems: CategorizedItem[] = [];
    const totalBatches = Math.ceil(urls.length / BATCH_SIZE);

    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
        const batchUrls = urls.slice(i, i + BATCH_SIZE);
        const currentBatchNumber = (i / BATCH_SIZE) + 1;

        if (onProgress) {
            onProgress({ current: currentBatchNumber, total: totalBatches });
        }

        const prompt = `
            You are an intelligent content categorization engine.
            For each URL provided, your task is to determine a broad 'Content Theme', a specific 'Entity', and a click-worthy 'Sub Entity'.

            Instructions:
            1.  **Analyze the Slug:** Infer the content's topic from the URL slug.
            2.  **Assign Content Theme (Broad):** Assign a high-level, general theme.
            3.  **Assign Entity (Specific):** Assign a more detailed, narrow entity that captures the specific topic.
            4.  **Assign Sub Entity (The Hook):** Identify the key factor or hook that would make a user click. This should be concise and compelling.
            5.  The goal is a three-level taxonomy for deep analysis. Avoid generic labels.
            6.  Return ONLY a JSON array of objects, each with "url", "contentTheme", "entity", and "subEntity" keys. Do not add any explanation or surrounding text.

            Here are some examples of the desired output:
            - URL: "https://hothardware.com/news/microsoft-finally-fixed-windows-10-free-one-year-extended-security-updates-enrollment"
              - contentTheme: "OS Updates"
              - entity: "Windows 10 Updates"
              - subEntity: "Free One Year Updates"
            - URL: "https://hothardware.com/news/intel-core-ultra-7-365k-arrow-lake-refresh-cpu-benchmark-leak"
              - contentTheme: "CPUs"
              - entity: "Intel Arrow Lake CPUs"
              - subEntity: "CPU Benchmark Leak"
            - URL: "https://hothardware.com/news/potent-gaming-laptops-rtx-40-50-firepower-800-off"
              - contentTheme: "Laptops"
              - entity: "RTX Laptops"
              - subEntity: "Offer Price Reduction"

            Here is the list of URLs to categorize:
            ${JSON.stringify(batchUrls)}
        `;

        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                url: { type: Type.STRING },
                                contentTheme: { type: Type.STRING },
                                entity: { type: Type.STRING },
                                subEntity: { type: Type.STRING }
                            },
                            required: ["url", "contentTheme", "entity", "subEntity"]
                        }
                    }
                }
            });

            const jsonText = response.text.trim();
            const result = JSON.parse(jsonText) as CategorizedItem[];
            allCategorizedItems.push(...result);

        } catch (error) {
            console.error(`Error processing batch ${currentBatchNumber} of ${totalBatches}:`, error);
            throw new Error(`Failed to categorize URLs on batch ${currentBatchNumber}. The AI model could not process the request. Please check your API key and try again.`);
        }
    }
    
    return allCategorizedItems;
}


export async function fetchInsights(
    analysisData: CategorySummary[], 
    subcategoryAnalysisData: SubcategorySummary[], 
    discoverTop100Data: CategorizedUrlData[],
    apiKey: string
): Promise<{ insights: AiInsights, chartData: ChartData[] }> {
    if (!apiKey) throw new Error("API key is required.");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        You are a senior content strategy analyst. I have analyzed website performance data and assigned a 'performanceTier' to each Content Theme and Entity based on average clicks. I have also provided the raw data for the top 100 URLs by clicks from Google Discover.

        CONTEXT:
        1. CONTENT THEME Summary (Topical Authority):
        ---
        ${JSON.stringify(analysisData, null, 2)}
        ---
        
        2. ENTITY Summary (Topical Authority):
        ---
        ${JSON.stringify(subcategoryAnalysisData, null, 2)}
        ---

        3. TOP 100 GOOGLE DISCOVER URLS (by Clicks):
        ---
        ${JSON.stringify(discoverTop100Data, null, 2)}
        ---

        The 'performanceTier' logic is:
        - 'top': High average clicks, >2 articles.
        - 'potential': High average clicks, <=2 articles.
        - 'standard': All others.

        YOUR TASK: Provide a deep, data-driven analysis in JSON format.

        1.  **Summary:** Write an executive summary. Highlight strengths from 'top' performers and opportunities from 'potential' performers.
        2.  **Insights:** Provide specific, numbered insights on topical authority (based on theme/entity summaries).
        3.  **Recommendations:** Give strategic advice for scaling content in 'top' areas and experimenting in 'potential' areas.
        4.  **Next Big Topic:** Suggest ONE new, potentially tangential topic to explore next. Provide the topic name and data-driven reasoning.
        5.  **Chart Data:** Generate data for a bar chart. Include the top 5 'top' performers AND the top 5 'potential' performers, drawing from BOTH themes and entities. The 'name' property should be unique and descriptive.
        6.  **Discover Insights:** This is crucial. Analyze the 'TOP 100 GOOGLE DISCOVER URLS' data. Identify the top 10 performing entities by TOTAL clicks within this dataset. For each of these 10 entities, provide:
            - The entity name.
            - Total clicks for that entity from the top 100 list.
            - A brief, data-backed 'reasoning' for its success on Discover (e.g., "This entity succeeds due to frequent product leaks and high-value offers...").
            - A list of its 'topSubEntities' (the specific hooks), including the subEntity text, its URL, and its clicks. This provides actionable examples of what works.

        Return ONLY a JSON object with the specified structure. Do not add explanation.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        insights: { type: Type.ARRAY, items: { type: Type.STRING } },
                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
                        nextBigTopic: {
                            type: Type.OBJECT,
                            properties: {
                                topicName: { type: Type.STRING },
                                reasoning: { type: Type.STRING }
                            },
                            required: ["topicName", "reasoning"]
                        },
                        chartData: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    averageClicks: { type: Type.NUMBER },
                                    performanceTier: { type: Type.STRING, enum: ['top', 'potential'] }
                                },
                                required: ["name", "averageClicks", "performanceTier"]
                            }
                        },
                        discoverInsights: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    entity: { type: Type.STRING },
                                    totalClicks: { type: Type.NUMBER },
                                    reasoning: { type: Type.STRING },
                                    topSubEntities: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                subEntity: { type: Type.STRING },
                                                url: { type: Type.STRING },
                                                clicks: { type: Type.NUMBER }
                                            },
                                            required: ["subEntity", "url", "clicks"]
                                        }
                                    }
                                },
                                required: ["entity", "totalClicks", "reasoning", "topSubEntities"]
                            }
                        }
                    },
                    required: ["summary", "insights", "recommendations", "nextBigTopic", "chartData", "discoverInsights"]
                }
            }
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // Sort chart data for better visualization
        result.chartData.sort((a: ChartData, b: ChartData) => b.averageClicks - a.averageClicks);
        return { insights: result, chartData: result.chartData };
    } catch (error) {
        console.error("Error calling Gemini API for insights:", error);
        throw new Error("Failed to generate insights. The AI model could not process the request. Please check your API key and try again.");
    }
}

export async function fetchChatResponse(
  analysisData: CategorySummary[],
  subcategoryAnalysisData: SubcategorySummary[],
  insights: AiInsights,
  chatHistory: ChatMessage[],
  question: string,
  apiKey: string
): Promise<string> {
  if (!apiKey) throw new Error("API key is required.");
  const ai = new GoogleGenAI({ apiKey });

  const historyFormatted = chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Analyst'}: ${m.content}`).join('\n');

  const prompt = `
    You are a senior data analyst assistant. Your task is to answer follow-up questions based ONLY on the provided website performance data and the initial analysis. Do not invent information or provide recommendations beyond what the data supports. If the answer cannot be found in the provided context, state that clearly.

    **CONTEXT: FULL ANALYSIS DATA**

    **1. Content Theme Summary Data:**
    \`\`\`json
    ${JSON.stringify(analysisData, null, 2)}
    \`\`\`

    **2. Entity Summary Data:**
    \`\`\`json
    ${JSON.stringify(subcategoryAnalysisData, null, 2)}
    \`\`\`

    **3. Initial AI-Generated Insights:**
    \`\`\`json
    ${JSON.stringify(insights, null, 2)}
    \`\`\`

    **CONTEXT: ONGOING CONVERSATION**
    ${historyFormatted}

    **NEW QUESTION FROM USER:**
    ${question}

    Your answer:
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for chat:", error);
    throw new Error("Failed to get a response from the AI. Please check your API key and try again.");
  }
}