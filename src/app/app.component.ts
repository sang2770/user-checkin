import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { LoadingService } from './services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  @ViewChild('loader', { static: true }) loader: ElementRef | undefined;
  @ViewChild('animation', { static: true }) animation: ElementRef | undefined;
  isVisible: boolean = false;
  isRequiredKey: boolean = false;
  isShowDemo: boolean = false;
  constructor(
    private cdr: ChangeDetectorRef,
    public loadingService: LoadingService
  ) {}
  ngOnInit(): void {
    this.loadingService.isLoading$.subscribe((isLoading) => {
      this.isVisible = isLoading;
      this.cdr.detectChanges();
    });
    (window as any).electronAPI.getSettings().then((settings: any) => {
      const key = 'dateExpried1';
      const existed = settings.find(
        (item: any) => item.key === key && item.value
      );
      if (existed) {
        const expriedDate = new Date(JSON.parse(existed.value));
        if (expriedDate <= new Date()) {
          this.isShowDemo = true;
        }
      } else {
        this.isShowDemo = false;
        const expriedDate = new Date();
        expriedDate.setDate(expriedDate.getDate() + 1);
        (window as any).electronAPI.setSetting(
          key,
          JSON.stringify(expriedDate)
        );
      }
    });
  }

  onClose() {
    this.isRequiredKey = false;
    this.cdr.detectChanges();
  }

  // check event F12
  @HostListener('document:keydown', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    if (event.key === 'F12') {
      this.onOpenDevTools();
    }
  }
  onOpenDevTools() {
    (window as any).electronAPI.openDevTools();
  }
}
