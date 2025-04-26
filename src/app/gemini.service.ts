import { Injectable } from '@angular/core';
import { GenerativeModel, GoogleGenerativeAI, Part } from '@google/generative-ai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;
  
  constructor() {
    let apiKey = '';
    while (!apiKey) {
      apiKey = prompt("Digite sua API_KEY") || '';
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async generateContent(request: string | Array<string | Part>): Promise<string> {
    const data = await this.model.generateContent(request);
    return data.response.text();
  }
}