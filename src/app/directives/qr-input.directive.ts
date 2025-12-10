
import {
  Directive,
  ElementRef,
  Renderer2,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[appQrInput]',
  standalone: true
})
export class QrInputDirective implements OnInit, OnDestroy {
  @Input() qrButtonPosition: 'right' | 'left' = 'right';
  @Input() qrButtonIcon: string = 'fas fa-qrcode';
  @Input() qrButtonTooltip: string = 'Scan QR Code';
  @Output() qrScanClick = new EventEmitter<void>();

  private qrButton!: HTMLButtonElement;
  private wrapper!: HTMLDivElement;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnInit() {
    this.createQrButton();
  }

  private createQrButton() {
    const inputElement = this.el.nativeElement as HTMLInputElement;
    const parent = inputElement.parentElement;

    if (!parent) return;

    const computedStyle = window.getComputedStyle(parent);
    if (computedStyle.position === 'static') {
      this.wrapper = this.renderer.createElement('div');
      this.renderer.setStyle(this.wrapper, 'position', 'relative');
      this.renderer.setStyle(this.wrapper, 'width', '100%');

      this.renderer.insertBefore(parent, this.wrapper, inputElement);
      this.renderer.appendChild(this.wrapper, inputElement);
    }

    this.qrButton = this.renderer.createElement('button');
    this.renderer.setAttribute(this.qrButton, 'type', 'button');
    this.renderer.setAttribute(this.qrButton, 'title', this.qrButtonTooltip);
    this.renderer.addClass(this.qrButton, 'qr-scan-btn');

    const icon = this.renderer.createElement('i');
    const iconClasses = this.qrButtonIcon.split(' ');
    iconClasses.forEach(cls => this.renderer.addClass(icon, cls));
    this.renderer.appendChild(this.qrButton, icon);

    this.renderer.setStyle(this.qrButton, 'position', 'absolute');
    this.renderer.setStyle(this.qrButton, 'top', '50%');
    this.renderer.setStyle(this.qrButton, 'transform', 'translateY(-50%)');
    this.renderer.setStyle(this.qrButton, 'z-index', '10');
    this.renderer.setStyle(this.qrButton, 'background', 'transparent');
    this.renderer.setStyle(this.qrButton, 'border', 'none');
    this.renderer.setStyle(this.qrButton, 'cursor', 'pointer');
    this.renderer.setStyle(this.qrButton, 'padding', '8px 10px');
    this.renderer.setStyle(this.qrButton, 'color', '#6c757d');
    this.renderer.setStyle(this.qrButton, 'font-size', '1.2rem');
    this.renderer.setStyle(this.qrButton, 'transition', 'all 0.3s ease');

    if (this.qrButtonPosition === 'right') {
      this.renderer.setStyle(this.qrButton, 'right', '10px');
    } else {
      this.renderer.setStyle(this.qrButton, 'left', '10px');
    }

    this.renderer.listen(this.qrButton, 'mouseenter', () => {
      this.renderer.setStyle(this.qrButton, 'color', '#007bff');
      this.renderer.setStyle(this.qrButton, 'transform', 'translateY(-50%) scale(1.1)');
    });

    this.renderer.listen(this.qrButton, 'mouseleave', () => {
      this.renderer.setStyle(this.qrButton, 'color', '#6c757d');
      this.renderer.setStyle(this.qrButton, 'transform', 'translateY(-50%) scale(1)');
    });


    this.renderer.listen(this.qrButton, 'click', (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      this.qrScanClick.emit();
    });


    const container = this.wrapper || parent;
    this.renderer.appendChild(container, this.qrButton);
  }

  ngOnDestroy() {
    if (this.qrButton) {
      this.renderer.removeChild(this.qrButton.parentElement, this.qrButton);
    }
    if (this.wrapper && this.wrapper.parentElement) {
      const parent = this.wrapper.parentElement;
      const input = this.wrapper.firstChild;
      if (input) {
        this.renderer.insertBefore(parent, input, this.wrapper);
      }
      this.renderer.removeChild(parent, this.wrapper);
    }
  }
}