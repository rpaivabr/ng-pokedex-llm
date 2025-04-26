import { Injectable } from '@angular/core';
import { GenerativeModel, GoogleGenerativeAI, Part } from '@google/generative-ai';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI!: GoogleGenerativeAI;
  private model!: GenerativeModel;
  
  constructor() {
    this.initialize();
  }

  async generateContent(request: string | Array<string | Part>): Promise<string> {
    try {
      const data = await this.model.generateContent(request);
      return data.response.text();
    } catch (error) {
      localStorage.removeItem('API_KEY');
      this.initialize();
      return Promise.reject("Erro ao gerar conteúdo: " + error);
    }
  }

  async initialize(): Promise<void> {
    let apiKey = localStorage.getItem('API_KEY') || '';
    while (!apiKey) {
      apiKey = prompt("Digite sua API_KEY") || '';
    }
    localStorage.setItem('API_KEY', apiKey);
    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    } catch (error) {
      this.initialize();
      return Promise.reject("Erro ao gerar conteúdo: " + error);
    }
  }
}