import { GoogleGenAI, Type } from "@google/genai";
import type { CsvRow, CategorySummary, SubcategorySummary, CategorizedItem, AiInsights, ChartData, ChatMessage } from '../types';

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
            For each URL provided, your task is to determine a broad 'category' and a specific 'subcategory'.

            Instructions:
            1.  **Analyze the Slug:** Infer the content's topic from the URL slug.
            2.  **Assign Category (Broad):** Assign a high-level, general category. For example:
                -   "AMD Hardware Issues" -> Category: "Hardware Issues"
                -   "Gaming Laptop Reviews (HP Omen)" -> Category: "Laptop Reviews"
                -   "NVIDIA GPU Deals" -> Category: "GPU Deals"
            3.  **Assign Subcategory (Specific):** Assign a more detailed, narrow subcategory that captures the specific topic. For example:
                -   "AMD Hardware Issues" -> Subcategory: "AMD Hardware"
                -   "Gaming Laptop Reviews (HP Omen)" -> Subcategory: "HP Laptops"
                -   "NVIDIA GPU Deals" -> Subcategory: "NVIDIA GPUs"
            4.  The goal is a two-level taxonomy: a broad category for high-level analysis, and a specific subcategory for granular detail.
            5.  Avoid generic labels like "General" or folder names. Categories and subcategories should be editorially relevant.
            6.  Return ONLY a JSON array of objects, each with "url", "category", and "subcategory" keys. Do not add any explanation or surrounding text.

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
                                category: { type: Type.STRING },
                                subcategory: { type: Type.STRING }
                            },
                            required: ["url", "category", "subcategory"]
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
    apiKey: string
): Promise<{ insights: AiInsights, chartData: ChartData[] }> {
    if (!apiKey) throw new Error("API key is required.");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        You are a senior content strategy analyst. I have analyzed website performance data and assigned a 'performanceTier' to each category and subcategory.

        Here is the summary data for CATEGORIES:
        ---
        ${JSON.stringify(analysisData, null, 2)}
        ---
        
        Here is the summary data for SUBCATEGORIES:
        ---
        ${JSON.stringify(subcategoryAnalysisData, null, 2)}
        ---

        The 'performanceTier' logic is as follows:
        - 'top': Proven winners with high average clicks and more than 2 articles.
        - 'potential': One-hit wonders with high average clicks but few articles.
        - 'standard': All other categories.

        Your task is to provide a deep, data-driven analysis. Your response MUST use the metrics provided to support your points.

        1.  **Summary:** Write a concise executive summary. Highlight key strengths from 'top' performers (both categories and subcategories), then introduce opportunities from 'potential' performers.
        2.  **Insights:** Provide specific, numbered insights. Analyze both category and subcategory performance.
        3.  **Recommendations:** Give strategic advice. Recommend scaling content in 'top' areas and suggest experiments for 'potential' areas.
        4.  **Next Big Topic:** Based on all the data, suggest ONE new, potentially tangential topic to explore next. This should be a new content pillar idea. Provide the topic name and a brief, data-driven reasoning for why it's a good opportunity (e.g., "Based on the success of 'AMD Hardware' and 'NVIDIA GPUs', a new 'Custom PC Builds' category could be highly successful...").
        5.  **Chart Data:** Generate data for a bar chart. Include the top 5 'top' performers AND the top 5 'potential' performers, drawing from BOTH categories and subcategories. The 'name' property should be unique and descriptive (e.g., "Category: Laptop Reviews" or "Subcategory: AMD Hardware"). Each object must include the name, averageClicks, and performanceTier ('top' or 'potential').

        Return ONLY a JSON object with the specified structure. Do not add any explanation or surrounding text.
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
                        }
                    },
                    required: ["summary", "insights", "recommendations", "nextBigTopic", "chartData"]
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

    **1. Category Summary Data:**
    \`\`\`json
    ${JSON.stringify(analysisData, null, 2)}
    \`\`\`

    **2. Subcategory Summary Data:**
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