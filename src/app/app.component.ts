import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
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
  private mediaService = inject(MediaService);
  private geminiService = inject(GeminiService);

  videoElement = viewChild<ElementRef<HTMLVideoElement>>('video');
  canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  viewChildRef = effect(() => {
    const video = this.videoElement()!.nativeElement;
    const canvas = this.canvasElement()!.nativeElement;
    this.mediaService.startCamera(video, canvas);
  })

  base64 = this.mediaService.base64;

  captureRef = effect(() => {
    this.detectPokemon(this.base64());
  });

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
    const imagePart = {
      inlineData: { 
        data: base64,
        mimeType: 'image/jpeg',
      }
    }
    const responseText = await this.geminiService.generateContent([prompt, imagePart]);
    console.log('responseText:', responseText);
    // converter o texto string JSON em um objeto JavaScript
    const cleanedText = responseText.replace(/`json\s*|\s*`/g, '');
    console.log('cleanedText:', cleanedText);
    const pokemonResponse = JSON.parse(cleanedText) as PokemonData;
    console.log('pokemonResponse:', pokemonResponse);
    
    // mostrar nome do pokemon encontrado se probabilidade for suficiente
    if (pokemonResponse.number && pokemonResponse.probability > .9) {
      alert(pokemonResponse.name);
    }
  }
}
