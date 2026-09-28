import { Component, Input } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/** How long the dialog stays up at least; the model itself answers in well under a millisecond. */
const MIN_VISIBLE_MS = 500;

/** Resolves once the dialog has been visible long enough to register, instead of flashing. */
export function minimumLoadingTime(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MIN_VISIBLE_MS));
}

@Component({
  selector: 'app-support-type-loading-dialog',
  imports: [DialogModule, ProgressSpinnerModule],
  templateUrl: './support-type-loading-dialog.html',
  styleUrl: './support-type-loading-dialog.scss',
})
export class SupportTypeLoadingDialog {
  @Input() visible = false;
}
