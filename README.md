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

const API_KEY = 'AIzaSyDgxQ-1G3OCa7sebtA8B_6fDMoiQJbk768';

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

const API_KEY = 'AIzaSyDgxQ-1G3OCa7sebtA8B_6fDMoiQJbk768'

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












### src/app/app.component.html
```html
<mat-drawer-container autosize>
  <mat-drawer opened mode="side">
    <h2>Gemini</h2>

    <div style="display: flex; flex-direction: column">
      <button
        mat-button
        color="primary"
        routerLink="text"
        routerLinkActive="selected"
      >
        <mat-icon>chat_bubble</mat-icon>
        Text
      </button>
      <button
        mat-button
        color="primary"
        routerLink="chat"
        routerLinkActive="selected"
      >
        <mat-icon>subject</mat-icon>
        Chat
      </button>
      <button
        mat-button
        color="primary"
        routerLink="vision"
        routerLinkActive="selected"
      >
        <mat-icon>image</mat-icon>
        Vision
      </button>
    </div>
  </mat-drawer>

  <mat-toolbar>
    <h1>Build with AI and Angular</h1>
  </mat-toolbar>

  <main>
    <router-outlet />
  </main>
</mat-drawer-container>
```

### src/app/app.component.scss
```scss
.mat-drawer-container {
  width: 100%;
  height: 100vh;
  background-color: var(--color-surface-container-lowest);
}

.mat-drawer {
  width: 272px;
  padding: 0 20px;
  border-right: 1px solid var(--color-neutral-30);
  background-color: var(--color-surface-container-low);
}

.mat-toolbar {
  background-color: var(--color-surface-container-lowest);
  border-bottom: 1px solid var(--color-neutral-30);
}

main {
  display: flex;
  flex-direction: column;
  height: calc(100% - 64px);
  width: 100%;
}

.selected {
  background-color: var(--mdc-filled-button-container-color);
  color: var(--mdc-filled-button-label-text-color) !important;
}
```

## 3. Criação das Páginas e Serviços 

### Terminal
```
ng generate component pages/text
ng generate component pages/chat
ng generate component pages/vision

ng generate service services/text
ng generate service services/chat
ng generate service services/vision
```

### src/app/models/chat-content.ts
```typescript
export interface ChatContent {
  agent: 'user' | 'chatbot';
  message: string;
  loading?: boolean;
  imagePreview?: string;
}
```

### src/app/models/image-file.ts
```typescript
export type ImageFile = {
  preview: string;
  file: File;
};
```

### src/app/pipes/line-break.pipe.ts
```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lineBreak',
  standalone: true
})
export class LineBreakPipe implements PipeTransform {

  transform(value: string,): string {
    return value.replace(/(?:\r\n|\r|\n)/g, '<br/>');
  }

}
```

### src/assets/avatar-chatbot.png
[Link da pasta com as imagens](https://github.com/rpaivabr/ng-gemini/tree/main/src/assets)
### src/assets/avatar-user.png
[Link da pasta com as imagens](https://github.com/rpaivabr/ng-gemini/tree/main/src/assets)

### src/app/app-config.ts
```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { MarkdownModule } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimationsAsync(),
    importProvidersFrom([MarkdownModule.forRoot()]),
  ],
};
```

### src/app/app.routes.ts
```typescript
import { Routes } from '@angular/router';
import { ChatComponent } from './pages/chat/chat.component';
import { TextComponent } from './pages/text/text.component';
import { VisionComponent } from './pages/vision/vision.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'text' },
  { path: 'chat', component: ChatComponent },
  { path: 'text', component: TextComponent },
  { path: 'vision', component: VisionComponent },
];
```

### src/app/services/text.service.ts 
```typescript
import { Injectable } from '@angular/core';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { Observable, from, map } from 'rxjs';
import { ChatContent } from '../models/chat-content';

@Injectable({
  providedIn: 'root',
})
export class TextService {
  private model: GenerativeModel;

  constructor() {
    const genAI = new GoogleGenerativeAI(localStorage.getItem('API_KEY')!);
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  generateText(message: string): Observable<ChatContent> {
    return from(this.model.generateContent(message)).pipe(
      map(({ response }) => {
        const text = response.text();
        return {
          message: text,
          agent: 'chatbot',
        };
      })
    );
  }
}
```

### src/app/pages/text.component.ts 
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MarkdownModule } from 'ngx-markdown';
import { LineBreakPipe } from '../../pipes/line-break.pipe';
import { TextService } from '../../services/text.service';
import { ChatContent } from '../../models/chat-content';

@Component({
  selector: 'app-text',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MarkdownModule,
    LineBreakPipe,
  ],
  templateUrl: './text.component.html',
  styleUrl: './text.component.scss',
})
export class TextComponent {
  private textService = inject(TextService);
  contents: ChatContent[] = [];
  message: string = '';

