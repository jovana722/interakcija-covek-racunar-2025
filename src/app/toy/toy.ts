import { Component, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToyService } from '../../services/toy.service';
import { ToyModel } from '../../models/toy.model';
import { UserService } from '../../services/user.service';
import { CartService } from '../../services/cart.service';
import { FavoriteService } from '../../services/favorite.service';
import { RatingService } from '../../services/rating.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toy',
  imports: [RouterLink, CommonModule],
  templateUrl: './toy.html',
  styleUrls: ['./toy.css']
})
export class Toy {
  private cartService = inject(CartService);
  private favoriteService = inject(FavoriteService);
  private toyService = inject(ToyService);
  private ratingService = inject(RatingService);
  protected showRatingSuccessDialog = signal(false);


  protected toy = signal<ToyModel | null>(null);
  protected showSuccessDialog = signal(false);
  protected showLoginDialog = signal(false);
  protected showFavoriteSuccessDialog = signal(false);
  protected showFavoriteExistsDialog = signal(false);

constructor(private route: ActivatedRoute) {

  
  window.addEventListener('cart-add-success', (e: any) => {
    const toyId = e.detail;

    
    if (this.toy()?.toyId === toyId) {
      this.showSuccessDialog.set(true);

      setTimeout(() => {
        this.showSuccessDialog.set(false);
      }, 800);
    }
  });

  this.route.params.subscribe(params => {
    const id = Number(params['id']);
    if (id) {
      this.toyService.getToyById(id)
        .then(toyWithImage => this.toy.set(toyWithImage))
        .catch(err => console.error(err));
    }
  });
}


  private showDialog(dialog: typeof this.showSuccessDialog, duration: number = 600) {
    dialog.set(true);
    setTimeout(() => dialog.set(false), duration);
  }

  addToCart(toy: ToyModel): void {
    if (!UserService.hasAuth()) {
      this.showDialog(this.showLoginDialog, 1000);
      return;
    }
    this.cartService.addToCart(toy);
    this.showDialog(this.showSuccessDialog, 650);
  }

  addToFavorites(toy: ToyModel): void {
    if (!UserService.hasAuth()) {
      this.showDialog(this.showLoginDialog, 1000);
      return;
    }

    if (this.favoriteService.favorites().some(f => f.toyId === toy.toyId)) {
      this.showDialog(this.showFavoriteExistsDialog, 1000);
      return;
    }

    this.favoriteService.add({
      id: crypto.randomUUID(),
      toyId: toy.toyId,
      toyName: toy.name,
      price: toy.price,
      imageUrl: toy.imageUrl ?? 'assets/no-image.png'
    });

    this.showDialog(this.showFavoriteSuccessDialog, 700);
  }

  hoveredStar = signal(0);
userRating = signal<number | null>(null);
avgRating = signal(0);

ngOnInit() {
  this.userRating.set(
    this.ratingService.getUserRating(this.toy()!.toyId)
  );

  this.avgRating.set(
    this.ratingService.getAverageRating(this.toy()!.toyId)
  );
}

rate(value: number) {
  if (!UserService.hasAuth()) {
    this.showLoginDialog.set(true);
    return;
  }

  this.ratingService.rateToy(this.toy()!.toyId, value);
  this.userRating.set(value);
  this.avgRating.set(
    this.ratingService.getAverageRating(this.toy()!.toyId)
  );
  this.showDialog(this.showRatingSuccessDialog, 800);
}
}
