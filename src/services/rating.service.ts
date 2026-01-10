import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { Rating } from '../models/rating.model';

@Injectable({ providedIn: 'root' })
export class RatingService {

  private KEY = 'toy_ratings';

  private getAll(): Rating[] {
    return JSON.parse(localStorage.getItem(this.KEY) || '[]');
  }

  private save(all: Rating[]) {
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }

  /** korisnik ocenjuje igračku */
  rateToy(toyId: number, value: number) {
    if (!UserService.hasAuth()) {
      throw new Error('NOT_LOGGED_IN');
    }

    const user = UserService.getActiveUser();
    const all = this.getAll();

    const existing = all.find(r =>
      r.toyId === toyId && r.userEmail === user.email
    );

    if (existing) {
      existing.value = value; // update
    } else {
      all.push({
        toyId,
        userEmail: user.email,
        value
      });
    }

    this.save(all);
  }

  /** prosečna ocena (vidljivo svima) */
  getAverageRating(toyId: number): number {
    const ratings = this.getAll().filter(r => r.toyId === toyId);
    if (!ratings.length) return 0;

    const sum = ratings.reduce((a, b) => a + b.value, 0);
    return +(sum / ratings.length).toFixed(1);
  }

  /** ocena aktivnog korisnika */
  getUserRating(toyId: number): number | null {
    if (!UserService.hasAuth()) return null;
    const user = UserService.getActiveUser();

    const r = this.getAll().find(r =>
      r.toyId === toyId && r.userEmail === user.email
    );

    return r ? r.value : null;
  }
}
