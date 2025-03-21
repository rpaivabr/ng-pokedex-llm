# ng-pokedex-llm (Build With AI 2025 - Angular)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 19.2.x.

## Links Úteis
 - [Documentação Angular Oficial](https://angular.dev/)
 - [Google AI for Developers](https://ai.google.dev/gemini-api/docs/quickstart?lang=node)
 - [AI Studio API keys](https://aistudio.google.com/app/apikey)
 - [Angularizando](https://angularizando.com.br/artigos)

## 1. Instalação das dependências

### Terminal
```
node -v
npm i -g @angular/cli

ng version          // ou "npx -p @angular/cli ng version"

ng new ng-pokedex-llm    // ou "npx -p @angular/cli ng new ng-gemini"
// Which stylesheet format would you like to use? scss
// Do you want to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? No

cd ng-pokedex-llm

npm i @google/generative-ai

npm run start
```

## 2. Integrando Gemini com Angular (Apenas texto)

### src/app/app.component.ts
```typescript
import { Component, signal } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = '<sua_api_key_aqui>';

@Component({
  selector: 'app-root',
  imports: [],
  template: `
    <h1>Integrando Angular com Gemini</h1>
    <h3>{{ prompt }}</h3>
    <p>{{ text() }}</p>
  `,
})
export class AppComponent {
  private genAI = new GoogleGenerativeAI(API_KEY);
  private model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  
  prompt = 'Quem é esse pokemon?';
  text = signal('');

  constructor() {
    this.generateText();
  }

  async generateText() {   
    const result = await this.model.generateContent(this.prompt);
    this.text.set(result.response.text());
  }
}
```

## 3. Integrando Gemini com Angular (Multimodal, texto + imagem)

### src/app/media.service.ts
```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  async imageToBase64(imagePath: string): Promise<string> {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageDataUrl = reader.result as string;
          const base64Image = imageDataUrl.split(',')[1];
          resolve(base64Image);
        }
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao converter imagem para Base64:', error);
      return '';
    }
  }
}
```

### src/app/gemini.service.ts
```typescript
import { Injectable } from '@angular/core';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const API_KEY = '<sua_api_key_aqui>';

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
```

### src/app/app.component.ts
```typescript
import { Component, inject, signal } from '@angular/core';
import { MediaService } from './media.service';
import { GeminiService } from './gemini.service';

@Component({
  selector: 'app-root',
  imports: [],
  template: `
    <h1>Integrando Angular com Gemini</h1>
    <h3>{{ prompt }}</h3>
    <p>{{ text() }}</p>
  `,
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private mediaService = inject(MediaService);
  
  prompt = 'Quem é esse pokemon?';
  text = signal('');

  constructor() {
    this.generateText();
  }

  async generateText() {   
    const base64 = await this.mediaService.imageToBase64('/pokemon.png');
    const imagePart = { inlineData: { data: base64, mimeType: 'image/png', }};
    const result = await this.geminiService.generateContent([this.prompt, imagePart]);
    this.text.set(result);
  }
}
```

## 4. Criação do Layout principal (Pokedex utilizando camera)

### src/app/media.service.ts
```typescript
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private video!: HTMLVideoElement;
  private canvas!: HTMLCanvasElement;
  private base64Image = signal<string>('');
  base64 = this.base64Image.asReadonly();

  startCamera(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
    // verificar se a câmera está disponível ('user' ou 'environment')
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(stream => {
        this.video = video;
        this.video.srcObject = stream;
        this.canvas = canvas;
        this.startCapture();
      })
      .catch(error => {
        console.error('Erro ao acessar a câmera: ', error);
      })
  }

  startCapture(): void {
    setInterval(() => {
      this.captureAndSend();
    }, 5000); // intervalo entre capturas em milisegundos
  }

  private captureAndSend(): void {
    // capturar a imagem da câmera utilizando o canvas
    const context = this.canvas.getContext('2d')!;
    const { width, height } = this.video.getBoundingClientRect();
    this.canvas.width = width;
    this.canvas.height = height;
    context.drawImage(this.video, 0, 0, width, height);
    const imageDataUrl = this.canvas.toDataURL('image/jpeg');

    // atualizar a imagem como base64 (e propagar para o componente)
    this.base64Image.set(imageDataUrl.split(',')[1]);
  }

  async imageToBase64(imagePath: string): Promise<string> {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();

      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageDataUrl = reader.result as string;
          const base64Image = imageDataUrl.split(',')[1];
          resolve(base64Image);
        }
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao converter imagem para Base64:', error);
      return '';
    }
  }
}
```

### src/app/app.component.ts
```typescript
import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { Part } from '@google/generative-ai';
import { MediaService } from './media.service';
import { GeminiService } from './gemini.service';

type PokemonData = {
  name: string;
  number: number;
  probability: number;
}

@Component({
  selector: 'app-root',
  imports: [],
  template: `
    <video #video autoplay playsinline></video>
    <canvas #canvas></canvas>
  `,
})
export class AppComponent {
  private geminiService = inject(GeminiService);
  private mediaService = inject(MediaService);

  videoElement = viewChild<ElementRef<HTMLVideoElement>>('video');
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  base64 = this.mediaService.base64;
 
  viewChildRef = effect(() => {
    const video = this.videoElement()!.nativeElement;
    const canvas = this.canvasElement()!.nativeElement;
    this.mediaService.startCamera(video, canvas);
  });

  captureRef = effect(() => {
    this.detectPokemon(this.base64());
  })

  private async detectPokemon(base64: string) {
    if (!base64) return;
    const prompt = `
      Identifique o Pokémon na imagem, usando como base a Pokédex oficial.
      Retorne um JSON no seguinte formato:
      {"name": "Nome do Pokémon", "number": Numero do pokemon, "probability": 0.99}
      A resposta deve ser APENAS o JSON, sem texto adicional ou formatação.
      Se a imagem não contiver um Pokémon reconhecido, retorne {"nome": "Desconhecido", "numero": 0, "probabilidade": 0.0}.
      Priorize a precisão e evite suposições.
    `;
    const imagePart: Part = {
      inlineData: { 
        data: base64,
        mimeType: 'image/jpeg',
      }
    }
    const responseText = await this.geminiService.generateContent([prompt, imagePart]);
    
    // converter o texto string JSON em um objeto JavaScript
    const cleanedText = responseText.replace(/`json\s*|\s*`/g, '');
    const pokemonResponse = JSON.parse(cleanedText) as PokemonData;
    
    // mostrar nome do pokemon encontrado se probabilidade for suficiente
    if (pokemonResponse.number && pokemonResponse.probability > .9) {
      alert(pokemonResponse.name);
    }
  }
}
```

### src/styles.scss
```scss
body { overflow: hidden; margin: 0; }
video { width: 100dvw; height: 100dvh; object-fit: cover; }
canvas { display: none; }
```