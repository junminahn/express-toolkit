import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface QueryOptions {
  includePermissions?: boolean;
  includeCount?: boolean;
  tryList?: boolean;
  populateAccess?: string;
}

export interface Query {
  query?: any;
  select?: any;
  sort?: any;
  populate?: any;
  limit?: any;
  page?: any;
  options?: QueryOptions;
}

export class BaseService<T> {
  protected http: HttpClient;
  protected apiBaseUrl = '';
  protected basename = '';

  constructor(injector: Injector) {
    this.http = injector.get(HttpClient);
  }

  protected get baseUrl() {
    return `${this.apiBaseUrl}${this.basename}`;
  }

  public list(): Observable<T[]> {
    return this.http.get<T[]>(`${this.baseUrl}`);
  }

  public listQuery({
    query,
    select,
    sort,
    populate,
    limit,
    page,
    options = { includePermissions: true, includeCount: false, populateAccess: 'read' },
  }: Query): Observable<T[]> {
    return this.http.post<T[]>(`${this.baseUrl}/__query`, {
      query,
      select,
      sort,
      populate,
      limit,
      page,
      options,
    });
  }

  public read(id: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${id}`);
  }

  public readQuery(
    id: string,
    {
      select,
      populate,
      options = { includePermissions: true, includeCount: false, tryList: true, populateAccess: 'read' },
    }: Query,
  ): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}/__query/${id}`, { select, populate, options });
  }

  public create(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  public update(id: any, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  public delete(id: any): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }

  public distinct(field: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/distinct/${field}`);
  }

  public distinctQuery(field: string, conditions: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/distinct/${field}`, conditions);
  }
}
