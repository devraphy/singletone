import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../data/content.service';
import { LanguageService } from '../../i18n/language.service';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  language = inject(LanguageService);
  private content = inject(ContentService);
  private seo = inject(SeoService);

  constructor() {
    this.seo.update();
  }

  prepareProjects() {
    this.content.loadNavigationTrees();
  }
}
