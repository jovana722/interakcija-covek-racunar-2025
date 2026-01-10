// services/favorite.service.ts
import { Injectable, signal } from '@angular/core';
import { FavoriteModel } from '../models/favorite.model';

@Injectable({ providedIn: 'root' })
export class FavoriteService {

  private _favorites = signal<FavoriteModel[]>([]);
  favorites = this._favorites.asReadonly();

  add(favorite: FavoriteModel) {
    if (this._favorites().some(f => f.toyId === favorite.toyId)) {
      return;
    }

    this._favorites.update(list => [...list, favorite]);
  }

  remove(toyId: number) {
    this._favorites.update(list =>
      list.filter(f => f.toyId !== toyId)
    );
  }

  clear() {
    this._favorites.set([]);
  }
}
