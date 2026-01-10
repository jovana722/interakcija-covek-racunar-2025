import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToyService } from '../../services/toy.service';
import { ToyModel } from '../../models/toy.model';
import { CartService } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { FavoriteService } from '../../services/favorite.service';
import { RatingService } from '../../services/rating.service';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  // lista igračaka
  toys = signal<ToyModel[]>([]);

  private ratingService = inject(RatingService);

  // filter signali
  selectedType = signal<string | null>(null);
  selectedAgeGroup = signal<string | null>(null);
  selectedTargetGroup = signal<string | null>(null);
  selectedPrice = signal<string | null>(null);
  selectedProductionDate = signal<string | null>(null);
  selectedRating = signal<number | null>(null);

  // search
  searchQuery = signal<string>('');

  // dropdown lista tipova
  toyTypes = signal<string[]>([]);

  // dialog signali
  showSuccessDialog = signal(false);
  showLoginDialog = signal(false);
  showFavoriteSuccessDialog = signal(false);
  showFavoriteExistsDialog = signal(false);

  constructor(
    private cartService: CartService,
    private favoriteService: FavoriteService,
    private toyService: ToyService
  ) {
    this.loadToys();
  }

  // učitavanje igračaka
  loadToys = () => {
    this.toyService.getToys()
      .then((toysWithImages: ToyModel[]) => {
        this.toys.set(toysWithImages);
        const types = Array.from(new Set(toysWithImages.map(t => t.type.name)));
        this.toyTypes.set(types);
      })
      .catch((err: unknown) => console.error(err));
  }

  // computed signali
  ageGroups = computed(() =>
    Array.from(new Set(this.toys().map(t => t.ageGroup.name)))
  );

  targetGroups = computed(() =>
    Array.from(new Set(this.toys().map(t => t.targetGroup)))
  );

  productionYears = computed(() =>
    Array.from(new Set(this.toys().map(t => t.productionDate?.substring(0, 4))))
  );

filteredToys = computed(() =>
  this.toys().filter(toy => {

    if (this.selectedType() && toy.type.name !== this.selectedType()) return false;
    if (this.selectedAgeGroup() && toy.ageGroup.name !== this.selectedAgeGroup()) return false;
    if (this.selectedTargetGroup() && toy.targetGroup !== this.selectedTargetGroup()) return false;

    if (this.selectedPrice()) {
      const [min, max] = this.selectedPrice()!.split('-').map(Number);
      if (toy.price < min || toy.price > max) return false;
    }

    if (
      this.selectedProductionDate() &&
      !toy.productionDate.startsWith(this.selectedProductionDate()!)
    ) return false;

    const q = this.searchQuery().toLowerCase();
    if (
      q &&
      !toy.name.toLowerCase().includes(q) &&
      !toy.description.toLowerCase().includes(q)
    ) return false;

    // ⭐ FILTER PO OCENI (SAFE)
    if (this.selectedRating() !== null) {
      const avg = this.ratingService.getAverageRating(toy.toyId) ?? 0;
      if (avg < this.selectedRating()!) return false;
    }

    return true; // ✅ OBAVEZNO
  })
);


  // metode
  addToCart = (toy: ToyModel) => {
    if (!UserService.hasAuth()) {
      this.showLoginDialog.set(true);
      setTimeout(() => this.showLoginDialog.set(false), 1000);
      return;
    }

    this.cartService.addToCart({
      toyId: toy.toyId,
      name: toy.name,
      price: toy.price,
      imageUrl: toy.imageUrl ?? 'assets/no-image.png'
    });

    this.showSuccessDialog.set(true);
    setTimeout(() => this.showSuccessDialog.set(false), 650);
  }

  addToFavorites = (toy: ToyModel) => {
    if (!UserService.hasAuth()) {
      this.showLoginDialog.set(true);
      setTimeout(() => this.showLoginDialog.set(false), 1000);
      return;
    }

    if (this.favoriteService.favorites().some(f => f.toyId === toy.toyId)) {
      this.showFavoriteExistsDialog.set(true);
      setTimeout(() => this.showFavoriteExistsDialog.set(false), 1000);
      return;
    }

    this.favoriteService.add({
      id: crypto.randomUUID(),
      toyId: toy.toyId,
      toyName: toy.name,
      price: toy.price,
      imageUrl: toy.imageUrl ?? 'assets/no-image.png'
    });

    this.showFavoriteSuccessDialog.set(true);
    setTimeout(() => this.showFavoriteSuccessDialog.set(false), 700);
  }
  getAvg = (toyId: number) =>
    this.ratingService.getAverageRating(toyId);

}
