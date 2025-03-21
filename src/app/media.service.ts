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
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
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