import { Injectable, Inject, Optional, InjectionToken } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface SearchConfig {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export interface CurrentSearch {
  searchText: string;
  pageSize: number;
  page: number;
}

export interface ISearchService {
  searchText: string;
  pageSize: number;
  page: number;
  currentSearch$: BehaviorSubject<CurrentSearch | null>;
  submit(): void;
}

export const SEARCH_CONFIG = new InjectionToken<SearchConfig>('SearchConfig', {
  providedIn: 'root',
  factory: () => ({ defaultPageSize: 10, pageSizeOptions: [5, 10, 20, 50, 100] }),
});

@Injectable({
  providedIn: 'root',
})
export class SearchService implements ISearchService {
  searchText: string = '';
  pageSize: number;
  pageSizeOptions: number[];
  page: number = 1;
  currentSearch$ = new BehaviorSubject<CurrentSearch | null>(null);
  isLoading$ = new BehaviorSubject<boolean>(false);

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    @Optional() @Inject(SEARCH_CONFIG) public config: SearchConfig
  ) {
    this.pageSize = this.config?.defaultPageSize ?? 10;
    this.pageSizeOptions = this.config?.pageSizeOptions ?? [10];
    this._initFromUrl();
  }

  private _initFromUrl(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.searchText = params['q'] || this.searchText;
        this.page = +params['page'] || this.page;
        this.pageSize = +params['pageSize'] || this.pageSize;

        if (this.searchText) {
          this.submit();
        }
      });
  }

  setPageSize(newSize: number): void {
    if (this.pageSizeOptions.includes(newSize)) {
      this.pageSize = newSize;
      this.page = 1;
      this.submit();
    }
  }

  submit(): void {
    if (!this.searchText.trim()) return;

    this.router.navigate([], {
      queryParams: { q: this.searchText, page: this.page, pageSize: this.pageSize },
      queryParamsHandling: 'merge',
    });

    this.currentSearch$.next({
      searchText: this.searchText,
      pageSize: this.pageSize,
      page: this.page,
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