  generateText(): void {
    const chatContent: ChatContent = {
      agent: 'user',
      message: this.message,
    };

    const loadingContent: ChatContent = {
      agent: 'chatbot',
      message: '...',
      loading: true,
    };

    this.contents = [
      ...this.contents,
      chatContent,
      loadingContent,
    ];

    this.message = '';

    this.textService.generateText(chatContent.message).subscribe((content) => {
      this.contents = [
        ...this.contents.filter((content) => !content.loading),
        content,
      ];
    });
  }
}
```

### src/app/pages/text.component.html 
```html
<div class="chat-container">
  @for (content of contents; let i = $index; track i) {
    <div class="chat-message {{content.agent}}">
    <img
      class="avatar"
      [src]="'/assets/avatar-' + content.agent + '.png'"
      [alt]="content.agent + 'icon'"
    />
    <div class="message-details">
      <markdown
        class="message-content"
        [class.loading]="content.loading"
        [data]="content.message | lineBreak"
      />
    </div>
  </div>
  } @empty {
  <div class="message-container">
    <p class="message">
      Welcome to your Gemini App for text generation. <br />
      Write an instruction to start.
    </p>
  </div>
  }
</div>

<div class="chat-footer-container">
  <mat-form-field class="chat-input">
    <input
      placeholder="Send a message"
      matInput
      [(ngModel)]="message"
      (keyup.enter)="generateText()"
    />
  </mat-form-field>
  <button
    mat-icon-button
    color="accent"
    [disabled]="!message"
    (click)="generateText()"
  >
    <mat-icon color="accent">send</mat-icon>
  </button>
