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
    
    if (data.length === 0) return [];
    
    const hasTitles = !!data[0]?.Title;

    const allCategorizedItems: CategorizedItem[] = [];
    const totalBatches = Math.ceil(data.length / BATCH_SIZE);

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batchData = data.slice(i, i + BATCH_SIZE);
        const batchItems = hasTitles
            ? batchData.map(row => ({ url: row.URL, title: row.Title }))
            : batchData.map(row => ({ url: row.URL }));

        const currentBatchNumber = (i / BATCH_SIZE) + 1;

        if (onProgress) {
            onProgress({ current: currentBatchNumber, total: totalBatches });
        }
        
        const examples = `
- Item: {"url": "https://hothardware.com/reviews/dell-pro-14-premium-laptop-review-a-case-study-in-minimalism"${hasTitles ? ', "title": "Dell Pro 14 Premium Laptop Review: A Case Study In Minimalism"' : ''}}
- Desired Output:
  - contentTheme: "Laptop Reviews"
  - entity: "Dell Laptops"
  - subEntity: "Dell Pro 14 Premium Review"

- Item: {"url": "https://hothardware.com/reviews/bose-quietcomfort-ultra-earbuds-2nd-gen-review"${hasTitles ? ', "title": "Bose QuietComfort Ultra Earbuds 2nd Gen Review"' : ''}}
- Desired Output:
  - contentTheme: "Audio Reviews"
  - entity: "Bose Earbuds"
  - subEntity: "QuietComfort Ultra 2nd Gen Review"

- Item: {"url": "https://hothardware.com/news/potent-gaming-laptops-rtx-40-50-firepower-800-off"${hasTitles ? ', "title": "Potent Gaming Laptops With RTX 4050 Firepower Are A Whopping $800 Off"' : ''}}
- Desired Output:
  - contentTheme: "Laptop Deals"
  - entity: "Gaming Laptop Deals"
  - subEntity: "$800 Off RTX 40/50 Laptops"

- Item: {"url": "https://hothardware.com/news/intel-core-ultra-7-365k-arrow-lake-refresh-cpu-benchmark-leak"${hasTitles ? ', "title": "Intel Core Ultra 7 365K Arrow Lake Refresh CPU Benchmark Leak"' : ''}}
- Desired Output:
  - contentTheme: "CPU News"
  - entity: "Intel Arrow Lake CPUs"
  - subEntity: "CPU Benchmark Leak"
`;

        const prompt = `
            You are an expert content categorization engine. Your goal is to create a three-level taxonomy: a specific 'Content Theme', a more granular 'Entity', and a 'Sub Entity' that acts as a hook.

            **Crucial Instructions:**
            1.  **Analyze the ${hasTitles ? 'Title and URL' : 'URL Slug'}:** Infer the topic and, most importantly, the INTENT of the content. The title is the primary source if available.
            2.  **Assign Content Theme (Specific & Intent-Driven):** This is the most critical step. The theme MUST combine the main topic with the content's format or user intent. It should be a concise phrase (e.g., 2-3 words).
                -   First, identify the core topic (e.g., "Laptops," "Audio," "CPUs").
                -   Second, determine the content's primary purpose or format. Is it a review, a news piece, a deal/offer, a guide, a comparison, a benchmark analysis, or something else? This context is key.
                -   Combine them into a specific theme. For example:
                    -   An article reviewing a laptop becomes "Laptop Reviews," not just "Laptops."
                    -   An article announcing a sale on earbuds becomes "Earbud Deals," not just "Audio."
                    -   An article reporting a CPU benchmark leak becomes "CPU News," not just "CPUs."
            3.  **Assign Entity (The Subject):** This is the specific subject of the article. For "Laptop Reviews," the entity might be "Dell Laptops" or "Alienware Laptops."
            4.  **Assign Sub Entity (The Hook):** The specific, click-worthy detail. For a Dell laptop review, it could be "Dell Pro 14 Premium Review." For a deal, it might be "$800 Off RTX Laptops."
            5.  **Output Format:** Return ONLY a JSON array of objects with "url", "contentTheme", "entity", and "subEntity" keys. The "url" MUST be the original URL. Do not add any explanation or surrounding text.

            **Examples of the required output structure and logic:**
            ${examples}

            Here is the list of items to categorize:
            ${JSON.stringify(batchItems)}
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