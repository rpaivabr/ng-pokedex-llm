import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const API_KEY = localStorage.getItem('API_KEY') || '';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI = new GoogleGenerativeAI(API_KEY);
  private model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  async generateContent(request: string | Array<string | Part>): Promise<string> {
    const data = await this.model.generateContent(request);
    return data.response.text();
  }
}