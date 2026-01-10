import { Component, inject,signal } from '@angular/core';
import { FavoriteService } from '../../services/favorite.service';
import { CartService } from '../../services/cart.service';
import { Router } from '@angular/router';
import { FavoriteModel } from '../../models/favorite.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  templateUrl: './favorite.html',
  styleUrls: ['./favorite.css']
})
export class Favorite {

  protected showSuccessDialog = signal(false);
  private favoriteService = inject(FavoriteService);
  private cartService = inject(CartService);
  private router = inject(Router);

  favorites = this.favoriteService.favorites;

  removeFromFavorites(toyId: number) {
    this.favoriteService.remove(toyId);
  }

  addToCart(item: FavoriteModel) {
    this.cartService.addToCart({
      toyId: item.toyId,
      name: item.toyName,
      price: item.price,
      imageUrl: item.imageUrl
    });
    this.showSuccessDialog.set(true);
    setTimeout(() => this.showSuccessDialog.set(false), 700);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  trackByToyId(index: number, item: FavoriteModel) {
    return item.toyId;
  }
}
