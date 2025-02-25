import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { Observable, debounceTime, distinctUntilChanged, filter, finalize, shareReplay, switchMap, tap } from 'rxjs';
import { SearchService, CurrentSearch } from './services/search.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface SearchResult {
  num_found: number;
  docs: {
    title: string;
    author_name: string[];
    cover_edition_key: string;
  }[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ],
})
export class AppComponent {
  private http = inject(HttpClient);
  searchService = inject(SearchService);
  searchResults$: Observable<SearchResult>;

  constructor() {
    this.searchResults$ = this.searchService.currentSearch$.pipe(
      filter((search): search is CurrentSearch => search !== null),
      distinctUntilChanged(),
      debounceTime(300),
      switchMap((search) => this.searchBooks(search)),
      shareReplay(1)
    );
  }

  onSearchInputChange(event: Event): void {
    this.searchService.searchText = (event.target as HTMLInputElement).value;
  }

  onSearch(): void {
    if (!this.searchService.searchText.trim()) return;
    this.searchService.page = 1;
    this.searchService.submit();
  }

  onPageChange(event: any): void {
    const { pageSize, pageIndex } = event;

    if (pageSize !== this.searchService.pageSize) {
      this.searchService.setPageSize(pageSize);
    } else {
      this.searchService.page = pageIndex + 1;
    }
    this.searchService.submit();
  }

  searchBooks(currentSearch: CurrentSearch): Observable<SearchResult> {
    const { searchText, pageSize, page } = currentSearch;
    const searchQuery = searchText.split(' ').join('+').toLowerCase();
    this.searchService.isLoading$.next(true);

    return this.http.get<SearchResult>(
      `https://openlibrary.org/search.json?q=${searchQuery}&page=${page}&limit=${pageSize}`
    ).pipe(
      finalize(() => this.searchService.isLoading$.next(false)),
      tap((result) => {
        if (result.num_found === 0) {
          alert('No results found!!!'); 
        }
      }),
    );
  }
}
