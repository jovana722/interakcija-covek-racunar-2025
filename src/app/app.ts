import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UserService } from '../services/user.service';
import { Utils } from './utils';
import { MessageModel } from '../models/message.model';
import { RasaService } from '../services/rasa.service';
import { ToyModel } from '../models/toy.model';
import { ToyOrderModel } from '../models/order.model';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
import { AttachmentType } from '../models/message.model';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'] // ✅

})
export class App {
  protected year = new Date().getFullYear()
  protected waitingForResponse: boolean = false
  protected botThinkingPlaceholder: string = 'Thinking ...'
  protected isChatVisible: boolean = false
  protected userMessage: string = ''
  protected messages: MessageModel[] = []
  protected lastToys: ToyModel[] = [];

  constructor(private router: Router, private utils: Utils, private cartService: CartService) {

    window.addEventListener('add-to-cart', (e: any) => {
      const toyId = e.detail;
      const toy = this.findToyById(toyId);
      if (toy) {
        this.addToCart(toy);
      }
    });

    this.messages.push({
      type: 'bot',
      text: 'How can I help you?'
    });
  }

  addToCart(toy: ToyModel) {
    if (!UserService.hasAuth()) {
      this.utils.showDialog(
        'You must be logged in to add items to cart',
        () => this.router.navigateByUrl('/login')
      );
      return;
    }

    this.cartService.addToCart({
      toyId: toy.toyId,
      name: toy.name,
      price: toy.price,
      imageUrl: toy.imageUrl ?? 'assets/no-image.png'
    });
    window.dispatchEvent(
      new CustomEvent('cart-add-success', {
        detail: toy.toyId
      })
    );
  }


  toggleChat() {
    this.isChatVisible = !this.isChatVisible;
  }

  async sendUserMessage() {
    if (this.waitingForResponse) return;

    const trimmedMessage = this.userMessage.trim();
    if (!trimmedMessage) return;

    this.userMessage = '';
    this.waitingForResponse = true;

    this.messages.push({ type: 'user', text: trimmedMessage });
    this.messages.push({ type: 'bot', text: this.botThinkingPlaceholder });

    RasaService.sendMessage(trimmedMessage)
      .then(rsp => {

        // 🔥 UVEK ukloni Thinking
        this.removeBotPlaceholder();
        this.waitingForResponse = false;

        if (!rsp.data || !rsp.data.length) {
          this.messages.push({
            type: 'bot',
            text: "Sorry, I didn't understand your question."
          });
          return;
        }

        for (const message of rsp.data) {

          const attachment = message.custom?.attachment as {
            type: AttachmentType;
            data?: any;
          };

          /* 📦 LISTA IGRAČAKA */
          if (attachment?.type === 'toy_list') {

            // ✅ ZAPAMTI IGRAČKE ZA ADD TO CART
            this.lastToys = attachment.data;


            let html = '';

            for (const toy of attachment.data) {
              html += `
                <div class="mb-2">
                  <strong>${toy.name}</strong><br>
                  Price: ${toy.price} RSD<br>
                  Age: ${toy.ageGroup?.name}<br>
                  Category: ${toy.type?.name}<br>
                </div>
              `;
            }

            this.messages.push({ type: 'bot', text: html });
          }


          /* 🧸 JEDNA IGRAČKA */
          if (attachment?.type === 'single_toy') {
            const toy = attachment.data;
            // ✅ ZAPAMTI JEDNU IGRAČKU

            if (!this.lastToys.find(t => t.toyId === toy.toyId)) {
              this.lastToys.push(toy);
            }

            this.messages.push({
              type: 'bot',
              text: `
                <h5>${toy.name}</h5>
                <p>${toy.description}</p>
                <strong>Price:</strong> ${toy.price} RSD
                <br>
              `
            });
          }

          if (attachment?.type === 'categories') {
            let html = '<ul>';
            for (const cat of attachment.data) {
              html += `<li>${cat.name} (${cat.count})</li>`;
            }
            html += '</ul>';
            this.messages.push({ type: 'bot', text: html });
          }

          /* 🔎 OPEN TOY DETAILS PAGE */
          if ((attachment as any)?.type === 'open_toy_details') {
            const toyId = (attachment as any).data.toyId;

            if (toyId) {
              this.router.navigate(['/toy', toyId]);
            }
          }



          /* 🛒 ADD TO CART — OVO SAD RADI */
          if (attachment?.type === 'order_toy') {
            const toyId = attachment.data.toyId;
            const toy = this.findToyById(toyId);
            if (toy) {
              this.addToCart(toy);
            }
          }



          /* 📦 RESERVE ENTIRE ORDER */
          if (attachment?.type === 'reserve_entire_order') {
            const success = this.cartService.reserveEntireOrder();

            if (success) {
              this.messages.push({
                type: 'bot',
                text: `✅ Your entire order has been reserved!`
              });

              this.router.navigate(['/checkout']);
            } else {
              this.messages.push({
                type: 'bot',
                text: `⚠️ No items available for reservation.`
              });
            }
          }

          /* 🗨️ TEKST */
          if (message.text) {
            this.messages.push({
              type: 'bot',
              text: message.text
            });
          }
        }

      })
      .catch(err => {
        console.error(err);
        this.removeBotPlaceholder();
        this.waitingForResponse = false;

        this.messages.push({
          type: 'error',
          text: 'Bot is currently unavailable.'
        });
      });
  }


  removeBotPlaceholder() {
    this.messages = this.messages.filter(
      m => m.text !== this.botThinkingPlaceholder
    );
  }

  findToyById(toyId: number): ToyModel | null {
    return this.lastToys.find(t => t.toyId === toyId) ?? null;
  }






  getUserName() {
    const user = UserService.getActiveUser()
    return `${user.firstName} ${user.lastName}`
  }

  hasAuth() {
    return UserService.hasAuth()
  }

  doLogout() {
    this.utils.showDialog(
      "Are you sure you want to logout?",
      () => {
        UserService.logout()
        this.router.navigateByUrl('/login')
      },
      "Logout Now",
      "Don't Logout"
    )
  }
}