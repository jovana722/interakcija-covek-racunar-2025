import { ToyModel } from './toy.model';
import { ToyOrderModel } from './order.model';

export interface RasaModel {
  text?: string;
  custom?: {
    attachment?:
      | { type: 'toy_list'; data: ToyModel[] }
      | { type: 'single_toy'; data: ToyModel }
      | { type: 'order_toy'; data: { toyId: number } }
      | { type: 'reservation_toy'; data: { toyId: number } }
      | { type: 'categories'; data: { name: string; count: number }[] };
  };
}


