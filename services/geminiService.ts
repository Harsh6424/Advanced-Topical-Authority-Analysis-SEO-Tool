
import { GoogleGenAI, Type } from "@google/genai";
import type { CsvRow, CategorySummary, CategorizedItem, AiInsights, ChartData } from '../types';

export async function categorizeUrlsFromCsv(data: CsvRow[], apiKey: string): Promise<CategorizedItem[]> {
    if (!apiKey) throw new Error("API key is required.");
    const ai = new GoogleGenAI({ apiKey });
    
    const urls = data.map(row => row.URL);
    if (urls.length === 0) return [];

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
        ${JSON.stringify(urls)}
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
        const result = JSON.parse(jsonText);
        return result as CategorizedItem[];

    } catch (error) {
        console.error("Error calling Gemini API for categorization:", error);
        throw new Error("Failed to categorize URLs. The AI model could not process the request. Please check your API key and try again.");
    }
}


export async function fetchInsights(analysisData: CategorySummary[], apiKey: string): Promise<{ insights: AiInsights, chartData: ChartData[] }> {
    if (!apiKey) throw new Error("API key is required.");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
        You are a senior content strategy analyst. I have analyzed website performance data and assigned a 'performanceTier' to each category.

        Here is the summary data:
        ---
        ${JSON.stringify(analysisData, null, 2)}
        ---

        The 'performanceTier' logic is as follows:
        - 'top': These are proven winners. They have high average clicks AND a healthy number of articles (more than 2), indicating consistent success.
        - 'potential': These are one-hit wonders or budding successes. They have high average clicks but are based on only one or two articles. They represent high-potential topics that may be worth scaling.
        - 'standard': All other categories.

        Your task is to provide a deep, data-driven analysis focusing on the 'top' and 'potential' tiers. Your response MUST use the metrics provided (e.g., averageClicks, articleCount) to support your points.

        1.  **Summary:** Write a concise executive summary. Start by highlighting the key strengths shown by 'top' performers, then introduce the opportunities presented by the 'potential' performers. Use specific data points.
        2.  **Insights:** Provide specific, numbered insights. For 'top' performers, explain WHY they are successful (e.g., "The 'Laptop Reviews' category is a top performer, averaging ${analysisData.find(d => d.performanceTier === 'top')?.averageClicks || 'X'} clicks across ${analysisData.find(d => d.performanceTier === 'top')?.articleCount || 'Y'} articles..."). For 'potential' performers, analyze their high performance relative to low article count (e.g., "The 'Niche Software' category shows high potential, achieving an impressive ${analysisData.find(d => d.performanceTier === 'potential')?.averageClicks || 'Z'} average clicks from just one article...").
        3.  **Recommendations:** Give strategic advice based on your insights. Recommend scaling content in 'top' categories and suggest experiments or further content creation for 'potential' categories to validate their promise.
        4.  **Chart Data:** Generate data for a bar chart. Include the top 5 'top' performers AND the top 5 'potential' performers. Each object in the array must include the category name, its averageClicks, and its performanceTier ('top' or 'potential').

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
                    required: ["summary", "insights", "recommendations", "chartData"]
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