</div>
```

### src/app/pages/text.component.scss 
```scss
:host {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  .chat-input {
    padding-top: 20px;
    width: calc(100% - 48px);
  }

  .user {
    background-color: var(--color-surface-container-highest);
  }

  .chatbot {
    background-color: var(--color-surface-container);
  }

  .chat-footer-container {
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
  }

  .chat-container {
    overflow: auto;
    padding: 0 10px 0 10px;
    height: 100%;
  }

  .chat-message {
    display: flex;
    align-items: flex-start;
    padding: 10px;
    margin-top: 10px;
    border-radius: 10px;
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .message-details {
    flex: 1;
    align-self: center;
  }

  .username {
    font-weight: bold;
    color: #333;
  }

  .message-content {
    margin: 5px 0;
    color: var(--mat-toolbar-container-text-color);
  }

  .message-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .message {
    text-align: center;
    color: var(--mat-toolbar-container-text-color);
    padding: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .loading {
    animation: fadeIn 1s ease-in-out infinite;
  }
}
```

### src/app/services/chat.service.ts 
```typescript
import { Injectable } from '@angular/core';
import {
  ChatSession,
  GenerativeModel,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import { Observable, from, map } from 'rxjs';
import { ChatContent } from '../models/chat-content';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private model: GenerativeModel;
  private chatSession: ChatSession;
  
  constructor() {
    const genAI = new GoogleGenerativeAI(localStorage.getItem('API_KEY')!);
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    this.chatSession = this.model.startChat({
      history: [
        {
          role: 'user',
          parts: `You're a poet. Respond to all questions with a rhyming poem.
            What is the capital of California?
          `,
        },
        {
          role: 'model',
          parts:
            'If the capital of California is what you seek, Sacramento is where you ought to peek.',
        },
      ],
    });
  }

  chat(chatContent: ChatContent): Observable<ChatContent> {
    return from(this.chatSession.sendMessage(chatContent.message)).pipe(
      map(({ response }) => {
        const text = response.text();
        return {
          message: text,
          agent: 'chatbot',
        };
      })
    );
  }
}
```

### src/app/pages/chat.component.ts 
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MarkdownComponent } from 'ngx-markdown';
import { LineBreakPipe } from '../../pipes/line-break.pipe';
import { ChatService } from '../../services/chat.service';
import { ChatContent } from '../../models/chat-content';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MarkdownComponent,
    LineBreakPipe,
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  private chatService = inject(ChatService);
  contents: ChatContent[] = [];
  message: string = '';

  sendMessage(): void {
    const chatContent: ChatContent = {
      agent: 'user',
      message: this.message,
    };

    const loadingContent: ChatContent = {
      agent: 'chatbot',
      message: '...',
      loading: true,
    };

    this.contents = [...this.contents, chatContent, loadingContent];

    this.message = '';

    this.chatService.chat(chatContent).subscribe((content) => {
      this.contents = [
        ...this.contents.filter((content) => !content.loading),
        content,
      ];
    });
  }
}
```

### src/app/pages/chat.component.html 
```html
<div class="chat-container">
  @for (content of contents; let i = $index; track i) {
  <div class="chat-message {{ content.agent }}">
    <img
      class="avatar"
      [src]="'/assets/avatar-' + content.agent + '.png'"
      [alt]="content.agent + 'icon'"
    />
    <div class="message-details">
      <markdown
        class="message-content"
        [class.loading]="content.loading"
        [data]="content.message | lineBreak"
      />
    </div>
  </div>
  } @empty {
  <div class="message-container">
    <p class="message">
      Welcome to your Gemini ChatBot App <br />
      Write a text to start.
    </p>
  </div>
  }
</div>

<div class="chat-footer-container">
  <mat-form-field class="chat-input">
    <input
      matInput
      placeholder="Send a message"
      [(ngModel)]="message"
      (keyup.enter)="sendMessage()"
    />
  </mat-form-field>
  <button
    mat-icon-button
    color="accent"
    [disabled]="!message"
    (click)="sendMessage()"
  >
    <mat-icon color="accent">send</mat-icon>
  </button>
</div>
```

### src/app/pages/chat.component.scss 
```scss
:host {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  .chat-input {
    padding-top: 20px;
    width: calc(100% - 48px);
  }

  .user {
    background-color: var(--color-surface-container-highest);
  }

  .chatbot {
    background-color: var(--color-surface-container);
  }

  .chat-footer-container {
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
  }

  .chat-container {
    overflow: auto;
    padding: 0 10px 0 10px;
    height: 100%;
  }

  .chat-message {
    display: flex;
    align-items: flex-start;
    padding: 10px;
    margin-top: 10px;
    border-radius: 10px;
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .message-details {
    flex: 1;
    align-self: center;
  }

  .username {
    font-weight: bold;
    color: #333;
  }

  .message-content {
    margin: 5px 0;
    color: var(--mat-toolbar-container-text-color);
  }

  .message-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .message {
    text-align: center;
    color: var(--mat-toolbar-container-text-color);
    padding: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .loading {
    animation: fadeIn 1s ease-in-out infinite;
  }
}
```

### src/app/services/vision.service.ts 
```typescript
import { Injectable } from '@angular/core';
import {
  GenerativeModel,
  GoogleGenerativeAI,
  InlineDataPart,
} from '@google/generative-ai';
import { Observable, from, map } from 'rxjs';
import { ChatContent } from '../models/chat-content';
import { ImageFile } from '../models/image-file';

@Injectable({
  providedIn: 'root',
})
export class VisionService {
  private model: GenerativeModel;

  constructor() {
    const genAI = new GoogleGenerativeAI(localStorage.getItem('API_KEY')!);
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
  }

  vision(message: string, imageFile: ImageFile): Observable<ChatContent> {
    console.log(message, imageFile);
    const imageDataPart: InlineDataPart = {
      inlineData: {
        data: imageFile.preview.substring(imageFile.preview.indexOf(',') + 1),
        mimeType: imageFile.file.type,
      },
    };

    return from(this.model.generateContent([message, imageDataPart])).pipe(
      map(({ response }) => {
        const text = response.text();
        return {
          message: text,
          agent: 'chatbot',
        };
      })
    );
  }
}
```

### src/app/pages/vision.component.ts 
```typescript
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { LineBreakPipe } from '../../pipes/line-break.pipe';
import { VisionService } from '../../services/vision.service';
import { ChatContent } from '../../models/chat-content';
import { ImageFile } from '../../models/image-file';

@Component({
  selector: 'app-vision',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    LineBreakPipe,
  ],
  templateUrl: './vision.component.html',
  styleUrl: './vision.component.scss',
  host: {
    class: 'contents',
  },
})
export class VisionComponent {
  private visionService = inject(VisionService);
  contents: ChatContent[] = [];
  message: string = '';
  imageFile?: ImageFile;

  removeImage() {
    this.imageFile = undefined;
  }

  sendMessage(): void {
    if (!this.imageFile) {
      return;
    }

    const chatContent: ChatContent = {
      agent: 'user',
      message: this.message,
      imagePreview: this.imageFile.preview,
    };

    const loadingContent: ChatContent = {
      agent: 'chatbot',
      message: '...',
      loading: true,
    };

    this.contents = [
      ...this.contents,
      chatContent,
      loadingContent,
    ];

    this.visionService.vision(this.message, this.imageFile).subscribe((content) => {
      this.contents = [
        ...this.contents.filter((content) => !content.loading),
        content,
      ];
    });

    this.message = '';
    this.imageFile = undefined;
  }

  selectImage(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.item(0);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const preview = e.target?.result as string;
        this.imageFile = { file, preview };
      };

      reader.readAsDataURL(file);
    }
  }
}
```

### src/app/pages/vision.component.html 
```html
<div class="chat-container">
  @for (content of contents; let i = $index; track i) {
  <div class="chat-message {{ content.agent }}">
    <img
      class="avatar"
      [src]="'/assets/avatar-' + content.agent + '.png'"
      [alt]="content.agent + 'icon'"
    />
    <div class="message-details">
      @if (content.imagePreview) {
      <img [src]="content.imagePreview" height="150px" alt="Preview" />
      }
      <p
        class="message-content"
        [class.loading]="content.loading"
        [innerHTML]="content.message | lineBreak"
      ></p>
    </div>
  </div>
  } @empty {
  <div class="message-container">
    <p class="message">
      Welcome to your Gemini Vision App <br />
      Write a text and attach an image to start.
    </p>
  </div>
  }
</div>

<div class="chat-footer-container">
  <mat-form-field class="chat-input">
    @if(imageFile) {
    <div class="image-preview">
      <img [src]="imageFile.preview" width="100px" alt="Preview" />
      <button
        mat-icon-button
        matTooltip="Remove"
        color="warn"
        (click)="this.imageFile = undefined; inputImage.value = ''"
      >
        <mat-icon class="custom-icon-size">close</mat-icon>
      </button>
    </div>
    }
    <input
      placeholder="Send a message"
      matInput
      [(ngModel)]="message"
      (keyup.enter)="sendMessage()"
    />

    <button mat-icon-button matSuffix class="image-upload-button">
      <input
        #inputImage
        type="file"
        accept="image/png, image/jpeg, image/webp"
        (change)="selectImage($event)"
      />
      <mat-icon color="primary">add_photo_alternate</mat-icon>
    </button>
  </mat-form-field>
  <button
    mat-icon-button
    color="accent"
    [disabled]="!imageFile || !message"
    (click)="sendMessage(); inputImage.value = ''"
  >
    <mat-icon color="accent">send</mat-icon>
  </button>
</div>
```

### src/app/pages/vision.component.scss 
```scss
:host {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  .chat-input {
    padding-top: 20px;
    width: calc(100% - 48px);
  }

  .user {
    background-color: var(--color-surface-container-highest);
  }

  .chatbot {
    background-color: var(--color-surface-container);
  }

  .chat-footer-container {
    display: flex;
    align-items: center;
    padding: 0 0 0 10px;
  }

  .chat-container {
    overflow: auto;
    padding: 0 10px 0 10px;
    height: 100%;
  }

  .chat-message {
    display: flex;
    align-items: flex-start;
    padding: 10px;
    margin-top: 10px;
    border-radius: 10px;
  }

  .avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    margin-right: 10px;
  }

  .message-details {
    flex: 1;
    align-self: center;
  }

  .username {
    font-weight: bold;
    color: #333;
  }

  .message-content {
    margin: 5px 0;
    color: var(--mat-toolbar-container-text-color);
  }

  .message-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }

  .message {
    text-align: center;
    color: var(--mat-toolbar-container-text-color);
    padding: 20px;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .loading {
    animation: fadeIn 1s ease-in-out infinite;
  }

  .image-upload-button {
    input[type="file"] {
      font-size: 100px;
      left: 0;
      opacity: 0;
      position: absolute;
      top: 0;
      z-index: 1;
    }
  }
}
```

## 4. Customização (Material 3 Theme | Colors)

### src/styles.scss
```scss
$theme: matx.define-theme(
  (
    color: (
      theme-type: dark,
      primary: matx.$m3-violet-palette,
      tertiary: matx.$m3-green-palette,
    ),
  )
);

// theme-type: dark|light
// primary|tertiary: $m3-red-palette|$m3-green-palette|$m3-blue-palette|$m3-yellow-palette| $m3-cyan-palette| $m3-magenta-palette| $m3-orange-palette|$m3-chartreuse-palette| $m3-azure-palette| $m3-violet-palette| $m3-rose-palette;
```

## 5. Deploy (Firebase Hosting)

### Terminal
```
npm install -g firebase-tools
firebase login          // ou "npx -p firebase-tools firebase login"
firebase init hosting   // ou "npx -p firebase-tools firebase init hosting"
firebase deploy         // ou "npx -p firebase-tools firebase deploy"
```
