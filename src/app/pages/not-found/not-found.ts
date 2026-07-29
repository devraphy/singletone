import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LanguageService } from '../../i18n/language.service';
import { SeoService } from '../../seo/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFoundComponent {
  language = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);
  isError = this.route.snapshot.data['status'] === 'error';

  constructor() {
    this.seo.update({
      title: this.isError ? 'Something went wrong' : 'Page not found',
      description: this.isError
        ? 'The requested content could not be loaded.'
        : 'The requested page could not be found.',
    });
  }
}
